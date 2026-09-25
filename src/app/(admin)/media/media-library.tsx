"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Dropzone } from "@/components/media/dropzone";
import { MediaDetailDialog } from "@/components/media/media-detail-dialog";
import { MediaThumb } from "@/components/media/media-thumb";
import { useMediaUpload } from "@/components/media/use-media-upload";
import { Input } from "@/components/ui/input";
import { type MediaItem } from "@/lib/media";
import { cn } from "@/lib/utils";

type Filter = "all" | "unused" | "no-alt";

type MediaLibraryProps = {
  initialItems: MediaItem[];
  usageCount: Record<string, number>;
};

export function MediaLibrary({ initialItems, usageCount }: MediaLibraryProps) {
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const { upload, uploading } = useMediaUpload();

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      if (filter === "unused" && usageCount[item.id]) return false;
      if (filter === "no-alt" && item.alt.trim()) return false;
      return !term || item.file_name.toLowerCase().includes(term) || item.alt.toLowerCase().includes(term);
    });
  }, [items, search, filter, usageCount]);

  const counts = {
    all: items.length,
    unused: items.filter((i) => !usageCount[i.id]).length,
    "no-alt": items.filter((i) => !i.alt.trim()).length,
  };

  async function handleFiles(files: File[]) {
    const added = await upload(files);
    if (added.length) setItems((current) => [...added, ...current]);
  }

  return (
    <>
      <Dropzone onFiles={handleFiles} uploading={uploading} />

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "All"],
              ["unused", "Unused"],
              ["no-alt", "Missing alt text"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "cursor-pointer rounded-full border px-4 py-1.5 text-xs tracking-wide transition-all duration-500",
                filter === key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/70 text-muted-foreground hover:border-primary/50 hover:text-primary",
              )}
            >
              {label} <span className="opacity-70">{counts[key]}</span>
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search images" className="pl-10" />
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted-foreground">No images here.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {visible.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setOpenId(item.id)}
              style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
              className="reveal group cursor-pointer text-left"
            >
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-border/60 transition-all duration-500 group-hover:border-primary/50 group-hover:shadow-[var(--shadow-glow)]">
                <MediaThumb item={item} sizes="(min-width: 1280px) 15rem, (min-width: 640px) 30vw, 45vw" className="transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]" />
                <div className="absolute inset-x-2 bottom-2 flex gap-1.5">
                  {usageCount[item.id] ? (
                    <span className="rounded-full bg-background/80 px-2 py-0.5 text-[0.65rem] text-foreground/80 backdrop-blur">
                      Used ×{usageCount[item.id]}
                    </span>
                  ) : (
                    <span className="rounded-full bg-background/80 px-2 py-0.5 text-[0.65rem] text-muted-foreground backdrop-blur">
                      Unused
                    </span>
                  )}
                  {!item.alt.trim() ? (
                    <span className="rounded-full bg-primary/85 px-2 py-0.5 text-[0.65rem] text-primary-foreground">No alt</span>
                  ) : null}
                </div>
              </div>
              <p className="mt-2 truncate text-xs text-muted-foreground group-hover:text-foreground">{item.file_name}</p>
            </button>
          ))}
        </div>
      )}

      <MediaDetailDialog
        item={items.find((i) => i.id === openId) ?? null}
        onClose={() => setOpenId(null)}
        onSaved={(saved) => setItems((current) => current.map((i) => (i.id === saved.id ? saved : i)))}
        onDeleted={(id) => {
          setItems((current) => current.filter((i) => i.id !== id));
          setOpenId(null);
        }}
      />
    </>
  );
}
