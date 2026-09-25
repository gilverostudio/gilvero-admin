"use client";

import { ChevronDown, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

import { MediaPicker } from "@/components/media/media-picker";
import { MediaThumb } from "@/components/media/media-thumb";
import { Sortable } from "@/components/sortable";
import { Button } from "@/components/ui/button";
import { Field as FieldShell } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TagInput } from "@/components/ui/tag-input";
import { Textarea } from "@/components/ui/textarea";
import { emptyObject, type Field } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

import { useMediaIndex } from "./media-context";

type Value = Record<string, unknown>;

type FieldsFormProps = {
  fields: Field[];
  value: Value;
  onChange: (value: Value) => void;
  /** Prefix for input ids so labels stay unique across many forms on a page. */
  idPrefix: string;
  columns?: 1 | 2 | 3;
};

const gridCols = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3" } as const;

/** Renders a value object from declarative field definitions (see lib/content/schema.ts). */
export function FieldsForm({ fields, value, onChange, idPrefix, columns = 1 }: FieldsFormProps) {
  const set = (name: string, v: unknown) => onChange({ ...value, [name]: v });

  return (
    <div className={cn("grid gap-5", gridCols[columns])}>
      {fields.map((field) => {
        const id = `${idPrefix}-${field.name}`;
        const wide = columns > 1 && ["list", "group", "images", "textarea", "lines", "strings", "textlist"].includes(field.type);
        return (
          <div key={field.name} className={cn(wide && "sm:col-span-full")}>
            <FieldControl field={field} id={id} value={value[field.name]} onChange={(v) => set(field.name, v)} />
          </div>
        );
      })}
    </div>
  );
}

