'use client'

import { useState, useEffect } from 'react'
import { supabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { showToast } from '@/components/ui/toast'

interface EmailTemplate {
  id: string
  user_id: string | null
  title: string
  description: string
  subject_line: string
  body_text: string
  category: string
  is_public: boolean
  use_count: number
  created_at: string
}

interface TemplateVariables {
  [key: string]: string
}

const CATEGORIES = [
  { id: 'all', label: 'All Templates', icon: '📧' },
  { id: 'cold_pitch', label: 'Cold Pitch', icon: '🎯' },
  { id: 'follow_up', label: 'Follow-Up', icon: '🔄' },
  { id: 'negotiation', label: 'Negotiation', icon: '💰' },
  { id: 'thank_you', label: 'Thank You', icon: '🙏' },
  { id: 'deliverables', label: 'Deliverables', icon: '📦' },
  { id: 'other', label: 'Other', icon: '✨' },
]

export function EmailTemplates({ userId }: { userId?: string }) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [variables, setVariables] = useState<TemplateVariables>({})
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  
  // New template form
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newSubject, setNewSubject] = useState('')
  const [newBody, setNewBody] = useState('')
  const [newCategory, setNewCategory] = useState('other')
  const [saving, setSaving] = useState(false)

  const supabase = supabaseClient()

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    filterTemplates()
  }, [templates, activeCategory, searchTerm])

  const loadTemplates = async () => {
    // Get public templates + user's own templates
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .or(`is_public.eq.true${userId ? `,user_id.eq.${userId}` : ''}`)
      .order('use_count', { ascending: false })

    if (error) {
      console.error('Error loading templates:', error)
    } else {
      setTemplates(data || [])
    }
    setLoading(false)
  }

  const filterTemplates = () => {
    let filtered = templates

    if (activeCategory !== 'all') {
      filtered = filtered.filter(t => t.category === activeCategory)
    }

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredTemplates(filtered)
  }

  const extractVariables = (template: EmailTemplate): string[] => {
    const text = template.subject_line + ' ' + template.body_text
    const matches = text.match(/\{\{([^}]+)\}\}/g) || []
    return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))]
  }

  const fillTemplate = (text: string, vars: TemplateVariables): string => {
    let filled = text
    Object.entries(vars).forEach(([key, value]) => {
      filled = filled.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
    })
    return filled
  }

  const copyToClipboard = async (template: EmailTemplate) => {
    const templateVars = extractVariables(template)
    const hasEmptyVars = templateVars.some(v => !variables[v])

    if (hasEmptyVars) {
      showToast('Please fill in all variables first', 'error')
      return
    }

    const subject = fillTemplate(template.subject_line, variables)
    const body = fillTemplate(template.body_text, variables)
    const fullEmail = `Subject: ${subject}\n\n${body}`

    try {
      await navigator.clipboard.writeText(fullEmail)
      showToast('✓ Copied to clipboard!', 'success')
      
      // Increment use count
      await supabase
        .from('email_templates')
        .update({ use_count: template.use_count + 1 })
        .eq('id', template.id)
      
      loadTemplates()
    } catch (err) {
      showToast('Failed to copy', 'error')
    }
  }

  const handlePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    const vars = extractVariables(template)
    const initialVars: TemplateVariables = {}
    vars.forEach(v => {
      initialVars[v] = variables[v] || ''
    })
    setVariables(initialVars)
    setShowPreviewModal(true)
  }

  const createTemplate = async () => {
    if (!userId) {
      showToast('Please log in to create templates', 'error')
      return
    }

    if (!newTitle || !newSubject || !newBody) {
      showToast('Please fill in all required fields', 'error')
      return
    }

    setSaving(true)

    const { error } = await supabase.from('email_templates').insert({
      user_id: userId,
      title: newTitle,
      description: newDescription,
      subject_line: newSubject,
      body_text: newBody,
      category: newCategory,
      is_public: false,
    })

    if (error) {
      showToast('Error creating template: ' + error.message, 'error')
    } else {
      showToast('✓ Template created!', 'success')
      setShowCreateModal(false)
      resetCreateForm()
      loadTemplates()
    }

    setSaving(false)
  }

  const resetCreateForm = () => {
    setNewTitle('')
    setNewDescription('')
    setNewSubject('')
    setNewBody('')
    setNewCategory('other')
  }

  const getCategoryIcon = (category: string) => {
    return CATEGORIES.find(c => c.id === category)?.icon || '✨'
  }

  if (loading) {
    return (
      <div className="py-8 text-center" style={{ color: '#5E6370' }}>
        Loading templates...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div 
        className="overflow-hidden"
        style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
          border: '1px solid rgba(0,0,0,0.06)'
        }}
      >
        {/* Search bar */}
        <div className="p-6" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="relative">
            <svg 
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" 
              style={{ color: '#9CA3AF' }}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl transition-all focus:outline-none"
              style={{
                background: '#F8F9FB',
                border: '1px solid rgba(0,0,0,0.06)',
                color: '#0C0F1A',
                fontFamily: 'var(--font-libre), sans-serif'
              }}
              onFocus={(e) => {
                e.currentTarget.style.background = '#FFFFFF'
                e.currentTarget.style.borderColor = '#FD8AE6'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(253,138,230,0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.background = '#F8F9FB'
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>
        </div>

        {/* Category filters */}
        <div className="px-6 py-6" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 cursor-pointer"
                style={{
                  borderRadius: '9999px',
                  background: activeCategory === cat.id ? '#0C0F1A' : '#F8F9FB',
                  color: activeCategory === cat.id ? '#FFFFFF' : '#5E6370',
                  boxShadow: activeCategory === cat.id ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
                  fontFamily: 'var(--font-libre), sans-serif'
                }}
                onMouseEnter={(e) => {
                  if (activeCategory !== cat.id) {
                    e.currentTarget.style.background = '#f1f5f9'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeCategory !== cat.id) {
                    e.currentTarget.style.background = '#F8F9FB'
                  }
                }}
              >
                <span className="mr-2">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results count + Create button */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ background: '#F8F9FB' }}>
          <div className="text-sm" style={{ color: '#5E6370', fontFamily: 'var(--font-libre), sans-serif' }}>
            <span style={{ fontWeight: 600, color: '#0C0F1A' }}>{filteredTemplates.length}</span> templates
          </div>
          {userId && (
            <Button
  onClick={() => setShowCreateModal(true)}
  size="default"
>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Template
            </Button>
          )}
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div 
          className="p-16 text-center"
          style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.06)'
          }}
        >
          <div className="text-6xl mb-4">📧</div>
          <h3 
            className="mb-2"
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#0C0F1A',
              fontFamily: 'var(--font-bricolage), sans-serif'
            }}
          >
            No templates found
          </h3>
          <p className="mb-6" style={{ color: '#5E6370', fontFamily: 'var(--font-libre), sans-serif' }}>
            Try adjusting your search or filters
          </p>
          {userId && (
            <Button onClick={() => setShowCreateModal(true)}>
              Create Your First Template
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="p-6 cursor-pointer group"
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                border: '2px solid rgba(0,0,0,0.06)',
                transition: 'all 0.15s ease-out'
              }}
              onClick={() => handlePreview(template)}
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
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div 
                    className="flex items-center justify-center text-2xl flex-shrink-0"
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)'
                    }}
                  >
                    {getCategoryIcon(template.category)}
                  </div>
                  <div className="flex-1">
                    <h3 
                      className="mb-1 group-hover:text-[#fd8ae6] transition-colors"
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: 700,
                        color: '#0C0F1A',
                        fontFamily: 'var(--font-bricolage), sans-serif'
                      }}
                    >
                      {template.title}
                    </h3>
                    {!template.is_public && (
                      <span 
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium"
                        style={{
                          background: 'rgba(59,130,246,0.1)',
                          color: '#2563eb',
                          borderRadius: '6px'
                        }}
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        Your template
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {template.description && (
                <p 
                  className="mb-4 line-clamp-2"
                  style={{ 
                    fontSize: '0.875rem',
                    color: '#5E6370',
                    fontFamily: 'var(--font-libre), sans-serif'
                  }}
                >
                  {template.description}
                </p>
              )}

              {/* Meta */}
              <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                <div className="flex items-center gap-4 text-xs" style={{ color: '#9CA3AF' }}>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                      <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                    </svg>
                    Used {template.use_count} times
                  </span>
                </div>
                <div 
                  className="text-sm font-medium group-hover:underline"
                  style={{ color: '#FD8AE6', fontFamily: 'var(--font-libre), sans-serif' }}
                >
                  Preview →
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  {selectedTemplate.title}
                </h3>
                {selectedTemplate.description && (
                  <p className="text-slate-600">{selectedTemplate.description}</p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowPreviewModal(false)
                  setVariables({})
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Variables Form */}
            {extractVariables(selectedTemplate).length > 0 && (
              <div className="mb-6 p-6 bg-slate-50 rounded-xl">
                <h4 className="text-sm font-semibold text-slate-700 mb-4">Fill in the details:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {extractVariables(selectedTemplate).map((variable) => (
                    <div key={variable}>
                      <label className="block text-xs font-medium text-slate-600 mb-2">
                        {variable.replace(/_/g, ' ')}
                      </label>
                      <Input
                        value={variables[variable] || ''}
                        onChange={(e) => setVariables({ ...variables, [variable]: e.target.value })}
                        placeholder={`Enter ${variable.replace(/_/g, ' ')}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview */}
            <div className="mb-6 p-6 bg-white border-2 border-slate-200 rounded-xl">
              <div className="mb-4">
                <div className="text-xs font-semibold text-slate-500 mb-2">SUBJECT:</div>
                <div className="font-semibold text-slate-900">
                  {fillTemplate(selectedTemplate.subject_line, variables)}
                </div>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <div className="text-xs font-semibold text-slate-500 mb-2">BODY:</div>
                <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {fillTemplate(selectedTemplate.body_text, variables)}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={() => copyToClipboard(selectedTemplate)}
                className="flex-1"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy to Clipboard
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPreviewModal(false)
                  setVariables({})
                }}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-slate-900">Create Template</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  resetCreateForm()
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Template Title *
                </label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., My Cold Pitch Template"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description (Optional)
                </label>
                <Input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief description of when to use this template"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-slate-900 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#fd8ae6] focus:border-[#fd8ae6]"
                >
                  {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Subject Line *
                </label>
                <Input
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Partnership Opportunity with {{your_name}}"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Use {`{{variable_name}}`} for dynamic content
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Body *
                </label>
                <textarea
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Hi {{contact_name}},&#10;&#10;I'm {{your_name}}..."
                  rows={12}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#fd8ae6] focus:border-[#fd8ae6] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={createTemplate}
                  disabled={saving || !newTitle || !newSubject || !newBody}
                  className="flex-1"
                >
                  {saving ? 'Creating...' : 'Create Template'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false)
                    resetCreateForm()
                  }}
                  disabled={saving}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}