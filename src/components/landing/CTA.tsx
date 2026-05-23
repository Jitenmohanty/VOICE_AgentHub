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
    <section className="relative py-20 px-2 md:py-32 md:px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <p
            className="text-sm font-medium uppercase tracking-[0.2em] mb-4"
            style={{ color: "var(--ah-ink-muted)" }}
          >
            How it works
          </p>
          <h2
            className="font-serif text-4xl md:text-6xl tracking-[-0.02em] mb-5 leading-[1.08]"
            style={{ color: "var(--ah-ink)" }}
          >
            Live in{" "}
            <span className="italic" style={{ color: "var(--ah-sage-deep)" }}>
              four steps
            </span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--ah-ink-soft)" }}>
            From zero to a working AI voice agent in under five minutes.
          </p>
        </motion.div>

        {/* Steps row — connected by a faint sage line on desktop */}
        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-5 mb-32">
          <div
            className="hidden md:block absolute top-[68px] left-[12%] right-[12%] h-px pointer-events-none"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(94, 115, 85, 0.30), transparent)",
            }}
          />

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
                  <div
                    className="absolute inset-0 rounded-2xl"
                    style={{ background: "var(--ah-cta)" }}
                  />
                  <div
                    className="relative w-full h-full rounded-2xl m-px flex items-center justify-center"
                    style={{ background: "var(--ah-bg-raised)" }}
                  >
                    <step.icon className="w-6 h-6" style={{ color: "var(--ah-cta)" }} strokeWidth={1.75} />
                  </div>
                </div>

                <p
                  className="text-[11px] font-medium uppercase tracking-[0.18em] mb-2"
                  style={{ color: "var(--ah-sage-deep)" }}
                >
                  Step {String(index + 1).padStart(2, "0")}
                </p>
                <h3
                  className="font-serif text-lg tracking-tight mb-2"
                  style={{ color: "var(--ah-ink)" }}
                >
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ah-ink-soft)" }}>
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
          {/* Soft sage underlay */}
          <div className="absolute inset-x-12 -bottom-12 h-48 bg-[radial-gradient(ellipse_at_center,rgba(168,184,155,0.30),rgba(201,194,224,0.16),transparent_70%)] blur-3xl pointer-events-none" />

          <GlassPanel
            elevation="floating"
            radius="xl"
            className="relative p-12 md:p-20 text-center overflow-hidden"
          >
            {/* Inner cream wash */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(244,236,219,0.6),transparent_70%)] pointer-events-none" />

            <div className="relative">
              <h2
                className="font-serif text-4xl md:text-6xl tracking-[-0.02em] mb-6 leading-[1.08]"
                style={{ color: "var(--ah-ink)" }}
              >
                Stop missing{" "}
                <span className="italic" style={{ color: "var(--ah-sage-deep)" }}>
                  customers.
                </span>
              </h2>
              <p
                className="text-lg mb-10 max-w-xl mx-auto leading-relaxed"
                style={{ color: "var(--ah-ink-soft)" }}
              >
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
