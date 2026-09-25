"use client";

import { useState } from "react";
import { toast } from "sonner";

import { registerMedia } from "@/app/(admin)/media/actions";
import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_BYTES, MEDIA_BUCKET, type MediaItem } from "@/lib/media";
import { createClient } from "@/lib/supabase/client";

async function readDimensions(file: File) {
  const bitmap = await createImageBitmap(file);
  const size = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return size;
}

function storagePathFor(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const base =
    file.name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "image";
  const now = new Date();
  const month = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  return `library/${month}/${crypto.randomUUID().slice(0, 8)}-${base}.${ext}`;
}

/** Alt text starting point from a file name: "noir-couture_03.jpg" → "Noir couture 03". */
function altFromName(name: string) {
  const words = name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  return words ? words[0].toUpperCase() + words.slice(1) : "";
}

/**
 * Upload images straight from the browser to Supabase Storage (no size limits
 * from server actions), then record them in the media table.
 */
export function useMediaUpload() {
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);

  async function upload(fileList: FileList | File[]): Promise<MediaItem[]> {
    const files = Array.from(fileList);
    const valid = files.filter((file) => {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast.error(`${file.name}: only JPG, PNG, WebP, AVIF or GIF images can be uploaded.`);
        return false;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        toast.error(`${file.name}: larger than 25 MB.`);
        return false;
      }
      return true;
    });
    if (!valid.length) return [];

    const supabase = createClient();
    setUploading({ done: 0, total: valid.length });
    const uploaded: Parameters<typeof registerMedia>[0] = [];

    try {
      for (const file of valid) {
        try {
          const { width, height } = await readDimensions(file);
          const storage_path = storagePathFor(file);
          const { error } = await supabase.storage
            .from(MEDIA_BUCKET)
            .upload(storage_path, file, { contentType: file.type, cacheControl: "31536000" });
          if (error) throw error;
          uploaded.push({
            storage_path,
            file_name: file.name,
            mime_type: file.type,
            size_bytes: file.size,
            width,
            height,
            alt: altFromName(file.name),
          });
        } catch (error) {
          toast.error(`${file.name}: ${error instanceof Error ? error.message : "upload failed"}`);
        }
        setUploading((u) => (u ? { ...u, done: u.done + 1 } : u));
      }

      if (!uploaded.length) return [];
      const result = await registerMedia(uploaded);
      if (!result.ok) {
        toast.error(result.error);
        return [];
      }
      toast.success(`${result.data.length} image${result.data.length > 1 ? "s" : ""} uploaded`);
      return result.data;
    } finally {
      setUploading(null);
    }
  }

  return { upload, uploading };
}
