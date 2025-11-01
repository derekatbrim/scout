// lib/supabase-server.ts
import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client with admin privileges
// ONLY use this in API routes and server components
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
