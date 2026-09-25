"use client";

import { Check, LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState, useTransition } from "react";

import { Sortable } from "@/components/sortable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toastResult } from "@/lib/toast-result";

import { createBlogCategory, deleteBlogCategory, renameBlogCategory, reorderBlogCategories } from "../actions";

export type BlogCategoryRow = { id: string; name: string; posts: { count: number }[] };

export function BlogCategories({ categories: initial }: { categories: BlogCategoryRow[] }) {
  const [categories, setCategories] = useState(initial);
  const [lastInitial, setLastInitial] = useState(initial);
  if (initial !== lastInitial) {
    setLastInitial(initial);
    setCategories(initial);
  }
  const [newName, setNewName] = useState("");
  const [adding, startAdd] = useTransition();
  const [, startTransition] = useTransition();

  return (
    <div className="max-w-2xl">
      <form
        className="mb-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const name = newName.trim();
          if (!name) return;
          startAdd(async () => {
            if (toastResult(await createBlogCategory(name), `“${name}” added`)) setNewName("");
          });
        }}
      >
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New category, e.g. Gear" maxLength={60} />
        <Button type="submit" disabled={adding || !newName.trim()} className="shrink-0">
          {adding ? <LoaderCircle className="animate-spin" /> : <Plus />} Add
        </Button>
      </form>

      <Sortable
        items={categories}
        getId={(c) => c.id}
        onReorder={(next) => {
          setCategories(next);
          startTransition(async () => {
            toastResult(await reorderBlogCategories(next.map((c) => c.id)), "Order saved");
          });
        }}
        className="space-y-2"
        renderItem={(category, handle) => (
          <CategoryRow
            category={category}
            handle={handle}
            onRenamed={(name) => setCategories((cs) => cs.map((c) => (c.id === category.id ? { ...c, name } : c)))}
          />
        )}
      />
    </div>
  );
}

function CategoryRow({
  category,
  handle,
  onRenamed,
}: {
  category: BlogCategoryRow;
  handle: React.ReactNode;
  onRenamed: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  const count = category.posts[0]?.count ?? 0;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/50 p-2 pr-3">
      {handle}
      {editing ? (
        <form
          className="flex flex-1 items-center gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            const next = name.trim();
            if (!next || next === category.name) return setEditing(false);
            start(async () => {
              if (toastResult(await renameBlogCategory(category.id, next), "Category renamed")) {
                onRenamed(next);
                setEditing(false);
              }
            });
          }}
        >
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} className="h-9" maxLength={60} />
          <Button type="submit" size="icon" variant="ghost" aria-label="Save name" disabled={pending}>
            {pending ? <LoaderCircle className="animate-spin" /> : <Check />}
          </Button>
          <Button type="button" size="icon" variant="ghost" aria-label="Cancel" onClick={() => (setEditing(false), setName(category.name))}>
            <X />
          </Button>
        </form>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{category.name}</p>
            <p className="text-xs text-muted-foreground">
              {count} article{count === 1 ? "" : "s"}
            </p>
          </div>
          {confirming ? (
            <div className="flex items-center gap-1.5">
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {count ? `${count} article${count === 1 ? "" : "s"} become uncategorised.` : "Delete?"}
              </span>
              <Button
                type="button"
                size="sm"
                disabled={pending}
                className="bg-none bg-destructive text-destructive-foreground shadow-none"
                onClick={() =>
                  start(async () => {
                    toastResult(await deleteBlogCategory(category.id), `“${category.name}” deleted`);
                    setConfirming(false);
                  })
                }
              >
                Delete
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <Button type="button" size="icon" variant="ghost" aria-label="Rename" onClick={() => setEditing(true)}>
                <Pencil />
              </Button>
              <Button type="button" size="icon" variant="ghost" aria-label="Delete" onClick={() => setConfirming(true)} className="hover:text-destructive">
                <Trash2 />
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
}
