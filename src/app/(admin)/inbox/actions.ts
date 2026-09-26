"use server";

import { z } from "zod";

import { fail, friendlyError, succeed, type ActionResult } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const uuid = z.string().uuid();
const statusSchema = z.enum(["new", "in_progress", "done", "spam"]);

export type SubmissionStatus = z.infer<typeof statusSchema>;

/** Inbox changes never affect the public website — no revalidation needed. */
export async function updateSubmission(
  id: string,
  patch: { status?: SubmissionStatus; notes?: string },
): Promise<ActionResult<null>> {
  await requireAdmin();
  const parsed = z
    .object({ status: statusSchema.optional(), notes: z.string().max(5000).optional() })
    .safeParse(patch);
  if (!parsed.success || !uuid.safeParse(id).success) return fail("Invalid update.");

  const supabase = await createClient();
  const { error } = await supabase.from("submissions").update(parsed.data).eq("id", id);
  if (error) return fail(friendlyError(error));
  return succeed(null);
}

export async function deleteSubmission(id: string): Promise<ActionResult<null>> {
  await requireAdmin();
  if (!uuid.safeParse(id).success) return fail("Invalid submission.");
  const supabase = await createClient();

  const { data: row } = await supabase.from("submissions").select("data").eq("id", id).maybeSingle();
  const files = ((row?.data as { attachments?: string[] } | null)?.attachments ?? []).filter((p) => p.startsWith("bookings/"));

  const { error } = await supabase.from("submissions").delete().eq("id", id);
  if (error) return fail(friendlyError(error));
  if (files.length) await supabase.storage.from("submissions").remove(files);
  return succeed(null);
}

export type Attachment = { path: string; name: string; url: string | null; isImage: boolean };

/** Short-lived links to a booking's reference files (the bucket is private). */
export async function getAttachmentLinks(id: string): Promise<Attachment[]> {
  await requireAdmin();
  if (!uuid.safeParse(id).success) return [];
  const supabase = await createClient();
  const { data: row } = await supabase.from("submissions").select("data").eq("id", id).maybeSingle();
  const paths = ((row?.data as { attachments?: string[] } | null)?.attachments ?? []).filter((p) => p.startsWith("bookings/"));
  if (!paths.length) return [];

  const { data } = await supabase.storage.from("submissions").createSignedUrls(paths, 60 * 30);
  return paths.map((path, i) => ({
    path,
    name: path.split("/").pop()!.replace(/^\d+-/, ""),
    url: data?.[i]?.signedUrl ?? null,
    isImage: !/\.pdf$/i.test(path),
  }));
}
