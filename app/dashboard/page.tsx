'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabaseClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '../../components/ui/button'
import { OnboardingModal } from '../../components/onboarding-modal'

interface DealStats {
  activeDeals: number
  totalValue: number
  wonDeals: number
  brandsCount: number
}

interface RecentDeal {
  id: string
  brand_name: string
  status: string
  deal_value: number | null
  created_at: string
}

interface AdvancedMetrics {
  projectedRevenue30d: number
  projectedRevenue90d: number
  avgDealCycle: number
  winRate: number
  bestPitchDay: string
  bestPitchTime: string
  topCategory: string
  benchmark: {
    yourWinRate: number
    avgWinRate: number
    yourAvgDeal: number
    avgDealValue: number
  }
}

type TimeRange = '7d' | '30d' | '90d' | 'all'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<DealStats>({ activeDeals: 0, totalValue: 0, wonDeals: 0, brandsCount: 0 })
  const [recentDeals, setRecentDeals] = useState<RecentDeal[]>([])
  const [isPro, setIsPro] = useState(false) // TODO: Connect to actual subscription status
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const router = useRouter()
  const supabase = supabaseClient()

  // Mock advanced metrics - replace with real calculations
  const [advancedMetrics, setAdvancedMetrics] = useState<AdvancedMetrics>({
    projectedRevenue30d: 12500,
    projectedRevenue90d: 38400,
    avgDealCycle: 14,
    winRate: 67,
    bestPitchDay: 'Tuesday',
    bestPitchTime: '10am - 12pm',
    topCategory: 'Food & Beverage',
    benchmark: {
      yourWinRate: 67,
      avgWinRate: 43,
      yourAvgDeal: 4200,
      avgDealValue: 2800
    }
  })

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('deal-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deals',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadStats(user.id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user)
      await loadStats(user.id)
    }

    getUser()
  }, [router, supabase.auth])

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const loadStats = async (userId: string) => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    setProfile(profileData)

    // TODO: Check subscription status
    // setIsPro(profileData?.subscription_tier === 'pro')

    if (!profileData?.onboarding_completed) {
      setShowOnboarding(true)
      setLoading(false)
      return
    }

    const { data: deals } = await supabase
      .from('deals')
      .select('deal_value, status, id, brand_name, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    const activeDeals = deals?.filter(d => d.status !== 'delivered').length || 0
    const totalValue = deals?.reduce((sum, d) => sum + (d.deal_value || 0), 0) || 0
    const wonDeals = deals?.filter(d => d.status === 'won' || d.status === 'delivered').length || 0

    const { count: brandsCount } = await supabase
      .from('brands')
      .select('*', { count: 'exact', head: true })

    const recent = deals?.slice(0, 3) || []

    setStats({ activeDeals, totalValue, wonDeals, brandsCount: brandsCount || 0 })
    setRecentDeals(recent)
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'prospect': return 'bg-slate-100 text-slate-700'
      case 'pitched': return 'bg-blue-100 text-blue-700'
      case 'negotiating': return 'bg-yellow-100 text-yellow-700'
      case 'won': return 'bg-green-100 text-green-700'
      case 'delivered': return 'bg-purple-100 text-purple-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const handleExport = (format: 'csv' | 'pdf') => {
    // TODO: Implement actual export functionality
    console.log(`Exporting as ${format}`)
    setShowExportMenu(false)
  }

  if (loading) {
    return (
      <motion.div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#F8F9FB' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        <div style={{ color: '#5E6370' }}>Loading...</div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      className="min-h-screen"
      style={{ background: '#F8F9FB' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {/* Top Navigation */}
      <nav 
        className="sticky top-0 z-40"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="cursor-pointer">
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
              <div className="hidden md:flex gap-6">
                <Link 
                  href="/dashboard" 
                  className="text-sm font-semibold transition-colors relative pb-1"
                  style={{ color: '#FD8AE6' }}
                >
                  Dashboard
                  <div 
                    className="absolute bottom-0 left-0 right-0"
                    style={{
                      height: '2px',
                      background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                      borderRadius: '2px'
                    }}
                  />
                </Link>
                <Link 
                  href="/dashboard/brands" 
                  className="text-sm font-medium transition-colors"
                  style={{ color: '#5E6370' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#0C0F1A'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#5E6370'}
                >
                  Brands
                </Link>
                <Link 
                  href="/dashboard/deals" 
                  className="text-sm font-medium transition-colors"
                  style={{ color: '#5E6370' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#0C0F1A'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#5E6370'}
                >
                  Pipeline
                </Link>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Pro Badge */}
              {isPro && (
                <div
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                    color: '#FFFFFF',
                    boxShadow: '0 2px 8px rgba(253,138,230,0.3)'
                  }}
                >
                  PRO
                </div>
              )}
              
              <Link 
                href="/dashboard/profile"
                className="transition-colors"
                style={{ color: '#5E6370' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#FD8AE6'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#5E6370'}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
              <span className="text-sm hidden sm:block" style={{ color: '#5E6370' }}>{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="text-sm font-medium px-4 py-2 transition-all"
                style={{
                  background: '#FFFFFF',
                  color: '#0C0F1A',
                  borderRadius: '12px',
                  border: '1px solid rgba(0,0,0,0.06)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'
                  e.currentTarget.style.background = '#F8F9FB'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'
                  e.currentTarget.style.background = '#FFFFFF'
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 
            className="mb-2"
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: '#0C0F1A',
              fontFamily: 'var(--font-bricolage), sans-serif'
            }}
          >
            Welcome back! 👋
          </h2>
          <p style={{ color: '#5E6370' }}>
            Here's what's happening with your brand partnerships
          </p>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: 'Active Deals',
              value: stats.activeDeals,
              subtext: stats.activeDeals === 0 ? 'Add your first deal' : 'In your pipeline',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ),
              gradient: false
            },
            {
              label: 'Pipeline Value',
              value: `$${stats.totalValue.toLocaleString()}`,
              subtext: 'Total potential',
              icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                </svg>
              ),
              gradient: true
            },
            {
              label: 'Deals Won',
              value: stats.wonDeals,
              subtext: 'Closed successfully',
              icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              ),
              gradient: false
            },
            {
              label: 'Brand Database',
              value: stats.brandsCount,
              subtext: 'Ready to discover',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              ),
              gradient: false
            }
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                border: '1px solid rgba(0,0,0,0.06)',
                transition: 'all 0.15s ease-out',
                cursor: 'pointer'
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.06)'
                e.currentTarget.style.borderColor = 'rgba(253,138,230,0.25)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)'
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium" style={{ color: '#5E6370' }}>
                  {stat.label}
                </div>
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    background: stat.gradient ? 'rgba(253,138,230,0.08)' : 'rgba(12,15,26,0.04)'
                  }}
                >
                  <div style={{ color: stat.gradient ? '#FD8AE6' : '#5E6370' }}>
                    {stat.icon}
                  </div>
                </div>
              </div>
              <div 
                className="mb-1"
                style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: stat.gradient ? '#FD8AE6' : '#0C0F1A',
                  fontFamily: 'var(--font-bricolage), sans-serif'
                }}
              >
                {stat.value}
              </div>
              <div className="text-sm" style={{ color: '#9CA3AF' }}>
                {stat.subtext}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ADVANCED INSIGHTS SECTION */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h3
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  color: '#0C0F1A',
                  fontFamily: 'var(--font-bricolage), sans-serif'
                }}
              >
                Advanced Insights
              </h3>
              {isPro && (
                <div
                  className="px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                    color: '#FFFFFF'
                  }}
                >
                  PRO
                </div>
              )}
            </div>
            
            {isPro && (
              <div className="flex items-center gap-3">
                {/* Time Range Toggle */}
                <div 
                  className="flex items-center rounded-lg p-1"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(0,0,0,0.06)'
                  }}
                >
                  {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className="px-3 py-1 rounded text-xs font-medium transition-all"
                      style={{
                        background: timeRange === range ? 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)' : 'transparent',
                        color: timeRange === range ? '#FFFFFF' : '#5E6370',
                        cursor: 'pointer'
                      }}
                    >
                      {range === 'all' ? 'All time' : range.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Export Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all"
                    style={{
                      background: '#FFFFFF',
                      color: '#0C0F1A',
                      borderRadius: '12px',
                      border: '1px solid rgba(0,0,0,0.06)',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(253,138,230,0.25)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export
                  </button>

                  {showExportMenu && (
                    <motion.div
                      className="absolute right-0 mt-2 w-48 rounded-lg overflow-hidden z-10"
                      style={{
                        background: '#FFFFFF',
                        boxShadow: '0 6px 14px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(0,0,0,0.06)'
                      }}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <button
                        onClick={() => handleExport('csv')}
                        className="w-full px-4 py-3 text-left text-sm transition-colors"
                        style={{ color: '#0C0F1A' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#F8F9FB'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Export as CSV
                        </div>
                      </button>
                      <button
                        onClick={() => handleExport('pdf')}
                        className="w-full px-4 py-3 text-left text-sm transition-colors"
                        style={{ color: '#0C0F1A' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#F8F9FB'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          Export as PDF
                        </div>
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Content: Pro Features or Paywall */}
          {isPro ? (
            // PRO CONTENT
            <div className="space-y-6">
              {/* Revenue Projections */}
              <div className="grid md:grid-cols-2 gap-6">
                <motion.div
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    transition: 'all 0.15s ease-out'
                  }}
                  whileHover={{
                    scale: 1.01,
                    boxShadow: '0 6px 14px rgba(0,0,0,0.06)',
                    borderColor: 'rgba(253,138,230,0.25)'
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-sm font-medium mb-1" style={{ color: '#5E6370' }}>
                        30-Day Revenue Projection
                      </div>
                      <div 
                        style={{
                          fontSize: '2.5rem',
                          fontWeight: 700,
                          background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          fontFamily: 'var(--font-bricolage), sans-serif'
                        }}
                      >
                        ${advancedMetrics.projectedRevenue30d.toLocaleString()}
                      </div>
                    </div>
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(253,138,230,0.08)' }}
                    >
                      <svg className="w-6 h-6" style={{ color: '#FD8AE6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm" style={{ color: '#5E6370' }}>
                    Based on {stats.activeDeals} active deals in your pipeline
                  </p>
                  <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: '#9CA3AF' }}>90-day projection</span>
                      <span className="font-semibold" style={{ color: '#0C0F1A' }}>
                        ${advancedMetrics.projectedRevenue90d.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    transition: 'all 0.15s ease-out'
                  }}
                  whileHover={{
                    scale: 1.01,
                    boxShadow: '0 6px 14px rgba(0,0,0,0.06)',
                    borderColor: 'rgba(253,138,230,0.25)'
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-sm font-medium mb-1" style={{ color: '#5E6370' }}>
                        Average Deal Cycle
                      </div>
                      <div 
                        style={{
                          fontSize: '2.5rem',
                          fontWeight: 700,
                          color: '#0C0F1A',
                          fontFamily: 'var(--font-bricolage), sans-serif'
                        }}
                      >
                        {advancedMetrics.avgDealCycle} days
                      </div>
                    </div>
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(59,130,246,0.08)' }}
                    >
                      <svg className="w-6 h-6" style={{ color: '#3B82F6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm" style={{ color: '#5E6370' }}>
                    From first contact to close
                  </p>
                  <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <div className="flex items-center gap-2 text-xs">
                      <div 
                        className="px-2 py-1 rounded"
                        style={{ background: 'rgba(34,197,94,0.08)', color: '#22C55E' }}
                      >
                        18% faster than avg
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Optimal Timing Insights */}
              <motion.div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '28px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  transition: 'all 0.15s ease-out'
                }}
                whileHover={{
                  boxShadow: '0 6px 14px rgba(0,0,0,0.06)',
                  borderColor: 'rgba(253,138,230,0.25)'
                }}
              >
                <div className="flex items-start gap-4 mb-6">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(251,146,60,0.08)' }}
                  >
                    <svg className="w-6 h-6" style={{ color: '#FB923C' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 
                      className="mb-2"
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: '#0C0F1A',
                        fontFamily: 'var(--font-bricolage), sans-serif'
                      }}
                    >
                      🎯 Optimal Pitch Timing
                    </h4>
                    <p className="text-sm mb-4" style={{ color: '#5E6370' }}>
                      Based on your successful deals, here's when brands are most likely to respond
                    </p>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div 
                        className="p-4 rounded-lg"
                        style={{ background: '#F8F9FB' }}
                      >
                        <div className="text-xs font-medium mb-1" style={{ color: '#9CA3AF' }}>
                          BEST DAY
                        </div>
                        <div className="text-xl font-bold" style={{ color: '#0C0F1A' }}>
                          {advancedMetrics.bestPitchDay}
                        </div>
                        <div className="text-xs mt-1" style={{ color: '#5E6370' }}>
                          3.2x higher response rate
                        </div>
                      </div>
                      <div 
                        className="p-4 rounded-lg"
                        style={{ background: '#F8F9FB' }}
                      >
                        <div className="text-xs font-medium mb-1" style={{ color: '#9CA3AF' }}>
                          BEST TIME
                        </div>
                        <div className="text-xl font-bold" style={{ color: '#0C0F1A' }}>
                          {advancedMetrics.bestPitchTime}
                        </div>
                        <div className="text-xs mt-1" style={{ color: '#5E6370' }}>
                          Peak engagement window
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Performance Benchmarks */}
              <motion.div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '28px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  transition: 'all 0.15s ease-out'
                }}
                whileHover={{
                  boxShadow: '0 6px 14px rgba(0,0,0,0.06)',
                  borderColor: 'rgba(253,138,230,0.25)'
                }}
              >
                <div className="flex items-start gap-4 mb-6">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(199,125,255,0.08)' }}
                  >
                    <svg className="w-6 h-6" style={{ color: '#C77DFF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 
                      className="mb-2"
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: '#0C0F1A',
                        fontFamily: 'var(--font-bricolage), sans-serif'
                      }}
                    >
                      📊 Performance vs. Industry
                    </h4>
                    <p className="text-sm mb-6" style={{ color: '#5E6370' }}>
                      See how you stack up against other creators in your tier
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium" style={{ color: '#5E6370' }}>
                            Win Rate
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm" style={{ color: '#9CA3AF' }}>
                              Avg: {advancedMetrics.benchmark.avgWinRate}%
                            </span>
                            <span className="text-lg font-bold" style={{ color: '#22C55E' }}>
                              You: {advancedMetrics.benchmark.yourWinRate}%
                            </span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${advancedMetrics.benchmark.yourWinRate}%`,
                              background: 'linear-gradient(135deg, #22C55E 0%, #14B8A6 100%)'
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium" style={{ color: '#5E6370' }}>
                            Average Deal Value
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm" style={{ color: '#9CA3AF' }}>
                              Avg: ${advancedMetrics.benchmark.avgDealValue.toLocaleString()}
                            </span>
                            <span className="text-lg font-bold" style={{ color: '#FD8AE6' }}>
                              You: ${advancedMetrics.benchmark.yourAvgDeal.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${(advancedMetrics.benchmark.yourAvgDeal / advancedMetrics.benchmark.avgDealValue) * 50}%`,
                              background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)'
                            }}
                          />
                        </div>
                      </div>

                      <div 
                        className="p-4 rounded-lg flex items-start gap-3 mt-4"
                        style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.12)' }}
                      >
                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#22C55E' }} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        <div>
                          <div className="font-semibold text-sm mb-1" style={{ color: '#22C55E' }}>
                            You're in the top 15%
                          </div>
                          <div className="text-xs" style={{ color: '#5E6370' }}>
                            Your win rate is 56% higher than the average creator. Keep it up!
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* AI Recommendations */}
              <motion.div
                style={{
                  background: 'linear-gradient(135deg, rgba(253,138,230,0.04) 0%, rgba(199,125,255,0.04) 100%)',
                  borderRadius: '16px',
                  padding: '28px',
                  border: '1px solid rgba(253,138,230,0.12)',
                  transition: 'all 0.15s ease-out'
                }}
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)' }}
                  >
                    <svg className="w-6 h-6" style={{ color: '#FFFFFF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 
                      className="mb-2"
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: '#0C0F1A',
                        fontFamily: 'var(--font-bricolage), sans-serif'
                      }}
                    >
                      💡 AI-Powered Recommendations
                    </h4>
                    <p className="text-sm mb-4" style={{ color: '#5E6370' }}>
                      Personalized tips to close more deals faster
                    </p>
                    
                    <div className="space-y-3">
                      <div 
                        className="flex items-start gap-3 p-3 rounded-lg"
                        style={{ background: '#FFFFFF' }}
                      >
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(253,138,230,0.12)' }}
                        >
                          <span className="text-xs font-bold" style={{ color: '#FD8AE6' }}>1</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm mb-1" style={{ color: '#0C0F1A' }}>
                            Focus on {advancedMetrics.topCategory}
                          </div>
                          <div className="text-xs" style={{ color: '#5E6370' }}>
                            Your win rate is 2.3x higher with {advancedMetrics.topCategory} brands
                          </div>
                        </div>
                      </div>
                      
                      <div 
                        className="flex items-start gap-3 p-3 rounded-lg"
                        style={{ background: '#FFFFFF' }}
                      >
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(253,138,230,0.12)' }}
                        >
                          <span className="text-xs font-bold" style={{ color: '#FD8AE6' }}>2</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm mb-1" style={{ color: '#0C0F1A' }}>
                            Send 3 more pitches this week
                          </div>
                          <div className="text-xs" style={{ color: '#5E6370' }}>
                            You're slightly below your average pitch volume. Aim for 8-10 per week
                          </div>
                        </div>
                      </div>
                      
                      <div 
                        className="flex items-start gap-3 p-3 rounded-lg"
                        style={{ background: '#FFFFFF' }}
                      >
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(253,138,230,0.12)' }}
                        >
                          <span className="text-xs font-bold" style={{ color: '#FD8AE6' }}>3</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm mb-1" style={{ color: '#0C0F1A' }}>
                            Follow up on 4 cold prospects
                          </div>
                          <div className="text-xs" style={{ color: '#5E6370' }}>
                            Deals in "prospect" stage for 14+ days have a 71% close rate with 1 follow-up
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          ) : (
            // PAYWALL FOR FREE USERS
            <motion.div
              className="relative overflow-hidden"
              style={{
                borderRadius: '16px',
                minHeight: '500px'
              }}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Blurred Preview Content */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  filter: 'blur(8px)',
                  opacity: 0.4
                }}
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', height: '200px' }} />
                  <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', height: '200px' }} />
                </div>
                <div className="mt-6" style={{ background: '#FFFFFF', borderRadius: '16px', padding: '28px', height: '300px' }} />
              </div>

              {/* Frosted Glass Overlay */}
              <div 
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)'
                }}
              >
                <div className="text-center max-w-md px-6">
                  {/* Lock Icon */}
                  <motion.div
                    className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                      boxShadow: '0 8px 24px rgba(253,138,230,0.3)'
                    }}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <svg className="w-10 h-10" style={{ color: '#FFFFFF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </motion.div>

                  <h3 
                    className="mb-3"
                    style={{
                      fontSize: '1.75rem',
                      fontWeight: 700,
                      color: '#0C0F1A',
                      fontFamily: 'var(--font-bricolage), sans-serif'
                    }}
                  >
                    Unlock Advanced Insights
                  </h3>
                  
                  <p className="mb-6" style={{ color: '#5E6370', lineHeight: 1.6 }}>
                    Get AI-powered recommendations, revenue projections, optimal pitch timing, and industry benchmarks to land more deals
                  </p>

                  {/* Features List */}
                  <div className="space-y-3 mb-8 text-left">
                    {[
                      'Revenue projections (30d & 90d)',
                      'Optimal pitch timing insights',
                      'Industry performance benchmarks',
                      'AI-powered recommendations',
                      'Export analytics as CSV/PDF',
                      'Goal setting & progress tracking'
                    ].map((feature, i) => (
                      <motion.div
                        key={feature}
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 + (i * 0.05) }}
                      >
                        <div 
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(253,138,230,0.12)' }}
                        >
                          <svg className="w-3 h-3" style={{ color: '#FD8AE6' }} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                        </div>
                        <span className="text-sm font-medium" style={{ color: '#0C0F1A' }}>
                          {feature}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Link href="/pricing">
                    <motion.button
                      className="w-full text-base font-semibold px-8 py-4 transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                        color: '#FFFFFF',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(253,138,230,0.3)',
                        cursor: 'pointer'
                      }}
                      whileHover={{
                        scale: 1.02,
                        boxShadow: '0 6px 16px rgba(253,138,230,0.4)'
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Upgrade to Pro →
                    </motion.button>
                  </Link>

                  <p className="mt-4 text-xs" style={{ color: '#9CA3AF' }}>
                    Start your 7-day free trial • Cancel anytime
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Quick Actions */}
          <motion.div 
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.06)'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <h3 
              className="mb-4"
              style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: '#0C0F1A',
                fontFamily: 'var(--font-bricolage), sans-serif'
              }}
            >
              Quick Actions
            </h3>
            <div className="flex flex-col gap-3">
              <Link href="/dashboard/brands">
                <button
                  className="w-full text-left px-4 py-3 transition-all font-medium"
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
                  🎯 Browse Brand Database
                </button>
              </Link>
              <Link href="/dashboard/deals">
                <button
                  className="w-full text-left px-4 py-3 transition-all font-medium"
                  style={{
                    background: '#FFFFFF',
                    color: '#0C0F1A',
                    borderRadius: '12px',
                    border: '1px solid rgba(0,0,0,0.06)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'
                    e.currentTarget.style.background = '#F8F9FB'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'
                    e.currentTarget.style.background = '#FFFFFF'
                  }}
                >
                  📊 Manage Pipeline
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div 
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.06)'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#0C0F1A',
                  fontFamily: 'var(--font-bricolage), sans-serif'
                }}
              >
                Recent Activity
              </h3>
              <Link 
                href="/dashboard/deals"
                className="text-sm font-medium transition-colors"
                style={{ color: '#FD8AE6', cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#FC6FDF'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#FD8AE6'}
              >
                View all →
              </Link>
            </div>
            
            {recentDeals.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🔭</div>
                <p className="text-sm mb-3" style={{ color: '#9CA3AF' }}>
                  No deals yet. Start by browsing brands!
                </p>
                <Link href="/dashboard/brands">
                  <button
                    className="text-sm font-medium px-4 py-2 transition-all"
                    style={{
                      background: '#FFFFFF',
                      color: '#0C0F1A',
                      borderRadius: '12px',
                      border: '1px solid rgba(0,0,0,0.06)',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'
                      e.currentTarget.style.background = '#F8F9FB'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'
                      e.currentTarget.style.background = '#FFFFFF'
                    }}
                  >
                    Browse Brands
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDeals.map((deal) => (
                  <Link 
                    key={deal.id} 
                    href="/dashboard/deals"
                    className="block"
                  >
                    <div 
                      className="cursor-pointer"
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: '1px solid rgba(0,0,0,0.04)',
                        background: '#FFFFFF',
                        transition: 'all 0.15s ease-out'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F8F9FB'
                        e.currentTarget.style.borderColor = 'rgba(253,138,230,0.25)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#FFFFFF'
                        e.currentTarget.style.borderColor = 'rgba(0,0,0,0.04)'
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div 
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '12px',
                              background: '#0C0F1A',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.875rem',
                              fontWeight: 600
                            }}
                          >
                            {deal.brand_name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div 
                              className="font-semibold"
                              style={{ color: '#0C0F1A' }}
                            >
                              {deal.brand_name}
                            </div>
                            <div 
                              className="text-xs"
                              style={{ color: '#9CA3AF' }}
                            >
                              {getTimeAgo(deal.created_at)}
                            </div>
                          </div>
                        </div>
                        <span 
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusColor(deal.status)}`}
                        >
                          {getStatusLabel(deal.status)}
                        </span>
                      </div>
                      {deal.deal_value && (
                        <div 
                          className="text-sm font-semibold ml-14"
                          style={{ color: '#22C55E' }}
                        >
                          ${deal.deal_value.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Getting Started (only show if no deals) */}
        {stats.activeDeals === 0 && (
          <motion.div 
            style={{
              background: 'linear-gradient(135deg, rgba(253,138,230,0.04) 0%, rgba(199,125,255,0.04) 100%)',
              border: '1px solid rgba(253,138,230,0.12)',
              borderRadius: '16px',
              padding: '28px'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <h3 
              className="mb-3"
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#0C0F1A',
                fontFamily: 'var(--font-bricolage), sans-serif'
              }}
            >
              🚀 Getting Started with Scout
            </h3>
            <p className="mb-5" style={{ color: '#5E6370' }}>
              Welcome to Scout! Here's how to get the most out of the platform:
            </p>
            <ol className="space-y-3" style={{ color: '#5E6370' }}>
              <li className="flex items-start gap-3">
                <span 
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '9999px',
                    background: 'rgba(34,197,94,0.12)',
                    color: '#22C55E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    flexShrink: 0,
                    marginTop: '2px'
                  }}
                >
                  1
                </span>
                <span>Browse the brand database to discover potential partners</span>
              </li>
              <li className="flex items-start gap-3">
                <span 
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '9999px',
                    background: 'rgba(34,197,94,0.12)',
                    color: '#22C55E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    flexShrink: 0,
                    marginTop: '2px'
                  }}
                >
                  2
                </span>
                <span>Click "Add to Pipeline" when you find brands you want to pitch</span>
              </li>
              <li className="flex items-start gap-3">
                <span 
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '9999px',
                    background: 'rgba(34,197,94,0.12)',
                    color: '#22C55E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    flexShrink: 0,
                    marginTop: '2px'
                  }}
                >
                  3
                </span>
                <span>Track your outreach and deal progress in the pipeline view</span>
              </li>
              <li className="flex items-start gap-3">
                <span 
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '9999px',
                    background: 'rgba(34,197,94,0.12)',
                    color: '#22C55E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    flexShrink: 0,
                    marginTop: '2px'
                  }}
                >
                  4
                </span>
                <span>Click any deal card to edit details, add notes, and update status</span>
              </li>
            </ol>
          </motion.div>
        )}
      </div>

      {/* Onboarding Modal */}
      {showOnboarding && user && (
        <OnboardingModal
          userId={user.id}
          onComplete={() => {
            setShowOnboarding(false)
            loadStats(user.id)
          }}
        />
      )}
    </motion.div>
  )
}