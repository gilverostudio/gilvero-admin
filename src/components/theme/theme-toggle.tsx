"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { currentTheme, setTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

/**
 * Sun / moon switch. Icons swap with CSS (the `light:` variant), so the server
 * markup is correct for either theme and nothing flickers on hydration.
 */
function ThemeToggle({ className }: { className?: string }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Switch between light and dark mode"
      title="Light / dark mode"
      className={cn("relative text-foreground/70", className)}
      onClick={() => setTheme(currentTheme() === "light" ? "dark" : "light")}
    >
      <Sun className="transition-all duration-500 light:scale-0 light:-rotate-90 light:opacity-0" />
      <Moon className="absolute scale-0 rotate-90 opacity-0 transition-all duration-500 light:scale-100 light:rotate-0 light:opacity-100" />
    </Button>
  );
}

export { ThemeToggle };
