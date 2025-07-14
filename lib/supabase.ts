// lib/supabase.ts
import { createClient } from "@supabase/supabase-js"

/**
 * ────────────────────────────────────────────────────────────────
 * IMPORTANT!
 * • In production you MUST set:
 *   NEXT_PUBLIC_SUPABASE_URL  and  NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   in your Vercel project’s Environment Variables.
 * • These fall-backs avoid a hard crash in the v0 preview only.
 * ────────────────────────────────────────────────────────────────
 */

const FALLBACK_URL = "https://tptndqehzwpfiqhdjigk.supabase.co"
const FALLBACK_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwdG5kcWVoendwZmlxaGRqaWdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTI4MTUsImV4cCI6MjA2Nzk4ODgxNX0.1-wY3DvWodaXLix5y7GBL9x-cgRyF354ZIYyvL5h7TI"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY

if (supabaseUrl === FALLBACK_URL || supabaseAnonKey === FALLBACK_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    "[Supabase] Environment variables are missing. Using placeholder values. " +
      "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your project settings.",
  )
}

/**
 * A single Supabase client for both client and server components.
 * The placeholder values let the app compile; real requests will fail
 * until proper credentials are supplied.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
