import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MediaIndexProvider } from "@/components/content/media-context";
import { requireAdmin } from "@/lib/auth";
import { env } from "@/lib/env";
import { MEDIA_COLUMNS, type MediaItem } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

import { PostForm, type PostFormValues } from "./post-form";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: PageProps<"/journal/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: id === "new" ? "New article" : "Edit article" };
}

type StoredBlock = { type: string; text?: string; image_id?: string; caption?: string };

export default async function PostPage({ params }: PageProps<"/journal/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const isNew = id === "new";
  if (!isNew && !UUID.test(id)) notFound();

  const supabase = await createClient();
  const { data: categories } = await supabase.from("blog_categories").select("id, name").order("sort_order");

  let initial: PostFormValues = {
    title: "",
    slug: "",
    category_id: null,
    published_on: new Date().toISOString().slice(0, 10),
    read_time: "",
    excerpt: "",
    cover: null,
    body: [],
    is_featured: false,
    status: "draft",
    seo_title: "",
    seo_description: "",
  };
  const media: Record<string, MediaItem> = {};

  if (!isNew) {
    const { data: post } = await supabase.from("posts").select(`*, cover:media(${MEDIA_COLUMNS})`).eq("id", id).maybeSingle();
    if (!post) notFound();

    const body = (post.body as StoredBlock[]).map((b, i) =>
      b.type === "image"
        ? { key: `b${i}`, type: "image" as const, image_id: b.image_id ?? "", caption: b.caption ?? "" }
        : { key: `b${i}`, type: b.type as "lead" | "heading" | "paragraph" | "quote", text: b.text ?? "" },
    );
    const imageIds = body.flatMap((b) => (b.type === "image" && b.image_id ? [b.image_id] : []));
    if (imageIds.length) {
      const { data } = await supabase.from("media").select(MEDIA_COLUMNS).in("id", imageIds);
      for (const item of (data ?? []) as MediaItem[]) media[item.id] = item;
    }

    initial = {
      title: post.title,
      slug: post.slug,
      category_id: post.category_id,
      published_on: post.published_on ?? new Date().toISOString().slice(0, 10),
      read_time: post.read_time,
      excerpt: post.excerpt,
      cover: post.cover as MediaItem | null,
      body,
      is_featured: post.is_featured,
      status: post.status,
      seo_title: post.seo_title ?? "",
      seo_description: post.seo_description ?? "",
    };
  }

  return (
    <MediaIndexProvider initial={media}>
      <PostForm id={isNew ? null : id} initial={initial} categories={categories ?? []} websiteUrl={env.websiteUrl()} />
    </MediaIndexProvider>
  );
}
