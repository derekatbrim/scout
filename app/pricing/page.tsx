'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'
import { loadStripe } from '@stripe/stripe-js'
import { showToast } from '@/components/ui/toast'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual' | 'lifetime'>('annual')
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const router = useRouter()
  const supabase = supabaseClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', user.id)
          .single()
        
        setProfile(profileData)
      }
      
      setLoading(false)
    }
    checkUser()
  }, [supabase.auth])

  const handleSubscribe = async (planName: string, priceId: string) => {
    if (!user) {
      router.push('/login')
      return
    }

    setCheckoutLoading(planName)

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          priceId: priceId,
        }),
      })

      const { sessionId, url, error } = await response.json()

      if (error) {
        showToast(error, 'error')
        setCheckoutLoading(null)
        return
      }

      if (url) {
        window.location.href = url
      }
    } catch (error: any) {
      console.error('Checkout error:', error)
      showToast('Something went wrong. Please try again.', 'error')
      setCheckoutLoading(null)
    }
  }

  // Map price IDs based on billing cycle
  const getPriceId = (planName: string): string => {
    // Replace these with your actual Stripe Price IDs
    const priceIds = {
      'Pro-monthly': process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY || 'price_pro_monthly',
      'Pro-annual': process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_ANNUAL || 'price_pro_annual',
      'Pro-lifetime': process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_LIFETIME || 'price_pro_lifetime',
      'Premium-monthly': process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM_MONTHLY || 'price_premium_monthly',
      'Premium-annual': process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM_ANNUAL || 'price_premium_annual',
      'Premium-lifetime': process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM_LIFETIME || 'price_premium_lifetime',
    }

    const key = `${planName}-${billingCycle}` as keyof typeof priceIds
    return priceIds[key] || ''
  }

  const plans = [
    {
      name: 'Free',
      tagline: 'Get Started',
      price: { monthly: 0, annual: 0, lifetime: 0 },
      description: 'Perfect for trying Scout',
      features: [
        'Up to 5 active deals',
        'Access to 70+ brands',
        'Basic pipeline view',
        'Community support',
      ],
      cta: 'Get Started Free',
      highlighted: false,
    },
    {
      name: 'Pro',
      tagline: 'Most Popular',
      price: { monthly: 29, annual: 290, lifetime: 490 },
      description: 'Everything you need to close deals',
      features: [
        'Unlimited active deals',
        'Full brand database access',
        'Advanced analytics & insights',
        'Email templates & pitch tools',
        'Rate calculator',
        'Deal templates library',
        'Export to CSV (10/month)',
        'Custom deal stages (up to 5)',
        'Priority support',
      ],
      cta: billingCycle === 'lifetime' ? 'Get Lifetime Access' : 'Start Free Trial',
      highlighted: true,
      badge: billingCycle === 'lifetime' ? 'Limited Offer' : 'Most Popular',
    },
    {
      name: 'Premium',
      tagline: 'For Power Users',
      price: { monthly: 79, annual: 790, lifetime: 990 },
      description: 'Maximum power and flexibility',
      features: [
        'Everything in Pro, plus:',
        'Unlimited exports & templates',
        'Track unlimited brands',
        'Custom fields & tags',
        'Advanced filtering & search',
        'Bulk actions (mass updates)',
        'API access & integrations',
        'White-label PDF reports',
        'Remove scout branding',
        'Early access to beta features',
      ],
      cta: billingCycle === 'lifetime' ? 'Get Lifetime Access' : 'Start Free Trial',
      highlighted: false,
    },
  ]

  return (
    <motion.div 
      className="min-h-screen"
      style={{ background: '#F8F9FB' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header */}
      <header 
        className="sticky top-0 z-40"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href={user ? "/dashboard" : "/"} className="cursor-pointer">
              <h1 
                className="text-2xl font-bold"
                style={{
                  color: '#0C0F1A',
                  fontFamily: 'var(--font-bricolage), sans-serif'
                }}
              >
                scout
              </h1>
            </Link>
            <div className="flex items-center gap-3 sm:gap-5">
              {loading ? (
                <div 
                  style={{
                    width: '80px',
                    height: '32px',
                    background: 'rgba(12,15,26,0.04)',
                    borderRadius: '8px'
                  }}
                />
              ) : user ? (
                <>
                  <Link 
                    href="/dashboard"
                    className="text-sm font-medium transition-colors hidden sm:block"
                    style={{ color: '#5E6370' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#0C0F1A'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#5E6370'}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/dashboard/profile"
                    className="transition-colors"
                    style={{ color: '#5E6370' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#FD8AE6'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#5E6370'}
                  >
                    <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    href="/login"
                    className="text-sm font-medium transition-colors"
                    style={{ color: '#5E6370' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#0C0F1A'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#5E6370'}
                  >
                    Log in
                  </Link>
                  <button
                    onClick={() => router.push('/login')}
                    className="text-sm font-semibold px-3 sm:px-4 py-2 transition-all"
                    style={{
                      background: '#0C0F1A',
                      color: '#FFFFFF',
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.06)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#0C0F1A'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-12 sm:pt-20 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8 text-center">
        <motion.div 
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h2 
            className="mb-4 sm:mb-6"
            style={{
              fontSize: 'clamp(2rem, 5vw, 4rem)',
              fontWeight: 700,
              color: '#0C0F1A',
              fontFamily: 'var(--font-bricolage), sans-serif',
              lineHeight: 1.1
            }}
          >
            Simple, transparent pricing
          </h2>
          <p 
            className="mb-8 sm:mb-10"
            style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
              color: '#5E6370',
              maxWidth: '600px',
              margin: '0 auto 2rem'
            }}
          >
            Start free, upgrade when you're ready. No hidden fees.
          </p>

          {/* Billing Toggle */}
          <div 
            className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-0 p-1.5 mb-8 sm:mb-12 w-full sm:w-auto"
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.06)',
              borderRadius: '14px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            {(['monthly', 'annual', 'lifetime'] as const).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className="flex-1 sm:flex-initial w-full sm:w-auto px-6 py-2.5 text-sm font-semibold rounded-xl transition-all"
                style={{
                  background: billingCycle === cycle ? '#0C0F1A' : 'transparent',
                  color: billingCycle === cycle ? '#FFFFFF' : '#5E6370',
                  cursor: 'pointer'
                }}
              >
                <span className="capitalize">{cycle}</span>
                {cycle === 'annual' && (
                  <span 
                    className="ml-2 text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: billingCycle === cycle ? 'rgba(253,138,230,0.2)' : 'rgba(253,138,230,0.1)',
                      color: billingCycle === cycle ? '#FFFFFF' : '#FD8AE6'
                    }}
                  >
                    Save 17%
                  </span>
                )}
                {cycle === 'lifetime' && (
                  <span 
                    className="ml-2 text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: billingCycle === cycle ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.1)',
                      color: billingCycle === cycle ? '#FFFFFF' : '#22C55E'
                    }}
                  >
                    Best Value
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan, index) => {
              const price = plan.price[billingCycle]
              const isCurrentPlan = profile?.subscription_tier === plan.name.toLowerCase()
              
              return (
                <motion.div
                  key={plan.name}
                  className="flex flex-col"
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '20px',
                    border: plan.highlighted ? '2px solid #FD8AE6' : '1px solid rgba(0,0,0,0.06)',
                    boxShadow: plan.highlighted ? '0 8px 24px rgba(253,138,230,0.12)' : '0 4px 12px rgba(0,0,0,0.04)',
                    padding: 'clamp(1.5rem, 4vw, 2rem)',
                    position: 'relative',
                    transform: plan.highlighted ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.15s ease-out'
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                  whileHover={{ 
                    transform: plan.highlighted ? 'scale(1.05) translateY(-4px)' : 'scale(1.02) translateY(-2px)',
                    boxShadow: plan.highlighted ? '0 12px 32px rgba(253,138,230,0.18)' : '0 8px 20px rgba(0,0,0,0.08)'
                  }}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div 
                      className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 text-xs font-bold rounded-full whitespace-nowrap"
                      style={{
                        background: plan.badge === 'Limited Offer' 
                          ? 'linear-gradient(135deg, #22C55E 0%, #14B8A6 100%)'
                          : 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                        color: '#FFFFFF',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}
                    >
                      {plan.badge}
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <h3 
                      className="text-sm font-semibold mb-2"
                      style={{ 
                        color: '#5E6370',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      {plan.tagline}
                    </h3>
                    <h4 
                      className="text-2xl sm:text-3xl font-bold mb-2"
                      style={{
                        color: '#0C0F1A',
                        fontFamily: 'var(--font-bricolage), sans-serif'
                      }}
                    >
                      {plan.name}
                    </h4>
                    <p className="text-sm" style={{ color: '#5E6370' }}>
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-6 pb-6" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <div className="flex items-baseline justify-center gap-2">
                      <span 
                        className="text-4xl sm:text-5xl font-bold"
                        style={{
                          color: plan.highlighted ? '#FD8AE6' : '#0C0F1A',
                          fontFamily: 'var(--font-bricolage), sans-serif'
                        }}
                      >
                        ${price}
                      </span>
                      {billingCycle !== 'lifetime' && (
                        <span className="text-base" style={{ color: '#5E6370' }}>
                          /{billingCycle === 'annual' ? 'year' : 'month'}
                        </span>
                      )}
                    </div>
                    {billingCycle === 'annual' && price > 0 && (
                      <div className="text-sm mt-2" style={{ color: '#5E6370' }}>
                        ${Math.round(price / 12)}/month billed annually
                      </div>
                    )}
                    {billingCycle === 'lifetime' && price > 0 && (
                      <div className="text-sm mt-2 font-semibold" style={{ color: '#22C55E' }}>
                        Pay once, use forever
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <svg 
                          className="w-5 h-5 flex-shrink-0 mt-0.5"
                          style={{ color: plan.highlighted ? '#FD8AE6' : '#22C55E' }}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path 
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm" style={{ color: '#5E6370' }}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => {
                      if (plan.name === 'Free') {
                        router.push('/login')
                      } else {
                        handleSubscribe(plan.name, getPriceId(plan.name))
                      }
                    }}
                    disabled={checkoutLoading === plan.name || isCurrentPlan}
                    className="w-full py-3.5 text-sm font-semibold rounded-xl transition-all"
                    style={{
                      background: plan.highlighted 
                        ? 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)'
                        : isCurrentPlan
                        ? '#E2E8F0'
                        : '#0C0F1A',
                      color: isCurrentPlan ? '#64748B' : '#FFFFFF',
                      cursor: (checkoutLoading === plan.name || isCurrentPlan) ? 'not-allowed' : 'pointer',
                      opacity: (checkoutLoading === plan.name || isCurrentPlan) ? 0.6 : 1,
                      boxShadow: plan.highlighted ? '0 4px 12px rgba(253,138,230,0.3)' : '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                    onMouseEnter={(e) => {
                      if (!checkoutLoading && !isCurrentPlan) {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = plan.highlighted 
                          ? '0 8px 20px rgba(253,138,230,0.4)'
                          : '0 6px 16px rgba(0,0,0,0.08)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = plan.highlighted 
                        ? '0 4px 12px rgba(253,138,230,0.3)'
                        : '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                  >
                    {checkoutLoading === plan.name 
                      ? 'Processing...'
                      : isCurrentPlan
                      ? 'Current Plan'
                      : plan.cta
                    }
                  </button>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Lifetime Deal CTA */}
      {billingCycle === 'lifetime' && (
        <motion.section 
          className="pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div 
            className="max-w-4xl mx-auto p-6 sm:p-10 rounded-2xl text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #22C55E 0%, #14B8A6 100%)',
              boxShadow: '0 8px 24px rgba(34,197,94,0.25)'
            }}
          >
            {/* Decorative Elements */}
            <div 
              className="absolute top-0 right-0 w-32 sm:w-64 h-32 sm:h-64 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
                filter: 'blur(40px)',
                transform: 'translate(30%, -30%)'
              }}
            />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(8px)'
                }}
              >
                <span className="text-2xl">⚡</span>
                <span className="text-sm font-bold" style={{ color: '#FFFFFF' }}>
                  Limited Time Offer
                </span>
              </div>
              
              <h3 
                className="text-2xl sm:text-3xl font-bold mb-3"
                style={{
                  color: '#FFFFFF',
                  fontFamily: 'var(--font-bricolage), sans-serif'
                }}
              >
                Only 100 lifetime deals available
              </h3>
              <p className="text-base sm:text-lg mb-6" style={{ color: 'rgba(255,255,255,0.9)' }}>
                82 spots left • Once they're gone, they're gone forever
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold" style={{ color: '#FFFFFF' }}>
                    $490
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.7)' }}>
                    One-time payment
                  </div>
                </div>
                <div className="text-2xl hidden sm:block" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  →
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold" style={{ color: '#FFFFFF' }}>
                    Lifetime
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.7)' }}>
                    Help us build the best creator tool
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* FAQ */}
      <section 
        className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8"
        style={{ background: '#FFFFFF' }}
      >
        <div className="max-w-4xl mx-auto">
          <h3 
            className="mb-8 sm:mb-12 text-center"
            style={{
              fontSize: 'clamp(2rem, 4vw, 2.5rem)',
              fontWeight: 700,
              color: '#0C0F1A',
              fontFamily: 'var(--font-bricolage), sans-serif'
            }}
          >
            Frequently asked questions
          </h3>
          
          <div className="space-y-4 sm:space-y-6">
            {[
              {
                q: "What happens when the Lifetime deal ends?",
                a: "After we hit 100 lifetime customers, the offer disappears forever. Anyone who purchased it keeps lifetime access - no catches, no limits."
              },
              {
                q: "Can I switch plans anytime?",
                a: "Yes! You can upgrade, downgrade, or cancel your subscription at any time. Changes take effect immediately."
              },
              {
                q: "Do you offer refunds?",
                a: "We offer a 30-day money-back guarantee on all plans, including Lifetime. If you're not satisfied, contact us for a full refund."
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards (Visa, Mastercard, Amex) via Stripe. Your payment information is secure and encrypted."
              },
              {
                q: "Is there a free trial?",
                a: "Pro and Premium plans include a 14-day free trial - no credit card required. Cancel anytime before the trial ends at no charge."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                className="p-4 sm:p-6"
                style={{
                  background: '#F8F9FB',
                  borderRadius: '16px',
                  border: '1px solid rgba(0,0,0,0.04)'
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * index }}
              >
                <h4 
                  className="mb-2 sm:mb-3"
                  style={{
                    fontSize: 'clamp(1rem, 2vw, 1.1rem)',
                    fontWeight: 600,
                    color: '#0C0F1A'
                  }}
                >
                  {faq.q}
                </h4>
                <p style={{ color: '#5E6370', lineHeight: 1.6, fontSize: 'clamp(0.875rem, 1.5vw, 1rem)' }}>
                  {faq.a}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section 
        className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #0C0F1A 0%, #141925 100%)'
        }}
      >
        {/* Gradient Orbs */}
        <div 
          className="absolute -top-20 -right-20 sm:top-[-80px] sm:right-[-80px]"
          style={{
            width: '200px',
            height: '200px',
            '@media (min-width: 640px)': {
              width: '330px',
              height: '330px'
            },
            background: 'radial-gradient(circle, rgba(253,138,230,0.2) 0%, rgba(12,15,26,0) 70%)',
            filter: 'blur(40px)'
          }}
        />
        <div 
          className="absolute -bottom-24 -left-10 sm:bottom-[-120px] sm:left-[-40px]"
          style={{
            width: '280px',
            height: '280px',
            '@media (min-width: 640px)': {
              width: '420px',
              height: '420px'
            },
            background: 'radial-gradient(circle, rgba(199,125,255,0.22) 0%, rgba(12,15,26,0) 70%)',
            filter: 'blur(40px)'
          }}
        />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h3 
            className="mb-4 sm:mb-6"
            style={{
              fontSize: 'clamp(2rem, 4vw, 2.75rem)',
              fontWeight: 700,
              color: '#FFFFFF',
              fontFamily: 'var(--font-bricolage), sans-serif'
            }}
          >
            Ready to land more brand deals?
          </h3>
          <p 
            className="mb-8 sm:mb-10"
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.25rem)',
              color: 'rgba(255,255,255,0.7)',
              maxWidth: '600px',
              margin: '0 auto 2rem'
            }}
          >
            Join creators who are finding, pitching, and closing partnerships faster with Scout.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-8 sm:px-10 py-3 sm:py-4 text-sm sm:text-base font-semibold transition-all"
            style={{
              background: '#FFFFFF',
              color: '#0C0F1A',
              borderRadius: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)'
              e.currentTarget.style.color = '#FFFFFF'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FFFFFF'
              e.currentTarget.style.color = '#0C0F1A'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            Get Started Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer 
        className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8"
        style={{
          background: '#FFFFFF',
          borderTop: '1px solid rgba(0,0,0,0.06)'
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <h1 
                className="text-2xl font-bold mb-2"
                style={{
                  color: '#0C0F1A',
                  fontFamily: 'var(--font-bricolage), sans-serif'
                }}
              >
                scout
              </h1>
              <p className="text-sm" style={{ color: '#5E6370' }}>
                Brand intelligence for creators
              </p>
            </div>
            <div className="flex gap-6 sm:gap-8">
              <Link 
                href="/" 
                className="text-sm font-medium transition-colors"
                style={{ color: '#5E6370' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#0C0F1A'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#5E6370'}
              >
                Home
              </Link>
              <Link 
                href="/pricing" 
                className="text-sm font-medium transition-colors"
                style={{ color: '#5E6370' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#0C0F1A'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#5E6370'}
              >
                Pricing
              </Link>
              <a 
                href="#" 
                className="text-sm font-medium transition-colors"
                style={{ color: '#5E6370' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#0C0F1A'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#5E6370'}
              >
                Contact
              </a>
            </div>
          </div>
          <div 
            className="mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-sm"
            style={{
              borderTop: '1px solid rgba(0,0,0,0.06)',
              color: '#9CA3AF'
            }}
          >
            © 2025 Scout. All rights reserved.
          </div>
        </div>
      </footer>
    </motion.div>
  )
}