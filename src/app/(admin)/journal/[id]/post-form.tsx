"use client";

import { ArrowLeft, ArrowUpRight, ImagePlus, LoaderCircle, RefreshCw, Timer, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { MediaPicker } from "@/components/media/media-picker";
import { MediaThumb } from "@/components/media/media-thumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FormSection } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { type MediaItem } from "@/lib/media";
import { slugify } from "@/lib/slug";
import { toastResult } from "@/lib/toast-result";
import { cn } from "@/lib/utils";

import { deletePost, savePost, type PostFieldErrors } from "../actions";
import { BlockEditor, estimateReadTime, type Block } from "./block-editor";

export type PostFormValues = {
  title: string;
  slug: string;
  category_id: string | null;
  published_on: string;
  read_time: string;
  excerpt: string;
  cover: MediaItem | null;
  body: Block[];
  is_featured: boolean;
  status: "draft" | "published";
  seo_title: string;
  seo_description: string;
};

type PostFormProps = {
  id: string | null;
  initial: PostFormValues;
  categories: { id: string; name: string }[];
  websiteUrl: string;
};

export function PostForm({ id, initial, categories, websiteUrl }: PostFormProps) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [errors, setErrors] = useState<PostFieldErrors>({});
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const [pickingCover, setPickingCover] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();

  const dirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(saved), [values, saved]);
  const isLive = saved.status === "published" && Boolean(id);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function set<K extends keyof PostFormValues>(key: K, value: PostFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key as keyof PostFieldErrors]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function save(status: PostFormValues["status"] = values.status) {
    const next = { ...values, status };
    startSave(async () => {
      const result = await savePost(id, {
        title: next.title,
        slug: next.slug,
        category_id: next.category_id,
        published_on: next.published_on,
        read_time: next.read_time || estimateReadTime(next.body),
        excerpt: next.excerpt,
        cover_id: next.cover?.id ?? null,
        body: next.body.map((b) =>
          b.type === "image" ? { type: "image" as const, image_id: b.image_id, caption: b.caption } : { type: b.type, text: b.text },
        ),
        is_featured: next.is_featured,
        status: next.status,
        seo_title: next.seo_title,
        seo_description: next.seo_description,
      });
      if (!result.ok && "fieldErrors" in result) setErrors(result.fieldErrors);
      const message =
        status === "published" && saved.status !== "published"
          ? "Published — it's live on the journal"
          : status === "draft" && saved.status === "published"
            ? "Moved to drafts — hidden from the site"
            : "Article saved";
      if (toastResult(result, message)) {
        const stored = { ...next, read_time: next.read_time || estimateReadTime(next.body) };
        setValues(stored);
        setSaved(stored);
        setErrors({});
        if (!id) router.replace(`/journal/${result.data.id}`);
      }
    });
  }

  return (
    <>
      <div className="reveal mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Link href="/journal" className="inline-flex items-center gap-1.5 text-xs tracking-wide text-muted-foreground hover:text-primary">
            <ArrowLeft className="size-3.5" /> Journal
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <h1 className="truncate text-3xl sm:text-[2.25rem]">{values.title || "New article"}</h1>
            <Badge tone={isLive ? "success" : "muted"}>{isLive ? "Published" : "Draft"}</Badge>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {isLive ? (
            <Button asChild variant="quiet">
              <a href={`${websiteUrl}/blog/${saved.slug}`} target="_blank" rel="noreferrer">
                View on site <ArrowUpRight />
              </a>
            </Button>
          ) : null}
          {values.status === "published" ? (
            <Button onClick={() => save("published")} disabled={saving || (!dirty && Boolean(id))}>
              {saving ? <LoaderCircle className="animate-spin" /> : <RefreshCw />} {id ? "Update" : "Publish"}
            </Button>
          ) : (
            <>
              <Button variant="quiet" onClick={() => save("draft")} disabled={saving || (!dirty && Boolean(id))}>
                {saving ? <LoaderCircle className="animate-spin" /> : null} Save draft
              </Button>
              <Button onClick={() => save("published")} disabled={saving}>
                Publish
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_21rem]">
        <div className="min-w-0 space-y-6">
          <FormSection title="Article">
            <Field label="Title" htmlFor="title" error={errors.title}>
              <Input
                id="title"
                value={values.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setValues((v) => ({ ...v, title, slug: slugTouched ? v.slug : slugify(title) }));
                }}
                placeholder="Lighting for Black on Black"
                maxLength={160}
              />
            </Field>
            <Field label="URL" htmlFor="slug" error={errors.slug} hint={id && saved.slug !== values.slug ? "Changing the URL breaks links already shared." : undefined}>
              <div className="flex items-center overflow-hidden rounded-xl border border-border/70 bg-background/40 focus-within:ring-1 focus-within:ring-ring">
                <span className="shrink-0 pl-3.5 text-sm text-muted-foreground">/blog/</span>
                <input
                  id="slug"
                  value={values.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
                  }}
                  className="h-11 min-w-0 flex-1 bg-transparent pr-3.5 text-sm outline-none"
                />
              </div>
            </Field>
            <Field label="Excerpt" htmlFor="excerpt" hint="Shown on the journal card and under the title. Also the default search description.">
              <Textarea id="excerpt" value={values.excerpt} onChange={(e) => set("excerpt", e.target.value)} rows={2} maxLength={400} />
            </Field>
          </FormSection>

          <FormSection title="Body" description={`${values.body.length} block${values.body.length === 1 ? "" : "s"} · drag to reorder, hover a block to change its type`}>
            <BlockEditor value={values.body} onChange={(body) => set("body", body)} error={errors.body} />
          </FormSection>
        </div>

        <aside className="space-y-6">
          <FormSection title="Publishing">
            <label className="flex cursor-pointer items-start justify-between gap-4">
              <span>
                <span className="block text-sm">Published</span>
                <span className="text-xs text-muted-foreground">Visible on the journal</span>
              </span>
              <Switch checked={values.status === "published"} onCheckedChange={(on) => set("status", on ? "published" : "draft")} />
            </label>
            <label className="flex cursor-pointer items-start justify-between gap-4">
              <span>
                <span className="block text-sm">Show on homepage</span>
                <span className="text-xs text-muted-foreground">Adds it to “Latest writing”</span>
              </span>
              <Switch checked={values.is_featured} onCheckedChange={(on) => set("is_featured", on)} />
            </label>
            <Field label="Publish date" htmlFor="published_on" error={errors.published_on} hint="Articles are listed newest first.">
              <Input id="published_on" type="date" value={values.published_on} onChange={(e) => set("published_on", e.target.value)} />
            </Field>
            <Field label="Category" htmlFor="category">
              <Select
                id="category"
                value={values.category_id ?? ""}
                onValueChange={(v) => set("category_id", v)}
                placeholder="Choose a category"
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
              />
            </Field>
            <Field label="Read time" htmlFor="read_time">
              <div className="flex gap-2">
                <Input id="read_time" value={values.read_time} onChange={(e) => set("read_time", e.target.value)} placeholder="7 min" maxLength={20} />
                <Button type="button" variant="quiet" size="icon" title="Estimate from the text" onClick={() => set("read_time", estimateReadTime(values.body))}>
                  <Timer />
                </Button>
              </div>
            </Field>
          </FormSection>

          <FormSection title="Cover image">
            <button
              type="button"
              onClick={() => setPickingCover(true)}
              className="group relative block aspect-[16/10] w-full cursor-pointer overflow-hidden rounded-2xl border border-border/60 transition-colors hover:border-primary/50"
            >
              {values.cover ? (
                <MediaThumb item={values.cover} sizes="20rem" className="transition-transform duration-1000 group-hover:scale-105" />
              ) : (
                <span className="flex size-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                  <ImagePlus className="size-6 text-primary" /> Choose a cover
                </span>
              )}
            </button>
            <p className="text-xs text-muted-foreground">Used on the journal card and behind the article title.</p>
          </FormSection>

          <FormSection title="Search & sharing">
            <Field label="SEO title" htmlFor="seo_title" hint="Leave empty to use the default.">
              <Input id="seo_title" value={values.seo_title} onChange={(e) => set("seo_title", e.target.value)} placeholder={`${values.title || "Title"} — Gilvero Journal`} maxLength={120} />
            </Field>
            <Field label="SEO description" htmlFor="seo_description" hint="Leave empty to use the excerpt.">
              <Textarea id="seo_description" value={values.seo_description} onChange={(e) => set("seo_description", e.target.value)} rows={3} maxLength={300} />
            </Field>
          </FormSection>

          {id ? (
            <div className="panel p-5">
              {confirmDelete ? (
                <div className="space-y-3">
                  <p className="text-sm">Delete “{saved.title}”? Images stay in the media library.</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={deleting}
                      className="bg-none bg-destructive text-destructive-foreground shadow-none"
                      onClick={() =>
                        startDelete(async () => {
                          if (toastResult(await deletePost(id), `“${saved.title}” deleted`)) router.replace("/journal");
                        })
                      }
                    >
                      {deleting ? <LoaderCircle className="animate-spin" /> : <Trash2 />} Delete article
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 /> Delete article
                </Button>
              )}
            </div>
          ) : null}
        </aside>
      </div>

      <div
        className={cn(
          "fixed inset-x-0 bottom-5 z-40 mx-auto flex w-fit items-center gap-3 rounded-full border border-primary/30 bg-popover/95 py-2 pr-2 pl-5 shadow-2xl backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          dirty ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0",
        )}
      >
        <span className="text-sm">Unsaved changes</span>
        <Button size="sm" variant="ghost" onClick={() => setValues(saved)} disabled={saving}>
          Discard
        </Button>
        <Button size="sm" onClick={() => save()} disabled={saving}>
          {saving ? <LoaderCircle className="animate-spin" /> : null} Save
        </Button>
      </div>

      <MediaPicker open={pickingCover} onOpenChange={setPickingCover} onSelect={([item]) => set("cover", item)} title="Choose a cover" />
    </>
  );
}