function FieldControl({ field, id, value, onChange }: { field: Field; id: string; value: unknown; onChange: (v: unknown) => void }) {
  switch (field.type) {
    case "text":
    case "url":
      return (
        <FieldShell label={field.label} htmlFor={id} hint={field.hint}>
          <Input
            id={id}
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            maxLength={field.type === "text" ? field.max : 500}
            inputMode={field.type === "url" ? "url" : undefined}
          />
        </FieldShell>
      );
    case "textarea":
      return (
        <FieldShell label={field.label} htmlFor={id} hint={field.hint}>
          <Textarea
            id={id}
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={field.rows ?? 3}
            maxLength={field.max}
          />
        </FieldShell>
      );
    case "number":
      return (
        <FieldShell label={field.label} htmlFor={id} hint={field.hint}>
          <Input
            id={id}
            type="number"
            value={Number.isFinite(value) ? String(value) : ""}
            min={field.min}
            max={field.max}
            onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
          />
        </FieldShell>
      );
    case "select":
      return (
        <FieldShell label={field.label} htmlFor={id} hint={field.hint}>
          <Select id={id} value={String(value ?? "")} onValueChange={onChange} options={field.options} />
        </FieldShell>
      );
    case "switch":
      return (
        <label htmlFor={id} className="flex h-full cursor-pointer items-center justify-between gap-3 pt-6 sm:justify-start">
          <span className="text-sm text-foreground/80">{field.label}</span>
          <Switch id={id} checked={Boolean(value)} onCheckedChange={onChange} />
        </label>
      );
    case "strings":
      return (
        <FieldShell label={field.label} htmlFor={id} hint={field.hint}>
          <TagInput id={id} value={(value as string[]) ?? []} onChange={onChange} placeholder={field.placeholder} />
        </FieldShell>
      );
    case "lines": {
      const lines = (value as string[]) ?? [];
      return (
        <FieldShell label={field.label} hint={field.hint}>
          <div className="grid gap-2 sm:grid-cols-2">
            {field.lineLabels.map((lineLabel, i) => (
              <Input
                key={lineLabel}
                aria-label={`${field.label} — ${lineLabel}`}
                value={lines[i] ?? ""}
                placeholder={lineLabel}
                maxLength={field.max}
                onChange={(e) => onChange(field.lineLabels.map((_, j) => (j === i ? e.target.value : (lines[j] ?? ""))))}
              />
            ))}
          </div>
        </FieldShell>
      );
    }
    case "link": {
      const link = (value as { label: string; href: string }) ?? { label: "", href: "" };
      return (
        <FieldShell label={field.label} hint={field.hint}>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input aria-label={`${field.label} label`} value={link.label} placeholder="Label" onChange={(e) => onChange({ ...link, label: e.target.value })} />
            <Input aria-label={`${field.label} link`} value={link.href} placeholder="/page" onChange={(e) => onChange({ ...link, href: e.target.value })} />
          </div>
        </FieldShell>
      );
    }
    case "slug":
      return (
        <FieldShell label={field.label} htmlFor={id} hint={field.hint ?? "Changing it breaks links already shared."}>
          <div className="flex items-center overflow-hidden rounded-xl border border-border/70 bg-background/40 focus-within:ring-1 focus-within:ring-ring">
            <span className="shrink-0 pl-3.5 text-sm text-muted-foreground">{field.prefix}</span>
            <input
              id={id}
              value={String(value ?? "")}
              onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              className="h-11 min-w-0 flex-1 bg-transparent pr-3.5 text-sm outline-none"
            />
          </div>
        </FieldShell>
      );
    case "textlist":
      return <TextListField field={field} id={id} value={(value as string[]) ?? []} onChange={onChange} />;
    case "image":
      return <ImageField field={field} id={id} value={(value as string | null) ?? null} onChange={onChange} />;
    case "images":
      return <ImagesField field={field} value={(value as string[]) ?? []} onChange={onChange} />;
    case "group":
      return (
        <fieldset className="rounded-2xl border border-border/60 p-4 sm:p-5">
          <legend className="px-2 text-xs tracking-wide text-muted-foreground">{field.label}</legend>
          {field.hint ? <p className="-mt-1 mb-4 text-xs text-muted-foreground/80">{field.hint}</p> : null}
          <FieldsForm fields={field.fields} value={(value as Value) ?? {}} onChange={onChange} idPrefix={id} columns={field.columns} />
        </fieldset>
      );
    case "list":
      return <ListField field={field} id={id} value={(value as Value[]) ?? []} onChange={onChange} />;
  }
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

function ImageField({
  field,
  id,
  value,
  onChange,
}: {
  field: Extract<Field, { type: "image" }>;
  id: string;
  value: string | null;
  onChange: (v: unknown) => void;
}) {
  const media = useMediaIndex();
  const [open, setOpen] = useState(false);
  const item = media.get(value);

  return (
    <FieldShell label={field.label} htmlFor={id} hint={field.hint}>
      <div className="flex items-center gap-3">
        <button
          id={id}
          type="button"
          onClick={() => setOpen(true)}
          className="group relative w-40 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-border/60 bg-secondary/40 transition-colors hover:border-primary/50"
          style={{ aspectRatio: field.aspect ?? "4 / 3" }}
        >
          {item ? (
            <MediaThumb item={item} sizes="10rem" />
          ) : (
            <span className="flex size-full items-center justify-center text-muted-foreground">
              <ImagePlus className="size-5" />
            </span>
          )}
        </button>
        <div className="flex flex-col gap-1.5">
          <Button type="button" size="sm" variant="quiet" onClick={() => setOpen(true)}>
            {item ? "Change" : "Choose image"}
          </Button>
          {item ? (
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)} className="text-muted-foreground">
              Remove
            </Button>
          ) : null}
        </div>
      </div>
      <MediaPicker
        open={open}
        onOpenChange={setOpen}
        onSelect={([picked]) => {
          media.add([picked]);
          onChange(picked.id);
        }}
        title={field.label}
      />
    </FieldShell>
  );
}

