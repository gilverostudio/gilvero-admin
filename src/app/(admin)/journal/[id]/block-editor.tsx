"use client";

import { Heading2, ImagePlus, Pilcrow, Quote, Trash2, Type } from "lucide-react";
import { useState, type ComponentType } from "react";
import { flushSync } from "react-dom";

import { useMediaIndex } from "@/components/content/media-context";
import { MediaPicker } from "@/components/media/media-picker";
import { MediaThumb } from "@/components/media/media-thumb";
import { Sortable } from "@/components/sortable";
import { cn } from "@/lib/utils";

export type TextBlockType = "lead" | "heading" | "paragraph" | "quote";
export type Block =
  | { key: string; type: TextBlockType; text: string }
  | { key: string; type: "image"; image_id: string; caption: string };

const TYPES: { type: Block["type"]; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { type: "lead", label: "Lead", icon: Type },
  { type: "heading", label: "Heading", icon: Heading2 },
  { type: "paragraph", label: "Paragraph", icon: Pilcrow },
  { type: "quote", label: "Quote", icon: Quote },
  { type: "image", label: "Image", icon: ImagePlus },
];

const textStyles: Record<TextBlockType, string> = {
  lead: "text-lg text-foreground/90",
  heading: "font-display text-xl font-semibold text-foreground",
  paragraph: "text-[0.95rem] text-muted-foreground",
  quote: "border-l-2 border-primary pl-4 italic text-foreground/90",
};

const placeholders: Record<TextBlockType, string> = {
  lead: "Opening line in larger type…",
  heading: "Section heading",
  paragraph: "Write…",
  quote: "A line worth pulling out",
};

/** Grows a textarea to fit its content. */
function autoSize(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

type BlockEditorProps = { value: Block[]; onChange: (blocks: Block[]) => void; error?: string };

/** Article body as ordered blocks: lead, heading, paragraph, quote, image. */
export function BlockEditor({ value, onChange, error }: BlockEditorProps) {
  const media = useMediaIndex();
  const [pickingFor, setPickingFor] = useState<{ index: number; replace: boolean } | null>(null);

  function insert(type: Block["type"], at = value.length) {
    if (type === "image") {
      setPickingFor({ index: at, replace: false });
      return;
    }
    const block: Block = { key: crypto.randomUUID(), type, text: "" };
    // Render synchronously, then focus — so no keystroke lands in the previous block.
    flushSync(() => onChange([...value.slice(0, at), block, ...value.slice(at)]));
    document.getElementById(`block-${block.key}`)?.focus();
  }

  function update(index: number, patch: Partial<Block>) {
    onChange(value.map((b, i) => (i === index ? ({ ...b, ...patch } as Block) : b)));
  }

  function changeType(index: number, type: Block["type"]) {
    const current = value[index];
    if (type === current.type) return;
    if (type === "image") {
      setPickingFor({ index, replace: true });
      return;
    }
    const text = current.type === "image" ? current.caption : current.text;
    onChange(value.map((b, i) => (i === index ? { key: b.key, type, text } : b)));
  }

  return (
    <div>
      {value.length ? (
        <Sortable
          items={value}
          getId={(b) => b.key}
          onReorder={onChange}
          className="space-y-2"
          renderItem={(block, handle, index) => (
            <div className="group flex items-start gap-1.5 rounded-2xl border border-transparent p-1.5 transition-colors focus-within:border-border/80 focus-within:bg-background/40 hover:border-border/60">
              <div className="flex flex-col items-center gap-1 pt-1 opacity-40 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                {handle}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex flex-wrap gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                  {TYPES.map(({ type, label, icon: Icon }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => changeType(index, type)}
                      title={`Turn into ${label.toLowerCase()}`}
                      className={cn(
                        "flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-[0.65rem] tracking-wide transition-colors",
                        block.type === type
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-border/70 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Icon className="size-3" /> {label}
                    </button>
                  ))}
                </div>
                {block.type === "image" ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setPickingFor({ index, replace: true })}
                      className="relative block aspect-[16/9] w-full max-w-xl cursor-pointer overflow-hidden rounded-xl border border-border/60 bg-secondary/40"
                    >
                      {media.get(block.image_id) ? <MediaThumb item={media.get(block.image_id)!} sizes="36rem" /> : null}
                    </button>
                    <input
                      value={block.caption}
                      onChange={(e) => update(index, { caption: e.target.value })}
                      placeholder="Caption (optional)"
                      maxLength={300}
                      className="w-full max-w-xl bg-transparent text-xs text-muted-foreground outline-none placeholder:text-muted-foreground/60"
                    />
                  </div>
                ) : (
                  <textarea
                    id={`block-${block.key}`}
                    ref={autoSize}
                    value={block.text}
                    rows={1}
                    onChange={(e) => {
                      update(index, { text: e.target.value });
                      autoSize(e.target);
                    }}
                    onKeyDown={(e) => {
                      // Enter at the end of a heading/lead starts a new paragraph.
                      if (e.key === "Enter" && !e.shiftKey && block.type !== "paragraph" && block.type !== "quote") {
                        e.preventDefault();
                        insert("paragraph", index + 1);
                      }
                    }}
                    placeholder={placeholders[block.type]}
                    className={cn(
                      "block w-full resize-none overflow-hidden bg-transparent leading-relaxed outline-none placeholder:text-muted-foreground/50",
                      textStyles[block.type],
                    )}
                  />
                )}
              </div>
              <button
                type="button"
                aria-label="Remove block"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                className="mt-7 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-secondary hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          )}
        />
      ) : (
        <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          Start the article with a lead paragraph, then add headings, paragraphs, quotes and images.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
        <span className="mr-1 text-xs text-muted-foreground">Add</span>
        {TYPES.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => insert(type)}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border/70 px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:border-primary/50 hover:text-primary"
          >
            <Icon className="size-3.5" /> {label}
          </button>
        ))}
      </div>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}

      <MediaPicker
        open={pickingFor !== null}
        onOpenChange={(open) => !open && setPickingFor(null)}
        title="Add an image"
        onSelect={([item]) => {
          if (!pickingFor) return;
          media.add([item]);
          const { index, replace } = pickingFor;
          const existing = value[index];
          const caption = existing && existing.type !== "image" ? existing.text : existing?.type === "image" ? existing.caption : "";
          const block: Block = { key: replace && existing ? existing.key : crypto.randomUUID(), type: "image", image_id: item.id, caption };
          onChange(replace ? value.map((b, i) => (i === index ? block : b)) : [...value.slice(0, index), block, ...value.slice(index)]);
          setPickingFor(null);
        }}
      />
    </div>
  );
}

/** ~200 words per minute, rounded, at least 1. */
export function estimateReadTime(blocks: Block[]) {
  const words = blocks
    .map((b) => (b.type === "image" ? b.caption : b.text))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min`;
}
