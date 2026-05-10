"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  // Navbar tightens once the page scrolls past the hero — Apple-style.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={[
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-[#050816]/85 backdrop-blur-2xl border-b border-white/8"
          : "bg-transparent backdrop-blur-md border-b border-transparent",
      ].join(" ")}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="w-9 h-9 rounded-2xl ah-gradient-bg flex items-center justify-center shadow-[0_8px_24px_-8px_rgba(124,58,237,0.6)] group-hover:shadow-[0_8px_24px_-4px_rgba(59,130,246,0.7)] transition-shadow">
              <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="absolute inset-0 rounded-2xl ah-gradient-bg blur-md opacity-40 group-hover:opacity-70 transition-opacity -z-10" />
          </div>
          <span className="font-semibold text-[17px] tracking-tight text-white">
            AgentHub
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-white/65">
          <a href="#features" className="hover:text-white transition-colors">
            Features
          </a>
          <a href="#pricing" className="hover:text-white transition-colors">
            Pricing
          </a>
          <Link href="/contact" className="hover:text-white transition-colors">
            Contact
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-white/65 hover:text-white transition-colors px-3 py-2"
          >
            Sign in
          </Link>
          <GradientButton href="/register" size="sm">
            Get Started
          </GradientButton>
        </div>
      </div>
    </motion.nav>
  );
}
