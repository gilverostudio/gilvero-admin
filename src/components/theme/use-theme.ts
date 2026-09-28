"use client";

import { useSyncExternalStore } from "react";

import { currentTheme, subscribeTheme, type Theme } from "@/lib/theme";

/** The active theme; "dark" during server render and hydration. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribeTheme, currentTheme, () => "dark");
}
