import "server-only";

import { env } from "@/lib/env";

/**
 * Ask the public website to refresh cached content after a save.
 * Tags follow the website's data layer, e.g. "projects", "project:the-lahore-vows".
 */
export async function revalidateWebsite(tags: string[]) {
  const secret = env.revalidateSecret();
  if (!secret) return { ok: false as const, reason: "WEBSITE_REVALIDATE_SECRET is not set" };

  try {
    const res = await fetch(`${env.websiteUrl()}/api/revalidate`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${secret}` },
      body: JSON.stringify({ tags }),
      cache: "no-store",
    });
    if (!res.ok) return { ok: false as const, reason: `Website responded ${res.status}` };
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, reason: error instanceof Error ? error.message : "Network error" };
  }
}

/** Health check used on the dashboard: is the website reachable and is the secret accepted? */
export async function checkWebsiteLink(): Promise<"connected" | "unauthorised" | "unreachable" | "not-configured"> {
  const secret = env.revalidateSecret();
  if (!secret) return "not-configured";
  try {
    const res = await fetch(`${env.websiteUrl()}/api/revalidate`, {
      headers: { authorization: `Bearer ${secret}` },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (res.status === 401) return "unauthorised";
    return res.ok ? "connected" : "unreachable";
  } catch {
    return "unreachable";
  }
}
