"use client";

import { Toaster } from "sonner";
import { useTheme } from "next-themes";

/**
 * Sonner doesn't watch our theme; it takes a `theme` prop once at mount.
 * Re-render it when the theme changes so toast colors stay coherent.
 */
export function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return <Toaster theme={resolvedTheme === "light" ? "light" : "dark"} position="top-right" richColors />;
}
