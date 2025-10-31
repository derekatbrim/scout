'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'
import { showToast } from '@/components/ui/toast'

export default function LandingPage() {
  const router = useRouter()
  const supabase = supabaseClient()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setCheckingAuth(false)
    }
    checkUser()
  }, [supabase.auth])

  const handleGetStarted = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      showToast('Please enter your email', 'error')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (error) {
      showToast('Error: ' + error.message, 'error')
    } else {
      showToast('Check your email for the magic link!', 'success')
      setEmail('')
    }

    setLoading(false)
  }

  return (
    <motion.div
      className="min-h-screen"
      style={{ background: '#F8F9FB' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {/* NAV */}
      <nav
        className="sticky top-0 z-40"
        style={{
          background: 'rgba(255,255,255,0.95)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href={user ? '/dashboard' : '/'} className="cursor-pointer">
            <h1
              className="text-2xl font-bold"
              style={{
                color: '#0C0F1A',
                fontFamily: 'var(--font-bricolage), sans-serif',
              }}
            >
              scout
            </h1>
          </Link>

          <div className="flex items-center gap-5">
            {!checkingAuth && user && (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium transition-colors"
                  style={{ color: '#5E6370' }}
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/profile"
                  className="transition-colors"
                  style={{ color: '#5E6370' }}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </Link>
              </>
            )}

            {!checkingAuth && !user && (
              <>
                <button
                  onClick={() => router.push('/login')}
                  className="text-sm font-medium transition-colors"
                  style={{ color: '#5E6370' }}
                >
                  Log in
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="text-sm font-semibold px-4 py-2 transition-all"
                  style={{
                    background: '#0C0F1A',
                    color: '#FFFFFF',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease-out',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow =
                      '0 6px 14px rgba(0,0,0,0.06)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#0C0F1A'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow =
                      '0 2px 8px rgba(0,0,0,0.04)'
                  }}
                >
                  Get started
                </button>
              </>
            )}

            {checkingAuth && (
              <div
                className="h-8 w-20 rounded"
                style={{ background: 'rgba(0,0,0,0.03)' }}
              />
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section - Contra-inspired split layout */}
      <section className="relative py-32 lg:py-40 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Content */}
            <motion.div
              className="max-w-2xl"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <div className="w-2 h-2 bg-[#fd8ae6] rounded-full animate-pulse"></div>
                <span className="text-sm font-medium" style={{ color: '#5E6370' }}>
                  Brand intelligence for creators
                </span>
              </div>

              {/* MASSIVE Headline */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 leading-[1.05]"
                style={{
                  color: '#0C0F1A',
                  fontFamily: 'var(--font-bricolage), sans-serif',
                }}
              >
                Find brand deals.{' '}
                <span className="relative inline-block">
                  <span 
                    className="relative z-10"
                    style={{
                      background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    Close faster.
                  </span>
                  <div className="absolute -bottom-2 left-0 right-0 h-4 -z-0"
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(253,138,230,0.25) 0%, rgba(199,125,255,0.2) 100%)',
                      filter: 'blur(1px)',
                    }}
                  ></div>
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg sm:text-xl mb-10 leading-relaxed"
                style={{ color: '#5E6370' }}
              >
                Scout helps you discover brands, track your outreach, and close more partnerships. Your deal pipeline, built for speed.
              </p>

              {/* CTA Form */}
              <form onSubmit={handleGetStarted} className="mb-5">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-5 py-4 text-base h-14 rounded-xl focus:outline-none"
                    style={{
                      border: '2px solid rgba(0,0,0,0.06)',
                      background: '#FFFFFF',
                      color: '#0C0F1A',
                      transition: 'all 0.15s ease-out',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(253,138,230,0.5)'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(253,138,230,0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-4 h-14 rounded-xl font-semibold"
                    style={{
                      background: loading ? '#9CA3AF' : '#0C0F1A',
                      color: '#FFFFFF',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease-out',
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.08)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) {
                        e.currentTarget.style.background = '#0C0F1A'
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)'
                      }
                    }}
                  >
                    {loading ? 'Sending...' : 'Get started free'}
                  </button>
                </div>
              </form>

              <div className="flex items-center gap-2 text-sm" style={{ color: '#5E6370' }}>
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Free to start · No credit card · Join 500+ creators</span>
              </div>
            </motion.div>

            {/* Right: Product Mockup */}
            <motion.div
              className="relative lg:block hidden"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="relative z-10">
                <div className="overflow-hidden transform rotate-2 hover:rotate-0 transition-all duration-500"
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '20px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(0,0,0,0.06)',
                  }}
                >
                  {/* Browser chrome */}
                  <div className="px-4 py-3 flex items-center gap-2"
                    style={{
                      background: 'rgba(0,0,0,0.02)',
                      borderBottom: '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="flex-1 mx-4 bg-white rounded px-3 py-1 text-xs"
                      style={{ color: '#9CA3AF' }}
                    >
                      scout.app/dashboard
                    </div>
                  </div>
                  {/* Screenshot */}
                  <div className="aspect-[4/3] p-6"
                    style={{
                      background: 'linear-gradient(to bottom right, #F8F9FB, rgba(248,249,251,0.5))',
                    }}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full"
                          style={{
                            background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                          }}
                        ></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 rounded w-3/4"
                            style={{ background: 'rgba(0,0,0,0.06)' }}
                          ></div>
                          <div className="h-3 rounded w-1/2"
                            style={{ background: 'rgba(0,0,0,0.04)' }}
                          ></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="rounded-xl p-4"
                            style={{
                              background: '#FFFFFF',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            }}
                          >
                            <div className="h-8 rounded mb-2"
                              style={{ background: 'rgba(253,138,230,0.15)' }}
                            ></div>
                            <div className="h-3 rounded"
                              style={{ background: 'rgba(0,0,0,0.06)' }}
                            ></div>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-xl p-6 space-y-3"
                        style={{
                          background: '#FFFFFF',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        }}
                      >
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg"
                              style={{
                                background: 'linear-gradient(135deg, rgba(251,146,60,0.8), rgba(253,138,230,0.6))',
                              }}
                            ></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-3 rounded w-2/3"
                                style={{ background: 'rgba(0,0,0,0.06)' }}
                              ></div>
                              <div className="h-2 rounded w-1/3"
                                style={{ background: 'rgba(0,0,0,0.04)' }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Radial gradient glow */}
              <div className="absolute -top-10 -right-12 w-64 h-64 blur-3xl rounded-full -z-10"
                style={{ background: 'rgba(253,138,230,0.25)' }}
              ></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF - More spacing */}
      <section
        className="py-16"
        style={{
          background: '#FFFFFF',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 lg:px-8 text-center">
          <p
            className="text-xs font-medium tracking-[0.35em] mb-10"
            style={{ color: '#5E6370' }}
          >
            TRUSTED BY CREATORS ON
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center justify-items-center">
            {['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn'].map(
              (platform) => (
                <div key={platform} style={{ color: '#9CA3AF', fontWeight: 600, fontSize: '1.1rem' }}>
                  {platform}
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS - More spacing */}
      <section className="py-32 px-6 lg:px-8" style={{ background: '#F8F9FB' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="mb-4"
              style={{
                fontSize: '3rem',
                color: '#0C0F1A',
                fontFamily: 'var(--font-bricolage), sans-serif',
              }}
            >
              Why creators love Scout
            </h2>
            <p style={{ color: '#5E6370', fontSize: '1.15rem', maxWidth: '600px', margin: '0 auto' }}>
              Real outreach, real pipelines, real responses.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah Chen',
                role: 'Food creator · 85k followers',
                text: '"Scout helped me land 3 new brand deals in my first month."',
                initials: 'SC',
                avatarBg: 'linear-gradient(135deg, #FD8AE6 0%, #FB7185 100%)',
              },
              {
                name: 'Marcus Johnson',
                role: 'Fitness creator · 120k followers',
                text: '"The pipeline feature is fire. I stopped losing brands in my inbox."',
                initials: 'MJ',
                avatarBg: 'linear-gradient(135deg, #22C55E 0%, #14B8A6 100%)',
              },
              {
                name: 'Emma Park',
                role: 'Beauty creator · 45k followers',
                text: '"A tool made for creators, not agencies."',
                initials: 'EP',
                avatarBg: 'linear-gradient(135deg, #C77DFF 0%, #FD8AE6 100%)',
              },
            ].map((t, i) => (
              <motion.div
                key={i}
                className="h-full flex flex-col transition-all cursor-pointer"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: '20px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                  padding: '32px',
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                whileHover={{
                  y: -4,
                  boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                  borderColor: 'rgba(253,138,230,0.25)',
                }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '18px',
                      background: t.avatarBg,
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1.25rem',
                    }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#0C0F1A', fontSize: '1.05rem' }}>
                      {t.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#5E6370' }}>
                      {t.role}
                    </div>
                  </div>
                </div>
                <p style={{ color: '#5E6370', lineHeight: 1.7, fontSize: '1rem' }}>{t.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* EVERYTHING YOU NEED - MUCH MORE SPACING */}
      <section className="py-32 px-6 lg:px-8" style={{ background: '#FFFFFF' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2
              style={{
                fontSize: '3rem',
                color: '#0C0F1A',
                fontFamily: 'var(--font-bricolage), sans-serif',
                marginBottom: '20px',
              }}
            >
              Everything you need to land brand deals
            </h2>
            <p
              style={{
                color: '#5E6370',
                fontSize: '1.15rem',
                maxWidth: '600px',
                margin: '0 auto',
              }}
            >
              Discovery, pipeline, analytics. Built for creators who close deals.
            </p>
          </div>

          <div className="space-y-40">
            {/* 1 - Brand Database */}
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    background: 'rgba(251,146,60,0.08)',
                    border: '1px solid rgba(251,146,60,0.25)',
                    borderRadius: '9999px',
                    color: '#c05621',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    marginBottom: '20px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Brand database
                </div>
                <h3 style={{ fontSize: '2.5rem', marginBottom: '16px', color: '#0C0F1A', fontFamily: 'var(--font-bricolage), sans-serif', lineHeight: 1.2 }}>
                  Discover 70+ brands ready to work with creators
                </h3>
                <p style={{ color: '#5E6370', marginBottom: '24px', fontSize: '1.05rem', lineHeight: 1.7 }}>
                  Filter by category, see typical ranges, grab the right contact, send better pitches.
                </p>
                <ul className="space-y-4">
                  {[
                    'Filter by category and niche',
                    'See typical deal ranges',
                    'View response rates',
                    'Get contact info instantly',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '9999px',
                          background: 'rgba(34,197,94,0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <svg
                          className="w-4 h-4"
                          style={{ color: '#22C55E' }}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                      <span style={{ color: '#0C0F1A', fontSize: '1rem' }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(251,146,60,0.08) 0%, rgba(253,138,230,0.04) 100%)',
                    border: '1px solid rgba(251,146,60,0.2)',
                    borderRadius: '20px',
                    padding: '24px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                  }}
                >
                  {[
                    { name: 'Finest Call', rate: '$2,000–$5,000', tag: 'Food & Bev' },
                    { name: 'Athletic Greens', rate: '$3,000–$8,000', tag: 'Health' },
                    { name: 'Glossier', rate: '$1,500–$4,000', tag: 'Beauty' },
                  ].map((brand, idx) => (
                    <div
                      key={brand.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        background: '#FFFFFF',
                        border: '1px solid rgba(0,0,0,0.04)',
                        borderRadius: '16px',
                        padding: '16px',
                        marginBottom: idx < 2 ? '12px' : '0',
                      }}
                    >
                      <div
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '16px',
                          background: '#0C0F1A',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: '1.1rem',
                        }}
                      >
                        {brand.name.slice(0, 2)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#0C0F1A', fontSize: '1rem' }}>
                          {brand.name}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#22C55E', fontWeight: 600 }}>
                          {brand.rate}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          background: 'rgba(12,15,26,0.04)',
                          border: '1px solid rgba(0,0,0,0.04)',
                          borderRadius: '9999px',
                          padding: '6px 12px',
                          fontWeight: 600,
                        }}
                      >
                        {brand.tag}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* 2 - Pipeline */}
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <motion.div
                className="order-last lg:order-first"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    background: 'rgba(199,125,255,0.08)',
                    border: '1px solid rgba(199,125,255,0.3)',
                    borderRadius: '9999px',
                    color: '#6B21A8',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    marginBottom: '20px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Deal pipeline
                </div>
                <h3 style={{ fontSize: '2.5rem', marginBottom: '16px', color: '#0C0F1A', fontFamily: 'var(--font-bricolage), sans-serif', lineHeight: 1.2 }}>
                  Track deals from pitch to payment
                </h3>
                <p style={{ color: '#5E6370', marginBottom: '24px', fontSize: '1.05rem', lineHeight: 1.7 }}>
                  Visual stages, notes, values. Your actual pipeline, not a demo.
                </p>
                <ul className="space-y-4">
                  {[
                    '5 pipeline stages',
                    'Drag and drop deals',
                    'Add notes and deadlines',
                    'Track deal value',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '9999px',
                          background: 'rgba(34,197,94,0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <svg
                          className="w-4 h-4"
                          style={{ color: '#22C55E' }}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                      <span style={{ color: '#0C0F1A', fontSize: '1rem' }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
              <motion.div
                className="order-first lg:order-last"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(199,125,255,0.08) 0%, rgba(59,130,246,0.04) 100%)',
                    border: '1px solid rgba(199,125,255,0.3)',
                    borderRadius: '20px',
                    padding: '24px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                    display: 'flex',
                    gap: '16px',
                    overflowX: 'auto',
                  }}
                >
                  {['Prospect', 'Pitched', 'Won'].map((stage) => (
                    <div key={stage} style={{ minWidth: '180px' }}>
                      <div
                        style={{
                          fontSize: '0.65rem',
                          color: '#5E6370',
                          marginBottom: '12px',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                        }}
                      >
                        {stage}
                      </div>
                      <div className="space-y-3">
                        {[1, 2].map((i) => (
                          <div
                            key={i}
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid rgba(0,0,0,0.04)',
                              borderRadius: '16px',
                              padding: '12px',
                            }}
                          >
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                                marginBottom: '8px',
                              }}
                            />
                            <div
                              style={{
                                width: '80%',
                                height: '6px',
                                background: 'rgba(12,15,26,0.08)',
                                borderRadius: '9999px',
                                marginBottom: '6px',
                              }}
                            />
                            <div
                              style={{
                                width: '55%',
                                height: '6px',
                                background: 'rgba(12,15,26,0.04)',
                                borderRadius: '9999px',
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* 3 - Analytics */}
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    background: 'rgba(34,197,94,0.08)',
                    border: '1px solid rgba(34,197,94,0.28)',
                    borderRadius: '9999px',
                    color: '#166534',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    marginBottom: '20px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Smart analytics
                </div>
                <h3 style={{ fontSize: '2.5rem', marginBottom: '16px', color: '#0C0F1A', fontFamily: 'var(--font-bricolage), sans-serif', lineHeight: 1.2 }}>
                  Know your numbers, grow your business
                </h3>
                <p style={{ color: '#5E6370', marginBottom: '24px', fontSize: '1.05rem', lineHeight: 1.7 }}>
                  Pipeline value, win rate, time to close. Numbers that matter.
                </p>
                <ul className="space-y-4">
                  {[
                    'Pipeline value tracking',
                    'Win rate analytics',
                    'Deal velocity metrics',
                    'Performance insights',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '9999px',
                          background: 'rgba(34,197,94,0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <svg
                          className="w-4 h-4"
                          style={{ color: '#22C55E' }}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                      <span style={{ color: '#0C0F1A', fontSize: '1rem' }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(248,249,251,1) 100%)',
                    border: '1px solid rgba(34,197,94,0.26)',
                    borderRadius: '20px',
                    padding: '24px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                  }}
                >
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {[
                      { label: 'Active deals', value: '12', color: '#3B82F6' },
                      { label: 'Pipeline value', value: '$24k', color: '#22C55E' },
                      { label: 'Win rate', value: '67%', color: '#C77DFF' },
                      { label: 'Avg deal', value: '$4.2k', color: '#FB7185' },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid rgba(0,0,0,0.04)',
                          borderRadius: '16px',
                          padding: '16px',
                        }}
                      >
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '9999px',
                            background: stat.color,
                            marginBottom: '10px',
                          }}
                        />
                        <div
                          style={{
                            fontWeight: 700,
                            color: '#0C0F1A',
                            fontSize: '1.5rem',
                            marginBottom: '4px',
                          }}
                        >
                          {stat.value}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#5E6370' }}>
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid rgba(0,0,0,0.04)',
                      borderRadius: '16px',
                      padding: '16px',
                    }}
                  >
                    <div className="flex items-end gap-2" style={{ height: '100px' }}>
                      {[44, 68, 52, 82, 58, 92, 71].map((h, i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            background: 'linear-gradient(180deg, rgba(199,125,255,0.8) 0%, rgba(199,125,255,0) 100%)',
                            height: `${h}%`,
                            borderTopLeftRadius: '8px',
                            borderTopRightRadius: '8px',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 lg:px-8 py-32" style={{ background: '#F8F9FB' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 mb-16">
            <div>
              <h3
                style={{
                  fontSize: '2.5rem',
                  color: '#0C0F1A',
                  fontFamily: 'var(--font-bricolage), sans-serif',
                  marginBottom: '8px',
                }}
              >
                How Scout works
              </h3>
              <p style={{ color: '#5E6370', fontSize: '1.05rem' }}>Four simple steps to more brand deals.</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/pricing"
                className="text-sm transition-all"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: '9999px',
                  padding: '12px 24px',
                  color: '#0C0F1A',
                  fontWeight: 500,
                }}
              >
                View pricing
              </Link>
              <Link
                href="/login"
                className="text-sm transition-all"
                style={{
                  background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                  borderRadius: '9999px',
                  padding: '12px 24px',
                  color: '#FFFFFF',
                  fontWeight: 600,
                }}
              >
                Get started
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                num: '1',
                title: 'Browse brands',
                desc: 'Search 70+ brands looking for creators.',
              },
              {
                num: '2',
                title: 'Add to pipeline',
                desc: 'Save the good ones so they stay visible.',
              },
              {
                num: '3',
                title: 'Pitch & negotiate',
                desc: 'Move deals across stages.',
              },
              {
                num: '4',
                title: 'Get paid',
                desc: 'Deliver content, track the bag, repeat.',
              },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                className="transition-all cursor-pointer"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: '20px',
                  padding: '32px 24px',
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                whileHover={{
                  y: -4,
                  borderColor: 'rgba(253,138,230,0.25)',
                }}
              >
                <div
                  className="mb-6 flex items-center justify-center"
                  style={{
                    width: '64px',
                    height: '64px',
                    background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                    borderRadius: '20px',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '1.5rem',
                  }}
                >
                  {step.num}
                </div>
                <h4
                  style={{
                    color: '#0C0F1A',
                    fontWeight: 600,
                    marginBottom: '8px',
                    fontSize: '1.1rem',
                  }}
                >
                  {step.title}
                </h4>
                <p style={{ color: '#5E6370', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS - Cleaner, not app icons */}
      <section className="py-32 px-6 lg:px-8" style={{ background: '#FFFFFF' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-16">
            {[
              {
                value: '70+',
                label: 'Brands in database',
                color: 'linear-gradient(135deg, #FD8AE6 0%, #FB7185 100%)',
              },
              {
                value: '500+',
                label: 'Active creators',
                color: 'linear-gradient(135deg, #C77DFF 0%, #3B82F6 100%)',
              },
              {
                value: '$2k-$15k',
                label: 'Typical deal range',
                color: 'linear-gradient(135deg, #22C55E 0%, #14B8A6 100%)',
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
              >
                <div className="mb-6 mx-auto"
                  style={{
                    width: '6px',
                    height: '48px',
                    background: stat.color,
                    borderRadius: '9999px',
                  }}
                />
                <div style={{ fontSize: '4rem', fontWeight: 700, color: '#0C0F1A', marginBottom: '12px', fontFamily: 'var(--font-bricolage), sans-serif' }}>
                  {stat.value}
                </div>
                <div style={{ color: '#5E6370', fontSize: '1.05rem' }}>{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="relative py-32 px-6 lg:px-8 overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #0C0F1A 0%, #141925 100%)',
        }}
      >
        <div
          className="absolute top-[-80px] right-[-80px]"
          style={{
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(253,138,230,0.2) 0%, rgba(12,15,26,0) 70%)',
            filter: 'blur(18px)',
          }}
        />
        <div
          className="absolute bottom-[-120px] left-[-40px]"
          style={{
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(199,125,255,0.22) 0%, rgba(12,15,26,0) 70%)',
            filter: 'blur(18px)',
          }}
        />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2
            className="mb-6"
            style={{
              fontSize: '3.5rem',
              color: '#FFFFFF',
              fontFamily: 'var(--font-bricolage), sans-serif',
            }}
          >
            Ready to land your next brand deal?
          </h2>
          <p
            className="mb-12"
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '1.15rem',
              maxWidth: '600px',
              margin: '0 auto 48px',
            }}
          >
            Join 500+ creators who are finding, pitching, and closing brand partnerships faster with Scout.
          </p>

          <form onSubmit={handleGetStarted} className="max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={loading}
                className="flex-1 px-5 text-base"
                style={{
                  height: '56px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '14px',
                  color: '#FFFFFF',
                  transition: 'all 0.15s ease-out',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
                  e.currentTarget.style.borderColor = 'rgba(253,138,230,0.5)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                }}
              />
              <button
                type="submit"
                disabled={loading}
                className="text-sm font-semibold"
                style={{
                  height: '56px',
                  background: loading ? '#9CA3AF' : '#FFFFFF',
                  color: loading ? '#FFFFFF' : '#0C0F1A',
                  borderRadius: '14px',
                  padding: '0 32px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease-out',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)'
                    e.currentTarget.style.color = '#FFFFFF'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.08)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = '#FFFFFF'
                    e.currentTarget.style.color = '#0C0F1A'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }
                }}
              >
                {loading ? 'Sending...' : 'Get started free'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className="py-12 px-6 lg:px-8"
        style={{
          background: '#FFFFFF',
          borderTop: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1
              className="text-2xl font-bold mb-2"
              style={{
                color: '#0C0F1A',
                fontFamily: 'var(--font-bricolage), sans-serif',
              }}
            >
              scout
            </h1>
            <p style={{ color: '#5E6370', fontSize: '0.9rem' }}>
              Brand intelligence for creators
            </p>
          </div>
          <div className="flex gap-8">
            <Link href="/" className="text-sm transition-colors" style={{ color: '#5E6370' }}>
              Home
            </Link>
            <Link href="/pricing" className="text-sm transition-colors" style={{ color: '#5E6370' }}>
              Pricing
            </Link>
            <Link href="/support" className="text-sm transition-colors" style={{ color: '#5E6370' }}>
              Contact
            </Link>
          </div>
        </div>
        <div className="mt-10 text-center text-xs" style={{ color: '#9CA3AF' }}>
          © 2025 Scout. All rights reserved.
        </div>
      </footer>
    </motion.div>
  )
}