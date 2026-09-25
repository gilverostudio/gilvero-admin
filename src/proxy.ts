import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

const PUBLIC_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  const { response, signedIn } = await updateSession(request);
  const isPublic = PUBLIC_PATHS.some((path) => request.nextUrl.pathname.startsWith(path));

  if (!signedIn && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (request.nextUrl.pathname !== "/") url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|login.jpg).*)"],
};
