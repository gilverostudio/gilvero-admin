import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** Gold gradient — the primary call to action. */
        gold: "bg-gradient-to-r from-[oklch(0.78_0.12_84)] to-[oklch(0.88_0.1_92)] text-primary-foreground shadow-[var(--shadow-glow)] hover:-translate-y-0.5 hover:brightness-110",
        /** Hairline outline — the secondary action. */
        quiet:
          "border border-border/80 bg-transparent text-foreground/85 hover:border-primary/60 hover:text-primary",
        /** Bare icon/text button. */
        ghost: "text-sm hover:bg-accent hover:text-accent-foreground",
        /** Translucent gold, used over imagery (hero CTAs). */
        hero:
          "border border-primary/40 bg-primary/10 text-primary backdrop-blur-md hover:-translate-y-0.5 hover:bg-primary/20",
      },
      size: {
        default: "h-10 px-5 py-2 text-sm",
        sm: "h-8 px-4 text-xs",
        lg: "h-12 px-8 text-[0.9rem] tracking-wide",
        xl: "h-14 px-10 text-[0.95rem] tracking-wide",
        icon: "h-10 w-10 text-sm",
      },
    },
    defaultVariants: {
      variant: "gold",
      size: "default",
    },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Render the child element (e.g. a Link) with button styling. */
    asChild?: boolean;
  };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { Button, buttonVariants, type ButtonProps };
