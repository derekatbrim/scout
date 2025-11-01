'use client'

import { useState, useRef, useCallback } from 'react'
import { supabaseClient } from '@/lib/supabase'
import { showToast } from '@/components/ui/toast'

interface PortfolioUploadProps {
  userId: string
  onSuccess: () => void
  onClose: () => void
}

interface UploadFormData {
  file: File | null
  previewUrl: string | null
  platform: string
  postType: string
  brandName: string
  description: string
  postUrl: string
  views: string
  likes: string
  comments: string
  postedAt: string
}

const PLATFORM_OPTIONS = [
  { value: '', label: 'Select platform' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'other', label: 'Other' },
]

const POST_TYPE_OPTIONS = [
  { value: '', label: 'Select type' },
  { value: 'reel', label: 'Reel' },
  { value: 'story', label: 'Story' },
  { value: 'static', label: 'Static Post' },
  { value: 'video', label: 'Video' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'other', label: 'Other' },
]

// File size limit: 10MB (cost-conscious!)
const MAX_FILE_SIZE = 10 * 1024 * 1024

export function PortfolioUpload({ userId, onSuccess, onClose }: PortfolioUploadProps) {
  const supabase = supabaseClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  
  const [formData, setFormData] = useState<UploadFormData>({
    file: null,
    previewUrl: null,
    platform: '',
    postType: '',
    brandName: '',
    description: '',
    postUrl: '',
    views: '',
    likes: '',
    comments: '',
    postedAt: '',
  })

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB to keep hosting costs low.`
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
    if (!validTypes.includes(file.type)) {
      return 'Invalid file type. Please upload an image (JPEG, PNG, GIF, WebP) or video (MP4, MOV, WebM).'
    }

    return null
  }

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    const error = validateFile(file)

    if (error) {
      showToast(error, 'error')
      return
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    const mediaType = file.type.startsWith('video') ? 'video' : 'image'

    setFormData(prev => ({
      ...prev,
      file,
      previewUrl,
    }))
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    handleFiles(e.dataTransfer.files)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  const handleUpload = async () => {
    if (!formData.file) {
      showToast('Please select a file to upload', 'error')
      return
    }

    if (!formData.platform) {
      showToast('Please select a platform', 'error')
      return
    }

    setUploading(true)

    try {
      // Generate unique filename
      const fileExt = formData.file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('portfolio')
        .upload(filePath, formData.file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('portfolio')
        .getPublicUrl(filePath)

      // Prepare metrics object
      const metrics: any = {}
      if (formData.views) metrics.views = parseInt(formData.views)
      if (formData.likes) metrics.likes = parseInt(formData.likes)
      if (formData.comments) metrics.comments = parseInt(formData.comments)
      
      // Calculate engagement rate if we have the data
      if (formData.views && formData.likes && formData.comments) {
        const views = parseInt(formData.views)
        const engagements = parseInt(formData.likes) + parseInt(formData.comments)
        metrics.engagement_rate = ((engagements / views) * 100).toFixed(2)
      }

      // Save portfolio item to database
      const { error: dbError } = await supabase
        .from('portfolio_items')
        .insert({
          user_id: userId,
          media_url: publicUrl,
          media_type: formData.file.type.startsWith('video') ? 'video' : 'image',
          file_size_bytes: formData.file.size,
          platform: formData.platform || null,
          post_type: formData.postType || null,
          brand_name: formData.brandName || null,
          description: formData.description || null,
          post_url: formData.postUrl || null,
          metrics: Object.keys(metrics).length > 0 ? metrics : null,
          posted_at: formData.postedAt || null,
          display_order: 0, // New items go to the front
        })

      if (dbError) throw dbError

      showToast('✨ Work added to your portfolio!', 'success')
      
      // Clean up preview URL
      if (formData.previewUrl) {
        URL.revokeObjectURL(formData.previewUrl)
      }

      onSuccess()
    } catch (error: any) {
      console.error('Upload error:', error)
      showToast(error.message || 'Failed to upload. Please try again.', 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ 
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        style={{
          border: '1px solid rgba(0,0,0,0.06)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between"
          style={{ borderRadius: '16px 16px 0 0' }}
        >
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Add to portfolio</h2>
            <p className="text-sm text-slate-600 mt-1">Showcase your best brand collaborations</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={uploading}
          >
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* File Upload Area */}
          {!formData.previewUrl ? (
            <div
              className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-[#fd8ae6] bg-[#fd8ae6]/5'
                  : 'border-slate-300 hover:border-[#fd8ae6] hover:bg-slate-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileInput}
                className="hidden"
              />
              
              <div className="flex flex-col items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
                  }}
                >
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                
                <div>
                  <p className="text-lg font-semibold text-slate-900 mb-1">
                    Drop your file here, or <span className="text-[#fd8ae6]">browse</span>
                  </p>
                  <p className="text-sm text-slate-500">
                    Images or videos up to 10MB
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    Supported: JPEG, PNG, GIF, WebP, MP4, MOV, WebM
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Preview
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-slate-100">
                {formData.file?.type.startsWith('video') ? (
                  <video
                    src={formData.previewUrl}
                    controls
                    className="w-full max-h-96 object-contain"
                  />
                ) : (
                  <img
                    src={formData.previewUrl}
                    alt="Preview"
                    className="w-full max-h-96 object-contain"
                  />
                )}
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  {formData.file?.name} ({(formData.file?.size! / 1024 / 1024).toFixed(2)} MB)
                </span>
                <button
                  onClick={() => {
                    if (formData.previewUrl) {
                      URL.revokeObjectURL(formData.previewUrl)
                    }
                    setFormData(prev => ({ ...prev, file: null, previewUrl: null }))
                  }}
                  className="text-red-600 hover:text-red-800 font-medium"
                  disabled={uploading}
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* Form Fields - Only show if file is selected */}
          {formData.previewUrl && (
            <div className="space-y-5 pt-4 border-t border-slate-200">
              {/* Platform & Post Type Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Platform *
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#fd8ae6] focus:border-[#fd8ae6] transition-all"
                    disabled={uploading}
                  >
                    {PLATFORM_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Post Type
                  </label>
                  <select
                    value={formData.postType}
                    onChange={(e) => setFormData(prev => ({ ...prev, postType: e.target.value }))}
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#fd8ae6] focus:border-[#fd8ae6] transition-all"
                    disabled={uploading}
                  >
                    {POST_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Brand Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Brand Partner
                </label>
                <input
                  type="text"
                  placeholder="e.g., Finest Call, Athletic Greens"
                  value={formData.brandName}
                  onChange={(e) => setFormData(prev => ({ ...prev, brandName: e.target.value }))}
                  className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#fd8ae6] focus:border-[#fd8ae6] transition-all"
                  disabled={uploading}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Tell us about this collaboration..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#fd8ae6] focus:border-[#fd8ae6] transition-all resize-none"
                  disabled={uploading}
                />
              </div>

              {/* Optional: Metrics Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-slate-700">
                    Performance Metrics <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <input
                      type="number"
                      placeholder="Views"
                      value={formData.views}
                      onChange={(e) => setFormData(prev => ({ ...prev, views: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#fd8ae6] focus:border-[#fd8ae6] transition-all"
                      disabled={uploading}
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Likes"
                      value={formData.likes}
                      onChange={(e) => setFormData(prev => ({ ...prev, likes: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#fd8ae6] focus:border-[#fd8ae6] transition-all"
                      disabled={uploading}
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Comments"
                      value={formData.comments}
                      onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                      className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#fd8ae6] focus:border-[#fd8ae6] transition-all"
                      disabled={uploading}
                    />
                  </div>
                </div>
              </div>

              {/* Post URL & Date Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Original Post URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://instagram.com/p/..."
                    value={formData.postUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, postUrl: e.target.value }))}
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#fd8ae6] focus:border-[#fd8ae6] transition-all"
                    disabled={uploading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Posted Date
                  </label>
                  <input
                    type="date"
                    value={formData.postedAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, postedAt: e.target.value }))}
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#fd8ae6] focus:border-[#fd8ae6] transition-all"
                    disabled={uploading}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between"
          style={{ borderRadius: '0 0 16px 16px' }}
        >
          <p className="text-sm text-slate-500">
            * Required fields
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={uploading}
              className="px-6 py-2 border-2 border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading || !formData.file || !formData.platform}
              className="px-6 py-2 rounded-xl text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: uploading || !formData.file || !formData.platform
                  ? '#9CA3AF'
                  : 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
              }}
            >
              {uploading ? 'Uploading...' : 'Add to Portfolio'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}