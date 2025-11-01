import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📦 Received request body:', body)
    
    const { userId, priceId } = body

    if (!userId || !priceId) {
      console.error('❌ Missing required fields:', { userId, priceId })
      return NextResponse.json(
        { error: 'Missing userId or priceId' },
        { status: 400 }
      )
    }

    console.log('🔍 Looking up user:', userId)

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email, stripe_customer_id')
      .eq('id', userId)
      .single()

    console.log('👤 Profile result:', { profile, profileError })

    if (profileError || !profile) {
      console.error('❌ Profile error:', profileError)
      return NextResponse.json(
        { error: 'User not found', details: profileError?.message },
        { status: 404 }
      )
    }

    console.log('✅ Found user:', profile.email)

    // Check if customer exists in Stripe
    let customerId = profile.stripe_customer_id

    if (!customerId) {
      console.log('🆕 Creating new Stripe customer for:', profile.email)
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: profile.email,
        metadata: {
          supabase_user_id: userId,
        },
      })
      customerId = customer.id
      console.log('✅ Created Stripe customer:', customerId)

      // Save customer ID to profile
      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
    } else {
      console.log('✅ Using existing Stripe customer:', customerId)
    }

    console.log('💳 Creating checkout session...')
    
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

    console.log('✅ Checkout session created:', session.id)

    return NextResponse.json({ 
      sessionId: session.id, 
      url: session.url 
    })
  } catch (error: any) {
    console.error('💥 Stripe checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}