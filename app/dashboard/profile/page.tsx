'use client'

import { useEffect, useState } from 'react'
import { supabaseClient } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { showToast } from '../../../components/ui/toast'
import { ProfilePictureUpload } from '../../../components/profile-picture-upload'
import { PortfolioUpload } from '../../../components/portfolio-upload'
import { PortfolioGrid } from '../../../components/portfolio-grid'

interface Profile {
  id: string
  email: string
  full_name: string
  instagram_handle: string
  creator_niche: string
  follower_count_range: string
  bio: string
  featured_image_url: string
  portfolio_items: any[]
  subscription_tier: 'free' | 'pro' | 'premium' | 'trial'
  created_at: string
}

interface DealStats {
  totalDeals: number
  activeDeals: number
  wonDeals: number
  totalValue: number
  winRate: number
}

interface ActionItem {
  id: string
  label: string
  completed: boolean
  field: keyof Profile
}

type TabType = 'work' | 'about' | 'pro-features'

// Pro Badge Component
const ProBadge = ({ tier }: { tier: 'pro' | 'premium' | 'trial' }) => {
  const badgeConfig = {
    pro: {
      label: 'Pro',
      gradient: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
      textColor: '#FFFFFF'
    },
    premium: {
      label: 'Premium',
      gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
      textColor: '#FFFFFF'
    },
    trial: {
      label: 'Trial',
      gradient: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
      textColor: '#FFFFFF'
    }
  }

  const config = badgeConfig[tier]

  return (
    <span
      className="px-2.5 py-1 text-xs font-bold inline-flex items-center gap-1"
      style={{
        background: config.gradient,
        color: config.textColor,
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
    >
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      {config.label}
    </span>
  )
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<DealStats>({
    totalDeals: 0,
    activeDeals: 0,
    wonDeals: 0,
    totalValue: 0,
    winRate: 0,
  })
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profileCompletion, setProfileCompletion] = useState(0)
  const [activeTab, setActiveTab] = useState<TabType>('work')
  
  // Portfolio state
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [portfolioItems, setPortfolioItems] = useState<any[]>([])
  const [loadingPortfolio, setLoadingPortfolio] = useState(false)
  
  // Form state
  const [fullName, setFullName] = useState('')
  const [instagramHandle, setInstagramHandle] = useState('')
  const [creatorNiche, setCreatorNiche] = useState('')
  const [followerRange, setFollowerRange] = useState('')
  const [bio, setBio] = useState('')

  const router = useRouter()
  const supabase = supabaseClient()

  const niches = [
    'Food & Beverage',
    'Health & Fitness',
    'Beauty & Personal Care',
    'Fashion & Apparel',
    'Lifestyle',
    'Tech & Gadgets',
    'Other',
  ]

  const followerRanges = [
    '0-10k',
    '10k-50k',
    '50k-100k',
    '100k-500k',
    '500k-1M',
    '1M+',
  ]

  const isPro = profile?.subscription_tier === 'pro' || profile?.subscription_tier === 'premium' || profile?.subscription_tier === 'trial'

  const loadPortfolio = async (userId: string) => {
    setLoadingPortfolio(true)
    const { data, error } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('user_id', userId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error loading portfolio:', error)
    } else {
      setPortfolioItems(data || [])
    }
    setLoadingPortfolio(false)
  }

  const calculateCompletion = (prof: Profile, portfolioCount: number = 0) => {
    let completed = 0
    const total = 10

    if (prof.full_name) completed++
    if (prof.instagram_handle) completed++
    if (prof.creator_niche) completed++
    if (prof.follower_count_range) completed++
    if (prof.bio) completed++
    if (prof.featured_image_url) completed++
    
    if (portfolioCount >= 1) completed++
    if (portfolioCount >= 3) completed++
    if (portfolioCount >= 5) completed++

    return Math.round((completed / total) * 100)
  }

  const getActionItems = (prof: Profile, portfolioCount: number = 0): ActionItem[] => {
    const items: ActionItem[] = []
    
    if (!prof.featured_image_url) {
      items.push({
        id: 'featured_image',
        label: 'Add a profile picture',
        completed: false,
        field: 'featured_image_url',
      })
    }
    
    if (portfolioCount === 0) {
      items.push({
        id: 'portfolio_first',
        label: 'Upload your first portfolio item',
        completed: false,
        field: 'portfolio_items',
      })
    } else if (portfolioCount < 3) {
      items.push({
        id: 'portfolio_3',
        label: `Add ${3 - portfolioCount} more pieces to your portfolio`,
        completed: false,
        field: 'portfolio_items',
      })
    } else if (portfolioCount < 5) {
      items.push({
        id: 'portfolio_5',
        label: `Add ${5 - portfolioCount} more for completionist status`,
        completed: false,
        field: 'portfolio_items',
      })
    }
    
    if (!prof.bio) {
      items.push({
        id: 'bio',
        label: 'Add a profile bio',
        completed: false,
        field: 'bio',
      })
    }
    
    if (!prof.instagram_handle) {
      items.push({
        id: 'instagram',
        label: 'Connect your Instagram',
        completed: false,
        field: 'instagram_handle',
      })
    }
    
    return items
  }

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setFullName(profileData.full_name || '')
        setInstagramHandle(profileData.instagram_handle || '')
        setCreatorNiche(profileData.creator_niche || '')
        setFollowerRange(profileData.follower_count_range || '')
        setBio(profileData.bio || '')
      }

      // Load portfolio
      await loadPortfolio(user.id)

      // Load deal stats
      const { data: deals } = await supabase
        .from('deals')
        .select('status, deal_value')
        .eq('user_id', user.id)

      if (deals) {
        const totalDeals = deals.length
        const activeDeals = deals.filter(d => d.status !== 'delivered').length
        const wonDeals = deals.filter(d => d.status === 'won' || d.status === 'delivered').length
        const totalValue = deals.reduce((sum, d) => sum + (d.deal_value || 0), 0)
        const winRate = totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0

        setStats({ totalDeals, activeDeals, wonDeals, totalValue, winRate })
      }

      // Calculate completion after portfolio loads
      const { data: portfolioData } = await supabase
        .from('portfolio_items')
        .select('id')
        .eq('user_id', user.id)
      
      if (profileData) {
        setProfileCompletion(calculateCompletion(profileData, portfolioData?.length || 0))
      }

      setLoading(false)
    }

    loadProfile()
  }, [router, supabase])

  const handleSave = async () => {
    if (!profile) return

    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        instagram_handle: instagramHandle.replace('@', ''),
        creator_niche: creatorNiche,
        follower_count_range: followerRange,
        bio: bio,
      })
      .eq('id', profile.id)

    if (error) {
      showToast('Error updating profile: ' + error.message, 'error')
    } else {
      showToast('✓ Profile updated successfully!', 'success')
      setEditing(false)
      
      // Reload profile
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.id)
        .single()
      
      if (updatedProfile) {
        setProfile(updatedProfile)
        setProfileCompletion(calculateCompletion(updatedProfile))
      }
    }

    setSaving(false)
  }

  const handleCancel = () => {
    if (profile) {
      setFullName(profile.full_name || '')
      setInstagramHandle(profile.instagram_handle || '')
      setCreatorNiche(profile.creator_niche || '')
      setFollowerRange(profile.follower_count_range || '')
      setBio(profile.bio || '')
    }
    setEditing(false)
  }

  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}/profile/${profile?.id}`
    
    try {
      await navigator.clipboard.writeText(profileUrl)
      showToast('✓ Profile link copied to clipboard!', 'success')
    } catch (err) {
      showToast('Could not copy link', 'error')
    }
  }

  const formatFollowerCount = (range: string) => {
    if (!range) return '0'
    if (range === '1M+') return '1M+'
    return range.replace('k', ',000')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F9FB' }}>
        <div style={{ color: '#5E6370' }}>Loading profile...</div>
      </div>
    )
  }

  const actionItems = profile ? getActionItems(profile, portfolioItems.length) : []
  const incompleteItems = actionItems.filter(item => !item.completed)

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="min-h-screen" 
      style={{ background: '#F8F9FB' }}
    >
      {/* Top Navigation */}
      <nav className="bg-white" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="cursor-pointer">
                <h1 className="text-2xl font-bold" style={{ color: '#0C0F1A', fontFamily: 'var(--font-bricolage), sans-serif' }}>
                  scout
                </h1>
              </Link>
              <div className="hidden md:flex gap-6">
                <Link 
                  href="/dashboard" 
                  className="transition-colors cursor-pointer"
                  style={{ color: '#5E6370' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#0C0F1A'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#5E6370'}
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
            
            <Link 
              href="/dashboard/profile"
              className="cursor-pointer transition-colors"
              style={{ color: '#FD8AE6' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#C77DFF'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#FD8AE6'}
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-7">
          {/* Left Column - Main Content (2/3 width) */}
          <div className="lg:col-span-2 space-y-7">
            {/* Hero Section - Contra Style with Pro Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.05, ease: 'easeOut' }}
              className="bg-white overflow-hidden cursor-default"
              style={{
                borderRadius: '20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                border: '1px solid rgba(0,0,0,0.06)',
                padding: '32px'
              }}
            >
              {/* Top Row: Photo + Info + Actions */}
              <div className="flex items-start gap-6 mb-8">
                {/* Profile Photo Upload */}
                {profile && (
                  <ProfilePictureUpload
                    userId={profile.id}
                    currentImageUrl={profile.featured_image_url}
                    userName={profile.full_name}
                    onUploadComplete={(url) => {
                      setProfile({ ...profile, featured_image_url: url })
                      setProfileCompletion(calculateCompletion({ ...profile, featured_image_url: url }))
                    }}
                  />
                )}

                {/* Info Column */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h1 
                      style={{ 
                        fontSize: '40px',
                        fontWeight: 'bold',
                        color: '#0C0F1A',
                        fontFamily: 'var(--font-bricolage), sans-serif',
                        lineHeight: '1.2'
                      }}
                    >
                      {profile?.full_name || 'Creator Name'}
                    </h1>
                    {isPro && profile && (
                      <ProBadge tier={profile.subscription_tier as 'pro' | 'premium' | 'trial'} />
                    )}
                  </div>
                  <p 
                    className="mb-1"
                    style={{ 
                      fontSize: '18px',
                      color: '#5E6370',
                      fontFamily: 'var(--font-libre), sans-serif'
                    }}
                  >
                    {profile?.creator_niche || 'Content Creator'}
                  </p>
                  <p className="flex items-center gap-1 mb-4" style={{ fontSize: '14px', color: '#9CA3AF' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Crystal Lake, Illinois
                  </p>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleShareProfile}
                      className="px-6 py-3 text-white font-semibold transition-all shadow-md cursor-pointer"
                      style={{
                        background: '#0C0F1A',
                        borderRadius: '9999px',
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
                      <span className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Share Profile
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('about')
                        setEditing(true)
                      }}
                      className="p-3 transition-all cursor-pointer"
                      style={{
                        background: '#F8F9FB',
                        borderRadius: '12px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#E8EBF0'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#F8F9FB'
                      }}
                      title="Edit profile"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#5E6370' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Bar - Contra Style */}
              <div 
                className="grid grid-cols-3 gap-4 pt-6"
                style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
              >
                {[
                  { label: 'Earned', value: `$${stats.totalValue.toLocaleString()}`, color: '#0C0F1A' },
                  { label: 'Collabs', value: stats.wonDeals, color: '#0C0F1A' },
                  { label: 'Followers', value: formatFollowerCount(profile?.follower_count_range || ''), color: '#0C0F1A' }
                ].map((stat, idx) => (
                  <div 
                    key={idx}
                    className="text-center p-4 transition-all cursor-pointer"
                    style={{
                      borderRadius: '12px',
                      background: '#F8F9FB'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#E8EBF0'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#F8F9FB'
                    }}
                  >
                    <div 
                      className="mb-1"
                      style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: stat.color,
                        fontFamily: 'var(--font-bricolage), sans-serif'
                      }}
                    >
                      {stat.value}
                    </div>
                    <div style={{ fontSize: '12px', color: '#5E6370', fontWeight: '500' }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Tab Navigation */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.1, ease: 'easeOut' }}
              className="bg-white"
              style={{
                borderRadius: '20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                border: '1px solid rgba(0,0,0,0.06)'
              }}
            >
              <div className="flex gap-8 px-6" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                {[
                  { 
                    id: 'work' as TabType, 
                    label: 'Work',
                    icon: (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )
                  },
                  { 
                    id: 'about' as TabType, 
                    label: 'About',
                    icon: (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )
                  },
                  ...(isPro ? [{ 
                    id: 'pro-features' as TabType, 
                    label: 'Pro Features',
                    icon: (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    )
                  }] : []),
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="pb-4 pt-6 font-semibold transition-colors relative cursor-pointer flex items-center gap-2"
                    style={{
                      fontSize: '16px',
                      color: activeTab === tab.id ? '#0C0F1A' : '#9CA3AF',
                      fontFamily: 'var(--font-libre), sans-serif'
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== tab.id) {
                        e.currentTarget.style.color = '#5E6370'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== tab.id) {
                        e.currentTarget.style.color = '#9CA3AF'
                      }
                    }}
                  >
                    {tab.icon}
                    {tab.label}
                    {activeTab === tab.id && (
                      <div 
                        className="absolute bottom-0 left-0 right-0"
                        style={{
                          height: '2px',
                          background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)'
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'work' && (
                  <div>
                    {/* Add Work Button */}
                    <div className="flex justify-end mb-6">
                      <button
                        onClick={() => setShowUploadModal(true)}
                        className="px-6 py-3 text-white font-semibold transition-all cursor-pointer inline-flex items-center gap-2"
                        style={{
                          background: '#0C0F1A',
                          borderRadius: '12px',
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
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Work
                      </button>
                    </div>

                    {/* Portfolio Grid */}
                    {loadingPortfolio ? (
                      <div className="text-center py-16">
                        <div className="text-4xl mb-4">⏳</div>
                        <p style={{ color: '#5E6370', fontSize: '15px' }}>
                          Loading your portfolio...
                        </p>
                      </div>
                    ) : (
                      <PortfolioGrid
                        items={portfolioItems}
                        isOwner={true}
                        onUpdate={() => profile && loadPortfolio(profile.id)}
                      />
                    )}
                  </div>
                )}

                {activeTab === 'about' && (
                  <div className="space-y-6">
                    {editing ? (
                      // Edit Mode
                      <div className="space-y-5">
                        <div>
                          <label 
                            className="block mb-2"
                            style={{ fontSize: '14px', fontWeight: '600', color: '#5E6370' }}
                          >
                            Full Name
                          </label>
                          <Input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Your name"
                            className="text-base"
                          />
                        </div>

                        <div>
                          <label 
                            className="block mb-2"
                            style={{ fontSize: '14px', fontWeight: '600', color: '#5E6370' }}
                          >
                            Bio
                          </label>
                          <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us about yourself..."
                            rows={3}
                            className="w-full px-3 py-2 bg-white transition-all"
                            style={{
                              border: '2px solid rgba(0,0,0,0.06)',
                              borderRadius: '12px',
                              color: '#0C0F1A',
                              fontFamily: 'var(--font-libre), sans-serif',
                              fontSize: '15px'
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = '#FD8AE6'
                              e.currentTarget.style.outline = 'none'
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'
                            }}
                          />
                        </div>

                        <div>
                          <label 
                            className="block mb-2"
                            style={{ fontSize: '14px', fontWeight: '600', color: '#5E6370' }}
                          >
                            Instagram Handle
                          </label>
                          <div className="relative">
                            <span 
                              className="absolute left-3 top-1/2"
                              style={{ 
                                transform: 'translateY(-50%)',
                                color: '#9CA3AF'
                              }}
                            >
                              @
                            </span>
                            <Input
                              value={instagramHandle}
                              onChange={(e) => setInstagramHandle(e.target.value)}
                              placeholder="username"
                              className="text-base pl-8"
                            />
                          </div>
                        </div>

                        <div>
                          <label 
                            className="block mb-2"
                            style={{ fontSize: '14px', fontWeight: '600', color: '#5E6370' }}
                          >
                            Creator Niche
                          </label>
                          <select
                            value={creatorNiche}
                            onChange={(e) => setCreatorNiche(e.target.value)}
                            className="w-full px-3 py-2 bg-white font-medium cursor-pointer transition-all"
                            style={{
                              border: '2px solid rgba(0,0,0,0.06)',
                              borderRadius: '12px',
                              color: '#0C0F1A',
                              fontFamily: 'var(--font-libre), sans-serif',
                              fontSize: '15px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = '#FD8AE6'
                              e.currentTarget.style.outline = 'none'
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'
                            }}
                          >
                            <option value="">Select a niche</option>
                            {niches.map(niche => (
                              <option key={niche} value={niche}>{niche}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label 
                            className="block mb-2"
                            style={{ fontSize: '14px', fontWeight: '600', color: '#5E6370' }}
                          >
                            Follower Count
                          </label>
                          <select
                            value={followerRange}
                            onChange={(e) => setFollowerRange(e.target.value)}
                            className="w-full px-3 py-2 bg-white font-medium cursor-pointer transition-all"
                            style={{
                              border: '2px solid rgba(0,0,0,0.06)',
                              borderRadius: '12px',
                              color: '#0C0F1A',
                              fontFamily: 'var(--font-libre), sans-serif',
                              fontSize: '15px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = '#FD8AE6'
                              e.currentTarget.style.outline = 'none'
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'
                            }}
                          >
                            <option value="">Select range</option>
                            {followerRanges.map(range => (
                              <option key={range} value={range}>
                                {formatFollowerCount(range)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 cursor-pointer"
                          >
                            {saving ? 'Saving...' : 'Save Changes'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleCancel}
                            disabled={saving}
                            className="flex-1 cursor-pointer"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="space-y-4">
                        {profile?.bio && (
                          <div 
                            className="p-4"
                            style={{
                              background: '#F8F9FB',
                              borderRadius: '12px'
                            }}
                          >
                            <div 
                              className="mb-2 uppercase tracking-wide"
                              style={{ fontSize: '12px', color: '#5E6370', fontWeight: '500' }}
                            >
                              Bio
                            </div>
                            <div 
                              className="leading-relaxed"
                              style={{ fontSize: '14px', color: '#0C0F1A' }}
                            >
                              {profile.bio}
                            </div>
                          </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-4">
                          {profile?.instagram_handle && (
                            <div 
                              className="p-4"
                              style={{
                                background: '#F8F9FB',
                                borderRadius: '12px'
                              }}
                            >
                              <div 
                                className="mb-2 uppercase tracking-wide"
                                style={{ fontSize: '12px', color: '#5E6370', fontWeight: '500' }}
                              >
                                Instagram
                              </div>
                              <a
                                href={`https://instagram.com/${profile.instagram_handle}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium cursor-pointer inline-flex items-center gap-1 transition-colors"
                                style={{ 
                                  fontSize: '14px',
                                  color: '#FD8AE6'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#C77DFF'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#FD8AE6'}
                              >
                                @{profile.instagram_handle}
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            </div>
                          )}
                          
                          <div 
                            className="p-4"
                            style={{
                              background: '#F8F9FB',
                              borderRadius: '12px'
                            }}
                          >
                            <div 
                              className="mb-2 uppercase tracking-wide"
                              style={{ fontSize: '12px', color: '#5E6370', fontWeight: '500' }}
                            >
                              Niche
                            </div>
                            <div 
                              className="font-semibold"
                              style={{ fontSize: '14px', color: '#0C0F1A' }}
                            >
                              {profile?.creator_niche || 'Not set'}
                            </div>
                          </div>
                          
                          <div 
                            className="p-4"
                            style={{
                              background: '#F8F9FB',
                              borderRadius: '12px'
                            }}
                          >
                            <div 
                              className="mb-2 uppercase tracking-wide"
                              style={{ fontSize: '12px', color: '#5E6370', fontWeight: '500' }}
                            >
                              Followers
                            </div>
                            <div 
                              className="font-semibold"
                              style={{ fontSize: '14px', color: '#0C0F1A' }}
                            >
                              {formatFollowerCount(profile?.follower_count_range || '')}
                            </div>
                          </div>
                          
                          <div 
                            className="p-4"
                            style={{
                              background: '#F8F9FB',
                              borderRadius: '12px'
                            }}
                          >
                            <div 
                              className="mb-2 uppercase tracking-wide"
                              style={{ fontSize: '12px', color: '#5E6370', fontWeight: '500' }}
                            >
                              Email
                            </div>
                            <div 
                              className="font-medium"
                              style={{ fontSize: '14px', color: '#0C0F1A' }}
                            >
                              {profile?.email}
                            </div>
                          </div>
                        </div>

                        {!editing && (
                          <Button
                            onClick={() => setEditing(true)}
                            variant="outline"
                            className="w-full cursor-pointer"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit Profile
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'pro-features' && isPro && (
                  <div className="space-y-6">
                    {/* Pro Status Banner */}
                    <div 
                      className="p-6 rounded-2xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(253,138,230,0.08) 0%, rgba(199,125,255,0.08) 100%)',
                        border: '1px solid rgba(253,138,230,0.2)'
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 
                              className="font-bold"
                              style={{ 
                                fontSize: '20px', 
                                color: '#0C0F1A',
                                fontFamily: 'var(--font-bricolage), sans-serif'
                              }}
                            >
                              You're on Scout Pro
                            </h3>
                            {profile && <ProBadge tier={profile.subscription_tier as 'pro' | 'premium' | 'trial'} />}
                          </div>
                          <p style={{ fontSize: '14px', color: '#5E6370' }}>
                            Unlock unlimited brand access and advanced features
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Pro Features Grid */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        {
                          icon: (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ),
                          title: 'Unlimited Brand Access',
                          description: 'View all 200+ brand contacts without limits',
                          active: true
                        },
                        {
                          icon: (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          ),
                          title: 'CSV Export',
                          description: 'Export brand contacts to CSV for outreach',
                          active: true
                        },
                        {
                          icon: (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          ),
                          title: 'Priority Support',
                          description: 'Get faster responses from our team',
                          active: true
                        },
                        {
                          icon: (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          ),
                          title: 'Advanced Analytics',
                          description: 'Track your pitch success rates and earnings',
                          active: false,
                          comingSoon: true
                        },
                        {
                          icon: (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          ),
                          title: 'Featured in Search',
                          description: 'Stand out when brands browse creators',
                          active: false,
                          comingSoon: true
                        },
                        {
                          icon: (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          ),
                          title: 'Custom Profile URL',
                          description: 'Get a branded profile link (scout.pro/yourname)',
                          active: false,
                          comingSoon: true
                        },
                      ].map((feature, idx) => (
                        <div
                          key={idx}
                          className="p-5 transition-all"
                          style={{
                            background: feature.active ? '#F8F9FB' : 'rgba(248,249,251,0.5)',
                            border: feature.active ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(0,0,0,0.04)',
                            borderRadius: '12px',
                            opacity: feature.active ? 1 : 0.6
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div 
                              className="flex-shrink-0 p-2 rounded-lg"
                              style={{
                                background: feature.active ? 'linear-gradient(135deg, rgba(253,138,230,0.15) 0%, rgba(199,125,255,0.15) 100%)' : 'rgba(0,0,0,0.03)',
                                color: feature.active ? '#FD8AE6' : '#9CA3AF'
                              }}
                            >
                              {feature.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 
                                  className="font-semibold"
                                  style={{ 
                                    fontSize: '14px',
                                    color: feature.active ? '#0C0F1A' : '#5E6370'
                                  }}
                                >
                                  {feature.title}
                                </h4>
                                {feature.comingSoon && (
                                  <span 
                                    className="px-2 py-0.5 text-xs font-semibold"
                                    style={{
                                      background: 'rgba(59,130,246,0.1)',
                                      color: '#3B82F6',
                                      borderRadius: '6px'
                                    }}
                                  >
                                    Soon
                                  </span>
                                )}
                              </div>
                              <p style={{ fontSize: '13px', color: '#5E6370', lineHeight: '1.5' }}>
                                {feature.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Manage Subscription */}
                    <div 
                      className="p-5 rounded-xl"
                      style={{
                        background: '#F8F9FB',
                        border: '1px solid rgba(0,0,0,0.06)'
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 
                            className="font-semibold mb-1"
                            style={{ fontSize: '14px', color: '#0C0F1A' }}
                          >
                            Manage Subscription
                          </h4>
                          <p style={{ fontSize: '13px', color: '#5E6370' }}>
                            View billing details and update your plan
                          </p>
                        </div>
                        <Link href="/dashboard/billing">
                          <button
                            className="px-5 py-2.5 text-sm font-semibold transition-all cursor-pointer"
                            style={{
                              background: '#0C0F1A',
                              color: '#FFFFFF',
                              borderRadius: '9999px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)'
                              e.currentTarget.style.transform = 'translateY(-1px)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#0C0F1A'
                              e.currentTarget.style.transform = 'translateY(0)'
                            }}
                          >
                            Manage
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Sidebar - Action Items */}
          <div className="space-y-7">
            {/* Profile Completion */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.15, ease: 'easeOut' }}
              className="bg-white p-6 sticky top-8"
              style={{
                borderRadius: '20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                border: '1px solid rgba(0,0,0,0.06)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Circular Progress with gradient */}
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="#E8EBF0"
                        strokeWidth="4"
                        fill="none"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="url(#progress-gradient)"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - profileCompletion / 100)}`}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FD8AE6" />
                          <stop offset="100%" stopColor="#C77DFF" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span 
                        className="font-bold"
                        style={{ fontSize: '14px', color: '#0C0F1A' }}
                      >
                        {profileCompletion}%
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 
                      className="font-bold"
                      style={{ fontSize: '16px', color: '#0C0F1A', fontFamily: 'var(--font-bricolage), sans-serif' }}
                    >
                      Get discovered
                    </h3>
                    <p style={{ fontSize: '12px', color: '#9CA3AF' }}>
                      Complete your profile
                    </p>
                  </div>
                </div>
              </div>

              {incompleteItems.length > 0 ? (
                <div className="space-y-2">
                  {incompleteItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 transition-all cursor-pointer group"
                      style={{
                        borderRadius: '12px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F8F9FB'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                      onClick={() => {
                        if (item.field === 'bio' || item.field === 'instagram_handle' || item.field === 'creator_niche' || item.field === 'follower_count_range') {
                          setActiveTab('about')
                          setEditing(true)
                        } else if (item.field === 'featured_image_url') {
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                          showToast('Click on your profile picture to upload!', 'info')
                        } else if (item.field === 'portfolio_items') {
                          setActiveTab('work')
                          setShowUploadModal(true)
                        } else {
                          showToast(`${item.label} - Coming soon!`, 'info')
                        }
                      }}
                    >
                      <div 
                        className="flex-shrink-0 mt-0.5 transition-all"
                        style={{
                          width: '20px',
                          height: '20px',
                          border: '2px solid rgba(0,0,0,0.12)',
                          borderRadius: '4px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#FD8AE6'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'
                        }}
                      />
                      <div className="flex-1">
                        <div 
                          className="transition-colors"
                          style={{ fontSize: '14px', color: '#5E6370' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#0C0F1A'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#5E6370'
                          }}
                        >
                          {item.label}
                        </div>
                      </div>
                      <svg 
                        className="w-4 h-4 flex-shrink-0 transition-colors" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        style={{ color: '#9CA3AF' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#FD8AE6'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#9CA3AF'
                        }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-3xl mb-2">🎉</div>
                  <div 
                    className="font-semibold mb-1"
                    style={{ fontSize: '14px', color: '#0C0F1A' }}
                  >
                    Profile complete!
                  </div>
                  <div style={{ fontSize: '12px', color: '#5E6370' }}>
                    You're all set to land brand deals
                  </div>
                </div>
              )}
            </motion.div>

            {/* Pro Upgrade Card - Only show for free users */}
            {!isPro && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.2, ease: 'easeOut' }}
                className="bg-white p-6"
                style={{
                  borderRadius: '20px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  background: 'linear-gradient(135deg, rgba(253,138,230,0.05) 0%, rgba(199,125,255,0.05) 100%)'
                }}
              >
                <div className="text-center">
                  <div className="text-3xl mb-3">⭐</div>
                  <h3 
                    className="font-bold mb-2"
                    style={{ 
                      fontSize: '16px', 
                      color: '#0C0F1A',
                      fontFamily: 'var(--font-bricolage), sans-serif'
                    }}
                  >
                    Upgrade to Pro
                  </h3>
                  <p className="mb-4" style={{ fontSize: '13px', color: '#5E6370', lineHeight: '1.5' }}>
                    Get unlimited brand access, CSV exports, and priority support
                  </p>
                  <Link href="/pricing">
                    <button
                      className="w-full px-5 py-3 text-sm font-semibold text-white transition-all cursor-pointer"
                      style={{
                        background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                        borderRadius: '9999px',
                        boxShadow: '0 4px 12px rgba(253,138,230,0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(253,138,230,0.4)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(253,138,230,0.3)'
                      }}
                    >
                      Try Pro for $0
                    </button>
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Quick Links */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.25, ease: 'easeOut' }}
              className="bg-white p-6"
              style={{
                borderRadius: '20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                border: '1px solid rgba(0,0,0,0.06)'
              }}
            >
              <h3 
                className="mb-4 uppercase tracking-wide"
                style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  color: '#0C0F1A',
                  fontFamily: 'var(--font-bricolage), sans-serif'
                }}
              >
                Quick Actions
              </h3>
              <div className="space-y-2">
                {[
                  {
                    href: '/dashboard/brands',
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    ),
                    label: 'Browse Brands'
                  },
                  {
                    href: '/dashboard/deals',
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    ),
                    label: 'View Pipeline'
                  },
                  {
                    href: '/dashboard/templates',
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    ),
                    label: 'Email Templates'
                  }
                ].map((link, idx) => (
                  <Link
                    key={idx}
                    href={link.href}
                    className="flex items-center gap-3 p-3 transition-all cursor-pointer group"
                    style={{
                      borderRadius: '12px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F8F9FB'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <div 
                      className="flex items-center justify-center transition-all"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: '#F8F9FB',
                        color: '#5E6370'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)'
                        e.currentTarget.style.color = '#FFFFFF'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#F8F9FB'
                        e.currentTarget.style.color = '#5E6370'
                      }}
                    >
                      {link.icon}
                    </div>
                    <span 
                      className="font-medium"
                      style={{ fontSize: '14px', color: '#0C0F1A' }}
                    >
                      {link.label}
                    </span>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Portfolio Upload Modal */}
      {showUploadModal && profile && (
        <PortfolioUpload
          userId={profile.id}
          onSuccess={async () => {
            setShowUploadModal(false)
            await loadPortfolio(profile.id)
            
            // Recalculate completion
            const { data: portfolioData } = await supabase
              .from('portfolio_items')
              .select('id')
              .eq('user_id', profile.id)
            
            setProfileCompletion(calculateCompletion(profile, portfolioData?.length || 0))
            showToast('✨ Portfolio updated!', 'success')
          }}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </motion.div>
  )
}