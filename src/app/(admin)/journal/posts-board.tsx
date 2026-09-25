"use client";

import { Eye, EyeOff, ImageOff, Search, Star } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { MediaThumb } from "@/components/media/media-thumb";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { type MediaItem } from "@/lib/media";
import { toastResult } from "@/lib/toast-result";
import { cn } from "@/lib/utils";

import { setPostFlags } from "./actions";

export type PostRow = {
  id: string;
  slug: string;
  title: string;
  published_on: string | null;
  read_time: string;
  status: "draft" | "published";
  is_featured: boolean;
  category: { id: string; name: string } | null;
  cover: MediaItem | null;
};

export function formatDate(iso: string | null) {
  if (!iso) return "No date";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

export function PostsBoard({ posts: initial, categories }: { posts: PostRow[]; categories: { id: string; name: string }[] }) {
  const [posts, setPosts] = useState(initial);
  const [lastInitial, setLastInitial] = useState(initial);
  if (initial !== lastInitial) {
    setLastInitial(initial);
    setPosts(initial);
  }
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [, startTransition] = useTransition();

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return posts.filter(
      (p) =>
        (!term || p.title.toLowerCase().includes(term)) &&
        (category === "all" || (category === "none" ? !p.category : p.category?.id === category)) &&
        (status === "all" || p.status === status),
    );
  }, [posts, search, category, status]);

  function toggle(post: PostRow, flags: { status?: "draft" | "published"; is_featured?: boolean }) {
    const previous = posts;
    setPosts((current) => current.map((p) => (p.id === post.id ? { ...p, ...flags } : p)));
    startTransition(async () => {
      const message =
        flags.status === "published"
          ? `“${post.title}” is live`
          : flags.status === "draft"
            ? `“${post.title}” moved to drafts`
            : flags.is_featured
              ? "Added to the homepage"
              : "Removed from the homepage";
      if (!toastResult(await setPostFlags(post.id, flags), message)) setPosts(previous);
    });
  }

  return (
    <section>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search articles" className="pl-10" />
        </div>
        <Select
          value={category}
          onValueChange={setCategory}
          className="sm:w-52"
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

      {visible.length === 0 ? (
        <div className="panel py-16 text-center text-sm text-muted-foreground">
          {posts.length ? "No articles match these filters." : "No articles yet — write the first one."}
        </div>
      ) : (
        <ul className="space-y-2.5">
          {visible.map((post) => {
            const published = post.status === "published";
            return (
              <li
                key={post.id}
                className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card/50 p-2.5 pr-3 transition-colors hover:border-primary/40 sm:gap-4"
              >
                <Link href={`/journal/${post.id}`} className="relative aspect-[16/10] w-20 shrink-0 overflow-hidden rounded-xl bg-secondary sm:w-24">
                  {post.cover ? (
                    <MediaThumb item={post.cover} sizes="6rem" />
                  ) : (
                    <span className="flex size-full items-center justify-center text-muted-foreground">
                      <ImageOff className="size-4" />
                    </span>
                  )}
                </Link>
                <Link href={`/journal/${post.id}`} className="min-w-0 flex-1">
                  <p className="truncate font-medium transition-colors group-hover:text-primary">{post.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {post.category?.name ?? "Uncategorised"} · {formatDate(post.published_on)}
                    {post.read_time ? ` · ${post.read_time}` : ""}
                  </p>
                </Link>
                <Badge tone={published ? "success" : "muted"} className="hidden sm:inline-flex">
                  {published ? "Published" : "Draft"}
                </Badge>
                <button
                  type="button"
                  onClick={() => toggle(post, { status: published ? "draft" : "published" })}
                  title={published ? "Unpublish (move to drafts)" : "Publish"}
                  className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {published ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => toggle(post, { is_featured: !post.is_featured })}
                  title={post.is_featured ? "Remove from homepage" : "Show on homepage"}
                  className={cn(
                    "flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-secondary",
                    post.is_featured ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Star className={cn("size-4", post.is_featured && "fill-primary")} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
