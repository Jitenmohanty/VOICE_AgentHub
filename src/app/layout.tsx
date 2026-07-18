import type { Metadata } from "next";
import { EB_Garamond, Figtree, JetBrains_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { CookieConsent } from "@/components/shared/CookieConsent";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { ThemedToaster } from "@/components/shared/ThemedToaster";
import "./globals.css";

const ebGaramond = EB_Garamond({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const figtree = Figtree({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Voxie — Multi-Agent Voice AI Platform",
  description:
    "Voxie is a voice-AI platform for small businesses. Embed an AI receptionist on your website that answers customer questions and captures leads to your inbox — for hotels, clinics, restaurants, and more.",
  openGraph: {
    title: "Voxie — Multi-Agent Voice AI Platform",
    description:
      "Voxie is a voice-AI platform for small businesses. Embed an AI receptionist on your website that answers customer questions and captures leads to your inbox — for hotels, clinics, restaurants, and more.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${ebGaramond.variable} ${figtree.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <SessionProvider>
            {children}
            <ThemedToaster />
            <CookieConsent />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
