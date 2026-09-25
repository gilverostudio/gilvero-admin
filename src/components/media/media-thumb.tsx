import Image from "next/image";

import { focalPosition, mediaUrl, type MediaItem } from "@/lib/media";
import { cn } from "@/lib/utils";

type MediaThumbProps = {
  item: Pick<MediaItem, "storage_path" | "alt" | "focal_x" | "focal_y" | "file_name">;
  sizes?: string;
  className?: string;
};

/** Cropped preview that respects the image's focal point. */
export function MediaThumb({ item, sizes = "200px", className }: MediaThumbProps) {
  return (
    <Image
      src={mediaUrl(item.storage_path)}
      alt={item.alt || item.file_name}
      fill
      sizes={sizes}
      style={{ objectPosition: focalPosition(item) }}
      className={cn("object-cover", className)}
    />
  );
}
