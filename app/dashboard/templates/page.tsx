'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabaseClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Template {
  id: string
  name: string
  subject: string
  body: string
  category: 'pitch' | 'followup' | 'negotiation' | 'delivery'
  user_id?: string
  is_default?: boolean
}

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Initial Brand Pitch',
    category: 'pitch',
    subject: 'Partnership opportunity with {{your_name}}',
    body: `Hi {{brand_contact}},

I'm {{your_name}}, a {{niche}} creator with {{follower_count}} engaged followers. I love {{brand_name}}'s products and think we'd be a great fit for a partnership.

My audience aligns perfectly with your target market, and I've had success with similar brands, generating {{average_engagement}}% engagement rates.

I'd love to discuss how we can work together. Are you open to a quick call this week?

Best,
{{your_name}}`,
    is_default: true
  },
  {
    id: '2',
    name: 'Follow-up After No Response',
    category: 'followup',
    subject: 'Following up on partnership inquiry',
    body: `Hi {{brand_contact}},

I wanted to follow up on my email from {{days_ago}} about partnering with {{brand_name}}.

I'm still very interested in collaborating and have some creative ideas that could drive real results for your brand.

Would you have 10 minutes this week to chat?

Thanks,
{{your_name}}`,
    is_default: true
  },
  {
    id: '3',
    name: 'Rate Negotiation',
    category: 'negotiation',
    subject: 'Re: Partnership terms',
    body: `Hi {{brand_contact}},

Thanks for your offer! I'm excited about the opportunity to work with {{brand_name}}.

Based on my engagement rates and the scope of deliverables, my rate for this type of campaign is typically {{your_rate}}. This includes {{deliverables}}.

I'm flexible and happy to discuss a package that works for both of us. Would you be open to {{your_rate}} for this campaign?

Looking forward to hearing from you,
{{your_name}}`,
    is_default: true
  },
  {
    id: '4',
    name: 'Content Delivery',
    category: 'delivery',
    subject: 'Content ready for review - {{brand_name}} campaign',
    body: `Hi {{brand_contact}},

I've finished creating the content for our {{campaign_name}} campaign! You can review everything here: {{content_link}}

The content includes:
• {{deliverable_1}}
• {{deliverable_2}}
• {{deliverable_3}}

Please let me know if you'd like any adjustments. Once approved, I'll schedule the posts for {{posting_date}}.

Thanks,
{{your_name}}`,
    is_default: true
  }
]

