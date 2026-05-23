"use client";

import { motion } from "framer-motion";
import { ArrowRight, Mic, Inbox, Code2, Webhook, Sparkles, Phone, MessageSquare } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";

export function Hero() {
  return (
    <section className="relative flex items-center justify-center overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="ah-pill mb-8"
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--ah-sage-deep)" }} />
            <span>Voice AI for hotels, clinics, restaurants &amp; more</span>
          </motion.div>

          {/* Headline — EB Garamond, ink-black, italic accent */}
          <h1
            className="font-serif text-5xl md:text-7xl lg:text-[88px] leading-[1.05] tracking-[-0.025em] mb-7"
            style={{ color: "var(--ah-ink)" }}
          >
            Never miss
            <br />
            a customer.{" "}
            <span className="italic" style={{ color: "var(--ah-sage-deep)" }}>
              Your AI takes the call.
            </span>
          </h1>

          {/* Subhead */}
          <p
            className="text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
            style={{ color: "var(--ah-ink-soft)" }}
          >
            Drop a single iframe into your existing site. Visitors talk to an AI that knows your menu,
            rooms, doctors, or services — and every captured lead lands in your inbox in under 30 seconds.
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-3 mb-16 flex-wrap">
            <GradientButton href="/register" size="lg">
              Start free
              <ArrowRight className="w-4 h-4" />
            </GradientButton>
            <GradientButton href="#pricing" size="lg" variant="outline">
              See pricing
            </GradientButton>
          </div>

          {/* Proof points */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm"
            style={{ color: "var(--ah-ink-muted)" }}
          >
            <span className="flex items-center gap-2">
              <Code2 className="w-4 h-4" style={{ color: "var(--ah-sage-deep)" }} />
              Embed on your existing site
            </span>
            <span className="hidden sm:inline w-1 h-1 rounded-full" style={{ background: "var(--ah-border-strong)" }} />
            <span className="flex items-center gap-2">
              <Inbox className="w-4 h-4" style={{ color: "var(--ah-lavender-deep)" }} />
              Leads delivered by email
            </span>
            <span className="hidden sm:inline w-1 h-1 rounded-full" style={{ background: "var(--ah-border-strong)" }} />
            <span className="flex items-center gap-2">
              <Webhook className="w-4 h-4" style={{ color: "var(--ah-sage-deep)" }} />
              Slack / HubSpot / Zapier ready
            </span>
          </motion.div>
        </motion.div>

        {/* Framed product preview — editorial cream card */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-24 mx-auto max-w-3xl text-left"
        >
          <div
            className="ah-card p-6 md:p-8"
            style={{ borderRadius: "var(--radius-2xl)" }}
          >
            {/* Mock window chrome */}
            <div
              className="flex items-center justify-between mb-6 pb-5"
              style={{ borderBottom: "1px solid var(--ah-border)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "var(--ah-sage)" }}
                >
                  <Phone className="w-4 h-4" style={{ color: "var(--ah-ink)" }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--ah-ink)" }}>
                    Bella Vista — AI Receptionist
                  </p>
                  <p className="text-xs" style={{ color: "var(--ah-ink-muted)" }}>
                    Connected · 00:42
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ background: "var(--ah-cta)" }}
                />
                <span className="text-xs" style={{ color: "var(--ah-sage-deep)" }}>Live</span>
              </div>
            </div>

            {/* Mock transcript */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-end">
                <div
                  className="rounded-2xl rounded-tr-md px-4 py-2.5 max-w-[80%]"
                  style={{ background: "var(--ah-bg-inset)", border: "1px solid var(--ah-border)" }}
                >
                  <p style={{ color: "var(--ah-ink-soft)" }}>
                    Hi, do you have any tables for two tonight at 8?
                  </p>
                </div>
              </div>
              <div className="flex justify-start">
                <div
                  className="rounded-2xl rounded-tl-md px-4 py-2.5 max-w-[80%]"
                  style={{ background: "var(--ah-cta)", color: "#FFFCF6" }}
                >
                  <p>
                    We do — 8pm window-side is open. Can I take a name and number so the team can confirm in 5?
                  </p>
                </div>
              </div>
              <div
                className="flex items-center gap-2 pt-2 text-xs"
                style={{ color: "var(--ah-ink-muted)" }}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="shimmer rounded-full px-2 py-0.5">Capturing lead…</span>
              </div>
            </div>

            {/* Mock audio wave */}
            <div className="mt-6 flex items-end gap-1 h-8 justify-center">
              {[8, 14, 22, 18, 10, 16, 24, 12, 20, 14, 8].map((h, i) => (
                <span
                  key={i}
                  className="w-1 rounded-full"
                  style={{
                    height: `${h}px`,
                    background: "var(--ah-sage-deep)",
                    opacity: 0.75,
                    animation: `wave-bar 1.4s ease-in-out ${i * 0.08}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Floating badge */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="absolute -top-4 right-4 md:-top-6 md:-right-6 hidden sm:flex"
          >
            <div
              className="px-4 py-2 flex items-center gap-2 rounded-full"
              style={{
                background: "var(--ah-bg-raised)",
                border: "1px solid var(--ah-border-strong)",
                boxShadow: "0 8px 22px -14px rgba(26, 26, 26, 0.18)",
              }}
            >
              <Mic className="w-3.5 h-3.5" style={{ color: "var(--ah-sage-deep)" }} />
              <span className="text-xs" style={{ color: "var(--ah-ink-soft)" }}>
                Real-time, low-latency
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
