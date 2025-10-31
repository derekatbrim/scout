'use client'

import { useEffect, useState } from 'react'
import { supabaseClient } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { showToast } from '../../../components/ui/toast'

interface Deal {
  id: string
  brand_name: string
  status: string
  deal_value: number | null
  pitched_date: string | null
  notes: string | null
  created_at: string
}

const PIPELINE_STAGES = [
  { 
    id: 'prospect', 
    label: 'Prospects', 
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#9CA3AF' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: '#9CA3AF' 
  },
  { 
    id: 'pitched', 
    label: 'Pitched', 
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#3B82F6' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    color: '#3B82F6' 
  },
  { 
    id: 'negotiating', 
    label: 'Negotiating', 
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#A855F7' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    color: '#A855F7' 
  },
  { 
    id: 'won', 
    label: 'Won', 
    icon: '🎉',
    color: '#10B981' 
  },
  { 
    id: 'delivered', 
    label: 'Delivered', 
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#FD8AE6' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: '#FD8AE6' 
  },
]

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newDealName, setNewDealName] = useState('')
  const [newDealValue, setNewDealValue] = useState('')
  const [saving, setSaving] = useState(false)
  
  const router = useRouter()
  const supabase = supabaseClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      loadDeals()
    }
    checkAuth()
  }, [router, supabase.auth])

  const loadDeals = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading deals:', error)
    } else {
      setDeals(data || [])
    }
    setLoading(false)
  }

  const addDeal = async () => {
    if (!newDealName.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase.from('deals').insert({
      user_id: user?.id,
      brand_name: newDealName,
      deal_value: newDealValue ? parseInt(newDealValue) : null,
      status: 'prospect',
    })

    if (error) {
      showToast('Error adding deal: ' + error.message, 'error')
    } else {
      showToast(`✓ ${newDealName} added!`, 'success')
      setNewDealName('')
      setNewDealValue('')
      setShowAddModal(false)
      loadDeals()
    }
  }

  const updateDealStatus = async (dealId: string, newStatus: string) => {
    const deal = deals.find(d => d.id === dealId)
    if (!deal) return

    const { error } = await supabase
      .from('deals')
      .update({ status: newStatus })
      .eq('id', dealId)

    if (error) {
      showToast('Error updating status: ' + error.message, 'error')
    } else {
      const stage = PIPELINE_STAGES.find(s => s.id === newStatus)
      showToast(`✓ ${deal.brand_name} → ${stage?.label}`, 'success')
      loadDeals()
      
      // Update selected deal if it's the one being edited
      if (selectedDeal?.id === dealId) {
        setSelectedDeal({...selectedDeal, status: newStatus})
        setEditingDeal({...selectedDeal, status: newStatus})
      }
    }
  }

  const saveDealEdit = async () => {
    if (!editingDeal) return

    setSaving(true)

    const { error } = await supabase
      .from('deals')
      .update({
        brand_name: editingDeal.brand_name,
        deal_value: editingDeal.deal_value,
        pitched_date: editingDeal.pitched_date,
        notes: editingDeal.notes,
      })
      .eq('id', editingDeal.id)

    if (error) {
      showToast('Error saving changes: ' + error.message, 'error')
    } else {
      showToast('✓ Changes saved!', 'success')
      setSelectedDeal(null)
      setEditingDeal(null)
      loadDeals()
    }

    setSaving(false)
  }

  const deleteDeal = async (dealId: string) => {
    const deal = deals.find(d => d.id === dealId)
    if (!confirm(`Delete ${deal?.brand_name}?`)) return

    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', dealId)

    if (error) {
      showToast('Error deleting deal: ' + error.message, 'error')
    } else {
      showToast('✓ Deal deleted', 'success')
      setSelectedDeal(null)
      loadDeals()
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

  const getStageDeals = (stageId: string) => {
    return deals.filter(d => d.status === stageId)
  }

  const getStageValue = (stageId: string) => {
    const stageDeals = getStageDeals(stageId)
    return stageDeals.reduce((sum, d) => sum + (d.deal_value || 0), 0)
  }

  const getTotalPipelineValue = () => {
    return deals.reduce((sum, d) => sum + (d.deal_value || 0), 0)
  }

  const canMoveLeft = (status: string) => {
    const currentIndex = PIPELINE_STAGES.findIndex(s => s.id === status)
    return currentIndex > 0
  }

  const canMoveRight = (status: string) => {
    const currentIndex = PIPELINE_STAGES.findIndex(s => s.id === status)
    return currentIndex < PIPELINE_STAGES.length - 1
  }

  const moveLeft = (deal: Deal) => {
    const currentIndex = PIPELINE_STAGES.findIndex(s => s.id === deal.status)
    if (currentIndex > 0) {
      updateDealStatus(deal.id, PIPELINE_STAGES[currentIndex - 1].id)
    }
  }

  const moveRight = (deal: Deal) => {
    const currentIndex = PIPELINE_STAGES.findIndex(s => s.id === deal.status)
    if (currentIndex < PIPELINE_STAGES.length - 1) {
      updateDealStatus(deal.id, PIPELINE_STAGES[currentIndex + 1].id)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f7fa' }}>
        <div style={{ color: '#5E6370' }}>Loading pipeline...</div>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="min-h-screen" 
      style={{ background: '#f5f7fa' }}
    >
      {/* Top Navigation */}
      <nav className="bg-white sticky top-0 z-40" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
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
                  className="font-semibold cursor-pointer pb-0.5"
                  style={{ color: '#FD8AE6', borderBottom: '2px solid #FD8AE6' }}
                >
                  Pipeline
                </Link>
              </div>
            </div>
            
            <Link 
              href="/dashboard/profile"
              className="cursor-pointer transition-colors"
              style={{ color: '#5E6370' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#FD8AE6'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#5E6370'}
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
        {/* Header */}
        <div className="mb-6">
          <h2 
            className="mb-2"
            style={{ 
              fontSize: '32px',
              fontWeight: '500',
              color: '#0C0F1A',
              fontFamily: 'var(--font-bricolage), sans-serif'
            }}
          >
            Pipeline
          </h2>
          <div className="flex items-center justify-between">
            <p style={{ color: '#9CA3AF', fontSize: '14px' }}>
              Track deals through every stage
            </p>
            <div className="flex items-center gap-4">
              <div 
                className="text-right px-4 py-2"
                style={{
                  background: 'rgba(253,138,230,0.05)',
                  border: '1px solid rgba(253,138,230,0.15)',
                  borderRadius: '12px'
                }}
              >
                <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Total Value
                </div>
                <div 
                  style={{ 
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#0C0F1A',
                    fontFamily: 'var(--font-bricolage), sans-serif'
                  }}
                >
                  ${getTotalPipelineValue().toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Bar */}
        <div 
          className="bg-white p-4 mb-8"
          style={{
            borderRadius: '20px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.06)'
          }}
        >
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05, ease: 'easeOut' }}
            className="grid grid-cols-5 gap-4"
          >
          {PIPELINE_STAGES.map((stage, idx) => {
            const stageDeals = getStageDeals(stage.id)
            const stageValue = getStageValue(stage.id)
            
            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.05 + (idx * 0.05), ease: 'easeOut' }}
                className="p-4 cursor-pointer"
                style={{
                  borderRadius: '12px',
                  background: '#f8f9fb',
                  border: 'none',
                  transition: 'all 0.15s ease-out'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.background = '#f0f2f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.background = '#f8f9fb'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px' }}>
                    {typeof stage.icon === 'string' ? (
                      <span style={{ fontSize: '20px' }}>{stage.icon}</span>
                    ) : (
                      stage.icon
                    )}
                  </div>
                  <div 
                    className="px-2 py-1"
                    style={{
                      borderRadius: '6px',
                      background: `${stage.color}15`,
                      color: stage.color,
                      fontSize: '14px',
                      fontWeight: 'bold',
                      fontFamily: 'var(--font-bricolage), sans-serif'
                    }}
                  >
                    {stageDeals.length}
                  </div>
                </div>
                <div 
                  className="mb-1"
                  style={{ 
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#0C0F1A'
                  }}
                >
                  {stage.label}
                </div>
                <div style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: '500' }}>
                  ${stageValue.toLocaleString()}
                </div>
              </motion.div>
            )
          })}
          </motion.div>
        </div>

        {/* Pipeline Columns */}
        {deals.length === 0 ? (
          <div 
            className="bg-white p-16 text-center"
            style={{
              borderRadius: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.06)'
            }}
          >
            <div className="text-6xl mb-4">🎯</div>
            <h3 
              className="mb-2"
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#0C0F1A',
                fontFamily: 'var(--font-bricolage), sans-serif'
              }}
            >
              No deals yet
            </h3>
            <p className="mb-6" style={{ color: '#5E6370', fontSize: '15px' }}>
              Start by browsing brands and adding them to your pipeline
            </p>
            <Link href="/dashboard/brands">
              <button
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
                Browse Brands
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-4 items-start">
            {PIPELINE_STAGES.map((stage, stageIdx) => {
              const stageDeals = getStageDeals(stage.id)
              const hasDeals = stageDeals.length > 0
              const isWinStage = stage.id === 'won' || stage.id === 'delivered'
              
              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.1 + (stageIdx * 0.05), ease: 'easeOut' }}
                  className="space-y-3 p-4"
                  style={{
                    background: hasDeals ? '#ffffff' : '#f8f9fb',
                    borderRadius: '20px',
                    boxShadow: 'inset -1px 0 0 rgba(0,0,0,0.04)',
                    transition: 'all 0.15s ease-out'
                  }}
                  onMouseEnter={(e) => {
                    if (isWinStage && hasDeals) {
                      e.currentTarget.style.boxShadow = '0 0 0 1px rgba(16,185,129,0.2), inset -1px 0 0 rgba(0,0,0,0.04)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'inset -1px 0 0 rgba(0,0,0,0.04)'
                  }}
                >
                  {/* Column Header */}
                  <div 
                    className="px-4 py-3 bg-white"
                    style={{
                      borderRadius: '12px',
                      border: '1px solid rgba(0,0,0,0.06)'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {typeof stage.icon === 'string' ? (
                          <span style={{ fontSize: '14px' }}>{stage.icon}</span>
                        ) : (
                          stage.icon
                        )}
                      </div>
                      <span 
                        style={{ 
                          fontSize: '13px',
                          fontWeight: '500',
                          color: '#5E6370'
                        }}
                      >
                        {stage.label}
                      </span>
                    </div>
                  </div>

                  {/* Deals in this column */}
                  <AnimatePresence>
                    {stageDeals.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-8 text-center cursor-pointer transition-opacity"
                        style={{
                          borderRadius: '12px',
                          border: '1px dashed rgba(0,0,0,0.12)',
                          background: 'transparent',
                          opacity: 0.5
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '0.8'
                          e.currentTarget.style.borderColor = 'rgba(253,138,230,0.3)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '0.5'
                          e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'
                        }}
                        onClick={() => setShowAddModal(true)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', opacity: 0.4 }}>
                          {typeof stage.icon === 'string' ? (
                            <span style={{ fontSize: '28px' }}>{stage.icon}</span>
                          ) : (
                            <div style={{ transform: 'scale(1.8)' }}>{stage.icon}</div>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: '500', lineHeight: '1.4' }}>
                          {stage.id === 'prospect' && 'Start your next pitch'}
                          {stage.id === 'pitched' && 'Time to reach out'}
                          {stage.id === 'negotiating' && 'Keep pushing forward'}
                          {stage.id === 'won' && 'You got this! 💪'}
                          {stage.id === 'delivered' && 'Finish strong'}
                        </div>
                      </motion.div>
                    ) : (
                      stageDeals.map((deal, dealIdx) => (
                        <motion.div
                          key={deal.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2, delay: dealIdx * 0.03, ease: 'easeOut' }}
                          className="bg-white p-4 cursor-pointer group relative"
                          style={{
                            borderRadius: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            border: '1px solid rgba(0,0,0,0.06)',
                            transition: 'all 0.15s ease-out'
                          }}
                          onClick={() => {
                            setSelectedDeal(deal)
                            setEditingDeal({...deal})
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.02)'
                            e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.06)'
                            e.currentTarget.style.borderColor = 'rgba(253,138,230,0.25)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)'
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
                            e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'
                          }}
                        >
                          {/* Quick move buttons - show on hover */}
                          <div 
                            className="absolute -top-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1"
                            style={{ zIndex: 10 }}
                          >
                            {canMoveLeft(deal.status) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  moveLeft(deal)
                                }}
                                className="p-1 bg-white text-white shadow-md transition-all"
                                style={{
                                  borderRadius: '6px',
                                  border: '1px solid rgba(0,0,0,0.06)',
                                  background: '#0C0F1A'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#0C0F1A'
                                }}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                            )}
                            {canMoveRight(deal.status) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  moveRight(deal)
                                }}
                                className="p-1 bg-white text-white shadow-md transition-all"
                                style={{
                                  borderRadius: '6px',
                                  border: '1px solid rgba(0,0,0,0.06)',
                                  background: '#0C0F1A'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#0C0F1A'
                                }}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            )}
                          </div>

                          {/* Brand avatar */}
                          <div 
                            className="flex items-center justify-center text-white font-bold mb-3"
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '10px',
                              background: '#0C0F1A',
                              fontSize: '14px',
                              fontFamily: 'var(--font-bricolage), sans-serif'
                            }}
                          >
                            {getBrandInitials(deal.brand_name)}
                          </div>

                          {/* Brand name */}
                          <div 
                            className="mb-2 line-clamp-2"
                            style={{ 
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#0C0F1A',
                              lineHeight: '1.4'
                            }}
                          >
                            {deal.brand_name}
                          </div>

                          {/* Deal value */}
                          {deal.deal_value && (
                            <div 
                              className="mb-2"
                              style={{ 
                                fontSize: deal.deal_value >= 5000 ? '18px' : '16px',
                                fontWeight: 'bold',
                                color: deal.deal_value >= 5000 ? '#10B981' : '#5E6370',
                                fontFamily: 'var(--font-bricolage), sans-serif'
                              }}
                            >
                              ${deal.deal_value.toLocaleString()}
                            </div>
                          )}

                          {/* Time ago */}
                          <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '500' }}>
                            {getTimeAgo(deal.created_at)}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <div 
        className="fixed bottom-8 right-8 z-50"
        style={{
          background: 'radial-gradient(circle at center, rgba(253,138,230,0.25), transparent 70%)',
          borderRadius: '50%',
          padding: '20px'
        }}
      >
        <button
          onClick={() => setShowAddModal(true)}
          className="w-16 h-16 text-white shadow-2xl flex items-center justify-center group transition-all cursor-pointer"
          style={{
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
          }}
        >
          <svg className="w-8 h-8 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Add Deal Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-8 max-w-md w-full"
              style={{
                borderRadius: '20px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#0C0F1A',
                    fontFamily: 'var(--font-bricolage), sans-serif'
                  }}
                >
                  Add New Deal
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 transition-colors cursor-pointer"
                  style={{
                    borderRadius: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F8F9FB'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#9CA3AF' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label 
                    className="block mb-2"
                    style={{ fontSize: '14px', fontWeight: '600', color: '#5E6370' }}
                  >
                    Brand Name *
                  </label>
                  <Input
                    value={newDealName}
                    onChange={(e) => setNewDealName(e.target.value)}
                    placeholder="e.g. Finest Call"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newDealName.trim()) {
                        addDeal()
                      }
                    }}
                  />
                </div>
                <div>
                  <label 
                    className="block mb-2"
                    style={{ fontSize: '14px', fontWeight: '600', color: '#5E6370' }}
                  >
                    Expected Value (optional)
                  </label>
                  <Input
                    type="number"
                    value={newDealValue}
                    onChange={(e) => setNewDealValue(e.target.value)}
                    placeholder="2000"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button onClick={addDeal} disabled={!newDealName.trim()} className="flex-1">
                    Add Deal
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddModal(false)
                      setNewDealName('')
                      setNewDealValue('')
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedDeal && editingDeal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => {
                setSelectedDeal(null)
                setEditingDeal(null)
              }}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto"
            >
              {/* Drawer Header */}
              <div 
                className="sticky top-0 bg-white z-10 px-6 py-5"
                style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
              >
                <div className="flex items-center justify-between">
                  <h3 
                    style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: '#0C0F1A',
                      fontFamily: 'var(--font-bricolage), sans-serif'
                    }}
                  >
                    Deal Details
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedDeal(null)
                      setEditingDeal(null)
                    }}
                    className="p-2 transition-colors cursor-pointer"
                    style={{
                      borderRadius: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F8F9FB'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#5E6370' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="p-6 space-y-6">
                {/* Brand Identity */}
                <div className="flex items-center gap-4">
                  <div 
                    className="flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                      fontSize: '20px',
                      fontFamily: 'var(--font-bricolage), sans-serif'
                    }}
                  >
                    {getBrandInitials(selectedDeal.brand_name)}
                  </div>
                  <div className="flex-1">
                    <div 
                      style={{ 
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#0C0F1A',
                        fontFamily: 'var(--font-bricolage), sans-serif',
                        marginBottom: '4px'
                      }}
                    >
                      {selectedDeal.brand_name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: '500' }}>
                      Added {getTimeAgo(selectedDeal.created_at)}
                    </div>
                  </div>
                </div>

                {/* Status Change */}
                <div>
                  <label 
                    className="block mb-2"
                    style={{ fontSize: '14px', fontWeight: '600', color: '#5E6370' }}
                  >
                    Pipeline Stage
                  </label>
                  <select
                    value={editingDeal.status}
                    onChange={(e) => {
                      setEditingDeal({...editingDeal, status: e.target.value})
                      updateDealStatus(selectedDeal.id, e.target.value)
                    }}
                    className="w-full px-4 py-3 bg-white font-medium cursor-pointer transition-all"
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
                    {PIPELINE_STAGES.map(stage => (
                      <option key={stage.id} value={stage.id}>
                        {typeof stage.icon === 'string' ? `${stage.icon} ` : ''}{stage.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Edit Form */}
                <div className="space-y-5">
                  <div>
                    <label 
                      className="block mb-2"
                      style={{ fontSize: '14px', fontWeight: '600', color: '#5E6370' }}
                    >
                      Brand Name
                    </label>
                    <Input
                      value={editingDeal.brand_name}
                      onChange={(e) => setEditingDeal({...editingDeal, brand_name: e.target.value})}
                    />
                  </div>

                  <div>
                    <label 
                      className="block mb-2"
                      style={{ fontSize: '14px', fontWeight: '600', color: '#5E6370' }}
                    >
                      Deal Value
                    </label>
                    <Input
                      type="number"
                      value={editingDeal.deal_value || ''}
                      onChange={(e) => setEditingDeal({...editingDeal, deal_value: parseInt(e.target.value) || null})}
                      placeholder="e.g. 2000"
                    />
                  </div>

                  <div>
                    <label 
                      className="block mb-2"
                      style={{ fontSize: '14px', fontWeight: '600', color: '#5E6370' }}
                    >
                      Pitched Date
                    </label>
                    <Input
                      type="date"
                      value={editingDeal.pitched_date || ''}
                      onChange={(e) => setEditingDeal({...editingDeal, pitched_date: e.target.value})}
                    />
                  </div>

                  <div>
                    <label 
                      className="block mb-2"
                      style={{ fontSize: '14px', fontWeight: '600', color: '#5E6370' }}
                    >
                      Notes
                    </label>
                    <textarea
                      className="w-full px-3 py-2 bg-white transition-all"
                      rows={4}
                      value={editingDeal.notes || ''}
                      onChange={(e) => setEditingDeal({...editingDeal, notes: e.target.value})}
                      placeholder="Add notes about this deal..."
                      style={{
                        border: '2px solid rgba(0,0,0,0.06)',
                        borderRadius: '12px',
                        color: '#0C0F1A',
                        fontFamily: 'var(--font-libre), sans-serif',
                        fontSize: '15px',
                        resize: 'vertical'
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
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={saveDealEdit}
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedDeal(null)
                      setEditingDeal(null)
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => deleteDeal(selectedDeal.id)}
                  className="w-full text-sm font-semibold py-3 transition-all"
                  style={{
                    color: '#EF4444',
                    borderRadius: '12px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#FEF2F2'
                    e.currentTarget.style.color = '#DC2626'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#EF4444'
                  }}
                >
                  Delete Deal
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}