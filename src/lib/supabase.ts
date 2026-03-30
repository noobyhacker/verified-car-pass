import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Public client — anon key only, respects RLS.
// All admin mutations go through /api/admin (Vercel serverless).
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient<Database>(supabaseUrl, supabaseAnonKey)
    : null;

// supabaseAdmin is gone — service key lives server-side only in api/admin.ts
export const isSupabaseEnabled = !!supabase;
