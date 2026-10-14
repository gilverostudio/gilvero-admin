import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Landing point for password-reset emails. Supports both link styles Supabase
 * can send: `?code=` (default template, PKCE) and `?token_hash=&type=recovery`.
 * On success the user lands on /account to choose a new password.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const supabase = await createClient();

  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type === "recovery") {
    ok = !(await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash })).error;
  }

  // A fresh URL, so the one-time token never stays in the address bar or history.
  const target = new URL(ok ? "/account" : "/login?error=link-expired", url.origin);
  return NextResponse.redirect(target);
}
