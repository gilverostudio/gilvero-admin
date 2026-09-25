"use client";

import { Check, LoaderCircle, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { listMedia } from "@/app/(admin)/media/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { type MediaItem } from "@/lib/media";
import { cn } from "@/lib/utils";

import { Dropzone } from "./dropzone";
import { MediaThumb } from "./media-thumb";
import { useMediaUpload } from "./use-media-upload";

type MediaPickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the chosen images, in the order they were clicked. */
  onSelect: (items: MediaItem[]) => void;
  multiple?: boolean;
  title?: string;
};

/** Choose one or more images from the library — or upload new ones on the spot. */
export function MediaPicker({ open, onOpenChange, onSelect, multiple = false, title }: MediaPickerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90svh] max-w-5xl flex-col gap-0 border-border/70 p-0 sm:rounded-[1.75rem]">
        {open ? (
          <PickerBody
            multiple={multiple}
            title={title}
            onCancel={() => onOpenChange(false)}
            onConfirm={(items) => {
              onSelect(items);
              onOpenChange(false);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PickerBody({
  multiple,
  title,
  onCancel,
  onConfirm,
}: {
  multiple: boolean;
  title?: string;
  onCancel: () => void;
  onConfirm: (items: MediaItem[]) => void;
}) {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MediaItem[]>([]);
  const { upload, uploading } = useMediaUpload();

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      listMedia(search).then((rows) => active && setItems(rows));
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);

  function toggle(item: MediaItem) {
    if (!multiple) {
      onConfirm([item]);
      return;
    }
    setSelected((current) =>
      current.some((s) => s.id === item.id) ? current.filter((s) => s.id !== item.id) : [...current, item],
    );
  }

  async function handleFiles(files: File[]) {
    const added = await upload(files);
    if (!added.length) return;
    setItems((current) => [...added, ...(current ?? [])]);
    if (multiple) setSelected((current) => [...current, ...added]);
    else onConfirm([added[0]]);
  }

  return (
    <>
      <div className="border-b border-border/60 p-6 pb-5">
        <DialogTitle className="text-xl">{title ?? (multiple ? "Add images" : "Choose an image")}</DialogTitle>
        <DialogDescription className="mt-1 text-sm text-muted-foreground">
          {multiple ? "Select as many as you like, in the order you want them." : "Pick from the library or upload a new one."}
        </DialogDescription>
        <div className="relative mt-5">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by file name or alt text" className="pl-10" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <Dropzone onFiles={handleFiles} uploading={uploading} compact />
        {items === null ? (
          <div className="flex justify-center py-16">
            <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No images match “{search}”.</p>
        ) : (
          <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {items.map((item) => {
              const position = selected.findIndex((s) => s.id === item.id);
              const isSelected = position > -1;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item)}
                  className={cn(
                    "group relative aspect-square cursor-pointer overflow-hidden rounded-xl border transition-all duration-300",
                    isSelected ? "border-primary ring-2 ring-primary/60" : "border-border/60 hover:border-primary/50",
                  )}
                >
                  <MediaThumb item={item} sizes="12rem" className="transition-transform duration-700 group-hover:scale-105" />
                  {isSelected ? (
                    <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-primary text-[0.7rem] font-semibold text-primary-foreground">
                      {multiple ? position + 1 : <Check className="size-3.5" />}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {multiple ? (
        <div className="flex items-center justify-between gap-3 border-t border-border/60 p-5">
          <p className="text-sm text-muted-foreground">{selected.length} selected</p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" disabled={!selected.length} onClick={() => onConfirm(selected)}>
              Add {selected.length || ""} image{selected.length === 1 ? "" : "s"}
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
