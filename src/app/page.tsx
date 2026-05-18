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
    <main className="min-h-screen bg-[var(--ah-bg-deep)]">
      <Navbar />
      <Hero />
      <AgentShowcase />
      <UseCases />
      <InterviewSpotlight />
      <Features />
      <Pricing />
      <CTA />
      <footer className="py-10 px-2 md:py-12 md:px-6 border-t border-white/[0.06] mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/50">
          <span className="text-white/40">
            © {new Date().getFullYear()} Voxie · Powered by Gemini &amp; Claude
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link href="/legal/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/legal/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/legal/cookies" className="hover:text-white transition-colors">
              Cookies
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
