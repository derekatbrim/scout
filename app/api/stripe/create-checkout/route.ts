import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { userId, priceId } = await request.json()

    if (!userId || !priceId) {
      return NextResponse.json(
        { error: 'Missing userId or priceId' },
        { status: 400 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email, stripe_customer_id')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if customer exists in Stripe
    let customerId = profile.stripe_customer_id

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: profile.email,
        metadata: {
          supabase_user_id: userId,
        },
      })
      customerId = customer.id

      // Save customer ID to profile
      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?payment=canceled`,
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          supabase_user_id: userId,
        },
      },
      metadata: {
        supabase_user_id: userId,
      },
    })

    return NextResponse.json({ 
      sessionId: session.id, 
      url: session.url 
    })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}