import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createClient } from "@/packages/supabase/server";

/**
 * Where the link in the confirmation e-mail lands.
 *
 * Supabase bounces the recipient through its own `/auth/v1/verify` and then
 * back here carrying a one-time `code`. Trading that code for a session is the
 * last step of signing up: without this route the link opens the app logged
 * out and the account stays unconfirmed forever.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) redirect("/");
  }

  redirect(
    `/login?error=${encodeURIComponent("Link de confirmação inválido ou expirado.")}`
  );
}
