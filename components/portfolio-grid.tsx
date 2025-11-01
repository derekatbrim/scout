'use client'

import { useState } from 'react'
import { supabaseClient } from '@/lib/supabase'
import { showToast } from '@/components/ui/toast'

interface PortfolioItem {
  id: string
  media_url: string
  media_type: 'image' | 'video'
  platform?: string
  post_type?: string
  brand_name?: string
  description?: string
  post_url?: string
  metrics?: {
    views?: number
    likes?: number
    comments?: number
    engagement_rate?: string
  }
  posted_at?: string
  is_featured: boolean
  display_order: number
  created_at: string
}

interface PortfolioGridProps {
  items: PortfolioItem[]
  isOwner: boolean
  onUpdate: () => void
}

export function PortfolioGrid({ items, isOwner, onUpdate }: PortfolioGridProps) {
  const supabase = supabaseClient()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const getPlatformIcon = (platform?: string) => {
    switch (platform) {
      case 'instagram':
        return '📸'
      case 'tiktok':
        return '🎵'
      case 'youtube':
        return '📺'
      default:
        return '🌐'
    }
  }

  const formatMetric = (num?: number): string => {
    if (!num) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const toggleFeatured = async (item: PortfolioItem) => {
    const { error } = await supabase
      .from('portfolio_items')
      .update({ is_featured: !item.is_featured })
      .eq('id', item.id)

    if (error) {
      showToast('Failed to update featured status', 'error')
    } else {
      showToast(item.is_featured ? 'Removed from featured' : '⭐ Added to featured!', 'success')
      onUpdate()
    }
  }

  const deleteItem = async (itemId: string) => {
    if (!confirm('Delete this portfolio item? This cannot be undone.')) return

    setDeleting(itemId)

    try {
      const { error } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      showToast('✓ Portfolio item deleted', 'success')
      onUpdate()
    } catch (error: any) {
      showToast(error.message || 'Failed to delete', 'error')
    } finally {
      setDeleting(null)
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🎨</div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">
          {isOwner ? 'Showcase your best work' : 'No work uploaded yet'}
        </h3>
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          {isOwner
            ? 'Upload brand collaborations, sponsored content, and your best-performing posts to show brands what you can do.'
            : 'This creator hasn\'t added any portfolio items yet.'}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <div
          key={item.id}
          className="group relative bg-white rounded-2xl shadow-sm border-2 border-slate-200 overflow-hidden transition-all cursor-pointer"
          style={{
            ...(item.is_featured && {
              borderColor: 'rgba(253,138,230,0.5)',
              background: 'linear-gradient(135deg, rgba(253,138,230,0.03) 0%, rgba(199,125,255,0.03) 100%)',
            }),
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)'
          }}
          onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
        >
          {/* Featured Badge */}
          {item.is_featured && (
            <div
              className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full text-xs font-bold text-white"
              style={{
                background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Featured
            </div>
          )}

          {/* Media */}
          <div className="relative aspect-square bg-slate-100">
            {item.media_type === 'video' ? (
              <video
                src={item.media_url}
                className="w-full h-full object-cover"
                muted
                loop
                playsInline
                onMouseEnter={(e) => e.currentTarget.play()}
                onMouseLeave={(e) => {
                  e.currentTarget.pause()
                  e.currentTarget.currentTime = 0
                }}
              />
            ) : (
              <img
                src={item.media_url}
                alt={item.brand_name || 'Portfolio item'}
                className="w-full h-full object-cover"
              />
            )}

            {/* Hover Overlay with Actions (Owner Only) */}
            {isOwner && (
              <div
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => toggleFeatured(item)}
                  className="p-3 bg-white rounded-full hover:scale-110 transition-transform"
                  title={item.is_featured ? 'Remove from featured' : 'Add to featured'}
                >
                  {item.is_featured ? (
                    <svg className="w-5 h-5 text-[#fd8ae6]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={() => deleteItem(item.id)}
                  disabled={deleting === item.id}
                  className="p-3 bg-white rounded-full hover:scale-110 transition-transform disabled:opacity-50"
                  title="Delete"
                >
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}

            {/* Platform Badge */}
            {item.platform && (
              <div className="absolute bottom-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1">
                <span>{getPlatformIcon(item.platform)}</span>
                <span className="capitalize">{item.platform}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-4">
            {/* Brand Name */}
            {item.brand_name && (
              <div className="text-base font-bold text-slate-900 mb-1">
                {item.brand_name}
              </div>
            )}

            {/* Description */}
            {item.description && (
              <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                {item.description}
              </p>
            )}

            {/* Metrics Row */}
            {item.metrics && (
              <div className="flex items-center gap-4 text-xs text-slate-500">
                {item.metrics.views && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{formatMetric(item.metrics.views)}</span>
                  </div>
                )}
                {item.metrics.likes && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>{formatMetric(item.metrics.likes)}</span>
                  </div>
                )}
                {item.metrics.engagement_rate && (
                  <div className="flex items-center gap-1 font-semibold text-green-600">
                    <span>{item.metrics.engagement_rate}%</span>
                  </div>
                )}
              </div>
            )}

            {/* Post URL Link */}
            {item.post_url && (
              <a
                href={item.post_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#fd8ae6] hover:text-[#fc6fdf] font-medium mt-3"
                onClick={(e) => e.stopPropagation()}
              >
                View original post
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
