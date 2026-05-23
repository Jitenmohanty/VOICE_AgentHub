"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

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
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? "rgba(247, 243, 236, 0.88)" : "transparent",
        backdropFilter: scrolled ? "blur(12px) saturate(140%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(12px) saturate(140%)" : "none",
        borderBottom: scrolled ? "1px solid var(--ah-border)" : "1px solid transparent",
      }}
    >
      <div className="max-w-7xl mx-auto px-2 md:px-8 py-3 md:py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center transition-transform group-hover:scale-105"
            style={{ background: "var(--ah-cta)" }}
          >
            <Sparkles className="w-4 h-4" style={{ color: "#FFFCF6" }} strokeWidth={2.5} />
          </div>
          <span
            className="font-serif text-[22px] tracking-tight"
            style={{ color: "var(--ah-ink)" }}
          >
            Voxie
          </span>
        </Link>

        <div
          className="hidden md:flex items-center gap-8 text-sm"
          style={{ color: "var(--ah-ink-soft)" }}
        >
          <a href="#features" className="hover:[color:var(--ah-ink)] transition-colors">
            Features
          </a>
          <a href="#pricing" className="hover:[color:var(--ah-ink)] transition-colors">
            Pricing
          </a>
          <Link href="/contact" className="hover:[color:var(--ah-ink)] transition-colors">
            Contact
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-sm transition-colors px-3 py-2"
            style={{ color: "var(--ah-ink-soft)" }}
          >
            Sign in
          </Link>
          <GradientButton href="/register" size="sm">
            Get started
          </GradientButton>
        </div>
      </div>
    </motion.nav>
  );
}
