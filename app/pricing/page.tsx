'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual' | 'lifetime'>('annual')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = supabaseClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    checkUser()
  }, [supabase.auth])

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
            <div className="flex items-center gap-5">
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
                    className="text-sm font-medium transition-colors"
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
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="text-sm font-semibold px-4 py-2 transition-all"
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
      <section className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 text-center">
        <motion.div 
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h2 
            className="mb-6"
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: 700,
              color: '#0C0F1A',
              fontFamily: 'var(--font-bricolage), sans-serif',
              lineHeight: 1.1
            }}
          >
            Simple, transparent pricing
          </h2>
          <p 
            className="mb-10"
            style={{
              fontSize: '1.25rem',
              color: '#5E6370',
              maxWidth: '600px',
              margin: '0 auto 2.5rem'
            }}
          >
            Start free, upgrade when you're ready. No hidden fees.
          </p>

          {/* Billing Toggle */}
          <div 
            className="inline-flex items-center p-1.5 mb-12"
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.06)',
              borderRadius: '14px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <button
              onClick={() => setBillingCycle('monthly')}
              className="px-6 py-3 rounded-lg font-medium transition-all relative"
              style={{
                background: billingCycle === 'monthly' ? '#0C0F1A' : 'transparent',
                color: billingCycle === 'monthly' ? '#FFFFFF' : '#5E6370',
                cursor: 'pointer',
                fontSize: '0.95rem'
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className="px-6 py-3 rounded-lg font-medium transition-all relative"
              style={{
                background: billingCycle === 'annual' ? '#0C0F1A' : 'transparent',
                color: billingCycle === 'annual' ? '#FFFFFF' : '#5E6370',
                cursor: 'pointer',
                fontSize: '0.95rem'
              }}
            >
              Annual
              <span 
                className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-bold rounded-full"
                style={{
                  background: '#22C55E',
                  color: '#FFFFFF'
                }}
              >
                Save 17%
              </span>
            </button>
            <button
              onClick={() => setBillingCycle('lifetime')}
              className="px-6 py-3 rounded-lg font-medium transition-all relative"
              style={{
                background: billingCycle === 'lifetime' ? '#0C0F1A' : 'transparent',
                color: billingCycle === 'lifetime' ? '#FFFFFF' : '#5E6370',
                cursor: 'pointer',
                fontSize: '0.95rem'
              }}
            >
              Lifetime
              <span 
                className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-bold rounded-full animate-pulse"
                style={{
                  background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                  color: '#FFFFFF'
                }}
              >
                Limited
              </span>
            </button>
          </div>

          {billingCycle === 'lifetime' && (
            <motion.div 
              className="mb-8 p-5 max-w-2xl mx-auto"
              style={{
                background: 'linear-gradient(135deg, rgba(253,138,230,0.08) 0%, rgba(199,125,255,0.08) 100%)',
                border: '2px solid rgba(253,138,230,0.3)',
                borderRadius: '16px'
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
            >
              <p 
                className="text-sm font-semibold"
                style={{ color: '#0C0F1A' }}
              >
                🔥 Early Adopter Special: Pay once, use Scout forever. Limited to first 100 customers!
              </p>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-7">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                className="relative"
                style={{
                  background: plan.highlighted 
                    ? 'linear-gradient(145deg, #0C0F1A 0%, #1a1f2e 100%)' 
                    : '#FFFFFF',
                  borderRadius: '20px',
                  padding: '32px',
                  boxShadow: plan.highlighted 
                    ? '0 8px 24px rgba(0,0,0,0.12)' 
                    : '0 4px 12px rgba(0,0,0,0.04)',
                  border: plan.highlighted 
                    ? '2px solid rgba(253,138,230,0.3)' 
                    : '1px solid rgba(0,0,0,0.06)',
                  transition: 'all 0.15s ease-out',
                  cursor: 'pointer'
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + (index * 0.1) }}
                onMouseEnter={(e) => {
                  if (!plan.highlighted) {
                    e.currentTarget.style.transform = 'scale(1.01)'
                    e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.06)'
                    e.currentTarget.style.borderColor = 'rgba(253,138,230,0.25)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!plan.highlighted) {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)'
                    e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'
                  }
                }}
              >
                {/* Badge */}
                {plan.highlighted && (
                  <div 
                    className="absolute -top-4 left-1/2 px-4 py-1.5 text-xs font-bold"
                    style={{
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                      color: '#FFFFFF',
                      borderRadius: '9999px',
                      boxShadow: '0 4px 12px rgba(253,138,230,0.3)'
                    }}
                  >
                    {plan.badge}
                  </div>
                )}

                {/* Plan Name */}
                <h3 
                  className="mb-1"
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: plan.highlighted ? '#FFFFFF' : '#0C0F1A',
                    fontFamily: 'var(--font-bricolage), sans-serif'
                  }}
                >
                  {plan.name}
                </h3>
                
                {/* Tagline */}
                <p 
                  className="text-xs font-semibold mb-4"
                  style={{ 
                    color: plan.highlighted ? '#FD8AE6' : '#5E6370' 
                  }}
                >
                  {plan.tagline}
                </p>
                
                {/* Description */}
                <p 
                  className="text-sm mb-8"
                  style={{ 
                    color: plan.highlighted ? 'rgba(255,255,255,0.7)' : '#5E6370' 
                  }}
                >
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-8">
                  <span 
                    style={{
                      fontSize: '3.5rem',
                      fontWeight: 700,
                      color: plan.highlighted ? '#FFFFFF' : '#0C0F1A',
                      lineHeight: 1
                    }}
                  >
                    ${plan.price[billingCycle]}
                  </span>
                  {plan.price.monthly > 0 && (
                    <span 
                      className="text-sm ml-2"
                      style={{ 
                        color: plan.highlighted ? 'rgba(255,255,255,0.6)' : '#5E6370' 
                      }}
                    >
                      {billingCycle === 'lifetime' ? 'one-time' : `/${billingCycle === 'monthly' ? 'mo' : 'yr'}`}
                    </span>
                  )}
                  
                  {billingCycle === 'annual' && plan.price.monthly > 0 && (
                    <div 
                      className="text-xs mt-2 font-medium"
                      style={{ color: '#22C55E' }}
                    >
                      ${plan.price.monthly}/mo billed annually
                    </div>
                  )}
                  
                  {billingCycle === 'lifetime' && plan.price.monthly > 0 && (
                    <div 
                      className="text-xs mt-2 font-medium"
                      style={{ 
                        color: plan.highlighted ? '#FD8AE6' : '#5E6370' 
                      }}
                    >
                      vs ${plan.price.monthly * 12 * 3}/3 years - Save ${(plan.price.monthly * 12 * 3) - plan.price.lifetime}!
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => router.push('/login')}
                  className="w-full mb-8 px-5 py-3.5 rounded-xl font-semibold transition-all"
                  style={{
                    background: plan.highlighted 
                      ? 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)' 
                      : '#0C0F1A',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    fontSize: '0.95rem'
                  }}
                  onMouseEnter={(e) => {
                    if (!plan.highlighted) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)'
                    }
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.06)'
                  }}
                  onMouseLeave={(e) => {
                    if (!plan.highlighted) {
                      e.currentTarget.style.background = '#0C0F1A'
                    }
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
                  }}
                >
                  {plan.cta}
                </button>

                {/* Features */}
                <ul className="space-y-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <svg
                        className="flex-shrink-0 mt-0.5"
                        style={{
                          width: '20px',
                          height: '20px',
                          color: plan.highlighted ? '#FD8AE6' : '#22C55E'
                        }}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span 
                        className="text-sm leading-relaxed"
                        style={{ 
                          color: plan.highlighted ? 'rgba(255,255,255,0.85)' : '#5E6370' 
                        }}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof for Lifetime */}
      {billingCycle === 'lifetime' && (
        <motion.section 
          className="pb-20 px-4 sm:px-6 lg:px-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <div 
            className="max-w-4xl mx-auto p-10 text-center"
            style={{
              background: 'linear-gradient(145deg, #0C0F1A 0%, #1a1f2e 100%)',
              borderRadius: '20px',
              color: '#FFFFFF',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
            }}
          >
            <h3 
              className="mb-8"
              style={{
                fontSize: '2rem',
                fontWeight: 700,
                fontFamily: 'var(--font-bricolage), sans-serif'
              }}
            >
              Why Lifetime Access?
            </h3>
            <div className="grid md:grid-cols-3 gap-8 text-sm">
              <div>
                <div className="text-4xl mb-3">💰</div>
                <div 
                  className="font-semibold mb-2"
                  style={{ fontSize: '1.1rem' }}
                >
                  Massive Savings
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Save thousands vs. paying monthly
                </div>
              </div>
              <div>
                <div className="text-4xl mb-3">🔒</div>
                <div 
                  className="font-semibold mb-2"
                  style={{ fontSize: '1.1rem' }}
                >
                  Price Lock
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Never worry about price increases
                </div>
              </div>
              <div>
                <div className="text-4xl mb-3">🚀</div>
                <div 
                  className="font-semibold mb-2"
                  style={{ fontSize: '1.1rem' }}
                >
                  Support Indies
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Help us build the best creator tool
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* FAQ */}
      <section 
        className="py-24 px-4 sm:px-6 lg:px-8"
        style={{ background: '#FFFFFF' }}
      >
        <div className="max-w-4xl mx-auto">
          <h3 
            className="mb-12 text-center"
            style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#0C0F1A',
              fontFamily: 'var(--font-bricolage), sans-serif'
            }}
          >
            Frequently asked questions
          </h3>
          
          <div className="space-y-6">
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
                a: "Our Free plan gives you access to core features with no time limit. Upgrade to Pro or Premium when you're ready for advanced features."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                className="p-6"
                style={{
                  background: '#F8F9FB',
                  borderRadius: '16px',
                  border: '1px solid rgba(0,0,0,0.04)'
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
              >
                <h4 
                  className="mb-3"
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: '#0C0F1A'
                  }}
                >
                  {faq.q}
                </h4>
                <p style={{ color: '#5E6370', lineHeight: 1.6 }}>
                  {faq.a}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section 
        className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #0C0F1A 0%, #141925 100%)'
        }}
      >
        {/* Gradient Orbs */}
        <div 
          className="absolute top-[-80px] right-[-80px]"
          style={{
            width: '330px',
            height: '330px',
            background: 'radial-gradient(circle, rgba(253,138,230,0.2) 0%, rgba(12,15,26,0) 70%)',
            filter: 'blur(40px)'
          }}
        />
        <div 
          className="absolute bottom-[-120px] left-[-40px]"
          style={{
            width: '420px',
            height: '420px',
            background: 'radial-gradient(circle, rgba(199,125,255,0.22) 0%, rgba(12,15,26,0) 70%)',
            filter: 'blur(40px)'
          }}
        />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h3 
            className="mb-6"
            style={{
              fontSize: '2.75rem',
              fontWeight: 700,
              color: '#FFFFFF',
              fontFamily: 'var(--font-bricolage), sans-serif'
            }}
          >
            Ready to land more brand deals?
          </h3>
          <p 
            className="mb-10"
            style={{
              fontSize: '1.25rem',
              color: 'rgba(255,255,255,0.7)',
              maxWidth: '600px',
              margin: '0 auto 2.5rem'
            }}
          >
            Join creators who are finding, pitching, and closing partnerships faster with Scout.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-10 py-4 text-base font-semibold transition-all"
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
        className="py-12 px-4 sm:px-6 lg:px-8"
        style={{
          background: '#FFFFFF',
          borderTop: '1px solid rgba(0,0,0,0.06)'
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
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
            <div className="flex gap-8">
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
            className="mt-8 pt-8 text-center text-sm"
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