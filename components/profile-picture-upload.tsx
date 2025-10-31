'use client'

import { useState, useRef } from 'react'
import { supabaseClient } from '../lib/supabase'
import { showToast } from './ui/toast'

interface ProfilePictureUploadProps {
  userId: string
  currentImageUrl?: string
  userName?: string
  onUploadComplete: (url: string) => void
}

export function ProfilePictureUpload({ 
  userId, 
  currentImageUrl,
  userName,
  onUploadComplete 
}: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = supabaseClient()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file', 'error')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be less than 5MB', 'error')
      return
    }

    setUploading(true)

    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `profile-pictures/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update profile with new image URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ featured_image_url: publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      setPreviewUrl(publicUrl)
      onUploadComplete(publicUrl)
      showToast('✓ Profile picture updated!', 'success')
    } catch (error: any) {
      console.error('Upload error:', error)
      showToast('Error uploading image: ' + error.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="relative group cursor-pointer" onClick={handleClick}>
      {/* Profile Picture Circle */}
      <div 
        className="overflow-hidden"
        style={{
          width: '112px',
          height: '112px',
          borderRadius: '50%',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '3px solid #FFFFFF',
          position: 'relative'
        }}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center text-white font-bold"
            style={{
              background: 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)',
              fontSize: '2.5rem',
              fontFamily: 'var(--font-bricolage), sans-serif'
            }}
          >
            {userName 
              ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
              : userId.substring(0, 2).toUpperCase()
            }
          </div>
        )}

        {/* Hover Overlay */}
        <div 
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{
            background: 'rgba(12,15,26,0.75)',
            backdropFilter: 'blur(4px)',
            borderRadius: '50%'
          }}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div 
                className="animate-spin"
                style={{
                  width: '24px',
                  height: '24px',
                  border: '3px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#FFFFFF',
                  borderRadius: '50%'
                }}
              />
              <span 
                className="font-medium"
                style={{ fontSize: '12px', color: '#FFFFFF' }}
              >
                Uploading...
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <svg 
                className="w-8 h-8" 
                fill="none" 
                stroke="#FFFFFF" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" 
                />
              </svg>
              <span 
                className="font-medium"
                style={{ fontSize: '12px', color: '#FFFFFF' }}
              >
                {previewUrl ? 'Change' : 'Upload'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Edit Badge - Bottom Right */}
      <div 
        className="absolute bottom-0 right-0 flex items-center justify-center transition-all duration-150"
        style={{
          width: '34px',
          height: '34px',
          background: '#FFFFFF',
          border: '2px solid rgba(0,0,0,0.06)',
          borderRadius: '50%',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          transform: uploading ? 'scale(0)' : 'scale(1)'
        }}
        onMouseEnter={(e) => {
          if (!uploading) {
            e.currentTarget.style.background = 'linear-gradient(135deg, #FD8AE6 0%, #C77DFF 100%)'
            e.currentTarget.style.borderColor = 'transparent'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#FFFFFF'
          e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'
        }}
      >
        <svg 
          className="w-4 h-4 transition-colors"
          style={{ color: '#5E6370' }}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          onMouseEnter={(e) => {
            if (!uploading) {
              e.currentTarget.style.color = '#FFFFFF'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#5E6370'
          }}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" 
          />
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" 
          />
        </svg>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
      />
    </div>
  )
}