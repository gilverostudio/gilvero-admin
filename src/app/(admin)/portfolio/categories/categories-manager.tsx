"use client";

import { Check, LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState, useTransition } from "react";

import { Sortable } from "@/components/sortable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toastResult } from "@/lib/toast-result";
import { cn } from "@/lib/utils";

import { createCategory, deleteCategory, reorderCategories, updateCategory } from "../actions";

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  is_visible: boolean;
  projects: { count: number }[];
};

export function CategoriesManager({ categories: initial }: { categories: CategoryRow[] }) {
  const [categories, setCategories] = useState(initial);
  const [lastInitial, setLastInitial] = useState(initial);
  if (initial !== lastInitial) {
    setLastInitial(initial);
    setCategories(initial);
  }

  const [newName, setNewName] = useState("");
  const [adding, startAdd] = useTransition();
  const [, startTransition] = useTransition();

  function add(event: React.FormEvent) {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    startAdd(async () => {
      if (toastResult(await createCategory(name), `“${name}” added`)) setNewName("");
    });
  }

  function reorder(next: CategoryRow[]) {
    setCategories(next);
    startTransition(async () => {
      toastResult(await reorderCategories(next.map((c) => c.id)), "Order saved");
    });
  }

  return (
    <div className="max-w-2xl">
      <form onSubmit={add} className="mb-6 flex gap-2">
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New category, e.g. Events" maxLength={60} />
        <Button type="submit" disabled={adding || !newName.trim()} className="shrink-0">
          {adding ? <LoaderCircle className="animate-spin" /> : <Plus />} Add
        </Button>
      </form>

      <Sortable
        items={categories}
        getId={(c) => c.id}
        onReorder={reorder}
        className="space-y-2"
        renderItem={(category, handle) => (
          <CategoryItem
            category={category}
            handle={handle}
            onChange={(patch) =>
              setCategories((current) => current.map((c) => (c.id === category.id ? { ...c, ...patch } : c)))
            }
          />
        )}
      />
    </div>
  );
}

function CategoryItem({
  category,
  handle,
  onChange,
}: {
  category: CategoryRow;
  handle: React.ReactNode;
  onChange: (patch: Partial<CategoryRow>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  const count = category.projects[0]?.count ?? 0;

  function rename() {
    const next = name.trim();
    if (!next || next === category.name) {
      setEditing(false);
      setName(category.name);
      return;
    }
    start(async () => {
      if (toastResult(await updateCategory(category.id, { name: next }), "Category renamed")) {
        onChange({ name: next });
        setEditing(false);
      }
    });
  }

  function toggleVisible(is_visible: boolean) {
    onChange({ is_visible });
    start(async () => {
      if (!toastResult(await updateCategory(category.id, { is_visible }), is_visible ? "Filter shown" : "Filter hidden")) {
        onChange({ is_visible: !is_visible });
      }
    });
  }

  function remove() {
    start(async () => {
      toastResult(await deleteCategory(category.id), `“${category.name}” deleted`);
      setConfirming(false);
    });
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border/60 bg-card/50 p-2 pr-3 transition-opacity",
        !category.is_visible && "opacity-60",
      )}
    >
      {handle}
      {editing ? (
        <form
          className="flex flex-1 items-center gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            rename();
          }}
        >
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} className="h-9" maxLength={60} />
          <Button type="submit" size="icon" variant="ghost" aria-label="Save name" disabled={pending}>
            {pending ? <LoaderCircle className="animate-spin" /> : <Check />}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Cancel"
            onClick={() => {
              setEditing(false);
              setName(category.name);
            }}
          >
            <X />
          </Button>
        </form>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{category.name}</p>
            <p className="text-xs text-muted-foreground">
              {count} project{count === 1 ? "" : "s"}
            </p>
          </div>
          {confirming ? (
            <div className="flex items-center gap-1.5">
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {count ? `${count} project${count === 1 ? "" : "s"} become uncategorised.` : "Delete?"}
              </span>
              <Button type="button" size="sm" onClick={remove} disabled={pending} className="bg-none bg-destructive text-destructive-foreground shadow-none">
                Delete
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <label className="flex items-center gap-2 text-xs text-muted-foreground" title="Show as a filter on the website">
                <Switch checked={category.is_visible} onCheckedChange={toggleVisible} aria-label="Visible on website" />
                <span className="hidden sm:inline">{category.is_visible ? "Shown" : "Hidden"}</span>
              </label>
              <Button type="button" size="icon" variant="ghost" aria-label="Rename" onClick={() => setEditing(true)}>
                <Pencil />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Delete"
                onClick={() => setConfirming(true)}
                className="hover:text-destructive"
              >
                <Trash2 />
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
}
