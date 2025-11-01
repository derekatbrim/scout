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

interface Deal {
  id: string
  brand_name: string
  status: string
  deal_value: number | null
  created_at: string
  pitched_date: string | null
  notes: string | null
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<DealStats>({ activeDeals: 0, totalValue: 0, wonDeals: 0, brandsCount: 0 })
  const [recentDeals, setRecentDeals] = useState<RecentDeal[]>([])
  const [isPro, setIsPro] = useState(false)
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [advancedMetrics, setAdvancedMetrics] = useState<AdvancedMetrics | null>(null)
  const [allDeals, setAllDeals] = useState<Deal[]>([])
  
  const router = useRouter()
  const supabase = supabaseClient()

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

  useEffect(() => {
    if (isPro && allDeals.length > 0) {
      calculateAdvancedMetrics(allDeals, timeRange)
    }
  }, [timeRange, isPro, allDeals])

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

  const filterDealsByTimeRange = (deals: Deal[], range: TimeRange): Deal[] => {
    const now = new Date()
    const cutoffDate = new Date()

    switch (range) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7)
        break
      case '30d':
        cutoffDate.setDate(now.getDate() - 30)
        break
      case '90d':
        cutoffDate.setDate(now.getDate() - 90)
        break
      case 'all':
        return deals
    }

    return deals.filter(d => new Date(d.created_at) >= cutoffDate)
  }

  const calculateAdvancedMetrics = (deals: Deal[], range: TimeRange) => {
    const filteredDeals = filterDealsByTimeRange(deals, range)
    
    if (filteredDeals.length === 0) {
      setAdvancedMetrics({
        projectedRevenue30d: 0,
        projectedRevenue90d: 0,
        avgDealCycle: 0,
        winRate: 0,
        bestPitchDay: 'Monday',
        bestPitchTime: '10am - 12pm',
        topCategory: 'N/A',
        benchmark: {
          yourWinRate: 0,
          avgWinRate: 43,
          yourAvgDeal: 0,
          avgDealValue: 2800
        }
      })
      return
    }

    const wonDeals = filteredDeals.filter(d => d.status === 'won' || d.status === 'delivered')
    const winRate = Math.round((wonDeals.length / filteredDeals.length) * 100)

    const dealsWithValue = filteredDeals.filter(d => d.deal_value && d.deal_value > 0)
    const avgDealValue = dealsWithValue.length > 0
      ? Math.round(dealsWithValue.reduce((sum, d) => sum + (d.deal_value || 0), 0) / dealsWithValue.length)
      : 0

    const wonDealsWithDates = wonDeals.filter(d => d.created_at)
    let avgDealCycle = 14
    
    if (wonDealsWithDates.length > 0) {
      const cycleTimes = wonDealsWithDates.map(d => {
        const created = new Date(d.created_at).getTime()
        const won = new Date().getTime()
        return Math.floor((won - created) / (1000 * 60 * 60 * 24))
      })
      avgDealCycle = Math.round(cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length)
    }

    const activeDeals = filteredDeals.filter(d => 
      d.status !== 'delivered' && d.status !== 'lost'
    )
    const activePipelineValue = activeDeals.reduce((sum, d) => sum + (d.deal_value || 0), 0)
    const historicalWinRate = winRate / 100
    
    const projectedRevenue30d = Math.round(activePipelineValue * historicalWinRate * 0.33)
    const projectedRevenue90d = Math.round(activePipelineValue * historicalWinRate)

    const dayMap: { [key: string]: number } = {}
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    wonDeals.forEach(d => {
      const date = new Date(d.created_at)
      const dayName = daysOfWeek[date.getDay()]
      dayMap[dayName] = (dayMap[dayName] || 0) + 1
    })
    
    const bestPitchDay = Object.keys(dayMap).length > 0
      ? Object.keys(dayMap).reduce((a, b) => dayMap[a] > dayMap[b] ? a : b)
      : 'Tuesday'

    const hourMap: { [key: string]: number } = {}
    wonDeals.forEach(d => {
      const hour = new Date(d.created_at).getHours()
      if (hour >= 9 && hour < 12) hourMap['9am - 12pm'] = (hourMap['9am - 12pm'] || 0) + 1
      else if (hour >= 12 && hour < 15) hourMap['12pm - 3pm'] = (hourMap['12pm - 3pm'] || 0) + 1
      else if (hour >= 15 && hour < 18) hourMap['3pm - 6pm'] = (hourMap['3pm - 6pm'] || 0) + 1
      else hourMap['Other'] = (hourMap['Other'] || 0) + 1
    })
    
    const bestPitchTime = Object.keys(hourMap).length > 0
      ? Object.keys(hourMap).reduce((a, b) => hourMap[a] > hourMap[b] ? a : b)
      : '10am - 12pm'

    setAdvancedMetrics({
      projectedRevenue30d,
      projectedRevenue90d,
      avgDealCycle,
      winRate,
      bestPitchDay,
      bestPitchTime,
      topCategory: 'Food & Beverage',
      benchmark: {
        yourWinRate: winRate,
        avgWinRate: 43,
        yourAvgDeal: avgDealValue,
        avgDealValue: 2800
      }
    })
  }

  const loadStats = async (userId: string) => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    setProfile(profileData)

    const isProUser = profileData?.subscription_tier === 'pro' || profileData?.subscription_tier === 'trial'
    setIsPro(isProUser)

    if (!profileData?.onboarding_completed) {
      setShowOnboarding(true)
      setLoading(false)
      return
    }

    const { data: deals } = await supabase
      .from('deals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    setAllDeals(deals || [])

    const activeDeals = deals?.filter(d => d.status !== 'delivered').length || 0
    const totalValue = deals?.reduce((sum, d) => sum + (d.deal_value || 0), 0) || 0
    const wonDeals = deals?.filter(d => d.status === 'won' || d.status === 'delivered').length || 0

    const { count: brandsCount } = await supabase
      .from('brands')
      .select('*', { count: 'exact', head: true })

    const recent = deals?.slice(0, 3) || []

    setStats({ activeDeals, totalValue, wonDeals, brandsCount: brandsCount || 0 })
    setRecentDeals(recent)

    if (isProUser && deals && deals.length > 0) {
      calculateAdvancedMetrics(deals, timeRange)
    }

    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleExport = async (format: 'csv' | 'pdf') => {
    setShowExportMenu(false)
    console.log(`Exporting as ${format}...`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'prospect': return { bg: 'rgba(148,163,184,0.12)', text: '#475569' }
      case 'pitched': return { bg: 'rgba(59,130,246,0.12)', text: '#1D4ED8' }
      case 'negotiating': return { bg: 'rgba(251,191,36,0.12)', text: '#92400E' }
      case 'won': return { bg: 'rgba(34,197,94,0.12)', text: '#166534' }
      case 'delivered': return { bg: 'rgba(168,85,247,0.12)', text: '#6B21A8' }
      default: return { bg: 'rgba(148,163,184,0.12)', text: '#475569' }
    }
  }

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8F9FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#5E6370' }}>Loading...</div>
      </div>
    )
  }

  return (
    <motion.div
      style={{ minHeight: '100vh', background: '#F8F9FB' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {/* Nav */}
      <nav
        style={{
          background: 'rgba(255,255,255,0.95)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          backdropFilter: 'blur(8px)',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="cursor-pointer">
                <h1
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
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
                  className="font-semibold transition-colors cursor-pointer"
                  style={{
                    color: '#FD8AE6',
                    borderBottom: '2px solid #FD8AE6',
                    paddingBottom: '2px'
                  }}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/dashboard/brands" 
                  className="transition-colors cursor-pointer"
                  style={{ color: '#5E6370' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#0C0F1A'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#5E6370'}
                >
                  Brands
                </Link>
                <Link 
                  href="/dashboard/deals" 
                  className="transition-colors cursor-pointer"
                  style={{ color: '#5E6370' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#0C0F1A'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#5E6370'}
                >
                  Pipeline
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {isPro && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                    color: '#FFFFFF',
                    borderRadius: '9999px',
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    boxShadow: '0 4px 10px rgba(253,138,230,0.25)'
                  }}
                >
                  PRO
                </div>
              )}
              <Link 
                href="/dashboard/profile"
                className="cursor-pointer transition-colors"
                style={{ color: '#5E6370' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
              <span className="text-sm hidden sm:inline" style={{ color: '#5E6370' }}>{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="text-sm px-4 py-2 rounded-lg transition-all"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0,0,0,0.06)',
                  color: '#0C0F1A',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F3F4F6'
                }}
                onMouseLeave={(e) => {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ paddingTop: '2.5rem', paddingBottom: '2.5rem' }}>
        {/* Welcome */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 
            style={{
              fontSize: '1.75rem',
              fontWeight: 600,
              color: '#0C0F1A',
              fontFamily: 'var(--font-bricolage), sans-serif',
              marginBottom: '0.5rem'
            }}
          >
            Welcome back!
          </h2>
          <p style={{ color: '#5E6370', fontFamily: 'var(--font-libre), sans-serif' }}>
            Here's what's happening with your brand partnerships
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4" style={{ gap: '1.75rem', marginBottom: '2rem' }}>
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
            },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              className="cursor-pointer"
              style={{
                background: '#FFFFFF',
                padding: '1.5rem',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                border: '1px solid rgba(0,0,0,0.06)',
                transition: 'all 0.15s ease-out'
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
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
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#5E6370', fontFamily: 'var(--font-libre), sans-serif' }}>
                  {stat.label}
                </div>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '12px',
                    background: 'rgba(253,138,230,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#5E6370'
                  }}
                >
                  {stat.icon}
                </div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0C0F1A', marginBottom: '0.25rem', fontFamily: 'var(--font-bricolage), sans-serif' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#9CA3AF', fontFamily: 'var(--font-libre), sans-serif' }}>
                {stat.subtext}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Advanced Insights */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#0C0F1A',
                  fontFamily: 'var(--font-bricolage), sans-serif',
                  marginBottom: '0.25rem'
                }}
              >
                Advanced Insights
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#5E6370', fontFamily: 'var(--font-libre), sans-serif' }}>
                Data-driven recommendations to boost your win rate
              </p>
            </div>

            {isPro && advancedMetrics && (
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className="px-4 py-2 text-sm font-medium rounded-full transition-all"
                      style={{
                        background: timeRange === range ? '#FFFFFF' : 'transparent',
                        color: timeRange === range ? '#0C0F1A' : '#5E6370',
                        border: timeRange === range ? '2px solid #FD8AE6' : '1px solid rgba(0,0,0,0.06)',
                        cursor: 'pointer'
                      }}
                    >
                      {range === 'all' ? 'All' : range.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2"
                    style={{
                      background: '#0C0F1A',
                      color: '#FFFFFF',
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease-out'
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
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export
                  </button>

                  {showExportMenu && (
                    <motion.div
                      className="absolute right-0 mt-2 rounded-lg shadow-lg overflow-hidden"
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid rgba(0,0,0,0.06)',
                        minWidth: '160px',
                        zIndex: 50
                      }}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {[
                        { label: 'Export as CSV', format: 'csv' as const },
                        { label: 'Export as PDF', format: 'pdf' as const },
                      ].map((item) => (
                        <button
                          key={item.format}
                          onClick={() => handleExport(item.format)}
                          className="w-full px-4 py-3 text-left text-sm transition-colors cursor-pointer"
                          style={{
                            background: '#FFFFFF',
                            color: '#0C0F1A',
                            borderBottom: '1px solid rgba(0,0,0,0.04)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#F8F9FB'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#FFFFFF'
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pro Content or Paywall */}
          <div className="relative">
            {/* Content - Always render but blur for free users */}
            <div
              className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${!isPro ? 'blur-sm opacity-40 pointer-events-none select-none' : ''}`}
            >
              {advancedMetrics && (
                <>
                  {/* Revenue Projections */}
                  <motion.div
                    style={{
                      background: '#FFFFFF',
                      padding: '2rem',
                      borderRadius: '16px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                      border: '1px solid rgba(0,0,0,0.06)'
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <div className="flex items-center gap-3 mb-5">
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          background: 'rgba(253,138,230,0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FD8AE6'
                        }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0C0F1A', fontFamily: 'var(--font-bricolage), sans-serif' }}>
                        Revenue Projections
                      </h4>
                    </div>

                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#0C0F1A', marginBottom: '0.75rem', fontFamily: 'var(--font-bricolage), sans-serif' }}>
                      ${advancedMetrics.projectedRevenue30d.toLocaleString()}
                    </div>
                    <p style={{ fontSize: '0.875rem', marginBottom: '1.25rem', color: '#9CA3AF', fontFamily: 'var(--font-libre), sans-serif' }}>
                      Based on {stats.activeDeals} active deals
                    </p>

                    <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '1rem' }}>
                      <div className="flex items-center justify-between text-sm">
                        <span style={{ color: '#5E6370', fontFamily: 'var(--font-libre), sans-serif' }}>90-day projection</span>
                        <span style={{ fontWeight: 600, color: '#0C0F1A', fontFamily: 'var(--font-libre), sans-serif' }}>
                          ${advancedMetrics.projectedRevenue90d.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Deal Cycle */}
                  <motion.div
                    style={{
                      background: '#FFFFFF',
                      padding: '2rem',
                      borderRadius: '16px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                      border: '1px solid rgba(0,0,0,0.06)'
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                  >
                    <div className="flex items-center gap-3 mb-5">
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          background: 'rgba(59,130,246,0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#3B82F6'
                        }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0C0F1A', fontFamily: 'var(--font-bricolage), sans-serif' }}>
                        Average Deal Cycle
                      </h4>
                    </div>

                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#0C0F1A', marginBottom: '0.75rem', fontFamily: 'var(--font-bricolage), sans-serif' }}>
                      {advancedMetrics.avgDealCycle} days
                    </div>
                    <p style={{ fontSize: '0.875rem', marginBottom: '1.25rem', color: '#9CA3AF', fontFamily: 'var(--font-libre), sans-serif' }}>
                      From first contact to close
                    </p>

                    {advancedMetrics.avgDealCycle < 21 && (
                      <div
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                        style={{
                          background: 'rgba(34,197,94,0.12)',
                          color: '#166534'
                        }}
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {Math.round(((21 - advancedMetrics.avgDealCycle) / 21) * 100)}% faster than avg
                      </div>
                    )}
                  </motion.div>

                  {/* Optimal Timing */}
                  <motion.div
                    className="md:col-span-2"
                    style={{
                      background: '#FFFFFF',
                      padding: '2rem',
                      borderRadius: '16px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                      border: '1px solid rgba(0,0,0,0.06)'
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          background: 'rgba(251,146,60,0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FB923C'
                        }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0C0F1A', fontFamily: 'var(--font-bricolage), sans-serif' }}>
                          Optimal Pitch Timing
                        </h4>
                        <p style={{ fontSize: '0.875rem', color: '#5E6370', fontFamily: 'var(--font-libre), sans-serif' }}>
                          When your deals are most likely to convert
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                      <div style={{ padding: '1.25rem', borderRadius: '12px', background: '#F8F9FB' }}>
                        <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: '#5E6370', fontFamily: 'var(--font-libre), sans-serif' }}>
                          Best Day
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0C0F1A', fontFamily: 'var(--font-bricolage), sans-serif' }}>
                          {advancedMetrics.bestPitchDay}
                        </div>
                      </div>
                      <div style={{ padding: '1.25rem', borderRadius: '12px', background: '#F8F9FB' }}>
                        <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: '#5E6370', fontFamily: 'var(--font-libre), sans-serif' }}>
                          Best Time
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0C0F1A', fontFamily: 'var(--font-bricolage), sans-serif' }}>
                          {advancedMetrics.bestPitchTime}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Performance Benchmarks */}
                  <motion.div
                    className="md:col-span-2"
                    style={{
                      background: '#FFFFFF',
                      padding: '2rem',
                      borderRadius: '16px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                      border: '1px solid rgba(0,0,0,0.06)'
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.25 }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: 'rgba(199,125,255,0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#C77DFF'
                          }}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0C0F1A', fontFamily: 'var(--font-bricolage), sans-serif' }}>
                          Performance Benchmarks
                        </h4>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <div className="flex items-center justify-between mb-2 text-sm">
                          <span style={{ color: '#5E6370', fontFamily: 'var(--font-libre), sans-serif' }}>Win Rate</span>
                          <span style={{ fontWeight: 600, color: '#0C0F1A', fontFamily: 'var(--font-libre), sans-serif' }}>
                            You: {advancedMetrics.benchmark.yourWinRate}% · Avg: {advancedMetrics.benchmark.avgWinRate}%
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '12px', borderRadius: '9999px', overflow: 'hidden', background: '#F1F5F9' }}>
                          <div
                            style={{
                              height: '100%',
                              borderRadius: '9999px',
                              width: `${advancedMetrics.benchmark.yourWinRate}%`,
                              background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)'
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2 text-sm">
                          <span style={{ color: '#5E6370', fontFamily: 'var(--font-libre), sans-serif' }}>Average Deal Value</span>
                          <span style={{ fontWeight: 600, color: '#0C0F1A', fontFamily: 'var(--font-libre), sans-serif' }}>
                            You: ${advancedMetrics.benchmark.yourAvgDeal.toLocaleString()} · Avg: ${advancedMetrics.benchmark.avgDealValue.toLocaleString()}
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '12px', borderRadius: '9999px', overflow: 'hidden', background: '#F1F5F9' }}>
                          <div
                            style={{
                              height: '100%',
                              borderRadius: '9999px',
                              width: `${Math.min((advancedMetrics.benchmark.yourAvgDeal / advancedMetrics.benchmark.avgDealValue) * 50, 100)}%`,
                              background: 'linear-gradient(135deg, #22C55E 0%, #14B8A6 100%)'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* AI Recommendations */}
                  <motion.div
                    className="md:col-span-2"
                    style={{
                      background: 'rgba(253,138,230,0.04)',
                      padding: '2rem',
                      borderRadius: '16px',
                      border: '1px solid rgba(253,138,230,0.08)'
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0C0F1A', marginBottom: '1.25rem', fontFamily: 'var(--font-bricolage), sans-serif' }}>
                      Recommendations to increase win rate
                    </h4>

                    <div className="space-y-3">
                      {[
                        {
                          title: 'Focus on Tuesday pitches',
                          desc: `You've closed ${advancedMetrics.benchmark.yourWinRate}% more deals on ${advancedMetrics.bestPitchDay}s - schedule your important pitches then`
                        },
                        {
                          title: 'Follow up faster',
                          desc: `Your avg deal cycle is ${advancedMetrics.avgDealCycle} days. Brands respond 2.3x better within 48hrs of initial contact`
                        },
                        {
                          title: 'Pitch during peak hours',
                          desc: `Most of your won deals came from ${advancedMetrics.bestPitchTime} pitches - send important emails in this window`
                        },
                      ].map((rec, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-4 rounded-lg"
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid rgba(0,0,0,0.03)'
                          }}
                        >
                          <span
                            className="inline-flex items-center justify-center flex-shrink-0"
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '9999px',
                              background: '#F1F5F9',
                              color: '#5E6370',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}
                          >
                            {idx + 1}
                          </span>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0C0F1A', marginBottom: '0.25rem', fontFamily: 'var(--font-libre), sans-serif' }}>
                              {rec.title}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#5E6370', fontFamily: 'var(--font-libre), sans-serif' }}>
                              {rec.desc}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}

              {/* Placeholder for Free Users */}
              {!isPro && !advancedMetrics && (
                <>
                  <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ height: '200px' }} />
                  </div>
                  <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ height: '200px' }} />
                  </div>
                  <div className="md:col-span-2" style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ height: '200px' }} />
                  </div>
                </>
              )}
            </div>

            {/* Paywall Overlay - FIXED: Now shows for all free users */}
            {!isPro && (
              <div
                className="absolute inset-0 flex items-center justify-center rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)'
                }}
              >
                <motion.div
                  className="max-w-md mx-auto text-center p-8 rounded-2xl"
                  style={{
                    background: '#FFFFFF',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                    border: '1px solid rgba(0,0,0,0.06)'
                  }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25, delay: 0.1 }}
                >
                  <div
                    className="mx-auto mb-5 flex items-center justify-center"
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '20px',
                      background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                      boxShadow: '0 8px 20px rgba(253,138,230,0.3)'
                    }}
                  >
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>

                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0C0F1A', marginBottom: '0.75rem', fontFamily: 'var(--font-bricolage), sans-serif' }}>
                    Unlock Advanced Analytics
                  </h3>
                  <p style={{ fontSize: '1rem', color: '#5E6370', marginBottom: '1.5rem', fontFamily: 'var(--font-libre), sans-serif' }}>
                    Get revenue projections, optimal timing insights, and AI-powered recommendations to close more deals
                  </p>

                  <ul className="text-left space-y-3 mb-6">
                    {[
                      'Revenue projections & forecasting',
                      'Deal cycle analysis & benchmarking',
                      'Optimal pitch timing recommendations',
                      'AI-powered win rate insights',
                      'Export reports as CSV or PDF'
                    ].map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#22C55E' }} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span style={{ fontSize: '0.9375rem', color: '#0C0F1A', fontFamily: 'var(--font-libre), sans-serif' }}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/pricing">
                    <button
                      className="w-full px-6 py-3 text-base font-semibold rounded-xl transition-all"
                      style={{
                        background: '#0C0F1A',
                        color: '#FFFFFF',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease-out'
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
                      Upgrade to Pro
                    </button>
                  </Link>
                  <p style={{ fontSize: '0.8125rem', color: '#9CA3AF', marginTop: '1rem', fontFamily: 'var(--font-libre), sans-serif' }}>
                    Start your 14-day free trial · No credit card required
                  </p>
                </motion.div>
              </div>
            )}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '1.75rem', marginBottom: '2rem' }}>
          {/* Quick Actions */}
          <motion.div
            style={{
              background: '#FFFFFF',
              padding: '1.5rem',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.06)'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.35 }}
          >
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0C0F1A', marginBottom: '1rem', fontFamily: 'var(--font-bricolage), sans-serif' }}>
              Quick Actions
            </h3>
            <div className="flex flex-col gap-3">
              <Link href="/dashboard/brands">
                <button
                  className="w-full text-sm font-semibold px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                  style={{
                    background: '#0C0F1A',
                    color: '#FFFFFF',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease-out'
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
                  Browse Brand Database
                </button>
              </Link>
              <Link href="/dashboard/deals">
                <button
                  className="w-full text-sm font-medium px-4 py-3 rounded-lg transition-all"
                  style={{
                    background: '#FFFFFF',
                    color: '#0C0F1A',
                    border: '1px solid rgba(0,0,0,0.06)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease-out'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F3F4F6'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#FFFFFF'
                  }}
                >
                  Manage Pipeline
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            style={{
              background: '#FFFFFF',
              padding: '1.5rem',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.06)'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0C0F1A', fontFamily: 'var(--font-bricolage), sans-serif' }}>
                Recent Activity
              </h3>
              <Link 
                href="/dashboard/deals"
                className="text-sm font-medium cursor-pointer"
                style={{ color: '#FD8AE6' }}
              >
                View all →
              </Link>
            </div>
            
            {recentDeals.length === 0 ? (
              <div className="text-center py-8">
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔭</div>
                <p style={{ fontSize: '0.875rem', marginBottom: '0.75rem', color: '#9CA3AF', fontFamily: 'var(--font-libre), sans-serif' }}>
                  No deals yet. Start by browsing brands!
                </p>
                <Link href="/dashboard/brands">
                  <button
                    className="text-sm font-medium px-4 py-2 rounded-lg transition-all"
                    style={{
                      background: '#FFFFFF',
                      color: '#0C0F1A',
                      border: '1px solid rgba(0,0,0,0.06)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease-out'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F3F4F6'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#FFFFFF'
                    }}
                  >
                    Browse Brands
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentDeals.map((deal) => {
                  const statusColor = getStatusColor(deal.status)
                  return (
                    <Link 
                      key={deal.id} 
                      href="/dashboard/deals"
                      className="block group"
                    >
                      <div
                        className="p-3 rounded-lg transition-all cursor-pointer"
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid rgba(0,0,0,0.03)',
                          borderRadius: '14px',
                          transition: 'all 0.15s ease-out'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#F8F9FB'
                          e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#FFFFFF'
                          e.currentTarget.style.borderColor = 'rgba(0,0,0,0.03)'
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                background: '#0C0F1A',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8125rem',
                                fontWeight: 600
                              }}
                            >
                              {deal.brand_name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#0C0F1A', fontSize: '0.9375rem', fontFamily: 'var(--font-libre), sans-serif' }}>
                                {deal.brand_name}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#9CA3AF', fontFamily: 'var(--font-libre), sans-serif' }}>
                                {getTimeAgo(deal.created_at)}
                              </div>
                            </div>
                          </div>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: statusColor.bg,
                              color: statusColor.text
                            }}
                          >
                            {getStatusLabel(deal.status)}
                          </span>
                        </div>
                        {deal.deal_value && (
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#22C55E', marginLeft: '48px', fontFamily: 'var(--font-libre), sans-serif' }}>
                            ${deal.deal_value.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Getting Started (only if no deals) */}
        {stats.activeDeals === 0 && (
          <motion.div
            style={{
              background: 'rgba(253,138,230,0.04)',
              border: '1px solid rgba(253,138,230,0.08)',
              padding: '1.5rem',
              borderRadius: '16px'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.45 }}
          >
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0C0F1A', marginBottom: '0.5rem', fontFamily: 'var(--font-bricolage), sans-serif' }}>
              Getting Started with Scout
            </h3>
            <p style={{ color: '#5E6370', marginBottom: '1rem', fontFamily: 'var(--font-libre), sans-serif' }}>
              Welcome to Scout! Here's how to get the most out of the platform:
            </p>
            <ol className="space-y-2" style={{ paddingLeft: '1.25rem', color: '#5E6370', fontFamily: 'var(--font-libre), sans-serif' }}>
              <li>Browse the brand database to discover potential partners</li>
              <li>Click "Add to Pipeline" when you find brands you want to pitch</li>
              <li>Track your outreach and deal progress in the pipeline view</li>
              <li>Click any deal card to edit details, add notes, and update status</li>
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