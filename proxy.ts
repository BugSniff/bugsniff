import type { NextRequest } from "next/server";
import { refreshSession } from "@/packages/supabase/session";

export async function proxy(request: NextRequest) {
  return refreshSession(request);
}

export const config = {
  // Everything except static assets and image files.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
