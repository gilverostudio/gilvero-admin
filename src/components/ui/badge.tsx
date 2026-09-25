import { cva, type VariantProps } from "class-variance-authority";
import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.68rem] font-medium tracking-wide whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "border-border/80 text-muted-foreground",
        gold: "border-primary/40 bg-primary/10 text-primary",
        success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        muted: "border-border/60 bg-secondary/60 text-muted-foreground",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

function Badge({ className, tone, ...props }: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { Badge };
