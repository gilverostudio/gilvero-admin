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

export type WebsiteLink = "connected" | "no-cms" | "site-missing-secret" | "unauthorised" | "unreachable" | "not-configured";

/** The website's secret-free /api/status report (older builds don't have it). */
async function websiteStatus() {
  try {
    const res = await fetch(`${env.websiteUrl()}/api/status`, { cache: "no-store", signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    return (await res.json()) as { cms?: boolean; revalidate?: boolean };
  } catch {
    return null;
  }
}

/**
 * Health check used on the dashboard: is the website reading the CMS, is it
 * reachable, and does it accept our secret?
 */
export async function checkWebsiteLink(): Promise<WebsiteLink> {
  const secret = env.revalidateSecret();
  const [status, auth] = await Promise.all([
    websiteStatus(),
    secret
      ? fetch(`${env.websiteUrl()}/api/revalidate`, {
          headers: { authorization: `Bearer ${secret}` },
          cache: "no-store",
          signal: AbortSignal.timeout(4000),
        }).then(
          (res) => res.status,
          () => 0,
        )
      : Promise.resolve(null),
  ]);

  if (status?.cms === false) return "no-cms";
  if (auth === null) return "not-configured";
  if (auth === 401) return status?.revalidate === false ? "site-missing-secret" : "unauthorised";
  return auth >= 200 && auth < 300 ? "connected" : "unreachable";
}
