"use client";

import { Toaster } from "sonner";

import { useTheme } from "@/components/theme/use-theme";

function ThemedToaster() {
  return <Toaster theme={useTheme()} position="bottom-right" />;
}

export { ThemedToaster };
