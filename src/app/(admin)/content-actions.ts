"use server";

import { fail, friendlyError, succeed, type ActionResult } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
import { getEditorPart } from "@/lib/content/editors";
import { loadPart, partFields, type PartValue } from "@/lib/content/load";
import { objectSchema } from "@/lib/content/schema";
import { createClient } from "@/lib/supabase/server";

/** Everything these editors touch is read by the website under the `site` tag. */
const TAGS = ["site"];

type Row = Record<string, unknown>;

/**
 * Save one part of an editor. The part (and therefore the table/key it writes
 * to) is looked up server-side from the editor registry — never trusted from
 * the browser. The value is validated against the part's field definitions.
 * Returns the stored value so the form picks up ids of newly created rows.
 */
export async function savePart(editorId: string, partIndex: number, value: unknown): Promise<ActionResult<PartValue>> {
  await requireAdmin();
  const part = getEditorPart(editorId, partIndex);
  if (!part) return fail("Unknown editor.");

  const parsed = objectSchema(partFields(part)).safeParse(value);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return fail(`${issue.path.length ? issue.path.join(" › ") + ": " : ""}${issue.message}`);
  }
  const data = parsed.data as Row;
  const supabase = await createClient();

  switch (part.kind) {
    case "section": {
      // Merge so keys this editor doesn't manage are preserved.
      const { data: existing } = await supabase.from("site_sections").select("data").eq("key", part.key).maybeSingle();
      const { error } = await supabase.from("site_sections").upsert({
        key: part.key,
        page: part.key.split(".")[0],
        label: part.title ?? editorId,
        data: { ...((existing?.data as Row) ?? {}), ...data },
      });
      if (error) return fail(friendlyError(error));
      break;
    }

    case "collection": {
      const items = data[part.list.name] as Row[];
      const scope = part.scope ?? {};
      let rows: Row[] = items.map((item, index) => ({ ...item, ...scope, sort_order: index }));
      if (part.derive === "faq") {
        // One flat list in the editor → topic groups + homepage order on the site.
        const topics: string[] = [];
        const perTopic = new Map<string, number>();
        let homeIndex = 0;
        rows = rows.map((row) => {
          const topic = String(row.topic);
          if (!topics.includes(topic)) topics.push(topic);
          const within = perTopic.get(topic) ?? 0;
          perTopic.set(topic, within + 1);
          return {
            ...row,
            topic_order: topics.indexOf(topic),
            sort_order: within,
            home_order: row.show_on_home ? homeIndex++ : 0,
          };
        });
      }
      const existingRows = rows.filter((r) => r.id);
      const newRows = rows.filter((r) => !r.id).map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => k !== "id")));

      // Upsert first, delete last: a failure part-way never loses rows.
      if (existingRows.length) {
        const { error } = await supabase.from(part.table).upsert(existingRows, { onConflict: "id" });
        if (error) return fail(friendlyError(error));
      }
      let insertedIds: string[] = [];
      if (newRows.length) {
        const { data: inserted, error } = await supabase.from(part.table).insert(newRows).select("id");
        if (error) return fail(friendlyError(error));
        insertedIds = (inserted ?? []).map((r) => r.id as string);
      }
      const keep = [...existingRows.map((r) => r.id as string), ...insertedIds];
      let remove = supabase.from(part.table).delete();
      for (const [column, v] of Object.entries(scope)) remove = remove.eq(column, v);
      if (keep.length) remove = remove.not("id", "in", `(${keep.join(",")})`);
      else remove = remove.not("id", "is", null);
      const { error } = await remove;
      if (error) return fail(friendlyError(error));
      break;
    }

    case "pageCta": {
      const { error } = await supabase.from("pages").update({ cta: data }).eq("slug", part.slug);
      if (error) return fail(friendlyError(error));
      break;
    }

    case "settings": {
      // jsonb groups (social, seo) are merged so unmanaged keys survive.
      const groups = part.fields.filter((f) => f.type === "group").map((f) => f.name);
      let patch: Row = data;
      if (groups.length) {
        const { data: existing } = await supabase.from("site_settings").select(groups.join(", ")).eq("id", 1).single();
        patch = { ...data };
        for (const g of groups) patch[g] = { ...(((existing as unknown as Row)?.[g] as Row) ?? {}), ...(data[g] as Row) };
      }
      const { error } = await supabase.from("site_settings").update(patch).eq("id", 1);
      if (error) return fail(friendlyError(error));
      break;
    }

    case "navigation": {
      const { error } = await supabase
        .from("navigation")
        .upsert({ key: part.key, data: part.arrayField ? data[part.arrayField] : data });
      if (error) return fail(friendlyError(error));
      break;
    }
  }

  // Return what is now stored (new list rows carry their database ids).
  return succeed(await loadPart(part), TAGS);
}
