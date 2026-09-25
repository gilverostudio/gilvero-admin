"use client";

import { ImageUp, LoaderCircle } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

import { ACCEPTED_IMAGE_TYPES } from "@/lib/media";
import { cn } from "@/lib/utils";

type DropzoneProps = {
  onFiles: (files: File[]) => void;
  uploading: { done: number; total: number } | null;
  compact?: boolean;
  children?: ReactNode;
};

/** Click-or-drop area for images. */
export function Dropzone({ onFiles, uploading, compact = false, children }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !uploading && inputRef.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (!uploading && e.dataTransfer.files.length) onFiles(Array.from(e.dataTransfer.files));
      }}
      className={cn(
        "group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[1.25rem] border border-dashed text-center transition-all duration-500 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none",
        compact ? "px-4 py-6" : "px-6 py-12",
        over ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-primary/[0.03]",
        uploading && "pointer-events-none",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onFiles(Array.from(e.target.files));
          e.target.value = "";
        }}
      />
      <span className="flex size-11 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary transition-transform duration-500 group-hover:-translate-y-0.5">
        {uploading ? <LoaderCircle className="size-5 animate-spin" /> : <ImageUp className="size-5" />}
      </span>
      {uploading ? (
        <p className="text-sm">
          Uploading {Math.min(uploading.done + 1, uploading.total)} of {uploading.total}…
        </p>
      ) : (
        children ?? (
          <div>
            <p className="text-sm">
              <span className="text-primary">Choose images</span> or drop them here
            </p>
            <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP, AVIF or GIF · up to 25 MB each</p>
          </div>
        )
      )}
    </div>
  );
}
