import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";

/**
 * Refreshes the Supabase session cookie on every request and reports whether
 * a user is signed in. This is an optimistic check only — admin membership is
 * verified on the server in `requireAdmin()`.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.supabaseUrl(), env.supabaseAnonKey(), {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Must run before anything else so a refreshed token is written to the response.
  const { data } = await supabase.auth.getClaims();

  response.headers.set("Cache-Control", "private, no-store");
  return { response, signedIn: Boolean(data?.claims?.sub) };
}
