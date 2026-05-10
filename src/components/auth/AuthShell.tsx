"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";

interface AuthShellProps {
  /** Page heading. Falls back to "Welcome" when omitted. */
  title: string;
  /** Optional supporting line below the title. */
  subtitle?: React.ReactNode;
  /** Optional element rendered after the subtitle (e.g. step indicator). */
  meta?: React.ReactNode;
  /** Optional element rendered below the children panel — usually a sign-in/up link. */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Unified shell for every auth page (login, register, forgot/reset password,
 * verify-email, verify-email-sent). Encapsulates the aurora background, the
 * brand mark, the heading + subtitle, and the centered card column.
 *
 * Pages plug in their form/content via `children`; the form should already be
 * wrapped in its own GlassPanel.
 */
export function AuthShell({ title, subtitle, meta, footer, children }: AuthShellProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 py-12 overflow-hidden">
      <AuroraBackground density="subtle" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-9">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-7 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl ah-gradient-bg flex items-center justify-center shadow-[0_8px_24px_-8px_rgba(124,58,237,0.6)]">
                <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <div className="absolute inset-0 rounded-2xl ah-gradient-bg blur-md opacity-40 group-hover:opacity-70 transition-opacity -z-10" />
            </div>
            <span className="font-semibold text-xl tracking-tight text-white">AgentHub</span>
          </Link>

          <h1 className="text-3xl md:text-[34px] font-semibold tracking-[-0.025em] text-white mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-white/55 max-w-sm mx-auto leading-relaxed">{subtitle}</p>
          )}
          {meta && <div className="mt-5">{meta}</div>}
        </div>

        {children}

        {footer && <div className="text-center mt-7 text-sm text-white/55">{footer}</div>}
      </motion.div>
    </div>
  );
}

/**
 * Step indicator dots — used by the multi-step register page.
 */
export function AuthStepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1 rounded-full transition-all duration-500 ${
            i < current ? "w-8 ah-gradient-bg" : "w-5 bg-white/10"
          }`}
        />
      ))}
    </div>
  );
}
