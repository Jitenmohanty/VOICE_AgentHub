import type { Metadata } from "next";
import { Outfit, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";
import { CookieConsent } from "@/components/shared/CookieConsent";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "AgentHub — Multi-Agent Voice AI Platform",
  description:
    "Choose your industry. Get a specialized voice AI agent powered by Gemini.",
  openGraph: {
    title: "AgentHub — Multi-Agent Voice AI Platform",
    description:
      "Choose your industry. Get a specialized voice AI agent powered by Gemini.",
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
      className={`${outfit.variable} ${ibmPlexSans.variable} ${jetbrainsMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0A0A0F] text-[#F0F0F5]">
        <SessionProvider>
          {children}
          <Toaster theme="dark" position="top-right" richColors />
          <CookieConsent />
        </SessionProvider>
      </body>
    </html>
  );
}
