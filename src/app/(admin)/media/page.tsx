import type { Metadata } from "next";

import { PageTitle } from "@/components/shell/page-title";
import { requireAdmin } from "@/lib/auth";
import { MEDIA_COLUMNS, type MediaItem } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

import { MediaLibrary } from "./media-library";

export const metadata: Metadata = { title: "Media Library" };

export default async function MediaPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: items }, { data: usage }] = await Promise.all([
    supabase.from("media").select(MEDIA_COLUMNS).order("created_at", { ascending: false }),
    supabase.from("media_usage").select("media_id"),
  ]);

  const usageCount: Record<string, number> = {};
  for (const row of usage ?? []) usageCount[row.media_id] = (usageCount[row.media_id] ?? 0) + 1;

  return (
    <>
      <PageTitle
        eyebrow="Media Library"
        title="Every image on the site."
        copy="Upload once, use anywhere. Set alt text and a focal point so crops always keep the subject in frame."
      />
      <MediaLibrary initialItems={(items ?? []) as MediaItem[]} usageCount={usageCount} />
    </>
  );
}
