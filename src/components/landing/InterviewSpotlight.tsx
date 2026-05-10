"use client";

import { motion } from "framer-motion";
import {
  Code,
  ArrowRight,
  Target,
  FileText,
  BarChart3,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GradientText } from "@/components/ui/gradient-text";

const rounds = [
  { num: 1, name: "Introduction", desc: "Background & communication" },
  { num: 2, name: "Core Language", desc: "Progressive difficulty Q&A" },
  { num: 3, name: "Framework Deep Dive", desc: "Real-world patterns" },
  { num: 4, name: "System Design", desc: "Architecture & trade-offs" },
  { num: 5, name: "Behavioral / HR", desc: "STAR method questions" },
];

const highlights = [
  { icon: Target, text: "Per-question scoring (1–10) with round breakdown" },
  { icon: FileText, text: "PDF resume upload with AI skill extraction" },
  { icon: BarChart3, text: "Detailed AI report: strengths, weaknesses, resources" },
  { icon: MessageSquare, text: "Voice-first — feels like a real interview, not a quiz" },
];

export function InterviewSpotlight() {
  return (
    <section className="relative py-32 px-6 overflow-hidden">
      {/* Subtle aurora wash */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[700px] bg-[radial-gradient(ellipse_at_50%_50%,rgba(59,130,246,0.1),transparent_60%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-7 text-xs">
              <Code className="w-3.5 h-3.5 text-violet-300" />
              <span className="font-medium tracking-wider text-white/70 uppercase text-[11px]">
                Killer Feature
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.03em] text-white mb-6 leading-[1.05]">
              AI mock interviews
              <br />
              <GradientText>that actually score you</GradientText>
            </h2>

            <p className="text-lg text-white/65 mb-10 leading-relaxed">
              Candidates fill a pre-call form, upload a resume, and jump into a structured 5-round
              voice interview. Every answer is scored in real time. After the call, Claude generates
              a comprehensive report with actionable feedback.
            </p>

            <div className="space-y-3.5 mb-10">
              {highlights.map((h) => (
                <div key={h.text} className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0 border border-violet-300/15">
                    <h.icon className="w-4 h-4 text-violet-300" strokeWidth={2} />
                  </div>
                  <span className="text-[15px] text-white/80">{h.text}</span>
                </div>
              ))}
            </div>

            <GradientButton href="/register" size="lg">
              Try interview agent
              <ArrowRight className="w-4 h-4" />
            </GradientButton>
          </motion.div>

          {/* Right — round flow visual */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            {/* Underlay glow */}
            <div className="absolute -inset-8 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.25),transparent_70%)] blur-3xl pointer-events-none" />

            <GlassPanel
              elevation="floating"
              gradientBorder
              radius="xl"
              className="relative p-7 space-y-3"
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-emerald-300/80 tracking-wider uppercase">
                  Live Interview Session
                </span>
              </div>

              {rounds.map((round, i) => (
                <motion.div
                  key={round.num}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.08, duration: 0.5 }}
                  className="flex items-center gap-4 p-3.5 rounded-2xl bg-white/[0.03] border border-white/8 group hover:border-white/14 hover:bg-white/[0.05] transition-all"
                >
                  <div className="w-10 h-10 rounded-xl ah-gradient-bg flex items-center justify-center shrink-0 font-semibold text-sm text-white opacity-90 shadow-[0_4px_16px_-4px_rgba(124,58,237,0.5)]">
                    {round.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{round.name}</p>
                    <p className="text-xs text-white/50">{round.desc}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </motion.div>
              ))}

              {/* Report preview */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.85, duration: 0.6 }}
                className="mt-5 p-5 rounded-2xl border border-violet-300/20 bg-gradient-to-br from-violet-500/[0.08] to-cyan-500/[0.04]"
              >
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-violet-300" />
                  <span className="text-xs font-semibold tracking-wider uppercase ah-gradient-text">
                    AI Report Generated
                  </span>
                </div>
                <div className="flex items-center gap-5">
                  <div className="text-center shrink-0">
                    <p className="text-3xl font-semibold text-white tracking-[-0.04em]">78</p>
                    <p className="text-[10px] text-white/45 uppercase tracking-wider">Score /100</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    <ScoreBar label="Core Language" pct={85} />
                    <ScoreBar label="System Design" pct={70} />
                    <ScoreBar label="Communication" pct={80} />
                  </div>
                </div>
              </motion.div>
            </GlassPanel>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ScoreBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[10px] text-white/45 w-24 shrink-0 text-right uppercase tracking-wider">
        {label}
      </span>
      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full ah-gradient-bg"
        />
      </div>
      <span className="text-[10px] text-white/70 font-mono w-8">{pct}%</span>
    </div>
  );
}
