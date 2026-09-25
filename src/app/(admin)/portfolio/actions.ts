"use server";

import { z } from "zod";

import { fail, friendlyError, succeed, type ActionResult } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";

/** Everything here is shown by the website's portfolio data layer. */
const TAGS = ["portfolio"];

const uuid = z.string().uuid();
const ids = z.array(uuid);

async function reorder(table: string, column: string, orderedIds: string[]) {
  const parsed = ids.safeParse(orderedIds);
  if (!parsed.success) return fail("Invalid order.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("reorder_rows", { p_table: table, p_column: column, p_ids: parsed.data });
  if (error) return fail(friendlyError(error));
  return succeed(null, TAGS);
}

async function nextOrder(table: string, column: string) {
  const supabase = await createClient();
  const { data } = await supabase.from(table).select(column).order(column, { ascending: false }).limit(1);
  const current = (data?.[0] as Record<string, number> | undefined)?.[column];
  return typeof current === "number" ? current + 1 : 0;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

const categoryName = z.string().trim().min(1, "Give the category a name.").max(60);

export async function createCategory(name: string): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = categoryName.safeParse(name);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("portfolio_categories")
    .insert({
      name: parsed.data,
      slug: slugify(parsed.data),
      sort_order: await nextOrder("portfolio_categories", "sort_order"),
    })
    .select("id")
    .single();
  if (error) return fail(friendlyError(error));
  return succeed(data, TAGS);
}

export async function updateCategory(
  id: string,
  input: { name?: string; is_visible?: boolean },
): Promise<ActionResult<null>> {
  await requireAdmin();
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) {
    const parsed = categoryName.safeParse(input.name);
    if (!parsed.success) return fail(parsed.error.issues[0].message);
    patch.name = parsed.data;
    patch.slug = slugify(parsed.data);
  }
  if (input.is_visible !== undefined) patch.is_visible = input.is_visible;

  const supabase = await createClient();
  const { error } = await supabase.from("portfolio_categories").update(patch).eq("id", uuid.parse(id));
  if (error) return fail(friendlyError(error));
  return succeed(null, TAGS);
}

/** Projects in a deleted category become uncategorised (they are not deleted). */
export async function deleteCategory(id: string): Promise<ActionResult<null>> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("portfolio_categories").delete().eq("id", uuid.parse(id));
  if (error) return fail(friendlyError(error));
  return succeed(null, TAGS);
}

export async function reorderCategories(orderedIds: string[]) {
  await requireAdmin();
  return reorder("portfolio_categories", "sort_order", orderedIds);
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

const optionalText = z
  .string()
  .trim()
  .max(2000)
  .transform((v) => v || null);

const projectSchema = z.object({
  title: z.string().trim().min(1, "Add a title.").max(140),
  slug: z
    .string()
    .trim()
    .min(1, "Add a URL slug.")
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only."),
  category_id: uuid.nullable(),
  client: z.string().trim().max(140),
  location: z.string().trim().max(140),
  year: z.string().trim().max(20),
  cover_id: uuid.nullable(),
  story: z.string().trim().max(2000),
  challenge: z.string().trim().max(2000),
  solution: z.string().trim().max(2000),
  result: z.string().trim().max(2000),
  services: z.array(z.string().trim().min(1).max(80)).max(30),
  testimonial_quote: optionalText,
  testimonial_author: optionalText,
  testimonial_role: optionalText,
  is_featured: z.boolean(),
  status: z.enum(["draft", "published"]),
  seo_title: optionalText,
  seo_description: optionalText,
  gallery: z
    .array(z.object({ media_id: uuid, caption: z.string().trim().max(200) }))
    .max(200),
});

export type ProjectInput = z.input<typeof projectSchema>;
export type ProjectFieldErrors = Partial<Record<keyof ProjectInput, string>>;

export async function saveProject(
  id: string | null,
  input: ProjectInput,
): Promise<ActionResult<{ id: string }> | { ok: false; error: string; fieldErrors: ProjectFieldErrors }> {
  await requireAdmin();
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: ProjectFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof ProjectInput;
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }

  const { gallery, ...fields } = parsed.data;
  if (fields.status === "published" && !fields.cover_id) {
    return { ok: false, error: "A published project needs a cover image.", fieldErrors: { cover_id: "Choose a cover image." } };
  }

  const supabase = await createClient();
  let projectId = id;

  if (projectId) {
    const { data: before } = await supabase.from("projects").select("is_featured").eq("id", projectId).single();
    const patch: Record<string, unknown> = { ...fields };
    if (fields.is_featured && !before?.is_featured) patch.featured_order = await nextOrder("projects", "featured_order");
    const { error } = await supabase.from("projects").update(patch).eq("id", projectId);
    if (error) return fail(friendlyError(error));
  } else {
    const { data, error } = await supabase
      .from("projects")
      .insert({
        ...fields,
        sort_order: await nextOrder("projects", "sort_order"),
        featured_order: fields.is_featured ? await nextOrder("projects", "featured_order") : 0,
      })
      .select("id")
      .single();
    if (error) return fail(friendlyError(error));
    projectId = data.id;
  }

  const { error: galleryError } = await supabase.rpc("set_project_gallery", {
    p_project: projectId,
    p_items: gallery,
  });
  if (galleryError) return fail(`Project saved, but the gallery failed: ${friendlyError(galleryError)}`);

  return succeed({ id: projectId! }, TAGS);
}

export async function setProjectFlags(
  id: string,
  flags: { status?: "draft" | "published"; is_featured?: boolean },
): Promise<ActionResult<null>> {
  await requireAdmin();
  const supabase = await createClient();
  const patch: Record<string, unknown> = {};

  if (flags.status) {
    if (flags.status === "published") {
      const { data } = await supabase.from("projects").select("cover_id").eq("id", uuid.parse(id)).single();
      if (!data?.cover_id) return fail("Add a cover image before publishing.");
    }
    patch.status = flags.status;
  }
  if (flags.is_featured !== undefined) {
    patch.is_featured = flags.is_featured;
    if (flags.is_featured) patch.featured_order = await nextOrder("projects", "featured_order");
  }

  const { error } = await supabase.from("projects").update(patch).eq("id", uuid.parse(id));
  if (error) return fail(friendlyError(error));
  return succeed(null, TAGS);
}

export async function deleteProject(id: string): Promise<ActionResult<null>> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", uuid.parse(id));
  if (error) return fail(friendlyError(error));
  return succeed(null, TAGS);
}

export async function reorderProjects(orderedIds: string[]) {
  await requireAdmin();
  return reorder("projects", "sort_order", orderedIds);
}

export async function reorderFeatured(orderedIds: string[]) {
  await requireAdmin();
  return reorder("projects", "featured_order", orderedIds);
}