export default function TemplatesPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const router = useRouter()
  const supabase = supabaseClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      setLoading(false)
    }
    checkAuth()
  }, [router, supabase.auth])

  const filteredTemplates = activeCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === activeCategory)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You can add a toast notification here
  }

  const categories = [
    { id: 'all', label: 'All Templates' },
    { id: 'pitch', label: 'Initial Pitch' },
    { id: 'followup', label: 'Follow-ups' },
    { id: 'negotiation', label: 'Negotiation' },
    { id: 'delivery', label: 'Delivery' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F9FB' }}>
        <div style={{ color: '#5E6370' }}>Loading...</div>
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
      {/* Top Navigation */}
      <nav 
        className="sticky top-0 z-40"
        style={{
          background: 'rgba(255,255,255,0.95)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          backdropFilter: 'blur(8px)'
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
                  className="text-sm font-medium transition-colors"
                  style={{ color: '#5E6370' }}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/dashboard/brands" 
                  className="text-sm font-medium transition-colors"
                  style={{ color: '#5E6370' }}
                >
                  Brands
                </Link>
                <Link 
                  href="/dashboard/deals" 
                  className="text-sm font-medium transition-colors"
                  style={{ color: '#5E6370' }}
                >
                  Pipeline
                </Link>
                <Link 
                  href="/dashboard/templates"
                  className="text-sm font-semibold relative pb-0.5"
                  style={{ color: '#FD8AE6' }}
                >
                  Templates
                  <div 
                    className="absolute bottom-0 left-0 right-0"
                    style={{ 
                      height: '2px',
                      background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)'
                    }}
                  />
                </Link>
              </div>
            </div>
            
            <Link 
              href="/dashboard/profile"
              className="transition-colors"
              style={{ color: '#5E6370' }}
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h2 
            className="mb-2"
            style={{
              fontSize: '2.25rem',
              fontWeight: 700,
              color: '#0C0F1A',
              fontFamily: 'var(--font-bricolage), sans-serif'
            }}
          >
            Email Templates
          </h2>
          <p style={{ color: '#5E6370', fontFamily: 'var(--font-libre), sans-serif' }}>
            Professional email templates to speed up your outreach and negotiations
          </p>
        </div>

        {/* Category Filter Bar */}
        <div 
          className="mb-6 p-2"
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.06)'
          }}
        >
          <div className="flex items-center gap-2 overflow-x-auto">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="px-4 py-2 text-sm font-medium whitespace-nowrap transition-all"
                style={{
                  background: activeCategory === cat.id ? '#0C0F1A' : 'transparent',
                  color: activeCategory === cat.id ? '#FFFFFF' : '#5E6370',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-libre), sans-serif'
                }}
                onMouseEnter={(e) => {
                  if (activeCategory !== cat.id) {
                    e.currentTarget.style.background = 'rgba(12,15,26,0.04)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeCategory !== cat.id) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between mb-6">
          <div style={{ color: '#5E6370', fontSize: '0.875rem' }}>
            {filteredTemplates.length} {filteredTemplates.length === 1 ? 'template' : 'templates'}
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-sm font-semibold transition-all"
            style={{
              background: '#0C0F1A',
              color: '#FFFFFF',
              borderRadius: '12px',
              padding: '10px 20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              cursor: 'pointer',
              fontFamily: 'var(--font-libre), sans-serif'
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
            + Create Template
          </button>
        </div>

        {/* Templates Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="cursor-pointer"
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                border: '1px solid rgba(0,0,0,0.06)',
                padding: '20px',
                transition: 'all 0.15s ease-out'
              }}
              onClick={() => setSelectedTemplate(template)}
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
              {/* Category Badge */}
              <div className="flex items-center justify-between mb-3">
                <span 
                  className="text-xs font-medium px-2 py-1"
                  style={{
                    background: 'rgba(12,15,26,0.04)',
                    color: '#5E6370',
                    borderRadius: '6px',
                    textTransform: 'capitalize'
                  }}
                >
                  {template.category}
                </span>
                {template.is_default && (
                  <span 
                    className="text-xs font-medium"
                    style={{ color: '#9CA3AF' }}
                  >
                    Default
                  </span>
                )}
              </div>

              {/* Template Name */}
              <h3 
                className="mb-2"
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#0C0F1A',
                  fontFamily: 'var(--font-bricolage), sans-serif'
                }}
              >
                {template.name}
              </h3>

              {/* Subject Line Preview */}
              <div 
                className="mb-3 pb-3"
                style={{ 
                  borderBottom: '1px solid rgba(0,0,0,0.06)'
                }}
              >
                <div 
                  className="text-xs font-medium mb-1"
                  style={{ color: '#9CA3AF' }}
                >
                  Subject
                </div>
                <div 
                  className="text-sm"
                  style={{ 
                    color: '#5E6370',
                    fontFamily: 'var(--font-libre), sans-serif'
                  }}
                >
                  {template.subject}
                </div>
              </div>

              {/* Body Preview */}
              <div 
                className="text-sm mb-4"
                style={{ 
                  color: '#9CA3AF',
                  fontFamily: 'var(--font-libre), sans-serif',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {template.body}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    copyToClipboard(template.body)
                  }}
                  className="flex-1 text-sm font-medium transition-all"
                  style={{
                    background: 'rgba(12,15,26,0.04)',
                    color: '#0C0F1A',
                    borderRadius: '10px',
                    padding: '8px 16px',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(12,15,26,0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(12,15,26,0.04)'
                  }}
                >
                  Copy
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedTemplate(template)
                  }}
                  className="flex-1 text-sm font-medium transition-all"
                  style={{
                    background: 'rgba(12,15,26,0.04)',
                    color: '#0C0F1A',
                    borderRadius: '10px',
                    padding: '8px 16px',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(12,15,26,0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(12,15,26,0.04)'
                  }}
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <div 
            className="text-center py-16"
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.06)'
            }}
          >
            <div className="text-4xl mb-3">📝</div>
            <h3 
              className="mb-2"
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#0C0F1A',
                fontFamily: 'var(--font-bricolage), sans-serif'
              }}
            >
              No templates yet
            </h3>
            <p 
              className="mb-6"
              style={{ 
                color: '#5E6370',
                fontFamily: 'var(--font-libre), sans-serif'
              }}
            >
              Create your first template to speed up your outreach
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-sm font-semibold transition-all"
              style={{
                background: '#0C0F1A',
                color: '#FFFFFF',
                borderRadius: '12px',
                padding: '10px 20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                cursor: 'pointer',
                fontFamily: 'var(--font-libre), sans-serif'
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
              Create Template
            </button>
          </div>
        )}
      </div>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setSelectedTemplate(null)}
        >
          <motion.div
            className="max-w-2xl w-full max-h-[80vh] overflow-auto"
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '32px',
              boxShadow: '0 6px 14px rgba(0,0,0,0.06)'
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <span 
                  className="text-xs font-medium px-2 py-1 inline-block mb-2"
                  style={{
                    background: 'rgba(12,15,26,0.04)',
                    color: '#5E6370',
                    borderRadius: '6px',
                    textTransform: 'capitalize'
                  }}
                >
                  {selectedTemplate.category}
                </span>
                <h3 
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    color: '#0C0F1A',
                    fontFamily: 'var(--font-bricolage), sans-serif'
                  }}
                >
                  {selectedTemplate.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="transition-colors"
                style={{
                  color: '#9CA3AF',
                  cursor: 'pointer'
                }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Subject */}
            <div className="mb-6">
              <div 
                className="text-sm font-semibold mb-2"
                style={{ 
                  color: '#0C0F1A',
                  fontFamily: 'var(--font-bricolage), sans-serif'
                }}
              >
                Subject Line
              </div>
              <div 
                className="p-4"
                style={{
                  background: 'rgba(12,15,26,0.02)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: '12px',
                  color: '#5E6370',
                  fontFamily: 'var(--font-libre), sans-serif'
                }}
              >
                {selectedTemplate.subject}
              </div>
            </div>

            {/* Body */}
            <div className="mb-6">
              <div 
                className="text-sm font-semibold mb-2"
                style={{ 
                  color: '#0C0F1A',
                  fontFamily: 'var(--font-bricolage), sans-serif'
                }}
              >
                Email Body
              </div>
              <div 
                className="p-4"
                style={{
                  background: 'rgba(12,15,26,0.02)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: '12px',
                  color: '#5E6370',
                  fontFamily: 'var(--font-libre), sans-serif',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.6'
                }}
              >
                {selectedTemplate.body}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  copyToClipboard(selectedTemplate.body)
                  setSelectedTemplate(null)
                }}
                className="flex-1 text-sm font-semibold transition-all"
                style={{
                  background: '#0C0F1A',
                  color: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-libre), sans-serif'
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
                Copy to Clipboard
              </button>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="px-6 text-sm font-medium transition-all"
                style={{
                  background: 'rgba(12,15,26,0.04)',
                  color: '#0C0F1A',
                  borderRadius: '12px',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(12,15,26,0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(12,15,26,0.04)'
                }}
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Template Modal Placeholder */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <motion.div
            className="max-w-lg w-full"
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '32px',
              boxShadow: '0 6px 14px rgba(0,0,0,0.06)'
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 
              className="mb-6"
              style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: '#0C0F1A',
                fontFamily: 'var(--font-bricolage), sans-serif'
              }}
            >
              Create Template
            </h3>
            <p style={{ color: '#5E6370', marginBottom: '24px' }}>
              Custom template creation coming soon!
            </p>
            <button
              onClick={() => setShowCreateModal(false)}
              className="w-full text-sm font-semibold transition-all"
              style={{
                background: '#0C0F1A',
                color: '#FFFFFF',
                borderRadius: '12px',
                padding: '12px 24px',
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
              Close
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}