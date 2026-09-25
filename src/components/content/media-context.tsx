"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

import { type MediaItem } from "@/lib/media";

type MediaIndex = {
  get: (id: string | null | undefined) => MediaItem | undefined;
  add: (items: MediaItem[]) => void;
};

const MediaContext = createContext<MediaIndex | null>(null);

/** Thumbnails for media ids referenced in forms; picker selections are added as they happen. */
export function MediaIndexProvider({ initial, children }: { initial: Record<string, MediaItem>; children: ReactNode }) {
  const [index, setIndex] = useState(initial);
  const get = useCallback((id: string | null | undefined) => (id ? index[id] : undefined), [index]);
  const add = useCallback(
    (items: MediaItem[]) => setIndex((current) => ({ ...current, ...Object.fromEntries(items.map((m) => [m.id, m])) })),
    [],
  );
  return <MediaContext.Provider value={{ get, add }}>{children}</MediaContext.Provider>;
}

export function useMediaIndex() {
  const ctx = useContext(MediaContext);
  if (!ctx) throw new Error("useMediaIndex must be used inside <MediaIndexProvider>");
  return ctx;
}
