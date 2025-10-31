'use client'

import { useState } from 'react'
import { Button } from './ui/button'

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

interface BrandModalProps {
  brand: Brand
  isOpen: boolean
  onClose: () => void
  onAddToPipeline: (brand: Brand) => void
  isAdding?: boolean
}

export function BrandModal({ brand, isOpen, onClose, onAddToPipeline, isAdding }: BrandModalProps) {
  if (!isOpen) return null

  const getBrandInitials = (brandName: string) => {
    return brandName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getResponseRateColor = (rate: string) => {
    switch (rate) {
      case 'High': return 'text-green-600 bg-green-50'
      case 'Medium': return 'text-yellow-600 bg-yellow-50'
      case 'Low': return 'text-red-600 bg-red-50'
      default: return 'text-slate-600 bg-slate-50'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-slideUp max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-8 py-6 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-[#020c1f] shadow-lg flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {getBrandInitials(brand.name)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">{brand.name}</h2>
              {brand.category && (
                <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg">
                  {brand.category}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-6">
          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Rate Range */}
            {brand.typical_rate_min && brand.typical_rate_max && (
              <div className="col-span-2 p-5 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-green-700 font-medium mb-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                  </svg>
                  Typical Rate Range
                </div>
                <div className="text-3xl font-bold text-green-700">
                  ${brand.typical_rate_min.toLocaleString()} - ${brand.typical_rate_max.toLocaleString()}
                </div>
              </div>
            )}

            {/* Response Rate */}
            {brand.response_rate && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-600 font-medium mb-2">Response Rate</div>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-sm ${getResponseRateColor(brand.response_rate)}`}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                  </svg>
                  {brand.response_rate}
                </div>
              </div>
            )}

            {/* Best Outreach Method */}
            {brand.best_outreach_method && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-600 font-medium mb-2">Best Outreach Method</div>
                <div className="flex items-center gap-2 text-slate-900 font-semibold">
                  <svg className="w-5 h-5 text-[#fd8ae6]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                  </svg>
                  {brand.best_outreach_method}
                </div>
              </div>
            )}
          </div>

          {/* Contact Info */}
          {(brand.contact_email || brand.contact_name || brand.website) && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Contact Information</h3>
              <div className="space-y-2">
                {brand.contact_name && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <svg className="w-5 h-5 text-slate-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                    </svg>
                    <div>
                      <div className="text-xs text-slate-500">Contact Person</div>
                      <div className="font-medium text-slate-900">{brand.contact_name}</div>
                    </div>
                  </div>
                )}
                {brand.contact_email && (
                  <a
                    href={`mailto:${brand.contact_email}`}
                    className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer group"
                  >
                    <svg className="w-5 h-5 text-slate-500 group-hover:text-[#fd8ae6] transition-colors flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                    </svg>
                    <div>
                      <div className="text-xs text-slate-500">Email</div>
                      <div className="font-medium text-[#fd8ae6] group-hover:text-[#fc6fdf] transition-colors">{brand.contact_email}</div>
                    </div>
                  </a>
                )}
                {brand.website && (
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer group"
                  >
                    <svg className="w-5 h-5 text-slate-500 group-hover:text-[#fd8ae6] transition-colors flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd"/>
                    </svg>
                    <div className="flex-1">
                      <div className="text-xs text-slate-500">Website</div>
                      <div className="font-medium text-[#fd8ae6] group-hover:text-[#fc6fdf] transition-colors truncate">Visit brand website</div>
                    </div>
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-[#fd8ae6] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {brand.notes && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Notes</h3>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-slate-700 leading-relaxed">{brand.notes}</p>
              </div>
            </div>
          )}

          {/* Creator Reviews - Coming Soon */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Creator Reviews</h3>
            <div className="p-8 text-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
              <div className="text-4xl mb-3">⭐</div>
              <div className="font-semibold text-slate-900 mb-1">Reviews coming soon!</div>
              <p className="text-sm text-slate-600">
                Soon you'll see ratings and reviews from other creators who've worked with {brand.name}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-8 py-6 flex gap-3">
          <Button
            onClick={() => onAddToPipeline(brand)}
            disabled={isAdding}
            className="flex-1"
          >
            {isAdding ? '✓ Added to Pipeline!' : '+ Add to Pipeline'}
          </Button>
          {brand.contact_email && (
            <a
              href={`mailto:${brand.contact_email}`}
              className="flex-1"
            >
              <Button variant="outline" className="w-full">
                Contact Brand
              </Button>
            </a>
          )}
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
            transform: translateY(20px);
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
