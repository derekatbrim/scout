'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabaseClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { showToast } from '@/components/ui/toast'
import { BrandDrawer } from '@/components/brand-drawer'
import { ActivityBadge } from '@/components/activity-badge'
import { HiringBadge } from '@/components/hiring-badge'

interface Brand {
  id: string
  name: string
  category: string
  contact_name: string
  contact_email: string
  website: string
  typical_rate_min: number
  typical_rate_max: number
  response_rate: string
  best_outreach_method: string
  notes: string
  // Activity signals
  activity_status?: 'active' | 'moderate' | 'quiet' | 'unknown'
  activity_score?: number
  hiring_status?: 'hiring' | 'open' | 'closed' | 'unknown'
  last_campaign_date?: string
  last_instagram_collab_date?: string
  has_creator_program?: boolean
}

type SortOption = 'name' | 'rate-low' | 'rate-high' | 'response-rate'
type ActivityFilter = 'all' | 'active' | 'moderate' | 'hiring' | 'recent'

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all')
  const [addingBrandId, setAddingBrandId] = useState<string | null>(null)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [userTier, setUserTier] = useState<'free' | 'pro' | 'premium' | 'trial'>('free')
  const router = useRouter()
  const supabase = supabaseClient()

  useEffect(() => {
  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    
    // Fetch user profile to check subscription tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()
    
    // Determine tier (default to 'free' if not set)
    const tier = profile?.subscription_tier || 'free'
    setUserTier(tier)
    
    loadBrands(tier)
  }
  checkAuth()
}, [router, supabase.auth])

  const loadBrands = async (tier: 'free' | 'pro' | 'premium' | 'trial') => {
    // Determine brand limit based on tier
    const brandLimit = tier === 'free' ? 70 : null // Pro/Premium/Trial = unlimited
    
    let query = supabase
      .from('brands')
      .select('*')
      .order('name')
    
    // Apply limit for free tier
    if (brandLimit) {
      query = query.limit(brandLimit)
    }
    
    const { data, error } = await query

    if (error) {
      console.error('Error loading brands:', error)
    } else {
      setBrands(data || [])
      setFilteredBrands(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    let filtered = brands

    if (searchTerm) {
      filtered = filtered.filter(brand =>
        brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(brand => brand.category === selectedCategory)
    }

    // Activity filtering - NEW
    if (activityFilter !== 'all') {
      if (activityFilter === 'active') {
        filtered = filtered.filter(brand => brand.activity_status === 'active')
      } else if (activityFilter === 'moderate') {
        filtered = filtered.filter(brand => brand.activity_status === 'moderate')
      } else if (activityFilter === 'hiring') {
        filtered = filtered.filter(brand => brand.hiring_status === 'hiring')
      } else if (activityFilter === 'recent') {
        filtered = filtered.filter(brand => {
          if (!brand.last_campaign_date && !brand.last_instagram_collab_date) return false
          const mostRecentDate = brand.last_campaign_date || brand.last_instagram_collab_date
          if (!mostRecentDate) return false
          const daysSince = Math.floor(
            (new Date().getTime() - new Date(mostRecentDate).getTime()) / (1000 * 60 * 60 * 24)
          )
          return daysSince <= 30
        })
      }
    }

    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'rate-low':
          return (a.typical_rate_min || 0) - (b.typical_rate_min || 0)
        case 'rate-high':
          return (b.typical_rate_max || 0) - (a.typical_rate_max || 0)
        case 'response-rate':
          const rateOrder = { 'High': 3, 'Medium': 2, 'Low': 1 }
          return (rateOrder[b.response_rate as keyof typeof rateOrder] || 0) - 
                 (rateOrder[a.response_rate as keyof typeof rateOrder] || 0)
        default:
          return 0
      }
    })

    setFilteredBrands(filtered)
  }, [searchTerm, selectedCategory, sortBy, activityFilter, brands])

  const addToPipeline = async (brand: Brand) => {
    setAddingBrandId(brand.id)
    
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase.from('deals').insert({
      user_id: user?.id,
      brand_id: brand.id,
      brand_name: brand.name,
      deal_value: brand.typical_rate_min || null,
      status: 'prospect',
      notes: `Contact: ${brand.contact_email || 'N/A'}\nBest method: ${brand.best_outreach_method || 'Email'}`
    })

    if (error) {
      showToast('Error adding to pipeline: ' + error.message, 'error')
      setAddingBrandId(null)
    } else {
      showToast(`✓ ${brand.name} added to your pipeline!`, 'success')
      setTimeout(() => setAddingBrandId(null), 1500)
    }
  }

  const getBrandInitials = (brandName: string) => {
    return brandName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getCategoryGradient = (category: string) => {
    const lowerCat = category?.toLowerCase() || ''
    if (lowerCat.includes('food') || lowerCat.includes('beverage')) {
      return 'linear-gradient(135deg, rgba(251,146,60,0.04) 0%, rgba(251,146,60,0.02) 100%)'
    }
    if (lowerCat.includes('health') || lowerCat.includes('fitness')) {
      return 'linear-gradient(135deg, rgba(34,197,94,0.04) 0%, rgba(34,197,94,0.02) 100%)'
    }
    if (lowerCat.includes('beauty') || lowerCat.includes('personal care')) {
      return 'linear-gradient(135deg, rgba(253,138,230,0.04) 0%, rgba(253,138,230,0.02) 100%)'
    }
    return 'linear-gradient(135deg, rgba(100,116,139,0.04) 0%, rgba(100,116,139,0.02) 100%)'
  }

  const getCategoryAvatarColor = (category: string) => {
    const lowerCat = category?.toLowerCase() || ''
    if (lowerCat.includes('food') || lowerCat.includes('beverage')) return 'bg-orange-500'
    if (lowerCat.includes('health') || lowerCat.includes('fitness')) return 'bg-green-500'
    if (lowerCat.includes('beauty') || lowerCat.includes('personal care')) return 'bg-pink-500'
    return 'bg-slate-700'
  }

  const getBrandDescription = (brand: Brand) => {
    if (!brand.notes) return 'Brand partnership opportunity'
    const firstSentence = brand.notes.split('.')[0].trim()
    if (firstSentence.length > 80) {
      return firstSentence.substring(0, 77) + '...'
    }
    return firstSentence
  }

  const categories = ['all', ...new Set(brands.map(b => b.category).filter(Boolean))]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F9FB' }}>
        <div style={{ color: '#5E6370' }}>Loading brands...</div>
      </div>
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
      {/* Navigation */}
      <nav className="bg-white sticky top-0 z-40" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.95)' }}>
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="cursor-pointer">
                <h1 className="text-2xl font-bold" style={{ color: '#0C0F1A', fontFamily: 'var(--font-bricolage), sans-serif' }}>scout</h1>
              </Link>
              <div className="hidden md:flex gap-6">
                <Link href="/dashboard" className="font-medium transition-colors" style={{ color: '#5E6370' }}>
                  Dashboard
                </Link>
                <Link href="/dashboard/brands" className="font-semibold" style={{ color: '#FD8AE6', borderBottom: '2px solid #FD8AE6', paddingBottom: '2px' }}>
                  Brands
                </Link>
                <Link href="/dashboard/deals" className="font-medium transition-colors" style={{ color: '#5E6370' }}>
                  Pipeline
                </Link>
              </div>
            </div>
            
            <Link href="/dashboard/profile" className="transition-colors" style={{ color: '#5E6370' }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <h2 className="text-4xl font-bold mb-3" style={{ color: '#0C0F1A', fontFamily: 'var(--font-bricolage), sans-serif' }}>
            Brand Database
          </h2>
          <p className="text-lg" style={{ color: '#5E6370' }}>
            Discover and connect with {brands.length} brands in your niche
          </p>
        </div>

        {/* Search Container */}
        <div className="bg-white mb-8 overflow-hidden" style={{ borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' }}>
          {/* Search Bar */}
          <div className="p-6" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5" style={{ color: '#9CA3AF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search brands by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-base focus:outline-none transition-all"
                style={{
                  background: '#F8F9FB',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: '12px',
                  color: '#0C0F1A',
                  fontFamily: 'var(--font-libre), sans-serif'
                }}
                onFocus={(e) => {
                  e.target.style.background = '#FFFFFF'
                  e.target.style.borderColor = 'rgba(253,138,230,0.5)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(253,138,230,0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.background = '#F8F9FB'
                  e.target.style.borderColor = 'rgba(0,0,0,0.06)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
          </div>

          {/* Category Filters - Enhanced with Contra-style effects */}
          <div 
            className="px-8 py-6 scrollbar-hide overflow-x-auto relative" 
            style={{ 
              borderBottom: '1px solid rgba(0,0,0,0.06)',
              maskImage: 'linear-gradient(to right, black calc(100% - 80px), transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, black calc(100% - 80px), transparent 100%)'
            }}
          >
            <div className="flex items-center gap-3">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className="px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-all"
                  style={{
                    borderRadius: '9999px',
                    background: selectedCategory === cat ? '#0C0F1A' : '#F8F9FB',
                    color: selectedCategory === cat ? '#FFFFFF' : '#0C0F1A',
                    boxShadow: selectedCategory === cat ? '0 2px 8px rgba(0,0,0,0.08)' : '0 1px 2px rgba(0,0,0,0.04)',
                    border: selectedCategory === cat ? 'none' : '1px solid rgba(0,0,0,0.06)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-libre), sans-serif'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCategory !== cat) {
                      e.currentTarget.style.background = '#FFFFFF'
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCategory !== cat) {
                      e.currentTarget.style.background = '#F8F9FB'
                      e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'
                    }
                  }}
                >
                  {cat === 'all' ? 'All Brands' : cat}
                </button>
              ))}
            </div>
            
            {/* Fade gradient indicator on right */}
            <div 
              className="absolute right-0 top-0 bottom-0 w-20 pointer-events-none"
              style={{
                background: 'linear-gradient(to left, rgba(248,249,251,1) 0%, transparent 100%)'
              }}
            />
          </div>

          {/* Results Row with Tier Badge */}
          <div className="px-6 py-3.5" style={{ background: 'rgba(248,249,251,0.8)', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm" style={{ color: '#5E6370', fontFamily: 'var(--font-libre), sans-serif' }}>
                  <span className="font-semibold" style={{ color: '#0C0F1A' }}>{filteredBrands.length}</span> {filteredBrands.length === 1 ? 'brand' : 'brands'}
                </span>
                {userTier === 'free' && brands.length >= 70 && (
                  <>
                    <span style={{ color: '#D1D5DB' }}>·</span>
                    <span 
                      className="px-2 py-0.5 text-xs font-semibold"
                      style={{
                        background: 'rgba(251,146,60,0.08)',
                        color: '#c05621',
                        borderRadius: '6px',
                        border: '1px solid rgba(251,146,60,0.2)'
                      }}
                    >
                      Free tier limit
                    </span>
                    <Link 
                      href="/pricing"
                      className="text-xs font-semibold transition-colors"
                      style={{ color: '#FD8AE6' }}
                    >
                      Unlock all →
                    </Link>
                  </>
                )}
                {(searchTerm || selectedCategory !== 'all' || activityFilter !== 'all') && (
                  <>
                    <span style={{ color: '#D1D5DB' }}>·</span>
                    <button
                      onClick={() => { 
                        setSearchTerm('')
                        setSelectedCategory('all')
                        setActivityFilter('all')
                      }}
                      className="text-sm font-medium transition-colors"
                      style={{ color: '#FD8AE6', cursor: 'pointer', fontFamily: 'var(--font-libre), sans-serif' }}
                    >
                      Clear filters
                    </button>
                  </>
                )}
              </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: '#5E6370' }}>Activity:</span>
                <select
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value as ActivityFilter)}
                  className="px-3 py-1.5 text-sm font-medium transition-all focus:outline-none"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(0,0,0,0.06)',
                    borderRadius: '8px',
                    color: '#0C0F1A',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-libre), sans-serif'
                  }}
                >
                  <option value="all">All brands</option>
                  <option value="active">Active campaigns</option>
                  <option value="moderate">Moderate activity</option>
                  <option value="hiring">Hiring now</option>
                  <option value="recent">Recent (30d)</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: '#5E6370' }}>Sort:</span>
                <select
                  value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-1.5 text-sm font-medium transition-all focus:outline-none"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: '8px',
                  color: '#0C0F1A',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-libre), sans-serif'
                }}
              >
                <option value="name">Name</option>
                <option value="rate-low">Rate: Low to High</option>
                <option value="rate-high">Rate: High to Low</option>
                <option value="response-rate">Response Rate</option>
              </select>
            </div>
          </div>
          </div>
        </div>

        {/* Upgrade CTA for Free Users */}
        {userTier === 'free' && brands.length >= 70 && filteredBrands.length > 0 && (
          <motion.div
            className="mx-auto max-w-2xl mb-6 p-5 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(253,138,230,0.04) 0%, rgba(199,125,255,0.04) 100%)',
              border: '1px solid rgba(253,138,230,0.12)',
              borderRadius: '16px'
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-3">
              <svg 
                width="28" 
                height="28" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: '#FD8AE6', margin: '0 auto' }}
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 
              className="mb-1.5"
              style={{ 
                fontSize: '1.125rem', 
                fontWeight: 600, 
                color: '#0C0F1A',
                fontFamily: 'var(--font-bricolage), sans-serif'
              }}
            >
              You're viewing 70 of 200+ brands
            </h3>
            <p 
              className="mb-4 text-sm"
              style={{ 
                color: '#5E6370',
                fontFamily: 'var(--font-libre), sans-serif'
              }}
            >
              Upgrade to unlock the full database with activity signals, hiring indicators, and verified contacts
            </p>
            <Link href="/pricing">
              <button
                className="px-5 py-2.5 text-sm font-semibold rounded-lg transition-all"
                style={{
                  background: '#0C0F1A',
                  color: '#FFFFFF',
                  borderRadius: '10px',
                  cursor: 'pointer'
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
                Upgrade to Pro
              </button>
            </Link>
          </motion.div>
        )}

        {/* Brands Grid */}
        {filteredBrands.length === 0 ? (
          <div className="bg-white p-16 text-center" style={{ borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold mb-2" style={{ color: '#0C0F1A', fontFamily: 'var(--font-bricolage), sans-serif' }}>No brands found</h3>
            <p className="mb-4" style={{ color: '#5E6370' }}>Try adjusting your search or filters</p>
            <Button variant="outline" onClick={() => { setSearchTerm(''); setSelectedCategory('all'); setActivityFilter('all') }}>
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredBrands.map((brand, index) => {
              const categoryGradient = getCategoryGradient(brand.category)
              const avatarColor = getCategoryAvatarColor(brand.category)
              const description = getBrandDescription(brand)
              
              return (
                <motion.div
                  key={brand.id}
                  className="bg-white overflow-hidden cursor-pointer group"
                  style={{
                    borderRadius: '14px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    transition: 'all 0.15s ease-out'
                  }}
                  onClick={() => setSelectedBrand(brand)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
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
                  {/* Header with Gradient */}
                  <div className="px-6 pt-6 pb-4" style={{ background: categoryGradient }}>
                    {/* Signals Row */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {/* Activity Badge - NEW */}
                      {brand.activity_status && brand.activity_status !== 'unknown' && (
                        <ActivityBadge 
                          status={brand.activity_status}
                          compact
                        />
                      )}
                      
                      {/* Hiring Badge - NEW */}
                      {brand.hiring_status && brand.hiring_status !== 'unknown' && brand.hiring_status !== 'closed' && (
                        <HiringBadge status={brand.hiring_status} />
                      )}
                      
                      {/* High Response Badge - EXISTING */}
                      {brand.response_rate === 'High' && (
                        <span 
                          className="px-2.5 py-1 text-xs font-bold"
                          style={{
                            background: 'rgba(34,197,94,0.08)',
                            color: '#166534',
                            borderRadius: '8px',
                            border: '1px solid rgba(34,197,94,0.1)'
                          }}
                        >
                          High Response
                        </span>
                      )}
                      
                      {/* Rate Badge - EXISTING */}
                      {brand.typical_rate_min && brand.typical_rate_max && (brand.typical_rate_max / brand.typical_rate_min > 4) && (
                        <span 
                          className="px-2.5 py-1 text-xs font-bold text-white" 
                          style={{ background: '#0C0F1A', borderRadius: '8px' }}
                        >
                          Starting at ${brand.typical_rate_min.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Brand Info */}
                    <div className="flex items-start gap-3">
                      <div className={`w-14 h-14 flex-shrink-0 flex items-center justify-center text-white text-lg font-bold ${avatarColor}`} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        {getBrandInitials(brand.name)}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <h3 className="text-lg font-bold mb-1" style={{ color: '#0C0F1A', fontFamily: 'var(--font-bricolage), sans-serif', lineHeight: '1.3' }}>
                          {brand.name}
                        </h3>
                        {brand.category && (
                          <p className="text-xs font-medium mb-2" style={{ color: '#5E6370' }}>
                            {brand.category}
                          </p>
                        )}
                        <p className="text-xs line-clamp-1" style={{ color: '#5E6370', lineHeight: '1.5' }}>
                          {description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}></div>

                  {/* Card Body */}
                  <div className="px-6 py-4">
                    {brand.typical_rate_min && brand.typical_rate_max && (
                      <div className="mb-3">
                        <div className="text-xs font-medium mb-1" style={{ color: '#5E6370' }}>Typical rate</div>
                        <div className="text-lg font-bold" style={{ color: '#0C0F1A', fontFamily: 'var(--font-bricolage), sans-serif' }}>
                          ${brand.typical_rate_min.toLocaleString()} — ${brand.typical_rate_max.toLocaleString()}
                        </div>
                      </div>
                    )}

                    {/* Chips */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {brand.response_rate && (
                        <span className={`px-2 py-1 text-xs font-medium ${
                          brand.response_rate === 'High' ? 'bg-green-50 text-green-700' :
                          brand.response_rate === 'Medium' ? 'bg-yellow-50 text-yellow-700' :
                          'bg-slate-100 text-slate-600'
                        }`} style={{ borderRadius: '6px' }}>
                          {brand.response_rate} response
                        </span>
                      )}
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        addToPipeline(brand)
                      }}
                      disabled={addingBrandId === brand.id}
                      className="w-full px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-all"
                      style={{
                        background: '#0C0F1A',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        cursor: addingBrandId === brand.id ? 'not-allowed' : 'pointer',
                        fontFamily: 'var(--font-libre), sans-serif'
                      }}
                      onMouseEnter={(e) => {
                        if (addingBrandId !== brand.id) {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)'
                          e.currentTarget.style.transform = 'translateY(-1px)'
                          e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.06)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (addingBrandId !== brand.id) {
                          e.currentTarget.style.background = '#0C0F1A'
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
                        }
                      }}
                    >
                      {addingBrandId === brand.id ? '✓ Added to Pipeline!' : '+ Add to Pipeline'}
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Brand Drawer */}
      <BrandDrawer
        brand={selectedBrand!}
        isOpen={!!selectedBrand}
        onClose={() => setSelectedBrand(null)}
        onAddToPipeline={addToPipeline}
        isAdding={addingBrandId === selectedBrand?.id}
      />
    </motion.div>
  )
}