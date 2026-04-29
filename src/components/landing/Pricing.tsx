"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    id: "free",
    name: "Free",
    tagline: "Try the product, no card required",
    inr: "₹0",
    usd: "$0",
    period: "forever",
    minutes: "30",
    agents: "1 agent",
    accent: "#8888AA",
    cta: "Start Free",
    highlight: false,
    features: [
      "30 voice minutes / month",
      "1 industry agent",
      "Embed on your existing site",
      "Lead-capture email delivery",
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
    agents: "3 agents",
    accent: "#00D4FF",
    cta: "Upgrade to Starter",
    highlight: true,
    features: [
      "200 voice minutes / month",
      "Up to 3 agents",
      "Slack / HubSpot / Zapier webhooks",
      "Lead status workflow + CSV export",
      "Quota threshold notifications",
      "Priority Stripe + Razorpay billing",
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
    agents: "10 agents",
    accent: "#6366F1",
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
    <section id="pricing" className="py-24 px-6 bg-[#0A0A12]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-(family-name:--font-heading) text-4xl md:text-5xl font-bold text-white mb-4">
            Pay Per Minute You Use, Not Per Lead
          </h2>
          <p className="text-[#8888AA] text-lg max-w-2xl mx-auto">
            Hard-capped monthly minutes — no surprise bills. Pay in INR with Razorpay or USD with Stripe.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative glass rounded-2xl p-8 flex flex-col ${
                plan.highlight ? "ring-2" : ""
              }`}
              style={
                plan.highlight ? { boxShadow: `0 0 40px ${plan.accent}20` } : undefined
              }
            >
              {plan.highlight && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: `${plan.accent}20`,
                    color: plan.accent,
                    border: `1px solid ${plan.accent}40`,
                  }}
                >
                  <Sparkles className="w-3 h-3" />
                  Most popular
                </div>
              )}

              <div className="mb-6">
                <h3
                  className="font-(family-name:--font-heading) text-2xl font-bold mb-1"
                  style={{ color: plan.accent }}
                >
                  {plan.name}
                </h3>
                <p className="text-sm text-[#8888AA]">{plan.tagline}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">{plan.inr}</span>
                  <span className="text-[#666680] text-sm">/ {plan.usd}</span>
                </div>
                <p className="text-xs text-[#666680] mt-1">{plan.period}</p>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-3">
                <div className="bg-white/[0.03] rounded-lg p-3 border border-[#2A2A3E] text-center">
                  <p className="text-xs text-[#8888AA]">Minutes</p>
                  <p className="text-lg font-bold text-white">{plan.minutes}</p>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-3 border border-[#2A2A3E] text-center">
                  <p className="text-xs text-[#8888AA]">Agents</p>
                  <p className="text-lg font-bold text-white">{plan.agents.split(" ")[0]}</p>
                </div>
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm">
                    <Check
                      className="w-4 h-4 shrink-0 mt-0.5"
                      style={{ color: plan.accent }}
                    />
                    <span className="text-[#C0C0D8]">{feat}</span>
                  </li>
                ))}
              </ul>

              <Link href="/register">
                <Button
                  className="w-full text-white border-0 hover:opacity-90"
                  style={{
                    background: plan.highlight
                      ? `linear-gradient(135deg, #00D4FF, #6366F1)`
                      : "rgba(255,255,255,0.05)",
                    border: plan.highlight ? "0" : "1px solid #2A2A3E",
                  }}
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-xs text-[#666680] mt-10 max-w-2xl mx-auto"
        >
          Over your monthly minutes? Calls pause until upgrade — no overage charges, no surprise invoices.
          Cancel anytime from the customer portal (Stripe) or your Razorpay account.
        </motion.p>
      </div>
    </section>
  );
}
