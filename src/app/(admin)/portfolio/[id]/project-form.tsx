"use client";

import { ArrowLeft, ArrowUpRight, ImagePlus, LoaderCircle, RefreshCw, Trash2 } from "lucide-react";
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
import { TagInput } from "@/components/ui/tag-input";
import { Textarea } from "@/components/ui/textarea";
import { type MediaItem } from "@/lib/media";
import { slugify } from "@/lib/slug";
import { toastResult } from "@/lib/toast-result";
import { cn } from "@/lib/utils";

import { deleteProject, saveProject, type ProjectFieldErrors } from "../actions";
import { GalleryEditor, type GalleryEntry } from "./gallery-editor";

export type ProjectFormValues = {
  title: string;
  slug: string;
  category_id: string | null;
  client: string;
  location: string;
  year: string;
  cover: MediaItem | null;
  story: string;
  challenge: string;
  solution: string;
  result: string;
  services: string[];
  testimonial_quote: string;
  testimonial_author: string;
  testimonial_role: string;
  is_featured: boolean;
  status: "draft" | "published";
  seo_title: string;
  seo_description: string;
  gallery: GalleryEntry[];
};

type ProjectFormProps = {
  id: string | null;
  initial: ProjectFormValues;
  categories: { id: string; name: string }[];
  serviceSuggestions: string[];
  websiteUrl: string;
};