function ImagesField({ field, value, onChange }: { field: Extract<Field, { type: "images" }>; value: string[]; onChange: (v: unknown) => void }) {
  const media = useMediaIndex();
  const [open, setOpen] = useState(false);
  const entries = value.map((mediaId, i) => ({ key: `${mediaId}-${i}`, mediaId }));

  return (
    <FieldShell label={`${field.label} (${value.length})`} hint={field.hint ?? "Drag to reorder."}>
      {entries.length ? (
        <Sortable
          items={entries}
          getId={(e) => e.key}
          layout="grid"
          onReorder={(next) => onChange(next.map((e) => e.mediaId))}
          className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6"
          renderItem={(entry, handle, index) => {
            const item = media.get(entry.mediaId);
            return (
              <div className="relative aspect-square overflow-hidden rounded-xl border border-border/60 bg-secondary/40">
                {item ? <MediaThumb item={item} sizes="8rem" /> : null}
                <div className="absolute inset-x-1 top-1 flex justify-between">
                  <div className="rounded-lg bg-background/80 backdrop-blur">{handle}</div>
                  <button
                    type="button"
                    aria-label="Remove image"
                    onClick={() => onChange(value.filter((_, i) => i !== index))}
                    className="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-background/80 text-muted-foreground backdrop-blur hover:text-destructive"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          }}
        />
      ) : null}
      <Button type="button" size="sm" variant="quiet" onClick={() => setOpen(true)} disabled={value.length >= (field.max ?? 60)}>
        <ImagePlus /> Add images
      </Button>
      <MediaPicker
        open={open}
        onOpenChange={setOpen}
        multiple
        title={field.label}
        onSelect={(items) => {
          media.add(items);
          onChange([...value, ...items.map((m) => m.id)].slice(0, field.max ?? 60));
        }}
      />
    </FieldShell>
  );
}

// ---------------------------------------------------------------------------
// Text lists (paragraphs, modules…)
// ---------------------------------------------------------------------------

function TextListField({
  field,
  id,
  value,
  onChange,
}: {
  field: Extract<Field, { type: "textlist" }>;
  id: string;
  value: string[];
  onChange: (v: unknown) => void;
}) {
  const [keys, setKeys] = useState<string[]>(() => value.map((_, i) => `t${i}`));
  const aligned = value.map((_, i) => keys[i] ?? `n${i}`);
  const entries = value.map((text, i) => ({ key: aligned[i], text }));
  const max = field.max ?? 100;

  return (
    <div>
      <p className="mb-2.5 text-xs tracking-wide text-muted-foreground">
        {field.label} <span className="text-muted-foreground/60">({value.length})</span>
      </p>
      {entries.length ? (
        <Sortable
          items={entries}
          getId={(e) => e.key}
          onReorder={(next) => {
            setKeys(next.map((e) => e.key));
            onChange(next.map((e) => e.text));
          }}
          className="space-y-2"
          renderItem={(entry, handle, index) => (
            <div className="flex items-start gap-1.5">
              <div className="pt-1.5">{handle}</div>
              {field.multiline ? (
                <Textarea
                  id={`${id}-${index}`}
                  aria-label={`${field.itemLabel} ${index + 1}`}
                  value={entry.text}
                  rows={3}
                  maxLength={field.maxLength}
                  onChange={(e) => onChange(value.map((v, i) => (i === index ? e.target.value : v)))}
                />
              ) : (
                <Input
                  id={`${id}-${index}`}
                  aria-label={`${field.itemLabel} ${index + 1}`}
                  value={entry.text}
                  maxLength={field.maxLength}
                  onChange={(e) => onChange(value.map((v, i) => (i === index ? e.target.value : v)))}
                />
              )}
              <button
                type="button"
                aria-label={`Remove ${field.itemLabel.toLowerCase()}`}
                onClick={() => {
                  setKeys(aligned.filter((_, i) => i !== index));
                  onChange(value.filter((_, i) => i !== index));
                }}
                className="mt-1.5 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          )}
        />
      ) : null}
      <Button
        type="button"
        size="sm"
        variant="quiet"
        className="mt-3"
        disabled={value.length >= max}
        onClick={() => {
          setKeys([...aligned, crypto.randomUUID()]);
          onChange([...value, ""]);
        }}
      >
        <Plus /> Add {field.itemLabel.toLowerCase()}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lists
// ---------------------------------------------------------------------------

type ListItem = Value & { __key?: string };

function ListField({
  field,
  id,
  value,
  onChange,
}: {
  field: Extract<Field, { type: "list" }>;
  id: string;
  value: Value[];
  onChange: (v: unknown) => void;
}) {
  // Stable keys for drag-and-drop without persisting them.
  const [keys, setKeys] = useState<string[]>(() => value.map((item, i) => String(item.id ?? `k${i}`)));
  const [open, setOpen] = useState<string | null>(null);
  const alignedKeys = value.map((item, i) => keys[i] ?? String(item.id ?? `n${i}`));
  const items: ListItem[] = value.map((item, i) => ({ ...item, __key: alignedKeys[i] }));
  const strip = (list: ListItem[]) =>
    list.map((item) => Object.fromEntries(Object.entries(item).filter(([k]) => k !== "__key")) as Value);
  const max = field.max ?? 100;

  function add() {
    const key = crypto.randomUUID();
    setKeys([...alignedKeys, key]);
    onChange([...value, emptyObject(field.fields)]);
    setOpen(key);
  }

  return (
    <div>
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <p className="text-xs tracking-wide text-muted-foreground">
          {field.label} <span className="text-muted-foreground/60">({value.length})</span>
        </p>
        {field.hint ? <p className="text-xs text-muted-foreground/80">{field.hint}</p> : null}
      </div>
      {items.length ? (
        <Sortable
          items={items}
          getId={(item) => item.__key!}
          onReorder={(next) => {
            setKeys(next.map((i) => i.__key!));
            onChange(strip(next));
          }}
          className="space-y-2"
          renderItem={(item, handle, index) => {
            const key = item.__key!;
            const isOpen = open === key;
            const titleValue = field.titleField ? String(item[field.titleField] ?? "") : "";
            const hidden = item.is_visible === false;
            return (
              <div className={cn("rounded-2xl border bg-background/40 transition-colors", isOpen ? "border-primary/40" : "border-border/60")}>
                <div className="flex items-center gap-1 py-1.5 pr-2 pl-1">
                  {handle}
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : key)}
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-1.5 text-left"
                  >
                    <span className="w-5 shrink-0 text-center text-xs text-muted-foreground">{index + 1}</span>
                    <span className={cn("truncate text-sm", !titleValue && "text-muted-foreground", hidden && "line-through opacity-60")}>
                      {titleValue || `New ${field.itemLabel.toLowerCase()}`}
                    </span>
                    <ChevronDown className={cn("ml-auto size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${field.itemLabel.toLowerCase()}`}
                    onClick={() => {
                      setKeys(alignedKeys.filter((k) => k !== key));
                      onChange(value.filter((_, i) => i !== index));
                    }}
                    className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                {isOpen ? (
                  <div className="border-t border-border/60 p-4 sm:p-5">
                    <FieldsForm
                      fields={field.fields}
                      value={strip([item])[0]}
                      idPrefix={`${id}-${key}`}
                      columns={field.columns}
                      onChange={(next) => onChange(value.map((v, i) => (i === index ? { ...(v.id ? { id: v.id } : {}), ...next } : v)))}
                    />
                  </div>
                ) : null}
              </div>
            );
          }}
        />
      ) : (
        <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">
          No {field.itemLabel.toLowerCase()}s yet.
        </p>
      )}
      <Button type="button" size="sm" variant="quiet" onClick={add} disabled={value.length >= max} className="mt-3">
        <Plus /> Add {field.itemLabel.toLowerCase()}
      </Button>
    </div>
  );
}
