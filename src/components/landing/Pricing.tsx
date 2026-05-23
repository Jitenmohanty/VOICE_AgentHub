"use client";

import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { GlassPanel } from "@/components/ui/glass-panel";

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
    <section id="pricing" className="relative py-20 px-2 md:py-32 md:px-6">
      {/* Subtle sage wash for this section */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(168,184,155,0.12),transparent_60%)] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p
            className="text-sm font-medium uppercase tracking-[0.2em] mb-4"
            style={{ color: "var(--ah-ink-muted)" }}
          >
            Simple, capped pricing
          </p>
          <h2
            className="font-serif text-4xl md:text-6xl tracking-[-0.02em] mb-5 leading-[1.08]"
            style={{ color: "var(--ah-ink)" }}
          >
            Pay per{" "}
            <span className="italic" style={{ color: "var(--ah-sage-deep)" }}>
              minute
            </span>
            , not per lead
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--ah-ink-soft)" }}>
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
                  <div
                    className="text-[11px] font-semibold tracking-[0.12em] uppercase px-3 py-1.5 rounded-full flex items-center gap-1.5"
                    style={{
                      background: "var(--ah-cta)",
                      color: "#FFFCF6",
                      boxShadow: "0 8px 22px -10px rgba(47, 74, 42, 0.55)",
                    }}
                  >
                    <Sparkles className="w-3 h-3" />
                    Most popular
                  </div>
                </div>
              )}

              <GlassPanel
                elevation={plan.highlight ? "floating" : "raised"}
                gradientBorder={plan.highlight}
                radius="xl"
                className="p-8 flex flex-col h-full"
              >
                <div className="mb-7">
                  <h3
                    className="font-serif text-2xl tracking-tight mb-1"
                    style={{ color: "var(--ah-ink)" }}
                  >
                    {plan.name}
                  </h3>
                  <p className="text-sm" style={{ color: "var(--ah-ink-soft)" }}>{plan.tagline}</p>
                </div>

                <div className="mb-7">
                  <div className="flex items-baseline gap-2">
                    <span
                      className="font-serif text-5xl tracking-[-0.03em]"
                      style={{ color: "var(--ah-ink)" }}
                    >
                      {plan.inr}
                    </span>
                    <span className="text-sm" style={{ color: "var(--ah-ink-muted)" }}>/ {plan.usd}</span>
                  </div>
                  <p className="text-xs mt-1.5" style={{ color: "var(--ah-ink-muted)" }}>{plan.period}</p>
                </div>

                <div className="mb-7 grid grid-cols-2 gap-3">
                  <div
                    className="rounded-2xl p-4 text-center"
                    style={{ background: "var(--ah-bg-inset)", border: "1px solid var(--ah-border)" }}
                  >
                    <p
                      className="text-[11px] uppercase tracking-wider"
                      style={{ color: "var(--ah-ink-muted)" }}
                    >
                      Minutes
                    </p>
                    <p
                      className="font-serif text-2xl tracking-tight mt-1"
                      style={{ color: "var(--ah-ink)" }}
                    >
                      {plan.minutes}
                    </p>
                  </div>
                  <div
                    className="rounded-2xl p-4 text-center"
                    style={{ background: "var(--ah-bg-inset)", border: "1px solid var(--ah-border)" }}
                  >
                    <p
                      className="text-[11px] uppercase tracking-wider"
                      style={{ color: "var(--ah-ink-muted)" }}
                    >
                      Agents
                    </p>
                    <p
                      className="font-serif text-2xl tracking-tight mt-1"
                      style={{ color: "var(--ah-ink)" }}
                    >
                      {plan.agents}
                    </p>
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-3 text-sm">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: "var(--ah-sage-soft)" }}
                      >
                        <Check className="w-3 h-3" style={{ color: "var(--ah-sage-deep)" }} strokeWidth={3} />
                      </span>
                      <span className="leading-relaxed" style={{ color: "var(--ah-ink-soft)" }}>{feat}</span>
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
          className="text-center text-xs mt-12 max-w-2xl mx-auto leading-relaxed"
          style={{ color: "var(--ah-ink-muted)" }}
        >
          Over your monthly minutes? Calls pause until upgrade — no overage charges, no surprise invoices.
          Cancel anytime from the customer portal (Stripe) or your Razorpay account.
        </motion.p>
      </div>
    </section>
  );
}
