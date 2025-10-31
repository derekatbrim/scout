import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton instance - create once, reuse everywhere
let supabaseInstance: SupabaseClient | null = null

/**
 * Get or create the Supabase client singleton
 * This ensures we only create ONE client instance for the entire app
 * Dramatically improves performance by reusing the same client
 */
export const supabaseClient = () => {
  // If client already exists, return it immediately (FAST!)
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Otherwise, create it once and cache it
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true, // CRITICAL: Preserves sessions across page navigations
      autoRefreshToken: true, // Auto-refresh tokens before they expire
      detectSessionInUrl: true, // Detect OAuth/magic link sessions in URL
      storageKey: 'scout-auth', // Custom key for localStorage
    },
  })

  return supabaseInstance
}