// lib/supabase.ts
'use client'

import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null

export const supabaseClient = (): SupabaseClient => {
  // reuse if we already made one
  if (supabaseInstance) {
    return supabaseInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // if we're in SSR/prerender and envs aren't there, don't blow up the whole build
  if (!supabaseUrl || !supabaseAnonKey) {
    // if this somehow runs in the browser, keep old behavior
    if (typeof window !== 'undefined') {
      throw new Error('supabaseUrl is required.')
    }

    // server / build phase: return a harmless stub so Next can prerender 404, error, etc.
    return {
      from: () => ({
        select: async () => ({ data: [], error: null }),
        insert: async () => ({ data: null, error: null }),
        update: async () => ({ data: null, error: null }),
        delete: async () => ({ data: null, error: null }),
        eq: () => ({
          select: async () => ({ data: [], error: null }),
        }),
      }),
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithOtp: async () => ({ data: null, error: null }),
      },
    } as unknown as SupabaseClient
  }

  // normal happy path
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'scout-auth',
    },
  })

  return supabaseInstance
}
