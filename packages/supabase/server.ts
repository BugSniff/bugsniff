import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAnonKey, supabaseUrl } from "./lib/env";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 *
 * It carries the anon key, not the service role: every read is still subject to
 * RLS, so a bug in a query cannot leak another organization's rows.
 */
export async function createClient() {
  const store = await cookies();

  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            store.set(name, value, options);
          }
        } catch {
          // Server Components cannot write cookies. Harmless: the proxy runs
          // before rendering and has already refreshed the session.
        }
      },
    },
  });
}
