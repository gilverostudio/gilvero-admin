import { z } from "zod";

/**
 * Declarative field definitions. One definition drives three things:
 *   1. the admin form (components/content/fields-form.tsx),
 *   2. server-side validation (toZod below),
 *   3. what gets written to the database.
 */

type Base = { name: string; label: string; hint?: string; placeholder?: string };

export type Field =
  | (Base & { type: "text"; max?: number; required?: boolean })
  | (Base & { type: "textarea"; max?: number; rows?: number })
  | (Base & { type: "number"; min?: number; max?: number })
  | (Base & { type: "url"; required?: boolean })
  | (Base & { type: "image"; aspect?: string })
  | (Base & { type: "images"; max?: number })
  | (Base & { type: "link" })
  | (Base & { type: "select"; options: { value: string; label: string }[] })
  | (Base & { type: "switch" })
  | (Base & { type: "strings"; max?: number })
  /** Fixed number of single-line inputs, stored as string[] (e.g. a two-line headline). */
  | (Base & { type: "lines"; lineLabels: string[]; max?: number })
  | (Base & { type: "group"; fields: Field[]; columns?: 1 | 2 })
  | (Base & {
      type: "list";
      fields: Field[];
      itemLabel: string;
      /** Field whose value titles each collapsed row. */
      titleField?: string;
      max?: number;
      /** Laid out as columns inside each row (for short fields). */
      columns?: 1 | 2 | 3;
    });

/** Accept site-relative paths, anchors, web links, phone and email links. */
export const HREF = /^(\/[^\s]*|#[^\s]*|https?:\/\/[^\s]+|tel:[^\s]+|mailto:[^\s]+)$/;

const text = (max = 2000) => z.string().trim().max(max, `Keep it under ${max} characters.`);

function fieldSchema(field: Field): z.ZodType {
  switch (field.type) {
    case "text":
      return field.required ? text(field.max ?? 300).min(1, `${field.label} is required.`) : text(field.max ?? 300);
    case "textarea":
      return text(field.max ?? 4000);
    case "number": {
      let n = z.number({ message: `${field.label} must be a number.` });
      if (field.min !== undefined) n = n.min(field.min);
      if (field.max !== undefined) n = n.max(field.max);
      return n;
    }
    case "url":
      return field.required
        ? z.string().trim().regex(HREF, "Use a link like /page, https://… , tel:… or mailto:…")
        : z.union([z.literal(""), z.string().trim().regex(HREF, "Use a link like /page, https://… , tel:… or mailto:…")]);
    case "image":
      return z.string().uuid().nullable();
    case "images":
      return z.array(z.string().uuid()).max(field.max ?? 60);
    case "link":
      return z.object({
        label: text(80).min(1, "Add a button label."),
        href: z.string().trim().regex(HREF, "Use a link like /page, https://… , tel:… or mailto:…"),
      });
    case "select":
      return z.enum(field.options.map((o) => o.value) as [string, ...string[]]);
    case "switch":
      return z.boolean();
    case "strings":
      return z.array(text(200).min(1)).max(field.max ?? 100);
    case "lines":
      return z.array(text(field.max ?? 200)).length(field.lineLabels.length);
    case "group":
      return objectSchema(field.fields);
    case "list":
      return z.array(objectSchema(field.fields).extend({ id: z.string().uuid().optional() })).max(field.max ?? 100);
  }
}

export function objectSchema(fields: Field[]) {
  return z.object(Object.fromEntries(fields.map((f) => [f.name, fieldSchema(f)])));
}

/** Empty value for a field — used when adding list items. */
export function emptyValue(field: Field): unknown {
  switch (field.type) {
    case "number":
      return 0;
    case "image":
      return null;
    case "images":
    case "strings":
    case "list":
      return [];
    case "lines":
      return field.lineLabels.map(() => "");
    case "link":
      return { label: "", href: "" };
    case "select":
      return field.options[0]?.value ?? "";
    case "switch":
      return true;
    case "group":
      return emptyObject(field.fields);
    default:
      return "";
  }
}

export function emptyObject(fields: Field[]) {
  return Object.fromEntries(fields.map((f) => [f.name, emptyValue(f)]));
}

/** Fill any missing keys so every field has a value of the right shape. */
export function normalize(fields: Field[], value: Record<string, unknown> | null | undefined): Record<string, unknown> {
  const source = value ?? {};
  return Object.fromEntries(
    fields.map((f) => {
      const v = source[f.name];
      if (v === undefined || v === null) return [f.name, f.type === "image" ? null : emptyValue(f)];
      if (f.type === "group") return [f.name, normalize(f.fields, v as Record<string, unknown>)];
      if (f.type === "list" && Array.isArray(v)) {
        return [
          f.name,
          v.map((item) => {
            const row = item as Record<string, unknown>;
            return { ...(row.id ? { id: row.id } : {}), ...normalize(f.fields, row) };
          }),
        ];
      }
      if (f.type === "lines") {
        const lines = Array.isArray(v) ? (v as string[]) : [];
        return [f.name, f.lineLabels.map((_, i) => lines[i] ?? "")];
      }
      if (f.type === "link") {
        const link = v as { label?: string; href?: string };
        return [f.name, { label: link.label ?? "", href: link.href ?? "" }];
      }
      return [f.name, v];
    }),
  );
}

/** Every media id referenced by a value (for loading thumbnails). */
export function collectMediaIds(fields: Field[], value: unknown, into = new Set<string>()): Set<string> {
  const obj = (value ?? {}) as Record<string, unknown>;
  for (const f of fields) {
    const v = obj[f.name];
    if (f.type === "image" && typeof v === "string") into.add(v);
    if (f.type === "images" && Array.isArray(v)) v.forEach((id) => typeof id === "string" && into.add(id));
    if (f.type === "group") collectMediaIds(f.fields, v, into);
    if (f.type === "list" && Array.isArray(v)) v.forEach((item) => collectMediaIds(f.fields, item, into));
  }
  return into;
}
