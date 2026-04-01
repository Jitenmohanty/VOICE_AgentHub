"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Code,
  ArrowRight,
  Target,
  FileText,
  BarChart3,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";

const rounds = [
  { num: 1, name: "Introduction", desc: "Background & communication", color: "#00D4FF" },
  { num: 2, name: "Core Language", desc: "Progressive difficulty Q&A", color: "#6366F1" },
  { num: 3, name: "Framework Deep Dive", desc: "Real-world patterns", color: "#FFB800" },
  { num: 4, name: "System Design", desc: "Architecture & trade-offs", color: "#10B981" },
  { num: 5, name: "Behavioral / HR", desc: "STAR method questions", color: "#EF4444" },
];

const highlights = [
  { icon: Target, text: "Per-question scoring (1–10) with round breakdown" },
  { icon: FileText, text: "PDF resume upload with AI skill extraction" },
  { icon: BarChart3, text: "Detailed AI report: strengths, weaknesses & resources" },
  { icon: MessageSquare, text: "Voice-first — feels like a real interview, not a quiz" },
];

export function InterviewSpotlight() {
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-[#6366F1]/5 rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — text content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-6">
              <Code className="w-4 h-4 text-[#6366F1]" />
              <span className="text-xs font-medium text-[#6366F1]">KILLER FEATURE</span>
            </div>

            <h2 className="font-(family-name:--font-heading) text-3xl md:text-4xl font-bold text-white mb-4">
              AI Mock Interviews
              <br />
              <span className="bg-linear-to-r from-[#6366F1] to-[#00D4FF] bg-clip-text text-transparent">
                That Actually Score You
              </span>
            </h2>

            <p className="text-[#8888AA] text-lg mb-8 leading-relaxed">
              Candidates fill out a pre-call form, upload their resume, and jump into a
              structured 5-round voice interview. Every answer is scored in real-time.
              After the call, Claude AI generates a comprehensive report with actionable feedback.
            </p>

            <div className="space-y-3 mb-8">
              {highlights.map((h) => (
                <div key={h.text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#6366F1]/10 flex items-center justify-center shrink-0">
                    <h.icon className="w-4 h-4 text-[#6366F1]" />
                  </div>
                  <span className="text-sm text-[#E0E0F0]">{h.text}</span>
                </div>
              ))}
            </div>

            <Link href="/register">
              <Button
                size="lg"
                className="bg-linear-to-r from-[#6366F1] to-[#00D4FF] text-white border-0 hover:opacity-90"
              >
                Try Interview Agent
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>

          {/* Right — visual: 5-round flow */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="glass rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span className="text-xs font-medium text-[#10B981]">Live Interview Session</span>
              </div>

              {rounds.map((round, i) => (
                <motion.div
                  key={round.num}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + i * 0.1 }}
                  className="flex items-center gap-4 p-3 rounded-xl bg-white/3 border border-[#2A2A3E] group hover:border-white/10 transition-all"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm"
                    style={{ backgroundColor: `${round.color}15`, color: round.color }}
                  >
                    {round.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{round.name}</p>
                    <p className="text-xs text-[#666680]">{round.desc}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </motion.div>
              ))}

              {/* Report preview */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 }}
                className="mt-4 p-4 rounded-xl border border-dashed border-[#6366F1]/30 bg-[#6366F1]/5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-[#6366F1]" />
                  <span className="text-xs font-semibold text-[#6366F1]">AI Report Generated</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">78</p>
                    <p className="text-[10px] text-[#8888AA]">Score /100</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <ScoreBar label="Core Language" pct={85} color="#6366F1" />
                    <ScoreBar label="System Design" pct={70} color="#10B981" />
                    <ScoreBar label="Communication" pct={80} color="#FFB800" />
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ScoreBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[#8888AA] w-20 shrink-0 text-right">{label}</span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5 }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] text-white font-mono w-6">{pct}%</span>
    </div>
  );
}
