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
      className="min-h-screen overflow-x-hidden w-full"
      style={{ background: '#F8F9FB' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {/* NAV - Mobile Optimized */}
      <nav
        className="sticky top-0 z-40 w-full"
        style={{
          background: 'rgba(255,255,255,0.95)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <Link href={user ? '/dashboard' : '/'} className="cursor-pointer flex-shrink-0">
            <h1
              className="text-xl sm:text-2xl font-bold"
              style={{
                color: '#0C0F1A',
                fontFamily: 'var(--font-bricolage), sans-serif',
              }}
            >
              scout
            </h1>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            {!checkingAuth && user && (
              <>
                <Link
                  href="/dashboard"
                  className="hidden sm:block text-sm font-medium transition-colors"
                  style={{ color: '#5E6370' }}
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/profile"
                  className="transition-colors p-1"
                  style={{ color: '#5E6370' }}
                >
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6"
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
                  className="text-xs sm:text-sm font-medium transition-colors"
                  style={{ color: '#5E6370' }}
                >
                  Log in
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="text-xs sm:text-sm font-semibold px-2.5 sm:px-4 py-1.5 sm:py-2 transition-all"
                  style={{
                    background: '#0C0F1A',
                    color: '#FFFFFF',
                    borderRadius: '10px',
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
                className="h-8 w-16 sm:w-20 rounded"
                style={{ background: 'rgba(0,0,0,0.03)' }}
              />
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section - Fully Mobile Optimized */}
      <section className="relative py-10 sm:py-16 md:py-20 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden w-full">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
            {/* Left: Content */}
            <motion.div
              className="w-full max-w-2xl mx-auto lg:mx-0"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-5 sm:mb-6 md:mb-8"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#fd8ae6] rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm font-medium" style={{ color: '#5E6370' }}>
                  Brand intelligence for creators
                </span>
              </div>

              {/* Hero Headline - BIGGER and more prominent */}
              <h1 
                className="font-bold mb-4 sm:mb-5 md:mb-6 leading-[1.1] sm:leading-[1.05]"
                style={{
                  fontSize: 'clamp(2.25rem, 10vw, 5.5rem)',
                  color: '#0C0F1A',
                  fontFamily: 'var(--font-bricolage), sans-serif',
                  letterSpacing: '-0.02em',
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
                  <div 
                    className="absolute left-0 right-0 -z-0"
                    style={{ 
                      bottom: 'clamp(2px, 0.5vw, 8px)',
                      height: 'clamp(8px, 2vw, 12px)',
                      background: 'linear-gradient(135deg, rgba(253,138,230,0.25) 0%, rgba(199,125,255,0.2) 100%)',
                      filter: 'blur(1px)',
                    }}
                  ></div>
                </span>
              </h1>

              {/* Subheadline */}
              <p 
                className="mb-6 sm:mb-7 md:mb-8 leading-relaxed"
                style={{
                  fontSize: 'clamp(0.9375rem, 2.5vw, 1.125rem)',
                  color: '#5E6370',
                }}
              >
                scout shows you the brands, helps you track conversations, and keeps every deal moving. It is your pipeline, just dressed for visitors.
              </p>

              {/* CTA Form - Mobile optimized */}
              <form onSubmit={handleGetStarted} className="mb-4 sm:mb-5">
                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-4 py-3 sm:py-3.5 text-sm sm:text-base border-2 border-slate-200 rounded-xl sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#fd8ae6] focus:border-[#fd8ae6] transition-all"
                    style={{
                      height: '48px',
                      fontFamily: 'var(--font-libre), sans-serif',
                    }}
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-semibold rounded-xl sm:rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-md hover:shadow-lg active:scale-95 whitespace-nowrap"
                    style={{
                      height: '48px',
                      background: loading ? '#9CA3AF' : '#020c1f',
                      color: '#FFFFFF',
                      fontFamily: 'var(--font-libre), sans-serif',
                      transition: 'all 0.15s ease-out',
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) {
                        e.currentTarget.style.background = '#020c1f'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }
                    }}
                  >
                    {loading ? "Sending..." : "Get started free"}
                  </button>
                </div>
              </form>

              <div className="flex items-center gap-2 text-xs sm:text-sm" style={{ color: '#9CA3AF' }}>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" style={{ color: '#22C55E' }} fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Free to start · No credit card · Join 500+ creators</span>
              </div>
            </motion.div>

            {/* Right: Product Mockup - Hide on mobile for better UX */}
            <motion.div 
              className="relative hidden lg:block"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="relative z-10">
                <div 
                  className="overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-500"
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
                    border: '2px solid rgba(0,0,0,0.06)',
                  }}
                >
                  {/* Browser chrome */}
                  <div className="px-4 py-3 border-b flex items-center gap-2"
                    style={{
                      background: '#F8F9FB',
                      borderColor: 'rgba(0,0,0,0.06)',
                    }}
                  >
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="flex-1 mx-4 bg-white rounded px-3 py-1 text-xs" style={{ color: '#9CA3AF' }}>
                      scout.app/dashboard
                    </div>
                  </div>
                  {/* Screenshot placeholder */}
                  <div className="aspect-[4/3] p-6"
                    style={{
                      background: 'linear-gradient(to bottom right, #F8F9FB, #E5E7EB)',
                    }}
                  >
                    <div className="space-y-4">
                      {/* Placeholder dashboard elements */}
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-16 h-16 rounded-full"
                          style={{
                            background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                          }}
                        ></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 rounded" style={{ background: '#D1D5DB', width: '75%' }}></div>
                          <div className="h-3 rounded" style={{ background: '#E5E7EB', width: '50%' }}></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="rounded-xl p-4 shadow-sm" style={{ background: '#FFFFFF' }}>
                            <div className="h-8 rounded mb-2" style={{ background: 'rgba(253,138,230,0.2)' }}></div>
                            <div className="h-3 rounded" style={{ background: '#E5E7EB' }}></div>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-xl p-6 shadow-sm space-y-3" style={{ background: '#FFFFFF' }}>
                        {[1,2,3].map(i => (
                          <div key={i} className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-lg"
                              style={{
                                background: 'linear-gradient(135deg, #FB923C 0%, #F87171 100%)',
                              }}
                            ></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-3 rounded" style={{ background: '#E5E7EB', width: '66%' }}></div>
                              <div className="h-2 rounded" style={{ background: '#F3F4F6', width: '33%' }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Glow effect */}
              <div 
                className="absolute -top-10 -right-12 w-56 h-56 rounded-full -z-10"
                style={{
                  background: 'radial-gradient(circle, rgba(253,138,230,0.3) 0%, rgba(12,15,26,0) 70%)',
                  filter: 'blur(40px)',
                }}
              ></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF - Mobile optimized */}
      <section
        className="py-8 sm:py-10 md:py-12 px-4 sm:px-6 lg:px-8 w-full"
        style={{
          background: '#FFFFFF',
          borderTop: '1px solid rgba(0,0,0,0.03)',
          borderBottom: '1px solid rgba(0,0,0,0.03)',
        }}
      >
        <div className="max-w-6xl mx-auto text-center">
          <p
            className="text-[0.625rem] sm:text-xs font-medium tracking-[0.25em] sm:tracking-[0.3em] mb-6 sm:mb-8"
            style={{ color: '#5E6370' }}
          >
            TRUSTED BY CREATORS ON
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 sm:gap-6 items-center justify-items-center">
            {['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn'].map(
              (platform, i) => (
                <motion.div 
                  key={platform} 
                  className={`text-sm sm:text-base font-semibold ${i >= 3 ? 'hidden sm:block' : ''}`}
                  style={{ color: '#9CA3AF' }}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  {platform}
                </motion.div>
              )
            )}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS - Mobile optimized grid */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 w-full" style={{ background: '#F8F9FB' }}>
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-10 sm:mb-12 md:mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <h2
              className="mb-3"
              style={{
                fontSize: 'clamp(1.75rem, 5vw, 2.6rem)',
                color: '#0C0F1A',
                fontFamily: 'var(--font-bricolage), sans-serif',
              }}
            >
              Why creators love Scout
            </h2>
            <p className="text-sm sm:text-base mx-auto" style={{ color: '#5E6370', maxWidth: '560px' }}>
              Real outreach, real pipelines, real responses.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-7">
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
                className="h-full flex flex-col"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                  padding: 'clamp(20px, 4vw, 28px)',
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                  <div
                    style={{
                      width: 'clamp(48px, 10vw, 56px)',
                      height: 'clamp(48px, 10vw, 56px)',
                      borderRadius: '14px',
                      background: t.avatarBg,
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 'clamp(1rem, 2vw, 1.15rem)',
                      flexShrink: 0,
                    }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm sm:text-base font-semibold" style={{ color: '#0C0F1A' }}>
                      {t.name}
                    </div>
                    <div className="text-xs sm:text-sm" style={{ color: '#5E6370' }}>
                      {t.role}
                    </div>
                  </div>
                </div>
                <p className="text-sm sm:text-base leading-relaxed" style={{ color: '#5E6370' }}>{t.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* EVERYTHING YOU NEED - Mobile optimized sections */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 w-full" style={{ background: '#FFFFFF' }}>
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-10 sm:mb-12 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <h2
              style={{
                fontSize: 'clamp(1.75rem, 5vw, 2.4rem)',
                color: '#0C0F1A',
                fontFamily: 'var(--font-bricolage), sans-serif',
                marginBottom: 'clamp(12px, 2vw, 14px)',
              }}
            >
              Everything you need to land brand deals
            </h2>
            <p
              className="text-sm sm:text-base mx-auto"
              style={{
                color: '#5E6370',
                maxWidth: '540px',
              }}
            >
              Discovery, pipeline, analytics. The same stack you use in dashboard views.
            </p>
          </motion.div>

          <div className="space-y-16 sm:space-y-20">
            {/* Feature 1 */}
            <motion.div 
              className="grid lg:grid-cols-2 gap-8 sm:gap-10 md:gap-14 items-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div>
                <p
                  style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    background: 'rgba(251,146,60,0.08)',
                    border: '1px solid rgba(251,146,60,0.2)',
                    borderRadius: '9999px',
                    color: '#c05621',
                    fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)',
                    fontWeight: 600,
                    marginBottom: '12px',
                  }}
                >
                  Brand database
                </p>
                <h3 className="mb-3 sm:mb-4" style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: '#0C0F1A', fontFamily: 'var(--font-bricolage), sans-serif' }}>
                  Discover 70+ brands ready to work with creators
                </h3>
                <p className="text-sm sm:text-base mb-4 sm:mb-5" style={{ color: '#5E6370' }}>
                  Filter by category, see typical ranges, grab the right contact, send better pitches.
                </p>
                <ul className="space-y-2.5 sm:space-y-3">
                  {[
                    'Filter by category and niche',
                    'See typical deal ranges',
                    'View response rates',
                    'Get contact info instantly',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 sm:gap-3">
                      <span
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '9999px',
                          background: 'rgba(34,197,94,0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <svg
                          className="w-3 h-3"
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
                      <span className="text-sm sm:text-base" style={{ color: '#0C0F1A' }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(251,146,60,0.08) 0%, rgba(253,138,230,0.04) 100%)',
                    border: '1px solid rgba(251,146,60,0.12)',
                    borderRadius: '16px',
                    padding: 'clamp(14px, 3vw, 18px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                  }}
                >
                  {[
                    { name: 'Finest Call', rate: '$2,000–$5,000', tag: 'Food & Bev' },
                    { name: 'Athletic Greens', rate: '$3,000–$8,000', tag: 'Health' },
                    { name: 'Glossier', rate: '$1,500–$4,000', tag: 'Beauty' },
                  ].map((brand) => (
                    <div
                      key={brand.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'clamp(10px, 2vw, 12px)',
                        background: '#FFFFFF',
                        border: '1px solid rgba(0,0,0,0.02)',
                        borderRadius: '12px',
                        padding: 'clamp(10px, 2vw, 12px)',
                        marginBottom: '10px',
                      }}
                    >
                      <div
                        style={{
                          width: 'clamp(40px, 8vw, 48px)',
                          height: 'clamp(40px, 8vw, 48px)',
                          borderRadius: '12px',
                          background: '#0C0F1A',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                          flexShrink: 0,
                        }}
                      >
                        {brand.name.slice(0, 2)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="text-sm sm:text-base font-semibold truncate" style={{ color: '#0C0F1A' }}>
                          {brand.name}
                        </div>
                        <div className="text-xs sm:text-sm font-medium" style={{ color: '#22C55E' }}>
                          {brand.rate}
                        </div>
                      </div>
                      <div
                        className="text-xs whitespace-nowrap"
                        style={{
                          background: 'rgba(12,15,26,0.04)',
                          border: '1px solid rgba(0,0,0,0.03)',
                          borderRadius: '9999px',
                          padding: '4px 10px',
                          fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)',
                        }}
                      >
                        {brand.tag}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              className="grid lg:grid-cols-2 gap-8 sm:gap-10 md:gap-14 items-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="order-last lg:order-first">
                <p
                  style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    background: 'rgba(199,125,255,0.08)',
                    border: '1px solid rgba(199,125,255,0.3)',
                    borderRadius: '9999px',
                    color: '#6B21A8',
                    fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)',
                    fontWeight: 600,
                    marginBottom: '12px',
                  }}
                >
                  Deal pipeline
                </p>
                <h3 className="mb-3 sm:mb-4" style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: '#0C0F1A', fontFamily: 'var(--font-bricolage), sans-serif' }}>
                  Track deals from pitch to payment
                </h3>
                <p className="text-sm sm:text-base mb-4 sm:mb-5" style={{ color: '#5E6370' }}>
                  Visual stages, notes, values. The stuff from your dashboard, not a marketing mock.
                </p>
                <ul className="space-y-2.5 sm:space-y-3">
                  {[
                    '5 pipeline stages',
                    'Drag and drop deals',
                    'Add notes and deadlines',
                    'Track deal value',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 sm:gap-3">
                      <span
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '9999px',
                          background: 'rgba(34,197,94,0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <svg
                          className="w-3 h-3"
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
                      <span className="text-sm sm:text-base" style={{ color: '#0C0F1A' }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="order-first lg:order-last">
                <div className="overflow-hidden">
                  <div
                    className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0"
                    style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                    }}
                  >
                    <div
                      style={{
                        background: 'linear-gradient(135deg, rgba(199,125,255,0.08) 0%, rgba(59,130,246,0.04) 100%)',
                        border: '1px solid rgba(199,125,255,0.3)',
                        borderRadius: '16px',
                        padding: 'clamp(14px, 3vw, 20px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                        display: 'flex',
                        gap: 'clamp(8px, 2vw, 12px)',
                        minWidth: 'fit-content',
                        maxWidth: '100%',
                      }}
                    >
                      {['Prospect', 'Pitched', 'Won'].map((stage) => (
                        <div key={stage} style={{ minWidth: 'clamp(120px, 22vw, 170px)', maxWidth: '180px' }}>
                          <div
                            style={{
                              fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)',
                              color: '#5E6370',
                              marginBottom: '8px',
                              textTransform: 'uppercase',
                              fontWeight: 600,
                            }}
                          >
                            {stage}
                          </div>
                          <div className="space-y-2.5 sm:space-y-3">
                            {[1, 2].map((i) => (
                              <div
                                key={i}
                                style={{
                                  background: '#FFFFFF',
                                  border: '1px solid rgba(0,0,0,0.04)',
                                  borderRadius: '12px',
                                  padding: 'clamp(8px, 2vw, 10px)',
                                }}
                              >
                                <div
                                  style={{
                                    width: 'clamp(28px, 6vw, 32px)',
                                    height: 'clamp(28px, 6vw, 32px)',
                                    borderRadius: '8px',
                                    background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                                    marginBottom: '6px',
                                  }}
                                />
                                <div
                                  style={{
                                    width: '80%',
                                    height: '6px',
                                    background: 'rgba(12,15,26,0.08)',
                                    borderRadius: '9999px',
                                    marginBottom: '4px',
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
                  </div>
                </div>
                <style jsx>{`
                  div::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              className="grid lg:grid-cols-2 gap-8 sm:gap-10 md:gap-14 items-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div>
                <p
                  style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    background: 'rgba(34,197,94,0.08)',
                    border: '1px solid rgba(34,197,94,0.28)',
                    borderRadius: '9999px',
                    color: '#166534',
                    fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)',
                    fontWeight: 600,
                    marginBottom: '12px',
                  }}
                >
                  Smart analytics
                </p>
                <h3 className="mb-3 sm:mb-4" style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: '#0C0F1A', fontFamily: 'var(--font-bricolage), sans-serif' }}>
                  Know your numbers, grow your business
                </h3>
                <p className="text-sm sm:text-base mb-4 sm:mb-5" style={{ color: '#5E6370' }}>
                  Pipeline value, win rate, time to close. Presentable numbers for brands.
                </p>
                <ul className="space-y-2.5 sm:space-y-3">
                  {[
                    'Pipeline value tracking',
                    'Win rate analytics',
                    'Deal velocity metrics',
                    'Performance insights',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 sm:gap-3">
                      <span
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '9999px',
                          background: 'rgba(34,197,94,0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <svg
                          className="w-3 h-3"
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
                      <span className="text-sm sm:text-base" style={{ color: '#0C0F1A' }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(248,249,251,1) 100%)',
                    border: '1px solid rgba(34,197,94,0.26)',
                    borderRadius: '16px',
                    padding: 'clamp(14px, 3vw, 20px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                  }}
                >
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
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
                          border: '1px solid rgba(0,0,0,0.03)',
                          borderRadius: '12px',
                          padding: 'clamp(10px, 2vw, 12px)',
                        }}
                      >
                        <div
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '9999px',
                            background: stat.color,
                            marginBottom: '6px',
                          }}
                        />
                        <div
                          className="text-xl sm:text-2xl"
                          style={{
                            fontWeight: 700,
                            color: '#0C0F1A',
                          }}
                        >
                          {stat.value}
                        </div>
                        <div className="text-xs" style={{ color: '#5E6370' }}>
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid rgba(0,0,0,0.03)',
                      borderRadius: '12px',
                      padding: 'clamp(10px, 2vw, 12px)',
                    }}
                  >
                    <div className="flex items-end gap-1.5 sm:gap-2" style={{ height: 'clamp(70px, 15vw, 90px)' }}>
                      {[44, 68, 52, 82, 58, 92, 71].map((h, i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            background: 'linear-gradient(180deg, rgba(199,125,255,0.8) 0%, rgba(199,125,255,0) 100%)',
                            height: `${h}%`,
                            borderTopLeftRadius: '6px',
                            borderTopRightRadius: '6px',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS - Mobile optimized */}
      <section
        className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 w-full"
        style={{ background: '#F8F9FB' }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 sm:gap-6 mb-8 sm:mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <div>
              <h3
                style={{
                  fontSize: 'clamp(1.75rem, 5vw, 2.1rem)',
                  color: '#0C0F1A',
                  fontFamily: 'var(--font-bricolage), sans-serif',
                  marginBottom: '6px',
                }}
              >
                How Scout works
              </h3>
              <p className="text-sm sm:text-base" style={{ color: '#5E6370' }}>Four simple steps to more brand deals.</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/pricing"
                className="text-xs sm:text-sm font-medium"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(12,15,26,0.06)',
                  borderRadius: '9999px',
                  padding: '10px 16px',
                  color: '#0C0F1A',
                }}
              >
                View pricing
              </Link>
              <Link
                href="/login"
                className="text-xs sm:text-sm font-semibold"
                style={{
                  background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                  borderRadius: '9999px',
                  padding: '10px 16px',
                  color: '#FFFFFF',
                  transition: 'transform 0.1s ease-out',
                }}
              >
                Get started
              </Link>
            </div>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5 sm:gap-6 md:gap-8">
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
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(12,15,26,0.03)',
                  borderRadius: '16px',
                  padding: 'clamp(20px, 4vw, 26px) clamp(16px, 3vw, 20px) clamp(18px, 3.5vw, 24px)',
                  transition: 'all 0.15s ease-out',
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.borderColor = 'rgba(253,138,230,0.25)'
                  e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.06)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = 'rgba(12,15,26,0.03)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div
                  className="mb-4 sm:mb-5 flex items-center justify-center"
                  style={{
                    width: 'clamp(50px, 10vw, 58px)',
                    height: 'clamp(50px, 10vw, 58px)',
                    background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                    borderRadius: '14px',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: 'clamp(1.125rem, 2.5vw, 1.25rem)',
                  }}
                >
                  {step.num}
                </div>
                <h4
                  className="text-base sm:text-lg mb-2"
                  style={{
                    color: '#0C0F1A',
                    fontWeight: 600,
                  }}
                >
                  {step.title}
                </h4>
                <p className="text-xs sm:text-sm" style={{ color: '#5E6370' }}>
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS - Mobile optimized */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 w-full" style={{ background: '#FFFFFF' }}>
        <div className="max-w-6xl mx-auto grid sm:grid-cols-3 gap-10 sm:gap-12">
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
              <div className="mb-4 sm:mb-6 mx-auto"
                style={{
                  width: '5px',
                  height: 'clamp(32px, 7vw, 40px)',
                  background: stat.color,
                  borderRadius: '9999px',
                }}
              />
              <div 
                style={{ 
                  fontSize: 'clamp(2.5rem, 7vw, 3.4rem)', 
                  fontWeight: 700, 
                  color: '#0C0F1A', 
                  marginBottom: 'clamp(6px, 1.5vw, 12px)', 
                  fontFamily: 'var(--font-bricolage), sans-serif' 
                }}
              >
                {stat.value}
              </div>
              <div className="text-sm sm:text-base" style={{ color: '#5E6370' }}>{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA - Mobile optimized */}
      <section
        className="relative py-12 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden w-full"
        style={{
          background: 'linear-gradient(145deg, #0C0F1A 0%, #141925 100%)',
        }}
      >
        {/* Responsive blur effects */}
        <div
          className="absolute"
          style={{
            top: 'clamp(-40px, -8vw, -80px)',
            right: 'clamp(-40px, -8vw, -80px)',
            width: 'clamp(150px, 35vw, 330px)',
            height: 'clamp(150px, 35vw, 330px)',
            background: 'radial-gradient(circle, rgba(253,138,230,0.2) 0%, rgba(12,15,26,0) 70%)',
            filter: 'blur(14px)',
          }}
        />
        <div
          className="absolute"
          style={{
            bottom: 'clamp(-60px, -12vw, -120px)',
            left: 'clamp(-20px, -4vw, -40px)',
            width: 'clamp(200px, 45vw, 420px)',
            height: 'clamp(200px, 45vw, 420px)',
            background: 'radial-gradient(circle, rgba(199,125,255,0.22) 0%, rgba(12,15,26,0) 70%)',
            filter: 'blur(14px)',
          }}
        />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h2
            className="mb-4 sm:mb-6"
            style={{
              fontSize: 'clamp(1.75rem, 6vw, 2.9rem)',
              color: '#FFFFFF',
              fontFamily: 'var(--font-bricolage), sans-serif',
            }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            Ready to land your next brand deal?
          </motion.h2>
          <motion.p
            className="mb-8 sm:mb-10 md:mb-12 text-sm sm:text-base mx-auto"
            style={{
              color: 'rgba(255,255,255,0.7)',
              maxWidth: '600px',
            }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            Join 500+ creators who are finding, pitching, and closing brand partnerships faster with Scout.
          </motion.p>

          <motion.form 
            onSubmit={handleGetStarted} 
            className="max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={loading}
                className="flex-1 px-4 sm:px-5 py-3.5 sm:py-4 text-sm sm:text-base"
                style={{
                  height: '54px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '14px',
                  color: '#FFFFFF',
                  transition: 'all 0.15s ease-out',
                  fontFamily: 'var(--font-libre), sans-serif',
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
                className="text-sm sm:text-base font-semibold whitespace-nowrap px-6 sm:px-8 py-3.5 sm:py-4"
                style={{
                  height: '54px',
                  background: loading ? '#9CA3AF' : '#FFFFFF',
                  color: loading ? '#FFFFFF' : '#0C0F1A',
                  borderRadius: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease-out',
                  fontFamily: 'var(--font-libre), sans-serif',
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
          </motion.form>
        </div>
      </section>

      {/* FOOTER - Mobile optimized */}
      <footer
        className="py-8 sm:py-10 md:py-12 px-4 sm:px-6 lg:px-8 w-full"
        style={{
          background: '#FFFFFF',
          borderTop: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h1
              className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2"
              style={{
                color: '#0C0F1A',
                fontFamily: 'var(--font-bricolage), sans-serif',
              }}
            >
              scout
            </h1>
            <p className="text-xs sm:text-sm" style={{ color: '#5E6370' }}>
              Brand intelligence for creators
            </p>
          </div>
          <div className="flex gap-6 sm:gap-8">
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
        <div className="mt-6 sm:mt-10 text-center text-xs" style={{ color: '#9CA3AF' }}>
          © 2025 Scout. All rights reserved.
        </div>
      </footer>
    </motion.div>
  )
}