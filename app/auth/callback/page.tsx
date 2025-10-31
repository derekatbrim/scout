'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '../../../lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = supabaseClient()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash parameters from the URL (Supabase magic link uses hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (accessToken && refreshToken) {
          // Set the session manually
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError) {
            console.error('Session error:', sessionError)
            setError('Failed to authenticate. Please try again.')
            setTimeout(() => router.push('/login'), 2000)
            return
          }

          // Session set successfully - redirect to dashboard
          router.push('/dashboard')
        } else {
          // No tokens in URL - check if we already have a session
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session) {
            router.push('/dashboard')
          } else {
            setError('Invalid authentication link. Please try again.')
            setTimeout(() => router.push('/login'), 2000)
          }
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        setError('Something went wrong. Please try logging in again.')
        setTimeout(() => router.push('/login'), 2000)
      }
    }

    handleAuthCallback()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F9FB' }}>
      <div className="text-center">
        {error ? (
          <div>
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#0C0F1A' }}>
              Authentication Error
            </h2>
            <p style={{ color: '#5E6370' }}>{error}</p>
            <p className="text-sm mt-2" style={{ color: '#9CA3AF' }}>
              Redirecting to login...
            </p>
          </div>
        ) : (
          <div>
            <div 
              className="inline-block animate-spin mb-4"
              style={{
                width: '40px',
                height: '40px',
                border: '4px solid rgba(253,138,230,0.2)',
                borderTopColor: '#FD8AE6',
                borderRadius: '50%'
              }}
            />
            <h2 className="text-xl font-bold mb-2" style={{ color: '#0C0F1A' }}>
              Completing sign in...
            </h2>
            <p style={{ color: '#5E6370' }}>
              You'll be redirected to your dashboard in a moment
            </p>
          </div>
        )}
      </div>
    </div>
  )
}