"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { SidebarNav } from "./sidebar-nav";

/** Slide-in navigation for small screens. */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu" className="lg:hidden">
          <Menu />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[18rem] flex-col border-r border-border/60 bg-background p-6 shadow-2xl data-[state=open]:animate-in data-[state=open]:slide-in-from-left data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left">
          <div className="flex items-center justify-between">
            <Dialog.Title className="font-display text-base tracking-[0.42em]">GILVERO</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close menu">
                <X />
              </Button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Admin navigation</Dialog.Description>
          <div className="mt-8 -mr-3 flex-1 overflow-y-auto pr-3 pl-3">
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
