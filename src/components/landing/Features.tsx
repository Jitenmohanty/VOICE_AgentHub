"use client";

import { motion } from "framer-motion";
import {
  Code2,
  Inbox,
  Webhook,
  Brain,
  Sparkles,
  ShieldCheck,
  ListChecks,
  Mic2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GradientText } from "@/components/ui/gradient-text";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Bento grid placement — uses Tailwind grid-area utilities. */
  span: string;
  /** Tint applied to the icon halo. Constrained to the brand palette. */
  tint: "violet" | "blue" | "cyan";
  /** Featured cells get the gradient border + lower text density. */
  featured?: boolean;
}

const TINT_BG: Record<Feature["tint"], string> = {
  violet: "bg-violet-500/10",
  blue: "bg-blue-500/10",
  cyan: "bg-cyan-500/10",
};
const TINT_TEXT: Record<Feature["tint"], string> = {
  violet: "text-violet-300",
  blue: "text-blue-300",
  cyan: "text-cyan-300",
};

const features: Feature[] = [
  {
    icon: Code2,
    title: "Embed on any website",
    description:
      "One iframe snippet — no rebuild, no new domain. The widget appears as a floating module wherever you paste it.",
    span: "md:col-span-2 md:row-span-2",
    tint: "violet",
    featured: true,
  },
  {
    icon: Inbox,
    title: "Leads in your inbox",
    description: "Caller name, phone, email, intent — delivered within 30 seconds of hangup.",
    span: "md:col-span-2",
    tint: "blue",
  },
  {
    icon: Webhook,
    title: "CRM ready",
    description: "Signed JSON webhook to Slack, HubSpot, Zapier.",
    span: "md:col-span-2",
    tint: "cyan",
  },
  {
    icon: Brain,
    title: "Industry-tuned agents",
    description:
      "Hotel, restaurant, medical, legal, interview templates. Each one knows the right questions and protocols.",
    span: "md:col-span-2",
    tint: "violet",
  },
  {
    icon: Mic2,
    title: "Real-time voice",
    description: "Low-latency Gemini Live with per-agent VAD. Pause to think — never get cut off.",
    span: "md:col-span-2 md:row-span-2",
    tint: "cyan",
    featured: true,
  },
  {
    icon: ShieldCheck,
    title: "Honest by design",
    description: "Agents capture lead intent. They never claim to have booked or scheduled.",
    span: "md:col-span-2",
    tint: "blue",
  },
  {
    icon: Sparkles,
    title: "AI summaries",
    description: "Claude analyzes every transcript: summary, sentiment, action items.",
    span: "md:col-span-3",
    tint: "violet",
  },
  {
    icon: ListChecks,
    title: "Lead workflow + CSV",
    description: "Mark new → contacted → won. Filter dates, export to CSV.",
    span: "md:col-span-3",
    tint: "cyan",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/40 mb-4">
            Built for SMBs
          </p>
          <h2 className="font-(family-name:--font-heading) text-4xl md:text-6xl font-semibold tracking-[-0.03em] text-white mb-5 leading-[1.05]">
            Everything you need to <GradientText>turn calls into customers</GradientText>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            From the iframe install to the structured lead in your inbox — all the pieces, none of the busywork.
          </p>
        </motion.div>

        {/* Bento grid — 6 columns desktop, asymmetric spans for visual rhythm */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-5 auto-rows-[minmax(180px,auto)]">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className={feature.span}
            >
              <GlassPanel
                elevation={feature.featured ? "raised" : "subtle"}
                gradientBorder={feature.featured}
                interactive
                radius="lg"
                className="h-full p-7 md:p-8 flex flex-col justify-between gap-6 group"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${TINT_BG[feature.tint]} transition-transform duration-500 group-hover:scale-110`}
                >
                  <feature.icon className={`w-5 h-5 ${TINT_TEXT[feature.tint]}`} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg md:text-xl tracking-tight mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm md:text-[15px] text-white/55 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
