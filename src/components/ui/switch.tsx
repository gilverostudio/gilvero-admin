"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-border/80 bg-secondary transition-colors duration-300 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary/60 data-[state=checked]:bg-primary/25",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-4 translate-x-1 rounded-full bg-muted-foreground shadow transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] data-[state=checked]:translate-x-6 data-[state=checked]:bg-primary data-[state=checked]:shadow-[var(--shadow-glow)]" />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
