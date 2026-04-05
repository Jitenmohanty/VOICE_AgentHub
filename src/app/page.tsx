import Link from "next/link";
import { Navbar } from "@/components/shared/Navbar";
import { Hero } from "@/components/landing/Hero";
import { AgentShowcase } from "@/components/landing/AgentShowcase";
import { Features } from "@/components/landing/Features";
import { InterviewSpotlight } from "@/components/landing/InterviewSpotlight";
import { UseCases } from "@/components/landing/UseCases";
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
      <CTA />
      <footer className="py-8 px-6 border-t border-[#2A2A3E]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-[#8888AA]">
          <span>© {new Date().getFullYear()} AgentHub. Powered by Google Gemini &amp; Claude AI.</span>
          <div className="flex items-center gap-6">
            <Link href="/legal/terms" className="hover:text-white transition-colors">
              Terms &amp; Conditions
            </Link>
            <Link href="/legal/cookies" className="hover:text-white transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
