"use server";

import { z } from "zod";

import { fail, friendlyError, succeed, type ActionResult } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";

/** The journal is read by the website under the `site` tag. */
const TAGS = ["site"];
const uuid = z.string().uuid();

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

const categoryName = z.string().trim().min(1, "Give the category a name.").max(60);

export async function createBlogCategory(name: string): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = categoryName.safeParse(name);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const supabase = await createClient();
  const { data: last } = await supabase.from("blog_categories").select("sort_order").order("sort_order", { ascending: false }).limit(1);
  const { data, error } = await supabase
    .from("blog_categories")
    .insert({ name: parsed.data, slug: slugify(parsed.data), sort_order: (last?.[0]?.sort_order ?? -1) + 1 })
    .select("id")
    .single();
  if (error) return fail(friendlyError(error));
  return succeed(data, TAGS);
}

export async function renameBlogCategory(id: string, name: string): Promise<ActionResult<null>> {
  await requireAdmin();
  const parsed = categoryName.safeParse(name);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const supabase = await createClient();
  const { error } = await supabase
    .from("blog_categories")
    .update({ name: parsed.data, slug: slugify(parsed.data) })
    .eq("id", uuid.parse(id));
  if (error) return fail(friendlyError(error));
  return succeed(null, TAGS);
}

/** Posts in a deleted category become uncategorised (they are not deleted). */
export async function deleteBlogCategory(id: string): Promise<ActionResult<null>> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("blog_categories").delete().eq("id", uuid.parse(id));
  if (error) return fail(friendlyError(error));
  return succeed(null, TAGS);
}

export async function reorderBlogCategories(ids: string[]): Promise<ActionResult<null>> {
  await requireAdmin();
  const parsed = z.array(uuid).safeParse(ids);
  if (!parsed.success) return fail("Invalid order.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("reorder_rows", { p_table: "blog_categories", p_column: "sort_order", p_ids: parsed.data });
  if (error) return fail(friendlyError(error));
  return succeed(null, TAGS);
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

const block = z.discriminatedUnion("type", [
  z.object({ type: z.enum(["lead", "heading", "paragraph", "quote"]), text: z.string().trim().min(1, "Remove empty blocks or add text.").max(8000) }),
  z.object({ type: z.literal("image"), image_id: uuid, caption: z.string().trim().max(300) }),
]);

const optionalText = z
  .string()
  .trim()
  .max(300)
  .transform((v) => v || null);

const postSchema = z.object({
  title: z.string().trim().min(1, "Add a title.").max(160),
  slug: z
    .string()
    .trim()
    .min(1, "Add a URL slug.")
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only."),
  category_id: uuid.nullable(),
  published_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date."),
  read_time: z.string().trim().max(20),
  excerpt: z.string().trim().max(400),
  cover_id: uuid.nullable(),
  body: z.array(block).max(300),
  is_featured: z.boolean(),
  status: z.enum(["draft", "published"]),
  seo_title: optionalText,
  seo_description: optionalText,
});

export type PostInput = z.input<typeof postSchema>;
export type PostFieldErrors = Partial<Record<keyof PostInput, string>>;

export async function savePost(
  id: string | null,
  input: PostInput,
): Promise<ActionResult<{ id: string }> | { ok: false; error: string; fieldErrors: PostFieldErrors }> {
  await requireAdmin();
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: PostFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof PostInput;
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }
  if (parsed.data.status === "published" && !parsed.data.body.length) {
    return { ok: false, error: "A published article needs some content.", fieldErrors: { body: "Add at least one block." } };
  }

  const supabase = await createClient();
  if (id) {
    const { error } = await supabase.from("posts").update(parsed.data).eq("id", uuid.parse(id));
    if (error) return fail(friendlyError(error));
    return succeed({ id }, TAGS);
  }
  const { data, error } = await supabase.from("posts").insert(parsed.data).select("id").single();
  if (error) return fail(friendlyError(error));
  return succeed({ id: data.id as string }, TAGS);
}

export async function setPostFlags(
  id: string,
  flags: { status?: "draft" | "published"; is_featured?: boolean },
): Promise<ActionResult<null>> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("posts").update(flags).eq("id", uuid.parse(id));
  if (error) return fail(friendlyError(error));
  return succeed(null, TAGS);
}

export async function deletePost(id: string): Promise<ActionResult<null>> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("posts").delete().eq("id", uuid.parse(id));
  if (error) return fail(friendlyError(error));
  return succeed(null, TAGS);
}
