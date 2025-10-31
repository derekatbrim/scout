'use client'

import { useState } from 'react'
import { supabaseClient } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const supabase = supabaseClient()

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Check your email for the magic link!')
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
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Sign in to manage your brand partnerships
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="mt-8 space-y-6">
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
              {loading ? 'Sending magic link...' : 'Continue with Email'}
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
              We'll email you a magic link for a password-free sign in.
            </p>
          </div>

          {/* Sign Up Link */}
          <div className="text-center pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Don't have an account?{' '}
              <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                Sign up
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
              "Scout helped me land 3 new brand deals in my first month. The brand database is a game-changer."
            </p>
            <footer className="text-sm text-slate-300">
              — Creator with 500K followers
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  )
}