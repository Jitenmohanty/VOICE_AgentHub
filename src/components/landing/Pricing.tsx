"use client";

import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GradientText } from "@/components/ui/gradient-text";

const plans = [
  {
    id: "free",
    name: "Free",
    tagline: "Try it, no card needed",
    inr: "₹0",
    usd: "$0",
    period: "forever",
    minutes: "30",
    agents: "1",
    cta: "Start Free",
    highlight: false,
    features: [
      "30 voice minutes / month",
      "1 industry agent",
      "Embed on your existing site",
      "Email lead delivery",
      "Claude post-call summaries",
      "All template types",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    tagline: "Most small businesses pick this",
    inr: "₹2,399",
    usd: "$29",
    period: "per month",
    minutes: "200",
    agents: "3",
    cta: "Upgrade to Starter",
    highlight: true,
    features: [
      "200 voice minutes / month",
      "Up to 3 agents",
      "Slack / HubSpot / Zapier webhooks",
      "Lead workflow + CSV export",
      "Quota threshold notifications",
      "Stripe + Razorpay billing",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For multi-location operators",
    inr: "₹7,999",
    usd: "$99",
    period: "per month",
    minutes: "800",
    agents: "10",
    cta: "Go Pro",
    highlight: false,
    features: [
      "800 voice minutes / month",
      "Up to 10 agents",
      "Everything in Starter",
      "Advanced AI tuning per agent",
      "Higher per-IP rate limits",
      "Priority support",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative py-32 px-6">
      {/* Subtle aurora wash for this section */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.08),transparent_60%)] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/40 mb-4">
            Simple, capped pricing
          </p>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.03em] text-white mb-5 leading-[1.05]">
            Pay per <GradientText>minute</GradientText>, not per lead
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Hard-capped monthly minutes — no surprise bills. Pay in INR with Razorpay or USD with Stripe.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                  <div className="ah-gradient-bg text-white text-[11px] font-semibold tracking-[0.12em] uppercase px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-[0_8px_24px_-8px_rgba(124,58,237,0.6)]">
                    <Sparkles className="w-3 h-3" />
                    Most popular
                  </div>
                </div>
              )}

              <GlassPanel
                elevation={plan.highlight ? "floating" : "raised"}
                gradientBorder={plan.highlight}
                radius="xl"
                className={`p-8 flex flex-col h-full ${plan.highlight ? "glow-aurora" : ""}`}
              >
                <div className="mb-7">
                  <h3 className="font-semibold text-white text-2xl tracking-tight mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-white/55">{plan.tagline}</p>
                </div>

                <div className="mb-7">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-semibold tracking-[-0.04em] text-white">
                      {plan.inr}
                    </span>
                    <span className="text-white/40 text-sm">/ {plan.usd}</span>
                  </div>
                  <p className="text-xs text-white/40 mt-1.5">{plan.period}</p>
                </div>

                <div className="mb-7 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/[0.04] border border-white/8 p-4 text-center">
                    <p className="text-[11px] text-white/45 uppercase tracking-wider">Minutes</p>
                    <p className="text-2xl font-semibold text-white tracking-tight mt-1">
                      {plan.minutes}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/[0.04] border border-white/8 p-4 text-center">
                    <p className="text-[11px] text-white/45 uppercase tracking-wider">Agents</p>
                    <p className="text-2xl font-semibold text-white tracking-tight mt-1">
                      {plan.agents}
                    </p>
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-3 text-sm">
                      <span className="w-5 h-5 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-cyan-300" strokeWidth={3} />
                      </span>
                      <span className="text-white/75 leading-relaxed">{feat}</span>
                    </li>
                  ))}
                </ul>

                <GradientButton
                  href="/register"
                  size="default"
                  variant={plan.highlight ? "primary" : "outline"}
                  className="w-full"
                >
                  {plan.cta}
                </GradientButton>
              </GlassPanel>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-xs text-white/40 mt-12 max-w-2xl mx-auto leading-relaxed"
        >
          Over your monthly minutes? Calls pause until upgrade — no overage charges, no surprise invoices.
          Cancel anytime from the customer portal (Stripe) or your Razorpay account.
        </motion.p>
      </div>
    </section>
  );
}
