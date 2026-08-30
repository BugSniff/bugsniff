import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./lib/env";

/** Supabase client for browser code. Carries the anon key and obeys RLS. */
export function createClient() {
  return createBrowserClient(supabaseUrl(), supabaseAnonKey());
}
