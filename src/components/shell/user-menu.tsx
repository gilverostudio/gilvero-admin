"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, LogOut } from "lucide-react";

import { signOut } from "@/app/login/actions";
import type { AdminUser } from "@/lib/auth";

function initials(admin: AdminUser) {
  const source = admin.full_name || admin.email;
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UserMenu({ admin }: { admin: AdminUser }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="group flex cursor-pointer items-center gap-2.5 rounded-full border border-border/70 py-1 pr-3 pl-1 transition-colors hover:border-primary/50 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none">
        <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-[oklch(0.78_0.12_84)] to-[oklch(0.88_0.1_92)] text-xs font-semibold text-primary-foreground">
          {initials(admin)}
        </span>
        <span className="hidden max-w-[10rem] truncate text-sm text-foreground/80 sm:inline">
          {admin.full_name || admin.email}
        </span>
        <ChevronDown className="size-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-60 rounded-2xl border border-border/70 bg-popover p-1.5 shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <div className="px-3 py-2.5">
            <p className="truncate text-sm font-medium">{admin.full_name || "Admin"}</p>
            <p className="truncate text-xs text-muted-foreground">{admin.email}</p>
            <p className="eyebrow mt-2 !text-[0.6rem]">{admin.role}</p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-border/70" />
          <form action={signOut}>
            <DropdownMenu.Item asChild>
              <button
                type="submit"
                className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground/80 outline-none data-[highlighted]:bg-secondary data-[highlighted]:text-foreground"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </DropdownMenu.Item>
          </form>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
