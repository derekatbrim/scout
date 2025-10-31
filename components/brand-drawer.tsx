'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { BrandReviews } from './brand-reviews'
import { supabaseClient } from '@/lib/supabase'

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
}

interface BrandDrawerProps {
  brand: Brand
  isOpen: boolean
  onClose: () => void
  onAddToPipeline: (brand: Brand) => void
  isAdding?: boolean
}

export function BrandDrawer({ brand, isOpen, onClose, onAddToPipeline, isAdding }: BrandDrawerProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [user, setUser] = useState<any>(null)
  const supabase = supabaseClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const getBrandInitials = (brandName: string) => {
    return brandName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getCategoryColor = (category: string) => {
    const lowerCat = category?.toLowerCase() || ''
    if (lowerCat.includes('food') || lowerCat.includes('beverage')) return 'bg-orange-500'
    if (lowerCat.includes('health') || lowerCat.includes('fitness')) return 'bg-green-500'
    if (lowerCat.includes('beauty') || lowerCat.includes('personal care')) return 'bg-pink-500'
    return 'bg-slate-700'
  }

  const getMicroChips = (brand: Brand) => {
    const chips: string[] = []
    if (brand.response_rate) chips.push(`${brand.response_rate} response`)
    if (brand.best_outreach_method) chips.push(brand.best_outreach_method)
    return chips
  }

  const microChips = getMicroChips(brand)

  // Mobile: Full-screen modal
  if (isMobile) {
    return (
      <div 
        className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fadeIn"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      >
        <div 
          className="bg-white w-full sm:max-w-2xl overflow-hidden animate-slideUp max-h-[95vh] overflow-y-auto"
          style={{ 
            borderTopLeftRadius: '24px', 
            borderTopRightRadius: '24px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
          }}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white px-6 py-5 flex items-start justify-between z-10" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <div className="flex items-start gap-4">
              <div className={`w-16 h-16 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 ${getCategoryColor(brand.category)}`} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                {getBrandInitials(brand.name)}
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1" style={{ color: '#0C0F1A', fontFamily: 'var(--font-bricolage), sans-serif' }}>
                  {brand.name}
                </h2>
                {brand.category && (
                  <span className="inline-block px-3 py-1 text-sm font-medium" style={{ background: '#F8F9FB', color: '#5E6370', borderRadius: '8px' }}>
                    {brand.category}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 transition-colors"
              style={{ borderRadius: '8px', cursor: 'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F8F9FB'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <svg className="w-6 h-6" style={{ color: '#5E6370' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* CTA Button */}
            <button
              onClick={() => onAddToPipeline(brand)}
              disabled={isAdding}
              className="w-full px-6 py-3.5 text-white font-semibold text-base disabled:opacity-50 transition-all"
              style={{
                background: '#0C0F1A',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                cursor: isAdding ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-libre), sans-serif'
              }}
              onMouseEnter={(e) => {
                if (!isAdding) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.06)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isAdding) {
                  e.currentTarget.style.background = '#0C0F1A'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
                }
              }}
            >
              {isAdding ? '✓ Added to Pipeline!' : 'Add to Pipeline'}
            </button>

            {/* Rate Display */}
            {brand.typical_rate_min && brand.typical_rate_max && (
              <div className="p-5" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(16,185,129,0.08) 100%)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '12px' }}>
                <div className="text-sm font-medium mb-2" style={{ color: '#15803d' }}>Typical Rate</div>
                <div className="text-3xl font-bold" style={{ color: '#15803d', fontFamily: 'var(--font-bricolage), sans-serif' }}>
                  ${brand.typical_rate_min.toLocaleString()} — ${brand.typical_rate_max.toLocaleString()}
                </div>
              </div>
            )}

            {/* Chips */}
            {microChips.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {microChips.map((chip, idx) => (
                  <span key={idx} className="px-3 py-1.5 text-sm font-medium" style={{ background: '#F8F9FB', color: '#5E6370', borderRadius: '8px' }}>
                    {chip}
                  </span>
                ))}
              </div>
            )}

            {/* About */}
            {brand.notes && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#0C0F1A' }}>About</h3>
                <p className="leading-relaxed" style={{ color: '#5E6370', fontFamily: 'var(--font-libre), sans-serif' }}>{brand.notes}</p>
              </div>
            )}

            {/* Contact Info */}
            {(brand.contact_email || brand.website) && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#0C0F1A' }}>Contact</h3>
                <div className="space-y-2">
                  {brand.contact_email && (
                    <a
                      href={`mailto:${brand.contact_email}`}
                      className="flex items-center gap-3 p-3 group transition-colors"
                      style={{ background: '#F8F9FB', borderRadius: '8px', cursor: 'pointer' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#F8F9FB'}
                    >
                      <svg className="w-5 h-5 transition-colors" style={{ color: '#5E6370' }} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                      </svg>
                      <div>
                        <div className="text-xs" style={{ color: '#9CA3AF' }}>Email</div>
                        <div className="font-medium" style={{ color: '#FD8AE6' }}>{brand.contact_email}</div>
                      </div>
                    </a>
                  )}
                  {brand.website && (
                    <a
                      href={brand.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 group transition-colors"
                      style={{ background: '#F8F9FB', borderRadius: '8px', cursor: 'pointer' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#F8F9FB'}
                    >
                      <svg className="w-5 h-5" style={{ color: '#5E6370' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd"/>
                      </svg>
                      <div className="flex-1">
                        <div className="text-xs" style={{ color: '#9CA3AF' }}>Website</div>
                        <div className="font-medium" style={{ color: '#FD8AE6' }}>Visit brand website</div>
                      </div>
                      <svg className="w-4 h-4" style={{ color: '#9CA3AF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Reviews Section */}
          <div className="px-6 py-6" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: '#FAFAFA' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: '#0C0F1A', fontFamily: 'var(--font-bricolage), sans-serif' }}>
              Creator Reviews
            </h3>
            <BrandReviews
              brandId={brand.id}
              brandName={brand.name}
              userId={user?.id}
            />
          </div>
        </div>
        
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(40px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out;
          }
          .animate-slideUp {
            animation: slideUp 0.3s ease-out;
          }
        `}</style>
      </div>
    )
  }

  // Desktop: Right-side drawer
  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-50 animate-fadeIn"
        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white z-[60] overflow-y-auto animate-slideInRight" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
        {/* Header */}
        <div className="sticky top-0 bg-white px-8 py-6 flex items-start justify-between z-10" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="flex items-start gap-4 flex-1">
            <div className={`w-16 h-16 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 ${getCategoryColor(brand.category)}`} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              {getBrandInitials(brand.name)}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#0C0F1A', fontFamily: 'var(--font-bricolage), sans-serif' }}>
                {brand.name}
              </h2>
              {brand.category && (
                <span className="inline-block px-3 py-1 text-sm font-medium" style={{ background: '#F8F9FB', color: '#5E6370', borderRadius: '8px' }}>
                  {brand.category}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 flex-shrink-0 transition-colors"
            style={{ borderRadius: '8px', cursor: 'pointer' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F8F9FB'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <svg className="w-6 h-6" style={{ color: '#5E6370' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-6">
          {/* CTA Button */}
          <button
            onClick={() => onAddToPipeline(brand)}
            disabled={isAdding}
            className="w-full px-6 py-3.5 text-white font-semibold text-base disabled:opacity-50 transition-all"
            style={{
              background: '#0C0F1A',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              cursor: isAdding ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-libre), sans-serif'
            }}
            onMouseEnter={(e) => {
              if (!isAdding) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)'
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.06)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isAdding) {
                e.currentTarget.style.background = '#0C0F1A'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
              }
            }}
          >
            {isAdding ? '✓ Added to Pipeline!' : 'Add to Pipeline'}
          </button>

          {/* Rate Display */}
          {brand.typical_rate_min && brand.typical_rate_max && (
            <div className="p-5" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(16,185,129,0.08) 100%)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '12px' }}>
              <div className="text-sm font-medium mb-2" style={{ color: '#15803d' }}>Typical Rate</div>
              <div className="text-3xl font-bold" style={{ color: '#15803d', fontFamily: 'var(--font-bricolage), sans-serif' }}>
                ${brand.typical_rate_min.toLocaleString()} — ${brand.typical_rate_max.toLocaleString()}
              </div>
            </div>
          )}

          {/* Chips */}
          {microChips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {microChips.map((chip, idx) => (
                <span key={idx} className="px-3 py-1.5 text-sm font-medium" style={{ background: '#F8F9FB', color: '#5E6370', borderRadius: '8px' }}>
                  {chip}
                </span>
              ))}
            </div>
          )}

          <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}></div>

          {/* About */}
          {brand.notes && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#0C0F1A' }}>About</h3>
              <p className="leading-relaxed" style={{ color: '#5E6370', fontFamily: 'var(--font-libre), sans-serif' }}>{brand.notes}</p>
            </div>
          )}

          {/* Contact Info */}
          {(brand.contact_email || brand.website) && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#0C0F1A' }}>Contact</h3>
              <div className="space-y-2">
                {brand.contact_email && (
                  <a
                    href={`mailto:${brand.contact_email}`}
                    className="flex items-center gap-3 p-3 group transition-colors"
                    style={{ background: '#F8F9FB', borderRadius: '8px', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#F8F9FB'}
                  >
                    <svg className="w-5 h-5" style={{ color: '#5E6370' }} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                    </svg>
                    <div>
                      <div className="text-xs" style={{ color: '#9CA3AF' }}>Email</div>
                      <div className="font-medium" style={{ color: '#FD8AE6' }}>{brand.contact_email}</div>
                    </div>
                  </a>
                )}
                {brand.website && (
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 group transition-colors"
                    style={{ background: '#F8F9FB', borderRadius: '8px', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#F8F9FB'}
                  >
                    <svg className="w-5 h-5" style={{ color: '#5E6370' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd"/>
                    </svg>
                    <div className="flex-1">
                      <div className="text-xs" style={{ color: '#9CA3AF' }}>Website</div>
                      <div className="font-medium" style={{ color: '#FD8AE6' }}>Visit brand website</div>
                    </div>
                    <svg className="w-4 h-4" style={{ color: '#9CA3AF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="px-8 py-6" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: '#FAFAFA' }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: '#0C0F1A', fontFamily: 'var(--font-bricolage), sans-serif' }}>
            Creator Reviews
          </h3>
          <BrandReviews
            brandId={brand.id}
            brandName={brand.name}
            userId={user?.id}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </>
  )
}