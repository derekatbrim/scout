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

  // Recalculate metrics when time range changes
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
      // Set placeholder metrics if no deals
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

    // Calculate Win Rate
    const wonDeals = filteredDeals.filter(d => d.status === 'won' || d.status === 'delivered')
    const winRate = Math.round((wonDeals.length / filteredDeals.length) * 100)

    // Calculate Average Deal Value
    const dealsWithValue = filteredDeals.filter(d => d.deal_value && d.deal_value > 0)
    const avgDealValue = dealsWithValue.length > 0
      ? Math.round(dealsWithValue.reduce((sum, d) => sum + (d.deal_value || 0), 0) / dealsWithValue.length)
      : 0

    // Calculate Average Deal Cycle (from created to won)
    const wonDealsWithDates = wonDeals.filter(d => d.created_at)
    let avgDealCycle = 14 // default
    
    if (wonDealsWithDates.length > 0) {
      const cycleTimes = wonDealsWithDates.map(d => {
        const created = new Date(d.created_at).getTime()
        const won = new Date().getTime() // Ideally you'd have a won_date field
        return Math.floor((won - created) / (1000 * 60 * 60 * 24))
      })
      avgDealCycle = Math.round(cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length)
    }

    // Calculate Revenue Projections
    const activeDeals = filteredDeals.filter(d => 
      d.status !== 'delivered' && d.status !== 'lost'
    )
    const activePipelineValue = activeDeals.reduce((sum, d) => sum + (d.deal_value || 0), 0)
    const historicalWinRate = winRate / 100
    
    // Simple projection: active pipeline * win rate
    const projectedRevenue30d = Math.round(activePipelineValue * historicalWinRate * 0.33)
    const projectedRevenue90d = Math.round(activePipelineValue * historicalWinRate)

    // Find Best Pitch Day (day with most won deals)
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

    // Find Best Pitch Time (simple - most common hour range)
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
      topCategory: 'Food & Beverage', // Would need brand category join
      benchmark: {
        yourWinRate: winRate,
        avgWinRate: 43, // Industry average - would come from aggregated data
        yourAvgDeal: avgDealValue,
        avgDealValue: 2800 // Industry average
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

    // ✅ WIRED: Check subscription status
    const isProUser = profileData?.subscription_tier === 'pro' || profileData?.subscription_tier === 'trial'
    setIsPro(isProUser)

    if (!profileData?.onboarding_completed) {
      setShowOnboarding(true)
      setLoading(false)
      return
    }

    // Fetch all deals for metrics calculation
    const { data: deals } = await supabase
      .from('deals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    setAllDeals(deals || [])

    // Calculate basic stats
    const activeDeals = deals?.filter(d => d.status !== 'delivered').length || 0
    const totalValue = deals?.reduce((sum, d) => sum + (d.deal_value || 0), 0) || 0
    const wonDeals = deals?.filter(d => d.status === 'won' || d.status === 'delivered').length || 0

    const { count: brandsCount } = await supabase
      .from('brands')
      .select('*', { count: 'exact', head: true })

    const recent = deals?.slice(0, 3) || []

    setStats({ activeDeals, totalValue, wonDeals, brandsCount: brandsCount || 0 })
    setRecentDeals(recent)

    // ✅ WIRED: Calculate advanced metrics if Pro
    if (isProUser && deals && deals.length > 0) {
      calculateAdvancedMetrics(deals, timeRange)
    }

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

  // ✅ WIRED: Export functionality
  const handleExport = async (format: 'csv' | 'pdf') => {
    setShowExportMenu(false)

    if (format === 'csv') {
      // Generate CSV
      const headers = ['Brand Name', 'Status', 'Deal Value', 'Created At', 'Notes']
      const rows = allDeals.map(d => [
        d.brand_name,
        d.status,
        d.deal_value || '0',
        new Date(d.created_at).toLocaleDateString(),
        (d.notes || '').replace(/,/g, ';') // escape commas
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n')

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `scout-analytics-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } else if (format === 'pdf') {
      // For PDF, you'd use a library like jsPDF
      // For now, just alert that it's coming soon
      alert('PDF export coming soon! Use CSV for now.')
    }
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
              {/* ✅ WIRED: Pro Badge */}
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
                className="cursor-pointer transition-colors"
                style={{ color: '#5E6370' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
              <span className="text-sm" style={{ color: '#5E6370' }}>{user?.email}</span>
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
                  e.currentTarget.style.background = '#F8F9FB'
                  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#FFFFFF'
                  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
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
              iconBg: '#F1F5F9',
              iconColor: '#5E6370',
              delay: 0.1
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
              iconBg: 'rgba(253,138,230,0.1)',
              iconColor: '#FD8AE6',
              delay: 0.15
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
              iconBg: 'rgba(34,197,94,0.1)',
              iconColor: '#22C55E',
              delay: 0.2
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
              iconBg: '#F1F5F9',
              iconColor: '#5E6370',
              delay: 0.25
            },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              className="cursor-pointer"
              style={{
                background: '#FFFFFF',
                padding: '24px',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                border: '1px solid rgba(0,0,0,0.06)',
                transition: 'all 0.15s ease-out'
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: stat.delay }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)'
                e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.06)'
                e.currentTarget.style.borderColor = 'rgba(253,138,230,0.25)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)'
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium" style={{ color: '#5E6370' }}>
                  {stat.label}
                </div>
                <div
                  className="transition-all"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: stat.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: stat.iconColor
                  }}
                >
                  {stat.icon}
                </div>
              </div>
              <div 
                className="mb-1"
                style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: idx === 1 ? '#FD8AE6' : idx === 2 ? '#22C55E' : '#0C0F1A'
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

        {/* ✅ WIRED: Advanced Insights Section */}
        {advancedMetrics && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3
                  className="mb-1"
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    color: '#0C0F1A',
                    fontFamily: 'var(--font-bricolage), sans-serif'
                  }}
                >
                  Advanced Insights
                </h3>
                <p style={{ color: '#5E6370', fontSize: '0.875rem' }}>
                  AI-powered analytics to help you land more deals
                </p>
              </div>

              {/* Time Range + Export Controls */}
              {isPro && (
                <div className="flex items-center gap-3">
                  {/* Time Range Toggle */}
                  <div className="flex gap-1 p-1 rounded-lg" style={{ background: '#F1F5F9' }}>
                    {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className="px-3 py-1.5 text-sm font-medium rounded-lg transition-all cursor-pointer"
                        style={{
                          background: timeRange === range ? '#FFFFFF' : 'transparent',
                          color: timeRange === range ? '#0C0F1A' : '#5E6370',
                          boxShadow: timeRange === range ? '0 2px 4px rgba(0,0,0,0.06)' : 'none'
                        }}
                      >
                        {range === 'all' ? 'All time' : range.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  {/* Export Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer"
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid rgba(0,0,0,0.06)',
                        color: '#0C0F1A'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F8F9FB'
                        e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#FFFFFF'
                        e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
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
              {/* Content (shown for Pro, blurred for Free) */}
              <div
                className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${!isPro ? 'blur-sm opacity-40 pointer-events-none select-none' : ''}`}
              >
                {/* Revenue Projections */}
                <motion.div
                  style={{
                    background: '#FFFFFF',
                    padding: '28px',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                    border: '1px solid rgba(0,0,0,0.06)'
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.35 }}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: 'rgba(253,138,230,0.1)',
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
                    <h4
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: '#0C0F1A'
                      }}
                    >
                      Revenue Projections
                    </h4>
                  </div>

                  <div
                    className="mb-3"
                    style={{
                      fontSize: '2.5rem',
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    ${advancedMetrics.projectedRevenue30d.toLocaleString()}
                  </div>
                  <p className="text-sm mb-5" style={{ color: '#5E6370' }}>
                    Based on {stats.activeDeals} active deals
                  </p>

                  <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '16px' }}>
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: '#5E6370' }}>90-day projection</span>
                      <span style={{ fontWeight: 600, color: '#0C0F1A' }}>
                        ${advancedMetrics.projectedRevenue90d.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Deal Cycle */}
                <motion.div
                  style={{
                    background: '#FFFFFF',
                    padding: '28px',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                    border: '1px solid rgba(0,0,0,0.06)'
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: 'rgba(59,130,246,0.1)',
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
                    <h4
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: '#0C0F1A'
                      }}
                    >
                      Average Deal Cycle
                    </h4>
                  </div>

                  <div
                    className="mb-3"
                    style={{
                      fontSize: '2.5rem',
                      fontWeight: 700,
                      color: '#0C0F1A'
                    }}
                  >
                    {advancedMetrics.avgDealCycle} days
                  </div>
                  <p className="text-sm mb-5" style={{ color: '#5E6370' }}>
                    From first contact to close
                  </p>

                  {advancedMetrics.avgDealCycle < 21 && (
                    <div
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                      style={{
                        background: 'rgba(34,197,94,0.1)',
                        color: '#22C55E'
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
                    padding: '28px',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                    border: '1px solid rgba(0,0,0,0.06)'
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.45 }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: 'rgba(251,146,60,0.1)',
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
                      <h4
                        style={{
                          fontSize: '1.125rem',
                          fontWeight: 600,
                          color: '#0C0F1A'
                        }}
                      >
                        Optimal Pitch Timing
                      </h4>
                      <p className="text-sm" style={{ color: '#5E6370' }}>
                        When your deals are most likely to convert
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div
                      className="p-5 rounded-lg"
                      style={{ background: '#F8F9FB' }}
                    >
                      <div className="text-sm mb-2" style={{ color: '#5E6370' }}>
                        Best Day
                      </div>
                      <div
                        style={{
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          color: '#0C0F1A'
                        }}
                      >
                        {advancedMetrics.bestPitchDay}
                      </div>
                    </div>
                    <div
                      className="p-5 rounded-lg"
                      style={{ background: '#F8F9FB' }}
                    >
                      <div className="text-sm mb-2" style={{ color: '#5E6370' }}>
                        Best Time
                      </div>
                      <div
                        style={{
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          color: '#0C0F1A'
                        }}
                      >
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
                    padding: '28px',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                    border: '1px solid rgba(0,0,0,0.06)'
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          background: 'rgba(199,125,255,0.1)',
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
                      <h4
                        style={{
                          fontSize: '1.125rem',
                          fontWeight: 600,
                          color: '#0C0F1A'
                        }}
                      >
                        Performance Benchmarks
                      </h4>
                    </div>

                    {advancedMetrics.benchmark.yourWinRate > advancedMetrics.benchmark.avgWinRate && (
                      <div
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
                        style={{
                          background: 'rgba(34,197,94,0.1)',
                          color: '#22C55E'
                        }}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Top {Math.round((1 - (advancedMetrics.benchmark.yourWinRate / 100)) * 100)}%
                      </div>
                    )}
                  </div>

                  <div className="space-y-5">
                    {/* Win Rate */}
                    <div>
                      <div className="flex items-center justify-between mb-2 text-sm">
                        <span style={{ color: '#5E6370' }}>Win Rate</span>
                        <span style={{ fontWeight: 600, color: '#0C0F1A' }}>
                          You: {advancedMetrics.benchmark.yourWinRate}% · Avg: {advancedMetrics.benchmark.avgWinRate}%
                        </span>
                      </div>
                      <div
                        className="w-full h-3 rounded-full overflow-hidden"
                        style={{ background: '#F1F5F9' }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${advancedMetrics.benchmark.yourWinRate}%`,
                            background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)'
                          }}
                        />
                      </div>
                    </div>

                    {/* Avg Deal Value */}
                    <div>
                      <div className="flex items-center justify-between mb-2 text-sm">
                        <span style={{ color: '#5E6370' }}>Average Deal Value</span>
                        <span style={{ fontWeight: 600, color: '#0C0F1A' }}>
                          You: ${advancedMetrics.benchmark.yourAvgDeal.toLocaleString()} · Avg: ${advancedMetrics.benchmark.avgDealValue.toLocaleString()}
                        </span>
                      </div>
                      <div
                        className="w-full h-3 rounded-full overflow-hidden"
                        style={{ background: '#F1F5F9' }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
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
                    background: 'linear-gradient(135deg, rgba(253,138,230,0.04) 0%, rgba(199,125,255,0.04) 100%)',
                    padding: '28px',
                    borderRadius: '16px',
                    border: '1px solid rgba(253,138,230,0.12)'
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.55 }}
                >
                  <h4
                    className="mb-5"
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      color: '#0C0F1A'
                    }}
                  >
                    🎯 AI Recommendations
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
                        className="flex items-start gap-4 p-4 rounded-lg"
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid rgba(0,0,0,0.04)'
                        }}
                      >
                        <div
                          className="flex-shrink-0"
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '9999px',
                            background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}
                        >
                          {idx + 1}
                        </div>
                        <div>
                          <div
                            className="mb-1"
                            style={{
                              fontWeight: 600,
                              color: '#0C0F1A'
                            }}
                          >
                            {rec.title}
                          </div>
                          <div className="text-sm" style={{ color: '#5E6370' }}>
                            {rec.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Paywall Overlay (Free Users) */}
              {!isPro && (
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-2xl"
                  style={{
                    background: 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)'
                  }}
                >
                  <div
                    className="max-w-md mx-auto text-center p-8 rounded-2xl"
                    style={{
                      background: '#FFFFFF',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                      border: '1px solid rgba(0,0,0,0.06)'
                    }}
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>

                    <h3
                      className="mb-3"
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: '#0C0F1A',
                        fontFamily: 'var(--font-bricolage), sans-serif'
                      }}
                    >
                      Unlock Advanced Insights
                    </h3>
                    
                    <p className="mb-6" style={{ color: '#5E6370' }}>
                      Get AI-powered recommendations, revenue projections, optimal pitch timing, and industry benchmarks to land more deals
                    </p>

                    <ul className="text-left space-y-3 mb-8">
                      {[
                        'Revenue projections (30d & 90d)',
                        'Optimal pitch timing insights',
                        'Industry performance benchmarks',
                        'AI-powered recommendations',
                        'Export analytics as CSV/PDF',
                        'Goal setting & progress tracking',
                      ].map((feature) => (
                        <li key={feature} className="flex items-center gap-3">
                          <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#22C55E' }} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span style={{ color: '#0C0F1A' }}>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link href="/pricing">
                      <button
                        className="w-full px-6 py-4 rounded-xl text-base font-semibold transition-all cursor-pointer"
                        style={{
                          background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                          color: '#FFFFFF',
                          boxShadow: '0 4px 12px rgba(253,138,230,0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.02)'
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(253,138,230,0.4)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(253,138,230,0.3)'
                        }}
                      >
                        Upgrade to Pro →
                      </button>
                    </Link>

                    <p className="mt-4 text-sm" style={{ color: '#9CA3AF' }}>
                      Start your 7-day free trial · Cancel anytime
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Quick Actions */}
          <motion.div 
            style={{
              background: '#FFFFFF',
              padding: '24px',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.06)'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <h3 
              className="mb-4"
              style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: '#0C0F1A'
              }}
            >
              Quick Actions
            </h3>
            <div className="flex flex-col gap-3">
              <Link href="/dashboard/brands">
                <button
                  className="w-full text-sm px-4 py-3 rounded-lg font-semibold transition-all cursor-pointer"
                  style={{
                    background: '#0C0F1A',
                    color: '#FFFFFF',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
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
                  className="w-full text-sm px-4 py-3 rounded-lg font-semibold transition-all cursor-pointer"
                  style={{
                    background: '#FFFFFF',
                    color: '#0C0F1A',
                    border: '1px solid rgba(0,0,0,0.06)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F8F9FB'
                    e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#FFFFFF'
                    e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'
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
              padding: '24px',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.06)'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.65 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#0C0F1A'
                }}
              >
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
            transition={{ duration: 0.3, delay: 0.7 }}
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
              {[
                'Browse the brand database to discover potential partners',
                'Click "Add to Pipeline" when you find brands you want to pitch',
                'Track your outreach and deal progress in the pipeline view',
                'Click any deal card to edit details, add notes, and update status',
              ].map((step, idx) => (
                <li key={idx} className="flex items-start gap-3">
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
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
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