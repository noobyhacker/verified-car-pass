import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY as string;

// Public client — anon key, respects RLS
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient<Database>(supabaseUrl, supabaseAnonKey)
    : null;

// Admin client — service role key, bypasses RLS for admin mutations
// Only used server-side style calls from admin dashboard
export const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })
    : supabase; // fallback to anon if no service key set

export const isSupabaseEnabled = !!supabase;
