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
    <main className="min-h-screen bg-[#0A0A0F]">
      <Navbar />
      <Hero />
      <AgentShowcase />
      <UseCases />
      <InterviewSpotlight />
      <Features />
      <Pricing />
      <CTA />
      <footer className="py-8 px-6 border-t border-[#2A2A3E]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#8888AA]">
          <span>© {new Date().getFullYear()} AgentHub. Powered by Google Gemini &amp; Claude AI.</span>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link href="/legal/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/legal/terms" className="hover:text-white transition-colors">
              Terms &amp; Conditions
            </Link>
            <Link href="/legal/cookies" className="hover:text-white transition-colors">
              Cookie Policy
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              Contact &amp; Support
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
