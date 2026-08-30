import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { serviceRoleKey, supabaseUrl } from "./lib/env";

/**
 * Supabase client that bypasses RLS entirely.
 *
 * Everywhere else in this app the server carries the anon key, so a mistake in
 * a query still cannot reach another organization's rows. This client has no
 * such floor: the service role sees and writes everything, and the only thing
 * standing between it and the whole database is the code calling it.
 *
 * It exists for one reason. A scan is a fact our own browser observed about a
 * store, not a claim a visitor makes, and there is no signed-in user to attach
 * it to when the scan is anonymous. Writing it needs a trusted writer.
 *
 * Do not reach for this to make a permission problem go away. If a signed-in
 * person cannot read something they should be able to read, the answer is a
 * policy, not this.
 */
export function createAdminClient() {
  return createSupabaseClient(supabaseUrl(), serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
