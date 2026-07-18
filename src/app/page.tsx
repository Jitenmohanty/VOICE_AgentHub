import Link from "next/link";
import { Navbar } from "@/components/shared/Navbar";
import { Hero } from "@/components/landing/Hero";
import { AgentShowcase } from "@/components/landing/AgentShowcase";
import { Features } from "@/components/landing/Features";
import { InterviewSpotlight } from "@/components/landing/InterviewSpotlight";
import { UseCases } from "@/components/landing/UseCases";
import { Pricing } from "@/components/landing/Pricing";
import { CTA } from "@/components/landing/CTA";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/*
        No-JS fallback. The landing sections below are framer-motion components
        that render with opacity:0 until JavaScript runs, so a crawler or
        reviewer that doesn't execute JS sees a blank page. This block gives
        them the app name + purpose + legal links in plain, always-visible HTML
        (it is hidden for normal JS users). Required for Google OAuth homepage
        verification, which reviews the page without running scripts.
      */}
      <noscript>
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "48px 24px",
            fontFamily: "system-ui, -apple-system, sans-serif",
            color: "#1a1a1a",
          }}
        >
          <h1 style={{ fontSize: 34, fontWeight: 700, marginBottom: 16 }}>Voxie</h1>
          <p style={{ fontSize: 19, lineHeight: 1.55, marginBottom: 16 }}>
            Voxie is a voice-AI platform for small businesses. Business owners create an
            industry-specific AI voice agent and embed it on their existing website with a single
            line of code. Visitors talk to the agent about the business&apos;s menu, rooms, doctors,
            or services, and every captured lead is delivered straight to the owner&apos;s inbox.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.6 }}>
            Voxie serves hotels, clinics, restaurants, legal practices, and more. Sign in with
            Google is used only to authenticate business owners into their Voxie dashboard.
          </p>
          <p style={{ fontSize: 16, marginTop: 20 }}>
            <a href="/legal/privacy">Privacy Policy</a>
            {" · "}
            <a href="/legal/terms">Terms of Service</a>
            {" · "}
            <a href="/contact">Contact</a>
          </p>
        </div>
      </noscript>
      <Navbar />
      <Hero />
      <AgentShowcase />
      <UseCases />
      <InterviewSpotlight />
      <Features />
      <Pricing />
      <CTA />
      <footer
        className="py-12 px-2 md:py-16 md:px-6 mt-12"
        style={{ borderTop: "1px solid var(--ah-border)" }}
      >
        <div
          className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm"
          style={{ color: "var(--ah-ink-muted)" }}
        >
          <span>
            © {new Date().getFullYear()} Voxie · Powered by Gemini &amp; Claude
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link href="/legal/privacy" className="hover:[color:var(--ah-ink)] transition-colors">
              Privacy
            </Link>
            <Link href="/legal/terms" className="hover:[color:var(--ah-ink)] transition-colors">
              Terms
            </Link>
            <Link href="/legal/cookies" className="hover:[color:var(--ah-ink)] transition-colors">
              Cookies
            </Link>
            <Link href="/contact" className="hover:[color:var(--ah-ink)] transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
