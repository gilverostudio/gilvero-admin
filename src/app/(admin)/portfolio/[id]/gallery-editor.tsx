"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useState } from "react";

import { MediaPicker } from "@/components/media/media-picker";
import { MediaThumb } from "@/components/media/media-thumb";
import { Sortable } from "@/components/sortable";
import { Button } from "@/components/ui/button";
import { type MediaItem } from "@/lib/media";

export type GalleryEntry = { key: string; caption: string; media: MediaItem };

type GalleryEditorProps = {
  value: GalleryEntry[];
  onChange: (value: GalleryEntry[]) => void;
  projectTitle: string;
};

export function GalleryEditor({ value, onChange, projectTitle }: GalleryEditorProps) {
  const [picking, setPicking] = useState(false);

  function add(items: MediaItem[]) {
    const start = value.length;
    onChange([
      ...value,
      ...items.map((media, i) => ({
        key: crypto.randomUUID(),
        media,
        caption: `${projectTitle || "Gallery"} — ${String(start + i + 1).padStart(2, "0")}`,
      })),
    ]);
  }

  return (
    <>
      {value.length ? (
        <Sortable
          items={value}
          getId={(g) => g.key}
          onReorder={onChange}
          layout="grid"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3"
          renderItem={(entry, handle, index) => (
            <div className="group overflow-hidden rounded-2xl border border-border/60 bg-background/50">
              <div className="relative aspect-[4/5]">
                <MediaThumb item={entry.media} sizes="(min-width: 640px) 14rem, 45vw" />
                <div className="absolute inset-x-1.5 top-1.5 flex items-center justify-between">
                  <div className="rounded-lg bg-background/80 backdrop-blur">{handle}</div>
                  <span className="rounded-full bg-background/80 px-2 py-0.5 text-[0.65rem] backdrop-blur">
                    {index === 0 ? "Large tile" : index + 1}
                  </span>
                  <button
                    type="button"
                    aria-label="Remove from gallery"
                    onClick={() => onChange(value.filter((g) => g.key !== entry.key))}
                    className="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-background/80 text-muted-foreground backdrop-blur transition-colors hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              <input
                value={entry.caption}
                onChange={(e) =>
                  onChange(value.map((g) => (g.key === entry.key ? { ...g, caption: e.target.value } : g)))
                }
                placeholder="Caption"
                maxLength={200}
                className="w-full border-t border-border/60 bg-transparent px-3 py-2.5 text-xs outline-none placeholder:text-muted-foreground focus:bg-primary/[0.04]"
              />
            </div>
          )}
        />
      ) : (
        <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          No gallery images yet. The case study page hides the gallery until you add some.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Drag to reorder. Every fifth image (1, 6, 11…) shows as a large tile on the site.
        </p>
        <Button type="button" variant="quiet" onClick={() => setPicking(true)}>
          <ImagePlus /> Add images
        </Button>
      </div>

      <MediaPicker open={picking} onOpenChange={setPicking} onSelect={add} multiple title="Add to gallery" />
    </>
  );
}