export function ProjectForm({ id, initial, categories, serviceSuggestions, websiteUrl }: ProjectFormProps) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [errors, setErrors] = useState<ProjectFieldErrors>({});
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const [pickingCover, setPickingCover] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();

  const dirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(saved), [values, saved]);
  const isLive = saved.status === "published" && Boolean(id);
  const categoryName = categories.find((c) => c.id === values.category_id)?.name ?? "Case study";

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function set<K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key as keyof ProjectFieldErrors]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function setTitle(title: string) {
    setValues((v) => ({ ...v, title, slug: slugTouched ? v.slug : slugify(title) }));
  }

  function save(status: ProjectFormValues["status"] = values.status) {
    const next = { ...values, status };
    startSave(async () => {
      const result = await saveProject(id, {
        title: next.title,
        slug: next.slug,
        category_id: next.category_id,
        client: next.client,
        location: next.location,
        year: next.year,
        cover_id: next.cover?.id ?? null,
        story: next.story,
        challenge: next.challenge,
        solution: next.solution,
        result: next.result,
        services: next.services,
        testimonial_quote: next.testimonial_quote,
        testimonial_author: next.testimonial_author,
        testimonial_role: next.testimonial_role,
        is_featured: next.is_featured,
        status: next.status,
        seo_title: next.seo_title,
        seo_description: next.seo_description,
        gallery: next.gallery.map((g) => ({ media_id: g.media.id, caption: g.caption })),
      });

      if (!result.ok && "fieldErrors" in result) setErrors(result.fieldErrors);
      const message =
        status === "published" && saved.status !== "published"
          ? "Published — it's live on the site"
          : status === "draft" && saved.status === "published"
            ? "Moved to drafts — hidden from the site"
            : "Project saved";
      if (toastResult(result, message)) {
        setValues(next);
        setSaved(next);
        setErrors({});
        if (!id) router.replace(`/portfolio/${result.data.id}`);
      }
    });
  }

  function remove() {
    if (!id) return;
    startDelete(async () => {
      if (toastResult(await deleteProject(id), `“${saved.title}” deleted`)) router.replace("/portfolio");
    });
  }

  return (
    <>
      {/* Header */}
      <div className="reveal mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Link href="/portfolio" className="inline-flex items-center gap-1.5 text-xs tracking-wide text-muted-foreground hover:text-primary">
            <ArrowLeft className="size-3.5" /> Portfolio
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <h1 className="truncate text-3xl sm:text-[2.25rem]">{values.title || "New project"}</h1>
            <Badge tone={saved.status === "published" && id ? "success" : "muted"}>
              {saved.status === "published" && id ? "Published" : "Draft"}
            </Badge>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {isLive ? (
            <Button asChild variant="quiet">
              <a href={`${websiteUrl}/portfolio/${saved.slug}`} target="_blank" rel="noreferrer">
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
        {/* Main column */}
        <div className="space-y-6">
          <FormSection title="Details">
            <Field label="Title" htmlFor="title" error={errors.title}>
              <Input id="title" value={values.title} onChange={(e) => setTitle(e.target.value)} placeholder="The Lahore Vows" maxLength={140} />
            </Field>
            <Field
              label="URL"
              htmlFor="slug"
              error={errors.slug}
              hint={id && saved.slug !== values.slug ? "Changing the URL breaks links already shared." : undefined}
            >
              <div className="flex items-center overflow-hidden rounded-xl border border-border/70 bg-background/40 focus-within:ring-1 focus-within:ring-ring">
                <span className="shrink-0 pl-3.5 text-sm text-muted-foreground">/portfolio/</span>
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
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Client" htmlFor="client">
                <Input id="client" value={values.client} onChange={(e) => set("client", e.target.value)} placeholder="Obsidian Group" />
              </Field>
              <Field label="Location" htmlFor="location">
                <Input id="location" value={values.location} onChange={(e) => set("location", e.target.value)} placeholder="Islamabad" />
              </Field>
              <Field label="Year" htmlFor="year">
                <Input id="year" value={values.year} onChange={(e) => set("year", e.target.value)} maxLength={20} />
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
            </div>
            <Field label="Services" htmlFor="services" hint="Shown on the case study, e.g. Photography, Drone.">
              <TagInput id="services" value={values.services} onChange={(v) => set("services", v)} suggestions={serviceSuggestions} />
            </Field>
          </FormSection>

          <FormSection title="The story" description="The case study reads top to bottom: story, then challenge → solution → result.">
            <Field label="Story" htmlFor="story" hint="One or two sentences. Also used as the search-engine description.">
              <Textarea id="story" value={values.story} onChange={(e) => set("story", e.target.value)} rows={3} />
            </Field>
            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Challenge" htmlFor="challenge">
                <Textarea id="challenge" value={values.challenge} onChange={(e) => set("challenge", e.target.value)} rows={5} />
              </Field>
              <Field label="Solution" htmlFor="solution">
                <Textarea id="solution" value={values.solution} onChange={(e) => set("solution", e.target.value)} rows={5} />
              </Field>
              <Field label="Result" htmlFor="result">
                <Textarea id="result" value={values.result} onChange={(e) => set("result", e.target.value)} rows={5} />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Gallery" description={`${values.gallery.length} image${values.gallery.length === 1 ? "" : "s"}`}>
            <GalleryEditor value={values.gallery} onChange={(g) => set("gallery", g)} projectTitle={values.title} />
          </FormSection>

          <FormSection title="Client testimonial" description="Optional — the quote block is hidden when empty.">
            <Field label="Quote" htmlFor="tq">
              <Textarea id="tq" value={values.testimonial_quote} onChange={(e) => set("testimonial_quote", e.target.value)} rows={3} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Name" htmlFor="ta">
                <Input id="ta" value={values.testimonial_author} onChange={(e) => set("testimonial_author", e.target.value)} />
              </Field>
              <Field label="Role" htmlFor="tr">
                <Input id="tr" value={values.testimonial_role} onChange={(e) => set("testimonial_role", e.target.value)} placeholder="GM, Obsidian Group" />
              </Field>
            </div>
          </FormSection>
        </div>

        {/* Side column */}
        <aside className="space-y-6">
          <FormSection title="Visibility">
            <label className="flex cursor-pointer items-start justify-between gap-4">
              <span>
                <span className="block text-sm">Published</span>
                <span className="text-xs text-muted-foreground">Visible on gilvero.com</span>
              </span>
              <Switch checked={values.status === "published"} onCheckedChange={(on) => set("status", on ? "published" : "draft")} />
            </label>
            <label className="flex cursor-pointer items-start justify-between gap-4">
              <span>
                <span className="block text-sm">Feature on homepage</span>
                <span className="text-xs text-muted-foreground">Adds it to “Recent commissions”</span>
              </span>
              <Switch checked={values.is_featured} onCheckedChange={(on) => set("is_featured", on)} />
            </label>
          </FormSection>

          <FormSection title="Cover image">
            <button
              type="button"
              onClick={() => setPickingCover(true)}
              className={cn(
                "group relative block aspect-[4/5] w-full cursor-pointer overflow-hidden rounded-2xl border transition-colors",
                errors.cover_id ? "border-destructive" : "border-border/60 hover:border-primary/50",
              )}
            >
              {values.cover ? (
                <>
                  <MediaThumb item={values.cover} sizes="20rem" className="transition-transform duration-1000 group-hover:scale-105" />
                  <span className="absolute inset-x-3 bottom-3 rounded-full bg-background/85 py-2 text-center text-xs opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                    Change cover
                  </span>
                </>
              ) : (
                <span className="flex size-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                  <ImagePlus className="size-6 text-primary" /> Choose a cover
                </span>
              )}
            </button>
            {errors.cover_id ? <p className="text-xs text-destructive">{errors.cover_id}</p> : null}
            <p className="text-xs text-muted-foreground">Used on the portfolio grid, homepage and case-study hero.</p>
          </FormSection>

          <FormSection title="Search & sharing">
            <Field label="SEO title" htmlFor="seo_title" hint="Leave empty to use the default.">
              <Input
                id="seo_title"
                value={values.seo_title}
                onChange={(e) => set("seo_title", e.target.value)}
                placeholder={`${values.title || "Title"} — ${categoryName} Case Study | Gilvero`}
                maxLength={120}
              />
            </Field>
            <Field label="SEO description" htmlFor="seo_description" hint="Leave empty to use the story.">
              <Textarea id="seo_description" value={values.seo_description} onChange={(e) => set("seo_description", e.target.value)} rows={3} maxLength={300} />
            </Field>
            <div className="rounded-xl border border-border/60 bg-background/50 p-3.5">
              <p className="truncate text-xs text-emerald-400/80">gilvero.com › portfolio › {values.slug || "…"}</p>
              <p className="mt-1 line-clamp-1 text-sm text-[oklch(78%_0.1_250)]">
                {values.seo_title || `${values.title || "Title"} — ${categoryName} Case Study | Gilvero`}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{values.seo_description || values.story || "Description…"}</p>
            </div>
          </FormSection>

          {id ? (
            <div className="panel p-5">
              {confirmDelete ? (
                <div className="space-y-3">
                  <p className="text-sm">Delete “{saved.title}” and its gallery? Images stay in the media library.</p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={remove} disabled={deleting} className="bg-none bg-destructive text-destructive-foreground shadow-none">
                      {deleting ? <LoaderCircle className="animate-spin" /> : <Trash2 />} Delete project
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 /> Delete project
                </Button>
              )}
            </div>
          ) : null}
        </aside>
      </div>

      {/* Unsaved-changes bar */}
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
