"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, UserPlus, Sparkles, MessageSquare } from "lucide-react";

const steps = [
  { icon: UserPlus, title: "Sign Up", description: "Create your free account in seconds" },
  { icon: Sparkles, title: "Pick Agent", description: "Choose a specialized AI agent for your domain" },
  { icon: MessageSquare, title: "Start Talking", description: "Have real-time voice conversations" },
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
            How It Works
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="text-center relative"
            >
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-[#00D4FF]/20 to-[#6366F1]/20 flex items-center justify-center mx-auto mb-4">
                <step.icon className="w-8 h-8 text-[#00D4FF]" />
              </div>
              <div className="absolute top-8 left-1/2 translate-x-8 w-[calc(100%-4rem)] h-px bg-linear-to-r from-[#00D4FF]/30 to-transparent hidden md:block last:hidden" />
              <span className="text-xs text-[#00D4FF] font-mono mb-2 block">
                Step {index + 1}
              </span>
              <h3 className="font-(family-name:--font-heading) font-semibold text-white text-lg mb-1">
                {step.title}
              </h3>
              <p className="text-sm text-[#8888AA]">{step.description}</p>
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
            Ready to meet your AI agent?
          </h2>
          <p className="text-[#8888AA] text-lg mb-8 max-w-xl mx-auto">
            Join thousands of businesses using AgentHub to automate conversations and delight customers.
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-linear-to-r from-[#00D4FF] to-[#6366F1] text-white border-0 text-lg px-10 py-6 hover:opacity-90"
            >
              Start Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
