import "server-only";

import { refresh } from "next/cache";

import { revalidateWebsite } from "@/lib/revalidate";

/** Every server action returns this shape so the UI can toast consistently. */
export type ActionResult<T = undefined> =
  | { ok: true; data: T; website: "updated" | "pending" }
  | { ok: false; error: string };

export function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

/**
 * After a successful write: refresh the admin screen and ask the public site to
 * re-fetch the given cache tags. A failed website refresh never fails the save —
 * the site's hourly fallback revalidation will catch up.
 */
export async function succeed<T>(data: T, websiteTags: string[] = []): Promise<ActionResult<T>> {
  refresh();
  if (!websiteTags.length) return { ok: true, data, website: "updated" };
  const result = await revalidateWebsite(websiteTags);
  return { ok: true, data, website: result.ok ? "updated" : "pending" };
}

/** Turn a Supabase/Postgres error into something an editor can act on. */
export function friendlyError(error: { message: string; code?: string } | null, fallback = "Something went wrong.") {
  if (!error) return fallback;
  if (error.code === "23505") return "That value is already in use — it must be unique.";
  if (error.code === "23503") return "This item is still in use elsewhere, so it can't be removed.";
  if (error.code === "42501") return "You don't have permission to do that.";
  return error.message || fallback;
}
