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

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<DealStats>({ activeDeals: 0, totalValue: 0, wonDeals: 0, brandsCount: 0 })
  const [recentDeals, setRecentDeals] = useState<RecentDeal[]>([])
  const router = useRouter()
  const supabase = supabaseClient()

  useEffect(() => {
    if (!user) return

    // Subscribe to deal changes
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
    // Check if onboarding is complete
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    setProfile(profileData)

    // Show onboarding if not completed
    if (!profileData?.onboarding_completed) {
      setShowOnboarding(true)
      setLoading(false)
      return
    }

    // Get all deals
    const { data: deals } = await supabase
      .from('deals')
      .select('deal_value, status, id, brand_name, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Calculate stats
    const activeDeals = deals?.filter(d => d.status !== 'delivered').length || 0
    const totalValue = deals?.reduce((sum, d) => sum + (d.deal_value || 0), 0) || 0
    const wonDeals = deals?.filter(d => d.status === 'won' || d.status === 'delivered').length || 0

    // Get brands count
    const { count: brandsCount } = await supabase
      .from('brands')
      .select('*', { count: 'exact', head: true })

    // Get recent 3 deals
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
              <span className="text-sm" style={{ color: '#5E6370' }}>
                {user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm font-medium px-4 py-2 transition-all"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: '12px',
                  color: '#0C0F1A',
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h2 
            className="mb-2"
            style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#0C0F1A',
              fontFamily: 'var(--font-bricolage), sans-serif'
            }}
          >
            Welcome back! 👋
          </h2>
          <p style={{ color: '#5E6370', fontSize: '1rem' }}>
            Here's what's happening with your brand partnerships
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-7 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {/* Active Deals */}
          <div
            className="cursor-pointer"
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.06)',
              transition: 'all 0.15s ease-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.01)'
              e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.06)'
              e.currentTarget.style.borderColor = 'rgba(253,138,230,0.25)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)'
              e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div 
                className="text-sm font-semibold"
                style={{ color: '#5E6370' }}
              >
                Active Deals
              </div>
              <div 
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(12,15,26,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg className="w-5 h-5" style={{ color: '#5E6370' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div 
              className="mb-1"
              style={{
                fontSize: '2.5rem',
                fontWeight: 700,
                color: '#0C0F1A'
              }}
            >
              {stats.activeDeals}
            </div>
            <div className="text-sm" style={{ color: '#5E6370' }}>
              {stats.activeDeals === 0 ? 'Add your first deal' : 'In your pipeline'}
            </div>
          </div>

          {/* Pipeline Value */}
          <div
            className="cursor-pointer"
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.06)',
              transition: 'all 0.15s ease-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.01)'
              e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.06)'
              e.currentTarget.style.borderColor = 'rgba(253,138,230,0.25)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)'
              e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div 
                className="text-sm font-semibold"
                style={{ color: '#5E6370' }}
              >
                Pipeline Value
              </div>
              <div 
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(253,138,230,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg className="w-5 h-5" style={{ color: '#FD8AE6' }} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
            <div 
              className="mb-1"
              style={{
                fontSize: '2.5rem',
                fontWeight: 700,
                color: '#FD8AE6'
              }}
            >
              ${stats.totalValue.toLocaleString()}
            </div>
            <div className="text-sm" style={{ color: '#5E6370' }}>
              Total potential
            </div>
          </div>

          {/* Deals Won */}
          <div
            className="cursor-pointer"
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.06)',
              transition: 'all 0.15s ease-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.01)'
              e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.06)'
              e.currentTarget.style.borderColor = 'rgba(253,138,230,0.25)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)'
              e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div 
                className="text-sm font-semibold"
                style={{ color: '#5E6370' }}
              >
                Deals Won
              </div>
              <div 
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(34,197,94,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg className="w-5 h-5" style={{ color: '#22C55E' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
            <div 
              className="mb-1"
              style={{
                fontSize: '2.5rem',
                fontWeight: 700,
                color: '#22C55E'
              }}
            >
              {stats.wonDeals}
            </div>
            <div className="text-sm" style={{ color: '#5E6370' }}>
              Closed successfully
            </div>
          </div>

          {/* Brand Database */}
          <div
            className="cursor-pointer"
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.06)',
              transition: 'all 0.15s ease-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.01)'
              e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.06)'
              e.currentTarget.style.borderColor = 'rgba(253,138,230,0.25)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)'
              e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div 
                className="text-sm font-semibold"
                style={{ color: '#5E6370' }}
              >
                Brand Database
              </div>
              <div 
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(12,15,26,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg className="w-5 h-5" style={{ color: '#5E6370' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <div 
              className="mb-1"
              style={{
                fontSize: '2.5rem',
                fontWeight: 700,
                color: '#0C0F1A'
              }}
            >
              {stats.brandsCount}
            </div>
            <div className="text-sm" style={{ color: '#5E6370' }}>
              Ready to discover
            </div>
          </div>
        </motion.div>

        {/* Two Column Layout */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-7 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          {/* Quick Actions */}
          <div 
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.06)'
            }}
          >
            <h3 
              className="mb-6"
              style={{
                fontSize: '1.25rem',
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
                  className="w-full px-5 py-3 text-sm font-semibold transition-all"
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
                  className="w-full px-5 py-3 text-sm font-semibold transition-all"
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
          </div>

          {/* Recent Activity */}
          <div 
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.06)'
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 
                style={{
                  fontSize: '1.25rem',
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
                style={{ color: '#FD8AE6' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#C77DFF'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#FD8AE6'}
              >
                View all →
              </Link>
            </div>
            
            {recentDeals.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">🔭</div>
                <p className="text-sm mb-4" style={{ color: '#5E6370' }}>
                  No deals yet. Start by browsing brands!
                </p>
                <Link href="/dashboard/brands">
                  <button
                    className="px-5 py-2.5 text-sm font-semibold transition-all"
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
          </div>
        </motion.div>

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