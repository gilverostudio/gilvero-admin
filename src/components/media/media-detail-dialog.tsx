"use client";

import { Check, Copy, Crosshair, ExternalLink, LoaderCircle, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import { deleteMedia, getMediaUsage, updateMedia, type MediaUsage } from "@/app/(admin)/media/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatBytes, mediaUrl, type MediaItem } from "@/lib/media";
import { toastResult } from "@/lib/toast-result";

type MediaDetailDialogProps = {
  item: MediaItem | null;
  onClose: () => void;
  onSaved: (item: MediaItem) => void;
  onDeleted: (id: string) => void;
};

export function MediaDetailDialog({ item, onClose, onSaved, onDeleted }: MediaDetailDialogProps) {
  return (
    <Dialog open={Boolean(item)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92svh] max-w-5xl overflow-y-auto border-border/70 p-0 sm:rounded-[1.75rem]">
        {item ? <Detail key={item.id} item={item} onSaved={onSaved} onDeleted={onDeleted} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function Detail({ item, onSaved, onDeleted }: Omit<MediaDetailDialogProps, "item" | "onClose"> & { item: MediaItem }) {
  const [alt, setAlt] = useState(item.alt);
  const [focal, setFocal] = useState({ x: item.focal_x, y: item.focal_y });
  const [usage, setUsage] = useState<MediaUsage[] | null>(null);
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = mediaUrl(item.storage_path);
  const dirty = alt !== item.alt || focal.x !== item.focal_x || focal.y !== item.focal_y;

  useEffect(() => {
    let active = true;
    getMediaUsage(item.id).then((rows) => active && setUsage(rows));
    return () => {
      active = false;
    };
  }, [item.id]);

  function pickFocal(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const clamp = (v: number) => Math.min(1, Math.max(0, Math.round(v * 100) / 100));
    setFocal({ x: clamp((event.clientX - rect.left) / rect.width), y: clamp((event.clientY - rect.top) / rect.height) });
  }

  function save() {
    startSave(async () => {
      const result = await updateMedia(item.id, { alt: alt.trim(), focal_x: focal.x, focal_y: focal.y });
      if (toastResult(result, "Image details saved")) onSaved(result.data);
    });
  }

  function remove() {
    startDelete(async () => {
      const result = await deleteMedia(item.id);
      if (toastResult(result, "Image deleted")) onDeleted(item.id);
      setConfirmDelete(false);
    });
  }

  return (
    <div className="grid lg:grid-cols-[1.4fr_1fr]">
      {/* Preview + focal point */}
      <div className="border-b border-border/60 bg-background/60 p-5 sm:p-6 lg:border-r lg:border-b-0">
        <div
          onClick={pickFocal}
          className="relative mx-auto cursor-crosshair overflow-hidden rounded-2xl"
          // Width derived from the ratio so the box always matches the image exactly
          // (focal clicks map 1:1 to the picture), capped at 52svh tall.
          style={{
            aspectRatio: `${item.width} / ${item.height}`,
            width: `min(100%, calc(52svh * ${item.width / item.height}))`,
          }}
        >
          <Image src={url} alt={alt || item.file_name} fill sizes="(min-width: 1024px) 40rem, 100vw" className="object-cover" />
          <span
            className="pointer-events-none absolute size-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary shadow-[0_0_0_4px_oklch(0%_0_0/0.35),var(--shadow-glow)] transition-all duration-300"
            style={{ left: `${focal.x * 100}%`, top: `${focal.y * 100}%` }}
          >
            <span className="absolute inset-0 m-auto size-1.5 rounded-full bg-primary" />
          </span>
        </div>
        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Crosshair className="size-3.5 text-primary" /> Click the subject — crops on the site keep this point in frame.
        </p>
        <div className="mx-auto mt-4 grid max-w-xs grid-cols-3 items-start gap-2">
          {[
            { label: "Portrait", ratio: "4 / 5" },
            { label: "Landscape", ratio: "4 / 3" },
            { label: "Banner", ratio: "21 / 9" },
          ].map((crop) => (
            <div key={crop.label}>
              <div className="relative overflow-hidden rounded-lg border border-border/60" style={{ aspectRatio: crop.ratio }}>
                <Image
                  src={url}
                  alt=""
                  fill
                  sizes="10rem"
                  className="object-cover"
                  style={{ objectPosition: `${focal.x * 100}% ${focal.y * 100}%` }}
                />
              </div>
              <p className="mt-1.5 text-center text-[0.65rem] tracking-wide text-muted-foreground">{crop.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-col p-6 sm:p-7">
        <DialogTitle className="truncate pr-8 text-lg">{item.file_name}</DialogTitle>
        <DialogDescription className="mt-1 text-xs text-muted-foreground">
          {item.width} × {item.height} · {formatBytes(item.size_bytes)} ·{" "}
          {new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </DialogDescription>

        <div className="mt-6 space-y-5">
          <Field
            label="Alt text"
            htmlFor="alt"
            hint="Describe the image for screen readers and search engines."
          >
            <Input id="alt" value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={300} placeholder="e.g. Bride and groom under candlelight" />
          </Field>

          <div>
            <p className="text-xs tracking-wide text-muted-foreground">Used in</p>
            <div className="mt-2 rounded-xl border border-border/60">
              {usage === null ? (
                <p className="flex items-center gap-2 px-3.5 py-3 text-sm text-muted-foreground">
                  <LoaderCircle className="size-3.5 animate-spin" /> Checking…
                </p>
              ) : usage.length === 0 ? (
                <p className="px-3.5 py-3 text-sm text-muted-foreground">Not used anywhere yet.</p>
              ) : (
                <ul className="max-h-44 divide-y divide-border/60 overflow-y-auto">
                  {usage.map((u, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
                      <span className="min-w-0">
                        <span className="block truncate">{u.label}</span>
                        <span className="text-xs text-muted-foreground">{u.kind}</span>
                      </span>
                      {u.href ? (
                        <Link href={u.href} className="shrink-0 text-xs text-primary hover:underline">
                          Open
                        </Link>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="quiet"
              size="sm"
              onClick={async () => {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy URL"}
            </Button>
            <Button asChild variant="quiet" size="sm">
              <a href={url} target="_blank" rel="noreferrer">
                <ExternalLink /> Original
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-5 lg:mt-10">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" onClick={remove} disabled={deleting} className="bg-none bg-destructive text-destructive-foreground shadow-none">
                {deleting ? <LoaderCircle className="animate-spin" /> : <Trash2 />} Delete forever
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              disabled={!usage || usage.length > 0}
              title={usage?.length ? "Remove it from the places above first" : undefined}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 /> Delete
            </Button>
          )}
          <Button type="button" onClick={save} disabled={!dirty || saving}>
            {saving ? <LoaderCircle className="animate-spin" /> : null} Save
          </Button>
        </div>
      </div>
    </div>
  );
}
