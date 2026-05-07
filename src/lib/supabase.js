import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are missing. Please check your .env file.')
}

// Use a singleton instance to avoid "Multiple GoTrueClient instances" warning
// and ensure session consistency across the app
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
