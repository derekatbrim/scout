import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  console.log('📨 Received webhook event:', event.type)

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata.supabase_user_id

        if (!userId) {
          console.error('❌ No user ID in subscription metadata')
          break
        }

        console.log('📝 Updating subscription for user:', userId)
        console.log('📊 Subscription details:', {
          id: subscription.id,
          status: subscription.status,
          trial_end: subscription.trial_end,
          trial_start: subscription.trial_start,
          current_period_end: subscription.current_period_end,
          cancel_at: subscription.cancel_at,
        })

        // Get the price ID to determine tier
        const priceId = subscription.items.data[0]?.price.id
        const priceAmount = subscription.items.data[0]?.price.unit_amount // in cents
        
        console.log('💰 Price info:', { priceId, priceAmount })

        // Determine subscription tier based on status and price
        let tier: 'free' | 'trial' | 'pro' | 'premium' = 'free'
        
        // If actively trialing, mark as trial
        if (subscription.status === 'trialing') {
          tier = 'trial'
          console.log('🎯 User is in trial period')
        } 
        // If active (paid), determine Pro vs Premium
        else if (subscription.status === 'active') {
          // Check by price ID first (most reliable)
          if (priceId) {
            const priceIdLower = priceId.toLowerCase()
            if (priceIdLower.includes('premium')) {
              tier = 'premium'
            } else if (priceIdLower.includes('pro')) {
              tier = 'pro'
            }
            // Fallback: check by amount if price ID doesn't have tier name
            else if (priceAmount) {
              // Pro: $29/mo ($2900 cents) or $290/yr ($29000 cents)
              // Premium: $79/mo ($7900 cents) or $790/yr ($79000 cents)
              if (priceAmount >= 7900) {
                tier = 'premium'
              } else if (priceAmount >= 2900) {
                tier = 'pro'
              }
            }
          }
          console.log(`✅ User has active ${tier} subscription`)
        }
        // If canceled but still in current period
        else if (subscription.status === 'canceled' && subscription.current_period_end && new Date(subscription.current_period_end * 1000) > new Date()) {
          // Keep their tier until period ends
          tier = priceId?.toLowerCase().includes('premium') ? 'premium' : 'pro'
          console.log('⚠️ Subscription canceled but still active until period end')
        }

        const updateData: any = {
          stripe_subscription_id: subscription.id,
          subscription_status: subscription.status,
          subscription_tier: tier,
        }

        // Set trial end date if in trial
        if (subscription.trial_end) {
          const trialEndDate = new Date(subscription.trial_end * 1000)
          updateData.trial_ends_at = trialEndDate.toISOString()
          console.log('📅 Trial ends at:', trialEndDate.toISOString())
        } else {
          // Clear trial end date if no longer in trial
          updateData.trial_ends_at = null
        }

        // Set subscription end date if canceled
        if (subscription.cancel_at) {
          const cancelDate = new Date(subscription.cancel_at * 1000)
          updateData.subscription_ends_at = cancelDate.toISOString()
          console.log('🗓️ Subscription ends at:', cancelDate.toISOString())
        } else if (subscription.canceled_at && subscription.current_period_end) {
          // If canceled but no specific cancel_at, use current_period_end
          const periodEndDate = new Date(subscription.current_period_end * 1000)
          updateData.subscription_ends_at = periodEndDate.toISOString()
          console.log('🗓️ Subscription ends at period end:', periodEndDate.toISOString())
        } else {
          // Clear end date if subscription is active
          updateData.subscription_ends_at = null
        }

        // Always set the current period end (when next payment is due)
        if (subscription.current_period_end) {
          updateData.subscription_expires_at = new Date(subscription.current_period_end * 1000).toISOString()
        }

        console.log('💾 Updating database with:', updateData)

        const { error } = await supabaseAdmin
          .from('profiles')
          .update(updateData)
          .eq('id', userId)

        if (error) {
          console.error('❌ Error updating profile:', error)
        } else {
          console.log('✅ Successfully updated profile')
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata.supabase_user_id

        if (!userId) {
          console.error('❌ No user ID in subscription metadata')
          break
        }

        console.log('🗑️ Subscription deleted for user:', userId)

        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            subscription_tier: 'free',
            subscription_status: 'canceled',
            stripe_subscription_id: null,
            subscription_ends_at: new Date().toISOString(),
          })
          .eq('id', userId)

        if (error) {
          console.error('❌ Error updating profile:', error)
        } else {
          console.log('✅ Downgraded user to free tier')
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string

        if (!subscriptionId) break

        // Get subscription to find user
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const userId = subscription.metadata.supabase_user_id

        if (!userId) {
          console.error('❌ No user ID in subscription metadata')
          break
        }

        console.log('💰 Payment succeeded for user:', userId)

        // If this was the first payment after trial, update to paid
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: 'active',
            subscription_tier: subscription.items.data[0]?.price.id?.includes('premium') ? 'premium' : 'pro',
            trial_ends_at: null, // Clear trial end date
          })
          .eq('id', userId)

        if (error) {
          console.error('❌ Error updating profile:', error)
        } else {
          console.log('✅ Activated paid subscription')
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string

        if (!subscriptionId) break

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const userId = subscription.metadata.supabase_user_id

        if (!userId) {
          console.error('❌ No user ID in subscription metadata')
          break
        }

        console.log('⚠️ Payment failed for user:', userId)

        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: 'past_due',
          })
          .eq('id', userId)

        if (error) {
          console.error('❌ Error updating profile:', error)
        } else {
          console.log('✅ Marked subscription as past due')
        }
        break
      }

      default:
        console.log('ℹ️ Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('💥 Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
