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
        <div className="max-w-7xl mx-auto text-center text-sm text-[#8888AA]">
          © {new Date().getFullYear()} AgentHub. Powered by Google Gemini & Claude AI.
        </div>
      </footer>
    </main>
  );
}
