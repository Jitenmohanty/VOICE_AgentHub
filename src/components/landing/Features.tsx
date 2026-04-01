"use client";

import { motion } from "framer-motion";
import {
  Globe,
  Mic2,
  Brain,
  BarChart3,
  FileText,
  Link2,
  Database,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Mic2,
    title: "Real-time Voice",
    description:
      "Natural, low-latency conversations via Gemini Live API. Speak and get instant voice responses.",
    color: "#FFB800",
  },
  {
    icon: Brain,
    title: "Industry-Specific Agents",
    description:
      "Hotels, restaurants, clinics, law firms & interviews — each agent has deep domain knowledge.",
    color: "#6366F1",
  },
  {
    icon: Database,
    title: "Your Real Data",
    description:
      "Agents use your actual menus, room info, doctor rosters & FAQs — not generic scripts.",
    color: "#10B981",
  },
  {
    icon: Sparkles,
    title: "AI Post-Call Reports",
    description:
      "Every call is analyzed by Claude AI — summaries, sentiment, action items & scores, automatically.",
    color: "#00D4FF",
  },
  {
    icon: BarChart3,
    title: "Interview Scoring",
    description:
      "5-round structured interviews with per-question scores, round breakdowns & detailed reports.",
    color: "#EF4444",
  },
  {
    icon: FileText,
    title: "Resume Parsing",
    description:
      "Candidates upload a PDF resume. Claude extracts skills and personalizes interview questions.",
    color: "#F97316",
  },
  {
    icon: Link2,
    title: "Shareable Public Links",
    description:
      "Every agent gets a public link — no login needed for callers. Share via QR, email, or embed.",
    color: "#8B5CF6",
  },
  {
    icon: Globe,
    title: "90+ Languages",
    description:
      "Speak naturally in any language. Gemini understands and responds fluently worldwide.",
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
            Everything You Need, Built In
          </h2>
          <p className="text-[#8888AA] text-lg max-w-2xl mx-auto">
            From onboarding to post-call analytics — a complete AI voice platform, not just a chatbot.
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
