/**
 * Read lazily, never at module load. Vercel builds the app before the project
 * has its environment variables, and a top-level read turns that into a build
 * failure instead of a clear runtime error.
 *
 * The value is passed in rather than looked up by name, and that is not a
 * style choice. Next replaces `process.env.NEXT_PUBLIC_SOMETHING` with a
 * literal when it bundles for the browser, and it can only do that when the
 * expression is written out in full. `process.env[name]` cannot be replaced, so
 * in the browser it reads undefined and every one of these throws — which is
 * exactly what happened the first time a component ran client-side.
 */
function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export const supabaseUrl = () =>
  required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);

export const supabaseAnonKey = () =>
  required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

/**
 * Deliberately not `NEXT_PUBLIC_`. The prefix is what ships a value to the
 * browser, and this one bypasses RLS — the naming is the guardrail.
 */
export const serviceRoleKey = () =>
  required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
