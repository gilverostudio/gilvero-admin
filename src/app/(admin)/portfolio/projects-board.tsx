"use client";

import { Eye, EyeOff, ImageOff, Images, Search, Star } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { MediaThumb } from "@/components/media/media-thumb";
import { Sortable } from "@/components/sortable";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { type MediaItem } from "@/lib/media";
import { toastResult } from "@/lib/toast-result";
import { cn } from "@/lib/utils";

import { reorderFeatured, reorderProjects, setProjectFlags } from "./actions";

export type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  year: string;
  status: "draft" | "published";
  is_featured: boolean;
  featured_order: number;
  sort_order: number;
  updated_at: string;
  category: { id: string; name: string } | null;
  cover: Pick<MediaItem, "storage_path" | "alt" | "file_name" | "focal_x" | "focal_y"> | null;
  project_images: { count: number }[];
};

type ProjectsBoardProps = {
  projects: ProjectRow[];
  categories: { id: string; name: string }[];
};

export function ProjectsBoard({ projects: initial, categories }: ProjectsBoardProps) {
  const [projects, setProjects] = useState(initial);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [, startTransition] = useTransition();

  // Keep local state in sync when the server refreshes after an action.
  const [lastInitial, setLastInitial] = useState(initial);
  if (initial !== lastInitial) {
    setLastInitial(initial);
    setProjects(initial);
  }

  const filtering = Boolean(search.trim()) || category !== "all" || status !== "all";
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return projects.filter(
      (p) =>
        (!term || p.title.toLowerCase().includes(term)) &&
        (category === "all" || (category === "none" ? !p.category : p.category?.id === category)) &&
        (status === "all" || p.status === status),
    );
  }, [projects, search, category, status]);

  const featured = useMemo(
    () => projects.filter((p) => p.is_featured).sort((a, b) => a.featured_order - b.featured_order),
    [projects],
  );

  function reorder(next: ProjectRow[]) {
    setProjects(next.map((p, i) => ({ ...p, sort_order: i })));
    startTransition(async () => {
      toastResult(await reorderProjects(next.map((p) => p.id)), "Order saved");
    });
  }

  function reorderFeaturedList(next: ProjectRow[]) {
    const orderById = new Map(next.map((p, i) => [p.id, i]));
    setProjects((current) =>
      current.map((p) => (orderById.has(p.id) ? { ...p, featured_order: orderById.get(p.id)! } : p)),
    );
    startTransition(async () => {
      toastResult(await reorderFeatured(next.map((p) => p.id)), "Homepage order saved");
    });
  }

  function toggle(project: ProjectRow, flags: { status?: "draft" | "published"; is_featured?: boolean }) {
    const previous = projects;
    setProjects((current) => current.map((p) => (p.id === project.id ? { ...p, ...flags } : p)));
    startTransition(async () => {
      const result = await setProjectFlags(project.id, flags);
      const message =
        flags.status === "published"
          ? `“${project.title}” is live`
          : flags.status === "draft"
            ? `“${project.title}” moved to drafts`
            : flags.is_featured
              ? "Added to the homepage"
              : "Removed from the homepage";
      if (!toastResult(result, message)) setProjects(previous);
    });
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_20rem]">
      {/* All projects */}
      <section>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects" className="pl-10" />
          </div>
          <Select
            value={category}
            onValueChange={setCategory}
            className="sm:w-48"
            options={[
              { value: "all", label: "All categories" },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
              { value: "none", label: "Uncategorised" },
            ]}
          />
          <Select
            value={status}
            onValueChange={setStatus}
            className="sm:w-40"
            options={[
              { value: "all", label: "Any status" },
              { value: "published", label: "Published" },
              { value: "draft", label: "Drafts" },
            ]}
          />
        </div>
        {filtering ? (
          <p className="mb-3 text-xs text-muted-foreground">Clear the filters to drag projects into a new order.</p>
        ) : null}

        {visible.length === 0 ? (
          <div className="panel py-16 text-center text-sm text-muted-foreground">
            {projects.length ? "No projects match these filters." : "No projects yet — create the first one."}
          </div>
        ) : (
          <Sortable
            items={visible}
            getId={(p) => p.id}
            onReorder={filtering ? () => {} : reorder}
            className="space-y-2.5"
            renderItem={(project, handle) => (
              <ProjectRowCard
                project={project}
                handle={filtering ? null : handle}
                onToggleFeatured={() => toggle(project, { is_featured: !project.is_featured })}
                onToggleStatus={() =>
                  toggle(project, { status: project.status === "published" ? "draft" : "published" })
                }
              />
            )}
          />
        )}
      </section>

      {/* Homepage order */}
      <aside>
        <div className="panel sticky top-24 p-5">
          <p className="eyebrow">On the homepage</p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            “Recent commissions” shows these in this order. Only published projects appear on the site.
          </p>
          {featured.length === 0 ? (
            <p className="mt-5 rounded-xl border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
              Star a project to feature it.
            </p>
          ) : (
            <Sortable
              items={featured}
              getId={(p) => p.id}
              onReorder={reorderFeaturedList}
              className="mt-4 space-y-1.5"
              renderItem={(project, handle, index) => (
                <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 py-1.5 pr-3 pl-1">
                  {handle}
                  <span className="w-4 text-center text-xs text-muted-foreground">{index + 1}</span>
                  <span className={cn("min-w-0 flex-1 truncate text-sm", project.status === "draft" && "text-muted-foreground line-through")}>
                    {project.title}
                  </span>
                </div>
              )}
            />
          )}
        </div>
      </aside>
    </div>
  );
}

function ProjectRowCard({
  project,
  handle,
  onToggleFeatured,
  onToggleStatus,
}: {
  project: ProjectRow;
  handle: React.ReactNode;
  onToggleFeatured: () => void;
  onToggleStatus: () => void;
}) {
  const imageCount = project.project_images[0]?.count ?? 0;
  const published = project.status === "published";

  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card/50 p-2.5 pr-3 transition-colors hover:border-primary/40 sm:gap-4">
      {handle ?? <span className="w-1" />}
      <Link href={`/portfolio/${project.id}`} className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-secondary sm:size-16">
        {project.cover ? (
          <MediaThumb item={project.cover} sizes="4rem" />
        ) : (
          <span className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-4" />
          </span>
        )}
      </Link>
      <Link href={`/portfolio/${project.id}`} className="min-w-0 flex-1">
        <p className="truncate font-medium transition-colors group-hover:text-primary">{project.title}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <span>{project.category?.name ?? "Uncategorised"}</span>
          {project.year ? <span>· {project.year}</span> : null}
          <span className="inline-flex items-center gap-1">
            · <Images className="size-3" /> {imageCount}
          </span>
        </p>
      </Link>
      <Badge tone={published ? "success" : "muted"} className="hidden sm:inline-flex">
        {published ? "Published" : "Draft"}
      </Badge>
      <button
        type="button"
        onClick={onToggleStatus}
        title={published ? "Unpublish (move to drafts)" : "Publish"}
        className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        {published ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
      </button>
      <button
        type="button"
        onClick={onToggleFeatured}
        title={project.is_featured ? "Remove from homepage" : "Feature on homepage"}
        className={cn(
          "flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-secondary",
          project.is_featured ? "text-primary" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Star className={cn("size-4", project.is_featured && "fill-primary")} />
      </button>
    </div>
  );
}
