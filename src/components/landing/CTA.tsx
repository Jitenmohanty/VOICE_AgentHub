"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  UserPlus,
  Settings,
  Link2,
  BarChart3,
} from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Create Account",
    description: "Sign up free with Google, GitHub, or email — takes 10 seconds",
  },
  {
    icon: Settings,
    title: "Set Up Your Agent",
    description:
      "Pick an industry, add your data (menus, doctors, rooms), customize personality & rules",
  },
  {
    icon: Link2,
    title: "Share Your Link",
    description:
      "Get a public link like /a/your-business — anyone can call your agent, no login needed",
  },
  {
    icon: BarChart3,
    title: "Get AI Insights",
    description:
      "After every call: transcript, AI summary, sentiment analysis & action items — automatically",
  },
];

export function CTA() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-(family-name:--font-heading) text-4xl md:text-5xl font-bold text-white mb-4">
            Live in 4 Steps
          </h2>
          <p className="text-[#8888AA] text-lg">
            From zero to a fully operational AI voice agent in under 5 minutes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.12 }}
              className="relative text-center glass rounded-2xl p-6"
            >
              <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-[#00D4FF]/20 to-[#6366F1]/20 flex items-center justify-center mx-auto mb-4">
                <step.icon className="w-7 h-7 text-[#00D4FF]" />
              </div>
              <span className="text-xs text-[#00D4FF] font-mono mb-2 block">
                Step {index + 1}
              </span>
              <h3 className="font-(family-name:--font-heading) font-semibold text-white text-lg mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-[#8888AA] leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-3xl p-12 text-center glow-cyan"
        >
          <h2 className="font-(family-name:--font-heading) text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to deploy your AI voice agent?
          </h2>
          <p className="text-[#8888AA] text-lg mb-8 max-w-xl mx-auto">
            Hotels, restaurants, clinics, law firms, and tech recruiters are already using
            AgentHub to handle calls, conduct interviews, and delight customers — 24/7.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-linear-to-r from-[#00D4FF] to-[#6366F1] text-white border-0 text-lg px-10 py-6 hover:opacity-90"
              >
                Create Your Agent Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <a href="#agents">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-[#2A2A3E] text-[#8888AA] hover:text-white hover:border-[#00D4FF]/50"
              >
                Explore Agents
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
