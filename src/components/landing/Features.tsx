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

const features = [
  {
    icon: Code2,
    title: "Embed on Your Existing Site",
    description:
      "One iframe snippet. Paste it anywhere on your website. The voice widget appears as a floating module — no new domain, no rebuild.",
    color: "#00D4FF",
  },
  {
    icon: Inbox,
    title: "Leads in Your Inbox in Seconds",
    description:
      "Every captured lead — caller name, phone, email, intent, urgency — lands as a structured email within ~30 seconds of the call ending.",
    color: "#10B981",
  },
  {
    icon: Webhook,
    title: "Slack · HubSpot · Zapier Ready",
    description:
      "Optional outbound webhook fires on every lead with HMAC-SHA256 signed JSON. Plug into your CRM in minutes — no custom integration code.",
    color: "#6366F1",
  },
  {
    icon: Brain,
    title: "Industry-Specific Agents",
    description:
      "Hotel, restaurant, medical, legal, interview templates. Each one knows the right questions, vocabulary, and emergency protocols out of the box.",
    color: "#FFB800",
  },
  {
    icon: ShieldCheck,
    title: "Honest by Design",
    description:
      "Agents never claim to have booked or scheduled anything. They capture lead intent, you call back to confirm. No fake confirmations, no broken trust.",
    color: "#F97316",
  },
  {
    icon: Mic2,
    title: "Real-Time Voice",
    description:
      "Natural, low-latency Gemini Live conversations with per-agent VAD tuning. Callers can pause to think without being cut off mid-sentence.",
    color: "#EF4444",
  },
  {
    icon: Sparkles,
    title: "AI Post-Call Summaries",
    description:
      "Claude analyzes every transcript: summary, sentiment, topics, escalation flag, action items. All searchable and CSV-exportable.",
    color: "#8B5CF6",
  },
  {
    icon: ListChecks,
    title: "Lead Workflow + CSV Export",
    description:
      "Mark leads new → contacted → qualified → won/lost. Export filtered date ranges as CSV. Run your sales pipeline without a separate CRM.",
    color: "#06B6D4",
  },
];

export function Features() {
  return (
    <section className="py-24 px-6 bg-[#0A0A12]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-(family-name:--font-heading) text-4xl md:text-5xl font-bold text-white mb-4">
            Built for Real SMBs, Not Demos
          </h2>
          <p className="text-[#8888AA] text-lg max-w-2xl mx-auto">
            From the iframe install to the lead in your inbox — everything you need to capture customers from your website 24/7.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="glass rounded-2xl p-6 text-center group hover:border-white/10 transition-all"
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 transition-all group-hover:scale-110"
                style={{ backgroundColor: `${feature.color}15` }}
              >
                <feature.icon className="w-7 h-7" style={{ color: feature.color }} />
              </div>
              <h3 className="font-(family-name:--font-heading) font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-[#8888AA]">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
