import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createClient } from "@/packages/supabase/server";

/**
 * Reasons Supabase refuses a link, in our own words.
 *
 * Its `error_description` is not reflected back to the page: it arrives in the
 * URL, so anyone could craft a link that makes the login screen say whatever
 * they like. Known codes get a message we wrote; anything else stays generic.
 */
const REFUSALS: Record<string, string> = {
  otp_expired:
    "O link expirou ou já foi usado. Cadastre-se de novo para receber outro.",
  access_denied:
    "O link de confirmação foi recusado. Cadastre-se de novo para receber outro.",
};

const GENERIC = "Link de confirmação inválido ou expirado.";

function backToLogin(message: string): never {
  redirect(`/login?error=${encodeURIComponent(message)}`);
}

/**
 * Where the link in the confirmation e-mail lands.
 *
 * Supabase bounces the recipient through its own `/auth/v1/verify` and then
 * back here carrying a one-time `code`. Trading that code for a session is the
 * last step of signing up: without this route the link opens the app logged
 * out and the account stays unconfirmed forever.
 *
 * A refused link arrives with no `code` at all — the reason is in `error_code`
 * instead. Reading only `code` would turn every distinct failure into the same
 * shrug.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");

  if (!code) {
    const refusal = params.get("error_code") ?? params.get("error") ?? "";
    backToLogin(REFUSALS[refusal] ?? GENERIC);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) backToLogin(REFUSALS[error.code ?? ""] ?? GENERIC);

  redirect("/");
}
