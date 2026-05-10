"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  UserPlus,
  Settings,
  Code2,
  Inbox,
} from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GradientText } from "@/components/ui/gradient-text";

const steps = [
  {
    icon: UserPlus,
    title: "Create account",
    description: "Sign up with Google or email — 10 seconds, no card required.",
  },
  {
    icon: Settings,
    title: "Set up your agent",
    description: "Pick an industry, add your data (menus, doctors, rooms), tune personality.",
  },
  {
    icon: Code2,
    title: "Embed on your website",
    description: "Copy a single iframe snippet, paste anywhere on your existing site.",
  },
  {
    icon: Inbox,
    title: "Leads in your inbox",
    description: "Every captured lead arrives by email in 30 seconds. Optional CRM webhook.",
  },
];

export function CTA() {
  return (
    <section className="relative py-32 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/40 mb-4">
            How it works
          </p>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] text-white mb-5 leading-[1.05]">
            Live in <GradientText>four steps</GradientText>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            From zero to a working AI voice agent in under five minutes.
          </p>
        </motion.div>

        {/* Steps row — connected by a faint gradient line on desktop */}
        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-5 mb-32">
          {/* Connector line — only desktop */}
          <div className="hidden md:block absolute top-[68px] left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
            >
              <GlassPanel
                elevation="subtle"
                interactive
                radius="lg"
                className="p-7 text-center h-full"
              >
                {/* Step number + icon */}
                <div className="relative mx-auto w-14 h-14 mb-5">
                  <div className="absolute inset-0 ah-gradient-bg rounded-2xl opacity-90 shadow-[0_8px_24px_-8px_rgba(124,58,237,0.5)]" />
                  <div className="relative w-full h-full rounded-2xl bg-[#0B1020] m-px flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-white" strokeWidth={1.75} />
                  </div>
                </div>

                <p className="text-[11px] font-medium uppercase tracking-[0.18em] mb-2">
                  <span className="ah-gradient-text">Step {String(index + 1).padStart(2, "0")}</span>
                </p>
                <h3 className="font-semibold text-white text-lg tracking-tight mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-white/55 leading-relaxed">
                  {step.description}
                </p>
              </GlassPanel>
            </motion.div>
          ))}
        </div>

        {/* Final CTA panel */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="relative"
        >
          {/* Underlay glow */}
          <div className="absolute inset-x-12 -bottom-12 h-48 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.4),rgba(6,182,212,0.2),transparent_70%)] blur-3xl pointer-events-none" />

          <GlassPanel
            elevation="floating"
            gradientBorder
            radius="xl"
            className="relative p-12 md:p-20 text-center overflow-hidden"
          >
            {/* Inner gradient wash */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(124,58,237,0.22),transparent_60%)] pointer-events-none" />

            <div className="relative">
              <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] text-white mb-6 leading-[1.05]">
                Stop missing <GradientText>customers.</GradientText>
              </h2>
              <p className="text-lg text-white/65 mb-10 max-w-xl mx-auto leading-relaxed">
                Free for 30 minutes a month — no credit card. Embed it on your site this afternoon,
                capture your first lead before dinner.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <GradientButton href="/register" size="lg">
                  Start free
                  <ArrowRight className="w-4 h-4" />
                </GradientButton>
                <GradientButton href="#pricing" size="lg" variant="outline">
                  See pricing
                </GradientButton>
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </section>
  );
}
