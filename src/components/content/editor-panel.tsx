"use client";

import { ArrowUpRight, ChevronDown, LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";

import { savePart } from "@/app/(admin)/content-actions";
import { Button } from "@/components/ui/button";
import type { Editor, Part } from "@/lib/content/editors";
import { toastResult } from "@/lib/toast-result";
import { cn } from "@/lib/utils";

import { FieldsForm } from "./fields-form";

type EditorPanelProps = {
  editor: Editor;
  initialValues: Record<string, unknown>[];
  websiteUrl: string;
  defaultOpen?: boolean;
};

const partFields = (part: Part) => (part.kind === "collection" ? [part.list] : part.fields);

/** One collapsible editor card: its parts' forms and a single Save for everything changed. */
export function EditorPanel({ editor, initialValues, websiteUrl, defaultOpen = false }: EditorPanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [values, setValues] = useState(initialValues);
  const [saved, setSaved] = useState(initialValues);
  const [saving, startSave] = useTransition();

  const dirtyParts = useMemo(
    () => values.map((v, i) => JSON.stringify(v) !== JSON.stringify(saved[i])),
    [values, saved],
  );
  const dirty = dirtyParts.some(Boolean);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function save() {
    startSave(async () => {
      let next = saved;
      for (let i = 0; i < editor.parts.length; i++) {
        if (!dirtyParts[i]) continue;
        const result = await savePart(editor.id, i, values[i]);
        if (!toastResult(result, `${editor.title} saved`)) return;
        const stored = result.data;
        next = next.map((v, j) => (j === i ? stored : v));
        setSaved(next);
        setValues((current) => current.map((v, j) => (j === i ? stored : v)));
      }
    });
  }

  return (
    <section
      id={editor.id}
      className={cn("panel scroll-mt-24 overflow-hidden transition-colors", dirty && "border-primary/40")}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-4 p-5 text-left sm:p-6"
      >
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2.5 text-lg">
            {editor.title}
            {dirty ? <span className="size-2 rounded-full bg-primary shadow-[var(--shadow-glow)]" aria-label="Unsaved changes" /> : null}
          </h2>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{editor.description}</p>
        </div>
        <ChevronDown className={cn("size-5 shrink-0 text-muted-foreground transition-transform duration-300", open && "rotate-180")} />
      </button>

      {open ? (
        <div className="border-t border-border/60">
          <div className="space-y-8 p-5 sm:p-6">
            {editor.parts.map((part, i) => (
              <div key={i}>
                {part.title ? <p className="eyebrow mb-4">{part.title}</p> : null}
                <FieldsForm
                  fields={partFields(part)}
                  value={values[i]}
                  idPrefix={`${editor.id}-${i}`}
                  onChange={(v) => setValues((current) => current.map((c, j) => (j === i ? v : c)))}
                />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-background/40 px-5 py-4 sm:px-6">
            {editor.preview ? (
              <Button asChild variant="ghost" size="sm">
                <a href={`${websiteUrl}${editor.preview}`} target="_blank" rel="noreferrer">
                  View on site <ArrowUpRight />
                </a>
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setValues(saved)} disabled={!dirty || saving}>
                Discard
              </Button>
              <Button type="button" size="sm" onClick={save} disabled={!dirty || saving}>
                {saving ? <LoaderCircle className="animate-spin" /> : null} Save
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
