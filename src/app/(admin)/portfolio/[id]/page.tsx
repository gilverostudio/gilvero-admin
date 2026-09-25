import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { MEDIA_COLUMNS, type MediaItem } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

import { ProjectForm, type ProjectFormValues } from "./project-form";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: PageProps<"/portfolio/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: id === "new" ? "New project" : "Edit project" };
}

const EMPTY: ProjectFormValues = {
  title: "",
  slug: "",
  category_id: null,
  client: "",
  location: "",
  year: String(new Date().getFullYear()),
  cover: null,
  story: "",
  challenge: "",
  solution: "",
  result: "",
  services: [],
  testimonial_quote: "",
  testimonial_author: "",
  testimonial_role: "",
  is_featured: false,
  status: "draft",
  seo_title: "",
  seo_description: "",
  gallery: [],
};

export default async function ProjectPage({ params }: PageProps<"/portfolio/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const isNew = id === "new";
  if (!isNew && !UUID.test(id)) notFound();

  const supabase = await createClient();
  const [{ data: categories }, { data: allServices }] = await Promise.all([
    supabase.from("portfolio_categories").select("id, name").order("sort_order"),
    supabase.from("projects").select("services"),
  ]);
  const serviceSuggestions = [...new Set((allServices ?? []).flatMap((p) => p.services as string[]))].sort();

  let initial = EMPTY;
  if (!isNew) {
    const { data: project } = await supabase
      .from("projects")
      .select(
        `*, cover:media(${MEDIA_COLUMNS}), gallery:project_images(id, caption, sort_order, media(${MEDIA_COLUMNS}))`,
      )
      .eq("id", id)
      .order("sort_order", { referencedTable: "project_images" })
      .maybeSingle();
    if (!project) notFound();

    initial = {
      title: project.title,
      slug: project.slug,
      category_id: project.category_id,
      client: project.client,
      location: project.location,
      year: project.year,
      cover: project.cover as MediaItem | null,
      story: project.story,
      challenge: project.challenge,
      solution: project.solution,
      result: project.result,
      services: project.services,
      testimonial_quote: project.testimonial_quote ?? "",
      testimonial_author: project.testimonial_author ?? "",
      testimonial_role: project.testimonial_role ?? "",
      is_featured: project.is_featured,
      status: project.status,
      seo_title: project.seo_title ?? "",
      seo_description: project.seo_description ?? "",
      gallery: (project.gallery as { id: string; caption: string; media: MediaItem }[]).map((g) => ({
        key: g.id,
        caption: g.caption,
        media: g.media,
      })),
    };
  }

  return (
    <ProjectForm
      id={isNew ? null : id}
      initial={initial}
      categories={categories ?? []}
      serviceSuggestions={serviceSuggestions}
      websiteUrl={process.env.NEXT_PUBLIC_WEBSITE_URL ?? "https://gilvero.com"}
    />
  );
}
