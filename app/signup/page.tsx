'use client'

import { useState } from 'react'
import { supabaseClient } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import Link from 'next/link'
import Image from 'next/image'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const supabase = supabaseClient()

    // Use environment variable or fallback to current origin
    // Redirect to auth callback page which will handle session and redirect to dashboard
    const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL 
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      : `${window.location.origin}/auth/callback`

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        }
      },
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Check your email for the magic link to complete signup!')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-md w-full space-y-8">
          {/* Logo */}
          <div>
            <Link href="/">
              <h1 className="text-4xl font-bold text-slate-900">Scout</h1>
            </Link>
            <h2 className="mt-6 text-3xl font-bold text-slate-900">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Start managing your brand partnerships today
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignUp} className="mt-8 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                Full name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Derek Koza"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
                className="text-base"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="text-base"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 text-base" 
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>

            {message && (
              <div className={`text-sm p-4 rounded-lg ${
                message.includes('Check your email') 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message}
              </div>
            )}
          </form>

          <div className="text-center">
            <p className="text-xs text-slate-500">
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>

          {/* Login Link */}
          <div className="text-center pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Hero Image */}
      <div className="hidden lg:block relative flex-1 bg-slate-900">
        <Image
          src="/images/login-hero.png"
          alt="Scout Dashboard"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-slate-900/20" />
        <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
          <blockquote className="space-y-2">
            <p className="text-xl font-medium">
              "Finally, a tool built specifically for creators. Scout makes brand outreach so much easier."
            </p>
            <footer className="text-sm text-slate-300">
              — Food & lifestyle creator
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  )
}