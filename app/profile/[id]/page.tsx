'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface Profile {
  id: string
  email: string
  full_name: string
  instagram_handle: string
  creator_niche: string
  follower_count_range: string
  bio: string
  featured_image_url: string
  created_at: string
}

interface PortfolioItem {
  id: string
  title: string
  description: string
  image_url: string
  external_link: string
  display_order: number
}

interface DealStats {
  wonDeals: number
  totalValue: number
}

export default function PublicProfilePage() {
  const params = useParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([])
  const [stats, setStats] = useState<DealStats>({ wonDeals: 0, totalValue: 0 })
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const loadPublicProfile = async () => {
      const userId = params.id as string

      if (!userId) {
        setNotFound(true)
        setLoading(false)
        return
      }

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError || !profileData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setProfile(profileData)

      // Load portfolio items
      const { data: portfolio } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('user_id', userId)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })

      setPortfolioItems(portfolio || [])

      // Load public stats (only won/delivered deals)
      const { data: deals } = await supabase
        .from('deals')
        .select('status, deal_value')
        .eq('user_id', userId)
        .in('status', ['won', 'delivered'])

      if (deals) {
        const wonDeals = deals.length
        const totalValue = deals.reduce((sum, d) => sum + (d.deal_value || 0), 0)
        setStats({ wonDeals, totalValue })
      }

      setLoading(false)
    }

    loadPublicProfile()
  }, [params.id, supabase])

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

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#F8F9FB' }}>
        <div className="text-6xl mb-4">😕</div>
        <h1 
          className="mb-2"
          style={{ 
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#0C0F1A',
            fontFamily: 'var(--font-bricolage), sans-serif'
          }}
        >
          Profile not found
        </h1>
        <p style={{ fontSize: '15px', color: '#5E6370', marginBottom: '24px' }}>
          This creator profile doesn't exist or has been removed.
        </p>
        <Link
          href="/"
          className="px-6 py-3 text-white font-semibold transition-all cursor-pointer"
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
          Go to Scout
        </Link>
      </div>
    )
  }

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
            <Link href="/" className="cursor-pointer">
              <h1 className="text-2xl font-bold" style={{ color: '#0C0F1A', fontFamily: 'var(--font-bricolage), sans-serif' }}>
                scout
              </h1>
            </Link>
            
            <Link
              href="/login"
              className="px-6 py-2 text-white font-semibold transition-all cursor-pointer"
              style={{
                background: '#0C0F1A',
                borderRadius: '9999px',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#0C0F1A'
              }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05, ease: 'easeOut' }}
          className="bg-white overflow-hidden cursor-default mb-8"
          style={{
            borderRadius: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.06)',
            padding: '48px'
          }}
        >
          <div className="flex flex-col md:flex-row items-start gap-8 mb-8">
            {/* Profile Photo */}
            <div className="flex-shrink-0">
              {profile.featured_image_url ? (
                <img
                  src={profile.featured_image_url}
                  alt={profile.full_name}
                  className="object-cover"
                  style={{
                    width: '160px',
                    height: '160px',
                    borderRadius: '20px',
                    border: '4px solid #F8F9FB'
                  }}
                />
              ) : (
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: '160px',
                    height: '160px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                    color: '#FFFFFF',
                    fontSize: '48px',
                    fontWeight: 'bold'
                  }}
                >
                  {profile.full_name?.charAt(0).toUpperCase() || 'C'}
                </div>
              )}
            </div>

            {/* Info Column */}
            <div className="flex-1">
              <h1 
                className="mb-3"
                style={{ 
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: '#0C0F1A',
                  fontFamily: 'var(--font-bricolage), sans-serif',
                  lineHeight: '1.1'
                }}
              >
                {profile.full_name}
              </h1>
              <p 
                className="mb-2"
                style={{ 
                  fontSize: '20px',
                  color: '#5E6370',
                  fontFamily: 'var(--font-libre), sans-serif'
                }}
              >
                {profile.creator_niche || 'Content Creator'}
              </p>
              <p className="flex items-center gap-2 mb-6" style={{ fontSize: '15px', color: '#9CA3AF' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Crystal Lake, Illinois
              </p>

              {profile.bio && (
                <p 
                  className="leading-relaxed mb-6"
                  style={{ fontSize: '16px', color: '#5E6370', maxWidth: '600px' }}
                >
                  {profile.bio}
                </p>
              )}

              {profile.instagram_handle && (
                <a
                  href={`https://instagram.com/${profile.instagram_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 font-semibold transition-all cursor-pointer"
                  style={{
                    background: '#0C0F1A',
                    color: '#FFFFFF',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    fontSize: '15px'
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
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  @{profile.instagram_handle}
                </a>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div 
            className="grid grid-cols-3 gap-4 pt-8"
            style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
          >
            {[
              { label: 'Earned', value: `$${stats.totalValue.toLocaleString()}`, color: '#0C0F1A' },
              { label: 'Collabs', value: stats.wonDeals, color: '#0C0F1A' },
              { label: 'Followers', value: formatFollowerCount(profile.follower_count_range || ''), color: '#0C0F1A' }
            ].map((stat, idx) => (
              <div 
                key={idx}
                className="text-center p-4"
                style={{
                  borderRadius: '12px',
                  background: '#F8F9FB'
                }}
              >
                <div 
                  className="mb-1"
                  style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: stat.color,
                    fontFamily: 'var(--font-bricolage), sans-serif'
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: '13px', color: '#5E6370', fontWeight: '500' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Portfolio Section */}
        {portfolioItems.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.1, ease: 'easeOut' }}
            className="bg-white p-8"
            style={{
              borderRadius: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.06)'
            }}
          >
            <h2 
              className="mb-6"
              style={{ 
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#0C0F1A',
                fontFamily: 'var(--font-bricolage), sans-serif'
              }}
            >
              Portfolio
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolioItems.map((item) => (
                <div
                  key={item.id}
                  className="group cursor-pointer overflow-hidden transition-all"
                  style={{
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                    border: '1px solid rgba(0,0,0,0.06)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)'
                    e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.06)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)'
                  }}
                  onClick={() => {
                    if (item.external_link) {
                      window.open(item.external_link, '_blank')
                    }
                  }}
                >
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full object-cover"
                      style={{ height: '240px' }}
                    />
                  )}
                  <div className="p-4">
                    <h3 
                      className="font-semibold mb-1"
                      style={{ fontSize: '16px', color: '#0C0F1A' }}
                    >
                      {item.title}
                    </h3>
                    {item.description && (
                      <p 
                        className="line-clamp-2"
                        style={{ fontSize: '14px', color: '#5E6370' }}
                      >
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.15, ease: 'easeOut' }}
          className="mt-8 text-center py-12"
        >
          <h3 
            className="mb-3"
            style={{ 
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#0C0F1A',
              fontFamily: 'var(--font-bricolage), sans-serif'
            }}
          >
            Want your own creator profile?
          </h3>
          <p className="mb-6" style={{ fontSize: '16px', color: '#5E6370' }}>
            Join Scout to showcase your work and connect with brands.
          </p>
          <Link
            href="/signup"
            className="inline-flex px-8 py-4 text-white font-semibold transition-all cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(253,138,230,0.25)',
              fontSize: '16px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(253,138,230,0.35)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(253,138,230,0.25)'
            }}
          >
            Get Started Free
          </Link>
        </motion.div>
      </div>

      {/* Footer */}
      <footer 
        className="border-t mt-16 py-8"
        style={{ 
          borderColor: 'rgba(0,0,0,0.06)',
          background: '#FFFFFF'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p style={{ fontSize: '14px', color: '#9CA3AF' }}>
            © 2024 Scout. Powering the creator economy.
          </p>
        </div>
      </footer>
    </motion.div>
  )
}
