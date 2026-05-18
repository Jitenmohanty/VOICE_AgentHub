"use client";

import { motion } from "framer-motion";
import { ArrowRight, Mic, Inbox, Code2, Webhook, Sparkles, Phone, MessageSquare } from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { GradientButton } from "@/components/ui/gradient-button";
import { GradientText } from "@/components/ui/gradient-text";
import { GlassPanel } from "@/components/ui/glass-panel";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-14 md:pt-32 md:pb-20">
      <AuroraBackground />

      <div className="relative z-10 max-w-6xl mx-auto px-2 md:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Eyebrow pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-10 text-xs tracking-wide text-white/70"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-300" />
            <span>Voice AI for hotels, clinics, restaurants & more</span>
          </motion.div>

          {/* Headline */}
          <h1 className="font-(family-name:--font-heading) font-semibold text-5xl md:text-7xl lg:text-[88px] leading-[1.02] tracking-[-0.03em] mb-8 text-white">
            Never miss a customer.
            <br />
            <GradientText>Your AI takes the call.</GradientText>
          </h1>

          {/* Subhead */}
          <p className="text-lg md:text-xl text-white/65 max-w-2xl mx-auto mb-12 leading-relaxed">
            Drop a single iframe into your existing site. Visitors talk to an AI that knows your menu,
            rooms, doctors, or services — and every captured lead lands in your inbox in under 30 seconds.
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-3 mb-20 flex-wrap">
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
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/55"
          >
            <span className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-violet-300" />
              Embed on your existing site
            </span>
            <span className="hidden sm:inline w-1 h-1 rounded-full bg-white/15" />
            <span className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-blue-300" />
              Leads delivered by email
            </span>
            <span className="hidden sm:inline w-1 h-1 rounded-full bg-white/15" />
            <span className="flex items-center gap-2">
              <Webhook className="w-4 h-4 text-cyan-300" />
              Slack / HubSpot / Zapier ready
            </span>
          </motion.div>
        </motion.div>

        {/* Floating product preview — looks like a mini call modal */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.55, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-24 mx-auto max-w-3xl"
        >
          {/* Soft glow underlay */}
          <div className="absolute inset-x-12 -bottom-8 h-48 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.4),rgba(6,182,212,0.2),transparent_70%)] blur-3xl pointer-events-none" />

          <GlassPanel
            elevation="floating"
            radius="xl"
            className="p-6 md:p-8 text-left"
          >
            {/* Mock window chrome */}
            <div className="flex items-center justify-between mb-6 pb-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl ah-gradient-bg flex items-center justify-center">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Bella Vista — AI Receptionist</p>
                  <p className="text-xs text-white/50">Connected · 00:42</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-300/80">Live</span>
              </div>
            </div>

            {/* Mock transcript */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-end">
                <div className="bg-white/[0.06] border border-white/10 rounded-2xl rounded-tr-md px-4 py-2.5 max-w-[80%]">
                  <p className="text-white/85">Hi, do you have any tables for two tonight at 8?</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="ah-gradient-bg rounded-2xl rounded-tl-md px-4 py-2.5 max-w-[80%] shadow-[0_8px_24px_-12px_rgba(124,58,237,0.6)]">
                  <p className="text-white">
                    We do — 8pm window-side is open. Can I take a name and number so the team can confirm in 5?
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 text-xs text-white/45">
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="shimmer rounded-full px-2 py-0.5">Capturing lead…</span>
              </div>
            </div>

            {/* Mock audio wave */}
            <div className="mt-6 flex items-end gap-1 h-8 justify-center">
              {[8, 14, 22, 18, 10, 16, 24, 12, 20, 14, 8].map((h, i) => (
                <span
                  key={i}
                  className="w-1 rounded-full bg-gradient-to-t from-cyan-400 via-blue-400 to-violet-400 opacity-70"
                  style={{
                    height: `${h}px`,
                    animation: `wave-bar 1.2s ease-in-out ${i * 0.08}s infinite`,
                  }}
                />
              ))}
            </div>
          </GlassPanel>

          {/* Floating badge */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="absolute -top-4 right-4 md:-top-6 md:-right-6 hidden sm:flex"
          >
            <GlassPanel elevation="raised" radius="md" className="px-4 py-2 flex items-center gap-2">
              <Mic className="w-3.5 h-3.5 text-cyan-300" />
              <span className="text-xs text-white/80">Real-time, low-latency</span>
            </GlassPanel>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
