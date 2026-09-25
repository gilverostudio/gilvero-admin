"use server";

import { z } from "zod";

import { fail, friendlyError, succeed, type ActionResult } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
import { MEDIA_BUCKET, MEDIA_COLUMNS, type MediaItem } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

/** Media is shown on portfolio pages today; later phases add their own tags. */
const WEBSITE_TAGS = ["portfolio"];

const uploadedSchema = z.array(
  z.object({
    storage_path: z.string().regex(/^library\/[\w./-]+$/),
    file_name: z.string().min(1).max(255),
    mime_type: z.string().startsWith("image/"),
    size_bytes: z.number().int().positive(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    alt: z.string().max(300).default(""),
  }),
);

/** Record files that the browser has already uploaded to Storage. */
export async function registerMedia(input: z.input<typeof uploadedSchema>): Promise<ActionResult<MediaItem[]>> {
  await requireAdmin();
  const parsed = uploadedSchema.safeParse(input);
  if (!parsed.success) return fail("Upload details were invalid.");

  const supabase = await createClient();
  const { data, error } = await supabase.from("media").insert(parsed.data).select(MEDIA_COLUMNS);
  if (error) return fail(friendlyError(error));
  return succeed(data as MediaItem[]);
}

const updateSchema = z.object({
  alt: z.string().max(300),
  focal_x: z.number().min(0).max(1),
  focal_y: z.number().min(0).max(1),
});

export async function updateMedia(id: string, input: z.input<typeof updateSchema>): Promise<ActionResult<MediaItem>> {
  await requireAdmin();
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return fail("Please check the alt text and focal point.");

  const supabase = await createClient();
  const { data, error } = await supabase.from("media").update(parsed.data).eq("id", id).select(MEDIA_COLUMNS).single();
  if (error) return fail(friendlyError(error));
  return succeed(data as MediaItem, WEBSITE_TAGS);
}

export type MediaUsage = { kind: string; label: string; href: string | null };

export async function getMediaUsage(id: string): Promise<MediaUsage[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("media_usage").select("kind, label, href").eq("media_id", id);
  return data ?? [];
}

/** Delete an image — refused while anything on the site still uses it. */
export async function deleteMedia(id: string): Promise<ActionResult<null>> {
  await requireAdmin();
  const supabase = await createClient();

  const usage = await getMediaUsage(id);
  if (usage.length) {
    return fail(`This image is still used in ${usage.length} place${usage.length > 1 ? "s" : ""}. Replace it there first.`);
  }

  const { data: item, error: readError } = await supabase.from("media").select("storage_path").eq("id", id).single();
  if (readError || !item) return fail("Image not found.");

  const { error } = await supabase.from("media").delete().eq("id", id);
  if (error) return fail(friendlyError(error));

  // Remove the file last: a leftover file is harmless, a row pointing at nothing is not.
  await supabase.storage.from(MEDIA_BUCKET).remove([item.storage_path]);
  return succeed(null);
}

/** Library listing for the picker dialog (newest first). */
export async function listMedia(search = ""): Promise<MediaItem[]> {
  await requireAdmin();
  const supabase = await createClient();
  let query = supabase.from("media").select(MEDIA_COLUMNS).order("created_at", { ascending: false }).limit(300);
  const term = search.trim();
  if (term) query = query.or(`file_name.ilike.%${term.replace(/[%,()]/g, "")}%,alt.ilike.%${term.replace(/[%,()]/g, "")}%`);
  const { data } = await query;
  return (data ?? []) as MediaItem[];
}
