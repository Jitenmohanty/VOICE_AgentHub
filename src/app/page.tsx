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
