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
      className="min-h-screen overflow-x-hidden"
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href={user ? '/dashboard' : '/'} className="cursor-pointer">
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

          <div className="flex items-center gap-3 sm:gap-5">
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
                  className="text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 transition-all"
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

      {/* Hero Section - Mobile optimized */}
      <section className="relative py-12 sm:py-20 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Content */}
            <motion.div
              className="max-w-2xl"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-6 sm:mb-8"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <div className="w-2 h-2 bg-[#fd8ae6] rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm font-medium" style={{ color: '#5E6370' }}>
                  Brand intelligence for creators
                </span>
              </div>

              {/* Responsive Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-[1.1]"
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
                  <div className="absolute -bottom-1 sm:-bottom-2 left-0 right-0 h-2 sm:h-3 -z-0"
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(253,138,230,0.25) 0%, rgba(199,125,255,0.2) 100%)',
                      filter: 'blur(1px)',
                    }}
                  ></div>
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 leading-relaxed"
                style={{ color: '#5E6370' }}
              >
                Scout helps you discover brands, track your outreach, and close more partnerships. Your deal pipeline, built for speed.
              </p>

              {/* CTA Form */}
              <form onSubmit={handleGetStarted} className="mb-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-4 sm:px-5 py-3 sm:py-4 text-sm sm:text-base border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#fd8ae6] focus:border-[#fd8ae6] transition-all"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-[#020c1f] hover:bg-[#fd8ae6] text-white rounded-xl font-semibold transition-all cursor-pointer disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 text-sm sm:text-base whitespace-nowrap"
                  >
                    {loading ? "Sending..." : "Get started free"}
                  </button>
                </div>
              </form>

              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="leading-snug">Free to start · No credit card · Join 500+ creators</span>
              </div>
            </motion.div>

            {/* Right: Product Mockup - Mobile optimized */}
            <motion.div
              className="relative hidden lg:block"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              {/* Main product screenshot */}
              <div className="relative z-10 max-w-full">
                <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-200 overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-500">
                  {/* Browser chrome */}
                  <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="flex-1 mx-4 bg-white rounded px-3 py-1 text-xs text-slate-400 truncate">
                      scout.app/dashboard
                    </div>
                  </div>
                  {/* Screenshot placeholder */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6">
                    <div className="space-y-3 sm:space-y-4">
                      {/* Placeholder dashboard elements */}
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#fd8ae6] to-[#fc6fdf] flex-shrink-0"></div>
                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="h-3 sm:h-4 bg-slate-200 rounded w-3/4"></div>
                          <div className="h-2 sm:h-3 bg-slate-200 rounded w-1/2"></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 sm:gap-3">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-4 shadow-sm">
                            <div className="h-6 sm:h-8 bg-[#fd8ae6]/20 rounded mb-1 sm:mb-2"></div>
                            <div className="h-2 sm:h-3 bg-slate-200 rounded"></div>
                          </div>
                        ))}
                      </div>
                      <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-6 shadow-sm space-y-2 sm:space-y-3">
                        {[1,2,3].map(i => (
                          <div key={i} className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-orange-400 to-pink-400 flex-shrink-0"></div>
                            <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
                              <div className="h-2 sm:h-3 bg-slate-200 rounded w-2/3"></div>
                              <div className="h-1.5 sm:h-2 bg-slate-200 rounded w-1/3"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pink glow - responsive sizing */}
              <div className="absolute -top-10 -right-12 w-32 h-32 sm:w-48 sm:h-48 lg:w-56 lg:h-56 bg-[#fd8ae6]/30 blur-3xl rounded-full -z-10"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section
        className="py-8 sm:py-10"
        style={{
          background: '#FFFFFF',
          borderTop: '1px solid rgba(0,0,0,0.03)',
          borderBottom: '1px solid rgba(0,0,0,0.03)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p
            className="text-xs font-medium tracking-[0.2em] sm:tracking-[0.35em]"
            style={{ color: '#5E6370' }}
          >
            TRUSTED BY CREATORS ON
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 sm:gap-6 mt-6 sm:mt-8 items-center justify-items-center">
            {['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn'].map(
              (platform) => (
                <div key={platform} className="text-sm sm:text-base" style={{ color: '#9CA3AF', fontWeight: 600 }}>
                  {platform}
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8" style={{ background: '#F8F9FB' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <h2
              className="mb-3 text-2xl sm:text-3xl lg:text-4xl"
              style={{
                color: '#0C0F1A',
                fontFamily: 'var(--font-bricolage), sans-serif',
              }}
            >
              Why creators love Scout
            </h2>
            <p className="text-sm sm:text-base" style={{ color: '#5E6370', maxWidth: '560px', margin: '0 auto' }}>
              Real outreach, real pipelines, real responses.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-7">
            {[
              {
                name: 'Sarah Chen',
                role: 'Food creator · 85k followers',
                text: '"Scout helped me land 3 new brand deals in my first month."',
                initials: 'SC',
                avatarBg:
                  'linear-gradient(135deg, #FD8AE6 0%, #FB7185 100%)',
              },
              {
                name: 'Marcus Johnson',
                role: 'Fitness creator · 120k followers',
                text: '"The pipeline feature is fire. I stopped losing brands in my inbox."',
                initials: 'MJ',
                avatarBg:
                  'linear-gradient(135deg, #22C55E 0%, #14B8A6 100%)',
              },
              {
                name: 'Emma Park',
                role: 'Beauty creator · 45k followers',
                text: '"A tool made for creators, not agencies."',
                initials: 'EP',
                avatarBg:
                  'linear-gradient(135deg, #C77DFF 0%, #FD8AE6 100%)',
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
                  padding: '20px sm:28px',
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
              >
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '16px',
                      background: t.avatarBg,
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1rem',
                      flexShrink: 0,
                    }}
                  >
                    {t.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm sm:text-base" style={{ fontWeight: 600, color: '#0C0F1A' }}>
                      {t.name}
                    </div>
                    <div className="text-xs" style={{ color: '#5E6370' }}>
                      {t.role}
                    </div>
                  </div>
                </div>
                <p className="text-sm sm:text-base" style={{ color: '#5E6370', lineHeight: 1.6 }}>{t.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* EVERYTHING YOU NEED */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8" style={{ background: '#FFFFFF' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl mb-3 sm:mb-4"
              style={{
                color: '#0C0F1A',
                fontFamily: 'var(--font-bricolage), sans-serif',
              }}
            >
              Everything you need to land brand deals
            </h2>
            <p
              className="text-sm sm:text-base"
              style={{
                color: '#5E6370',
                maxWidth: '540px',
                margin: '0 auto',
              }}
            >
              Discovery, pipeline, analytics. The same stack you use in dashboard views.
            </p>
          </div>

          <div className="space-y-12 sm:space-y-20">
            {/* Feature 1 */}
            <div className="grid lg:grid-cols-2 gap-8 sm:gap-14 items-center">
              <div>
                <p
                  style={{
                    display: 'inline-block',
                    padding: '6px 14px',
                    background: 'rgba(251,146,60,0.03)',
                    border: '1px solid rgba(251,146,60,0.15)',
                    borderRadius: '9999px',
                    color: '#c05621',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    marginBottom: '14px',
                  }}
                >
                  Brand database
                </p>
                <h3 className="text-xl sm:text-2xl lg:text-3xl mb-3 sm:mb-4" style={{ color: '#0C0F1A', fontFamily: 'var(--font-bricolage), sans-serif' }}>
                  Discover 70+ brands ready to work with creators
                </h3>
                <p className="text-sm sm:text-base mb-4 sm:mb-6" style={{ color: '#5E6370' }}>
                  Filter by category, see typical ranges, grab the right contact, send better pitches.
                </p>
                <ul className="space-y-2 sm:space-y-3">
                  {[
                    'Filter by category and niche',
                    'See typical deal ranges',
                    'View response rates',
                    'Get contact info instantly',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 sm:gap-3">
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
                    background:
                      'linear-gradient(135deg, rgba(251,146,60,0.08) 0%, rgba(253,138,230,0.04) 100%)',
                    border: '1px solid rgba(251,146,60,0.12)',
                    borderRadius: '16px',
                    padding: '16px sm:18px',
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
                        gap: '12px',
                        background: '#FFFFFF',
                        border: '1px solid rgba(0,0,0,0.02)',
                        borderRadius: '14px',
                        padding: '10px sm:12px',
                        marginBottom: '8px sm:10px',
                      }}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '12px',
                          background: '#0C0F1A',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          flexShrink: 0,
                        }}
                      >
                        {brand.name.slice(0, 2)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="text-sm sm:text-base" style={{ fontWeight: 600, color: '#0C0F1A', marginBottom: '2px' }}>
                          {brand.name}
                        </div>
                        <div className="text-xs sm:text-sm" style={{ color: '#22C55E' }}>
                          {brand.rate}
                        </div>
                      </div>
                      <div
                        className="text-xs whitespace-nowrap"
                        style={{
                          background: 'rgba(12,15,26,0.04)',
                          border: '1px solid rgba(0,0,0,0.03)',
                          borderRadius: '9999px',
                          padding: '4px 8px sm:4px 10px',
                        }}
                      >
                        {brand.tag}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="grid lg:grid-cols-2 gap-8 sm:gap-14 items-center">
              <div className="order-last lg:order-first">
                <p
                  style={{
                    display: 'inline-block',
                    padding: '6px 14px',
                    background: 'rgba(199,125,255,0.08)',
                    border: '1px solid rgba(199,125,255,0.3)',
                    borderRadius: '9999px',
                    color: '#6B21A8',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    marginBottom: '14px',
                  }}
                >
                  Deal pipeline
                </p>
                <h3 className="text-xl sm:text-2xl lg:text-3xl mb-3 sm:mb-4" style={{ color: '#0C0F1A', fontFamily: 'var(--font-bricolage), sans-serif' }}>
                  Track deals from pitch to payment
                </h3>
                <p className="text-sm sm:text-base mb-4 sm:mb-6" style={{ color: '#5E6370' }}>
                  Visual stages, notes, values. The stuff from your dashboard, not a marketing mock.
                </p>
                <ul className="space-y-2 sm:space-y-3">
                  {[
                    '5 pipeline stages',
                    'Drag and drop deals',
                    'Add notes and deadlines',
                    'Track deal value',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 sm:gap-3">
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
                <div
                  className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(199,125,255,0.08) 0%, rgba(59,130,246,0.04) 100%)',
                    border: '1px solid rgba(199,125,255,0.3)',
                    borderRadius: '16px',
                    padding: '16px sm:20px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                  }}
                >
                  <div className="flex gap-3 min-w-max sm:min-w-0">
                    {['Prospect', 'Pitched', 'Won'].map((stage) => (
                      <div key={stage} style={{ minWidth: '140px', flex: '1 1 0' }}>
                        <div
                          className="text-xs"
                          style={{
                            color: '#5E6370',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            fontWeight: 600,
                          }}
                        >
                          {stage}
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                          {[1, 2].map((i) => (
                            <div
                              key={i}
                              style={{
                                background: '#FFFFFF',
                                border: '1px solid rgba(0,0,0,0.04)',
                                borderRadius: '12px',
                                padding: '8px sm:10px',
                              }}
                            >
                              <div
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '8px',
                                  background:
                                    'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                                  marginBottom: '6px',
                                }}
                              />
                              <div
                                style={{
                                  width: '80%',
                                  height: '5px',
                                  background: 'rgba(12,15,26,0.08)',
                                  borderRadius: '9999px',
                                  marginBottom: '4px',
                                }}
                              />
                              <div
                                style={{
                                  width: '55%',
                                  height: '5px',
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
            </div>

            {/* Feature 3 */}
            <div className="grid lg:grid-cols-2 gap-8 sm:gap-14 items-center">
              <div>
                <p
                  style={{
                    display: 'inline-block',
                    padding: '6px 14px',
                    background: 'rgba(34,197,94,0.08)',
                    border: '1px solid rgba(34,197,94,0.28)',
                    borderRadius: '9999px',
                    color: '#166534',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    marginBottom: '14px',
                  }}
                >
                  Smart analytics
                </p>
                <h3 className="text-xl sm:text-2xl lg:text-3xl mb-3 sm:mb-4" style={{ color: '#0C0F1A', fontFamily: 'var(--font-bricolage), sans-serif' }}>
                  Know your numbers, grow your business
                </h3>
                <p className="text-sm sm:text-base mb-4 sm:mb-6" style={{ color: '#5E6370' }}>
                  Pipeline value, win rate, time to close. Presentable numbers for brands.
                </p>
                <ul className="space-y-2 sm:space-y-3">
                  {[
                    'Pipeline value tracking',
                    'Win rate analytics',
                    'Deal velocity metrics',
                    'Performance insights',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 sm:gap-3">
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
                    background:
                      'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(248,249,251,1) 100%)',
                    border: '1px solid rgba(34,197,94,0.26)',
                    borderRadius: '16px',
                    padding: '16px sm:20px',
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
                          padding: '10px sm:12px',
                        }}
                      >
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
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
                      padding: '10px sm:12px',
                    }}
                  >
                    <div className="flex items-end gap-1 sm:gap-2" style={{ height: '70px sm:90px' }}>
                      {[44, 68, 52, 82, 58, 92, 71].map((h, i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            background:
                              'linear-gradient(180deg, rgba(199,125,255,0.8) 0%, rgba(199,125,255,0) 100%)',
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
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        className="px-4 sm:px-6 lg:px-8 py-12 sm:py-20"
        style={{ background: '#F8F9FB' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6 mb-8 sm:mb-10">
            <div>
              <h3
                className="text-2xl sm:text-3xl lg:text-4xl mb-2"
                style={{
                  color: '#0C0F1A',
                  fontFamily: 'var(--font-bricolage), sans-serif',
                }}
              >
                How Scout works
              </h3>
              <p className="text-sm sm:text-base" style={{ color: '#5E6370' }}>Four simple steps to more brand deals.</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/pricing"
                className="text-xs sm:text-sm"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(12,15,26,0.05)',
                  borderRadius: '9999px',
                  padding: '8px 16px sm:10px 18px',
                  color: '#0C0F1A',
                  fontWeight: 500,
                }}
              >
                View pricing
              </Link>
              <Link
                href="/login"
                className="text-xs sm:text-sm"
                style={{
                  background:
                    'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                  borderRadius: '9999px',
                  padding: '8px 16px sm:10px 18px',
                  color: '#FFFFFF',
                  fontWeight: 500,
                  transition: 'transform 0.1s ease-out',
                }}
              >
                Get started
              </Link>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
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
                  borderRadius: '18px',
                  padding: '20px 16px sm:26px 20px',
                  transition: 'transform 0.1s ease-out',
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.borderColor =
                    'rgba(253,138,230,0.25)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor =
                    'rgba(12,15,26,0.03)'
                }}
              >
                <div
                  className="mb-4 sm:mb-5 flex items-center justify-center mx-auto"
                  style={{
                    width: '50px',
                    height: '50px',
                    background:
                      'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                    borderRadius: '16px',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '1.15rem',
                  }}
                >
                  {step.num}
                </div>
                <h4
                  className="text-base sm:text-lg"
                  style={{
                    color: '#0C0F1A',
                    fontWeight: 600,
                    marginBottom: '6px',
                  }}
                >
                  {step.title}
                </h4>
                <p className="text-sm" style={{ color: '#5E6370' }}>
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8" style={{ background: '#FFFFFF' }}>
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
                  height: '40px',
                  background: stat.color,
                  borderRadius: '9999px',
                }}
              />
              <div className="text-4xl sm:text-5xl lg:text-6xl" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 700, color: '#0C0F1A', marginBottom: '8px sm:12px', fontFamily: 'var(--font-bricolage), sans-serif' }}>
                {stat.value}
              </div>
              <div className="text-sm sm:text-base" style={{ color: '#5E6370' }}>{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #0C0F1A 0%, #141925 100%)',
        }}
      >
        {/* Responsive blur effects */}
        <div
          className="absolute -top-10 sm:-top-20 -right-10 sm:-right-20"
          style={{
            width: 'clamp(200px, 40vw, 400px)',
            height: 'clamp(200px, 40vw, 400px)',
            background: 'radial-gradient(circle, rgba(253,138,230,0.2) 0%, rgba(12,15,26,0) 70%)',
            filter: 'blur(18px)',
          }}
        />
        <div
          className="absolute -bottom-20 sm:-bottom-32 -left-10 sm:-left-20"
          style={{
            width: 'clamp(250px, 50vw, 500px)',
            height: 'clamp(250px, 50vw, 500px)',
            background: 'radial-gradient(circle, rgba(199,125,255,0.22) 0%, rgba(12,15,26,0) 70%)',
            filter: 'blur(18px)',
          }}
        />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2
            className="mb-4 sm:mb-6 text-2xl sm:text-3xl lg:text-4xl xl:text-5xl"
            style={{
              color: '#FFFFFF',
              fontFamily: 'var(--font-bricolage), sans-serif',
            }}
          >
            Ready to land your next brand deal?
          </h2>
          <p
            className="mb-8 sm:mb-12 text-sm sm:text-base lg:text-lg"
            style={{
              color: 'rgba(255,255,255,0.7)',
              maxWidth: '600px',
              margin: '0 auto 32px sm:48px',
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
                className="flex-1 px-4 sm:px-5 text-sm sm:text-base"
                style={{
                  height: '52px',
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
                className="text-sm font-semibold whitespace-nowrap"
                style={{
                  height: '52px',
                  background: loading ? '#9CA3AF' : '#FFFFFF',
                  color: loading ? '#FFFFFF' : '#0C0F1A',
                  borderRadius: '14px',
                  padding: '0 24px sm:32px',
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
        className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8"
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