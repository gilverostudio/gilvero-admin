/** Shared media-library types and helpers (safe on server and client). */

export const MEDIA_BUCKET = "media";

export const MEDIA_COLUMNS =
  "id, storage_path, file_name, mime_type, size_bytes, width, height, alt, focal_x, focal_y, created_at";

export type MediaItem = {
  id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number | null;
  width: number;
  height: number;
  alt: string;
  focal_x: number;
  focal_y: number;
  created_at: string;
};

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export function mediaUrl(storagePath: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${storagePath}`;
}

export function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function focalPosition(item: Pick<MediaItem, "focal_x" | "focal_y">) {
  return `${item.focal_x * 100}% ${item.focal_y * 100}%`;
}
