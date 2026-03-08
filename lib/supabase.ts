import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

/** Returns the shared Supabase client, creating it on first access. */
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.MBG_PUBLIC_SUPABASE_URL;
    const key = process.env.MBG_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error("Missing Supabase environment variables.");
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}
