'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabaseClient } from '../lib/supabase'
import { showToast } from './ui/toast'

interface OnboardingModalProps {
  userId: string
  onComplete: () => void
}

export function OnboardingModal({ userId, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState('')
  const [instagramHandle, setInstagramHandle] = useState('')
  const [creatorNiche, setCreatorNiche] = useState('')
  const [followerRange, setFollowerRange] = useState('')
  const [loading, setLoading] = useState(false)
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

  const handleSubmit = async () => {
    if (!fullName || !creatorNiche || !followerRange) {
      showToast('Please complete all required fields', 'error')
      return
    }

    setLoading(true)

    // First check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (fetchError) {
      console.error('Profile fetch error:', fetchError)
      showToast('Error: Could not find your profile', 'error')
      setLoading(false)
      return
    }

    // Update the profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        instagram_handle: instagramHandle.replace('@', ''),
        creator_niche: creatorNiche,
        follower_count_range: followerRange,
        onboarding_completed: true,
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Update error:', updateError)
      showToast('Error saving profile: ' + updateError.message, 'error')
      setLoading(false)
    } else {
      showToast('Welcome to scout!', 'success')
      onComplete()
    }
  }

  return (
    <motion.div 
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div 
        className="max-w-lg w-full"
        style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          border: '1px solid rgba(0,0,0,0.06)'
        }}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {/* Progress Bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <span 
              className="text-sm font-semibold"
              style={{ color: '#5E6370' }}
            >
              Step {step} of 3
            </span>
            <span 
              className="text-sm font-bold"
              style={{ color: '#FD8AE6' }}
            >
              {Math.round((step / 3) * 100)}%
            </span>
          </div>
          <div 
            style={{
              height: '8px',
              background: 'rgba(12,15,26,0.06)',
              borderRadius: '9999px',
              overflow: 'hidden'
            }}
          >
            <motion.div
              style={{
                height: '100%',
                background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                borderRadius: '9999px'
              }}
              initial={{ width: 0 }}
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Name & Instagram */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <h3 
                className="mb-2"
                style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: '#0C0F1A',
                  fontFamily: 'var(--font-bricolage), sans-serif'
                }}
              >
                Welcome to scout! 👋
              </h3>
              <p 
                className="mb-8"
                style={{
                  color: '#5E6370',
                  fontSize: '1rem',
                  lineHeight: 1.5
                }}
              >
                Let's get to know you better so we can personalize your experience.
              </p>

              <div className="space-y-6">
                <div>
                  <label 
                    className="block text-sm font-semibold mb-2"
                    style={{ color: '#0C0F1A' }}
                  >
                    What's your name? *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full px-4 py-3 text-base transition-all"
                    style={{
                      background: '#FFFFFF',
                      border: '2px solid rgba(0,0,0,0.06)',
                      borderRadius: '12px',
                      color: '#0C0F1A',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#FD8AE6'
                      e.target.style.boxShadow = '0 0 0 3px rgba(253,138,230,0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(0,0,0,0.06)'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>

                <div>
                  <label 
                    className="block text-sm font-semibold mb-2"
                    style={{ color: '#0C0F1A' }}
                  >
                    Instagram handle (optional)
                  </label>
                  <div className="relative">
                    <span 
                      className="absolute left-4 top-1/2"
                      style={{
                        transform: 'translateY(-50%)',
                        color: '#9CA3AF',
                        pointerEvents: 'none'
                      }}
                    >
                      @
                    </span>
                    <input
                      type="text"
                      value={instagramHandle}
                      onChange={(e) => setInstagramHandle(e.target.value)}
                      placeholder="janesmithcooks"
                      className="w-full pl-9 pr-4 py-3 text-base transition-all"
                      style={{
                        background: '#FFFFFF',
                        border: '2px solid rgba(0,0,0,0.06)',
                        borderRadius: '12px',
                        color: '#0C0F1A',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#FD8AE6'
                        e.target.style.boxShadow = '0 0 0 3px rgba(253,138,230,0.1)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(0,0,0,0.06)'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-10">
                <button
                  onClick={() => setStep(2)}
                  disabled={!fullName}
                  className="flex-1 px-6 py-3.5 rounded-xl font-semibold transition-all"
                  style={{
                    background: fullName ? '#0C0F1A' : 'rgba(12,15,26,0.3)',
                    color: '#FFFFFF',
                    cursor: fullName ? 'pointer' : 'not-allowed',
                    boxShadow: fullName ? '0 2px 8px rgba(0,0,0,0.04)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (fullName) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.06)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (fullName) {
                      e.currentTarget.style.background = '#0C0F1A'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
                    }
                  }}
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Niche */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <h3 
                className="mb-2"
                style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: '#0C0F1A',
                  fontFamily: 'var(--font-bricolage), sans-serif'
                }}
              >
                What's your niche?
              </h3>
              <p 
                className="mb-8"
                style={{
                  color: '#5E6370',
                  fontSize: '1rem',
                  lineHeight: 1.5
                }}
              >
                This helps us show you the most relevant brands.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {niches.map((niche) => (
                  <button
                    key={niche}
                    onClick={() => setCreatorNiche(niche)}
                    className="p-4 rounded-xl font-medium transition-all"
                    style={{
                      background: creatorNiche === niche ? 'rgba(253,138,230,0.08)' : '#FFFFFF',
                      border: creatorNiche === niche 
                        ? '2px solid #FD8AE6' 
                        : '2px solid rgba(0,0,0,0.06)',
                      color: creatorNiche === niche ? '#FD8AE6' : '#5E6370',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (creatorNiche !== niche) {
                        e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'
                        e.currentTarget.style.background = '#F8F9FB'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (creatorNiche !== niche) {
                        e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'
                        e.currentTarget.style.background = '#FFFFFF'
                      }
                    }}
                  >
                    {niche}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-10">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-6 py-3.5 rounded-xl font-semibold transition-all"
                  style={{
                    background: '#FFFFFF',
                    color: '#0C0F1A',
                    border: '2px solid rgba(0,0,0,0.06)',
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
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!creatorNiche}
                  className="flex-1 px-6 py-3.5 rounded-xl font-semibold transition-all"
                  style={{
                    background: creatorNiche ? '#0C0F1A' : 'rgba(12,15,26,0.3)',
                    color: '#FFFFFF',
                    cursor: creatorNiche ? 'pointer' : 'not-allowed',
                    boxShadow: creatorNiche ? '0 2px 8px rgba(0,0,0,0.04)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (creatorNiche) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.06)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (creatorNiche) {
                      e.currentTarget.style.background = '#0C0F1A'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
                    }
                  }}
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Followers */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <h3 
                className="mb-2"
                style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: '#0C0F1A',
                  fontFamily: 'var(--font-bricolage), sans-serif'
                }}
              >
                How many followers do you have?
              </h3>
              <p 
                className="mb-8"
                style={{
                  color: '#5E6370',
                  fontSize: '1rem',
                  lineHeight: 1.5
                }}
              >
                This helps us recommend brands in your rate range.
              </p>

              <div className="space-y-3">
                {followerRanges.map((range) => (
                  <button
                    key={range}
                    onClick={() => setFollowerRange(range)}
                    className="w-full p-4 rounded-xl font-medium transition-all text-left"
                    style={{
                      background: followerRange === range ? 'rgba(253,138,230,0.08)' : '#FFFFFF',
                      border: followerRange === range 
                        ? '2px solid #FD8AE6' 
                        : '2px solid rgba(0,0,0,0.06)',
                      color: followerRange === range ? '#FD8AE6' : '#5E6370',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (followerRange !== range) {
                        e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'
                        e.currentTarget.style.background = '#F8F9FB'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (followerRange !== range) {
                        e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'
                        e.currentTarget.style.background = '#FFFFFF'
                      }
                    }}
                  >
                    {range === '1M+' ? '1 Million+' : range.replace('k', ',000')}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-10">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 px-6 py-3.5 rounded-xl font-semibold transition-all"
                  style={{
                    background: '#FFFFFF',
                    color: '#0C0F1A',
                    border: '2px solid rgba(0,0,0,0.06)',
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
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!followerRange || loading}
                  className="flex-1 px-6 py-3.5 rounded-xl font-semibold transition-all"
                  style={{
                    background: followerRange && !loading ? '#0C0F1A' : 'rgba(12,15,26,0.3)',
                    color: '#FFFFFF',
                    cursor: followerRange && !loading ? 'pointer' : 'not-allowed',
                    boxShadow: followerRange && !loading ? '0 2px 8px rgba(0,0,0,0.04)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (followerRange && !loading) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.06)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (followerRange && !loading) {
                      e.currentTarget.style.background = '#0C0F1A'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
                    }
                  }}
                >
                  {loading ? 'Saving...' : 'Complete Setup'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}