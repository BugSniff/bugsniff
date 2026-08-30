/**
 * Read lazily, never at module load. Vercel builds the app before the project
 * has its environment variables, and a top-level read turns that into a build
 * failure instead of a clear runtime error.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export const supabaseUrl = () => required("NEXT_PUBLIC_SUPABASE_URL");
export const supabaseAnonKey = () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY");

/**
 * Deliberately not `NEXT_PUBLIC_`. The prefix is what ships a value to the
 * browser, and this one bypasses RLS — the naming is the guardrail.
 */
export const serviceRoleKey = () => required("SUPABASE_SERVICE_ROLE_KEY");
