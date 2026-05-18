"use client";

import { ThemeProvider as NextThemeProvider, type ThemeProviderProps } from "next-themes";

/**
 * Thin wrapper around `next-themes` so the `attribute` / `defaultTheme` config
 * lives in one place. We attach the theme as a class on <html> (`.dark` or
 * `.light`) which matches the CSS selectors in globals.css.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      // Suppresses the flash of the wrong theme on first paint by disabling
      // the cross-tab event during the hydration tick.
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemeProvider>
  );
}
