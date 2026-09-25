import "server-only";

import { MEDIA_COLUMNS, type MediaItem } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

import type { Editor, Part } from "./editors";
import { collectMediaIds, normalize, type Field } from "./schema";

export type PartValue = Record<string, unknown>;
export type LoadedEditor = { id: string; values: PartValue[] };

/** Fields that describe a part's value shape. */
export function partFields(part: Part): Field[] {
  return part.kind === "collection" ? [part.list] : part.fields;
}

export async function loadPart(part: Part): Promise<PartValue> {
  const supabase = await createClient();
  const fields = partFields(part);

  switch (part.kind) {
    case "section": {
      const { data } = await supabase.from("site_sections").select("data").eq("key", part.key).maybeSingle();
      return normalize(fields, data?.data as PartValue);
    }
    case "collection": {
      const columns = ["id", ...part.list.fields.map((f) => f.name)].join(", ");
      let query =
        part.derive === "faq"
          ? supabase.from(part.table).select(columns).order("topic_order").order("sort_order")
          : supabase.from(part.table).select(columns).order("sort_order");
      for (const [column, value] of Object.entries(part.scope ?? {})) query = query.eq(column, value);
      const { data } = await query;
      return normalize(fields, { items: (data ?? []) as unknown as PartValue[] });
    }
    case "pageCta": {
      const { data } = await supabase.from("pages").select("cta").eq("slug", part.slug).maybeSingle();
      return normalize(fields, data?.cta as PartValue);
    }
    case "settings": {
      const { data } = await supabase
        .from("site_settings")
        .select(fields.map((f) => f.name).join(", "))
        .eq("id", 1)
        .maybeSingle();
      return normalize(fields, data as unknown as PartValue);
    }
    case "navigation": {
      const { data } = await supabase.from("navigation").select("data").eq("key", part.key).maybeSingle();
      const raw = data?.data as unknown;
      return normalize(fields, part.arrayField ? { [part.arrayField]: raw ?? [] } : (raw as PartValue));
    }
  }
}

/** Load every part of every editor, plus the media referenced by them (for thumbnails). */
export async function loadEditors(editors: Editor[]) {
  const loaded: LoadedEditor[] = await Promise.all(
    editors.map(async (editor) => ({ id: editor.id, values: await Promise.all(editor.parts.map(loadPart)) })),
  );

  const ids = new Set<string>();
  editors.forEach((editor, i) =>
    editor.parts.forEach((part, j) => collectMediaIds(partFields(part), loaded[i].values[j], ids)),
  );

  const media: Record<string, MediaItem> = {};
  if (ids.size) {
    const supabase = await createClient();
    const { data } = await supabase.from("media").select(MEDIA_COLUMNS).in("id", [...ids]);
    for (const item of (data ?? []) as MediaItem[]) media[item.id] = item;
  }

  return { loaded, media };
}
