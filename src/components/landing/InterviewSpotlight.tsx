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
    <section className="relative py-20 px-2 md:py-32 md:px-6 overflow-hidden">
      {/* Subtle sage wash */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[700px] bg-[radial-gradient(ellipse_at_50%_50%,rgba(168,184,155,0.14),transparent_60%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="ah-pill mb-7">
              <Code className="w-3.5 h-3.5" style={{ color: "var(--ah-lavender-deep)" }} />
              <span
                className="font-medium tracking-wider uppercase text-xs"
                style={{ color: "var(--ah-ink-soft)" }}
              >
                Killer Feature
              </span>
            </div>

            <h2
              className="font-serif text-5xl md:text-6xl lg:text-7xl tracking-[-0.02em] mb-6 leading-[1.08]"
              style={{ color: "var(--ah-ink)" }}
            >
              AI mock interviews
              <br />
              <span style={{ color: "var(--ah-sage-deep)" }}>
                that actually score you
              </span>
            </h2>

            <p className="text-xl mb-10 leading-relaxed" style={{ color: "var(--ah-ink-soft)" }}>
              Candidates fill a pre-call form, upload a resume, and jump into a structured 5-round
              voice interview. Every answer is scored in real time. After the call, Claude generates
              a comprehensive report with actionable feedback.
            </p>

            <div className="space-y-3.5 mb-10">
              {highlights.map((h) => (
                <div key={h.text} className="flex items-center gap-3.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "var(--ah-lavender-soft)", border: "1px solid var(--ah-lavender)" }}
                  >
                    <h.icon className="w-4 h-4" style={{ color: "var(--ah-lavender-deep)" }} strokeWidth={2} />
                  </div>
                  <span className="text-base" style={{ color: "var(--ah-ink-soft)" }}>{h.text}</span>
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
            {/* Soft sage underlay */}
            <div className="absolute -inset-8 bg-[radial-gradient(ellipse_at_center,rgba(168,184,155,0.22),transparent_70%)] blur-3xl pointer-events-none" />

            <GlassPanel
              elevation="floating"
              radius="xl"
              className="relative p-7 space-y-3"
            >
              <div className="flex items-center gap-2 mb-5">
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ background: "var(--ah-cta)" }}
                />
                <span
                  className="text-xs font-medium tracking-wider uppercase"
                  style={{ color: "var(--ah-sage-deep)" }}
                >
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
                  className="flex items-center gap-4 p-3.5 rounded-2xl group transition-all"
                  style={{ background: "var(--ah-bg-inset)", border: "1px solid var(--ah-border)" }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-serif text-base"
                    style={{ background: "var(--ah-cta)", color: "#FFFCF6" }}
                  >
                    {round.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--ah-ink)" }}>{round.name}</p>
                    <p className="text-xs" style={{ color: "var(--ah-ink-muted)" }}>{round.desc}</p>
                  </div>
                  <CheckCircle2
                    className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    style={{ color: "var(--ah-sage-deep)" }}
                  />
                </motion.div>
              ))}

              {/* Report preview */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.85, duration: 0.6 }}
                className="mt-5 p-5 rounded-2xl"
                style={{ background: "var(--ah-cream-warm)", border: "1px solid var(--ah-lavender)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4" style={{ color: "var(--ah-lavender-deep)" }} />
                  <span
                    className="text-xs font-semibold tracking-wider uppercase"
                    style={{ color: "var(--ah-lavender-deep)" }}
                  >
                    AI Report Generated
                  </span>
                </div>
                <div className="flex items-center gap-5">
                  <div className="text-center shrink-0">
                    <p
                      className="font-serif text-4xl tracking-[-0.03em]"
                      style={{ color: "var(--ah-ink)" }}
                    >
                      78
                    </p>
                    <p
                      className="text-xs uppercase tracking-wider"
                      style={{ color: "var(--ah-ink-muted)" }}
                    >
                      Score /100
                    </p>
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
      <span
        className="text-xs w-24 shrink-0 text-right uppercase tracking-wider"
        style={{ color: "var(--ah-ink-muted)" }}
      >
        {label}
      </span>
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: "rgba(26, 26, 26, 0.08)" }}
      >
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full"
          style={{ background: "var(--ah-cta)" }}
        />
      </div>
      <span
        className="text-xs font-mono w-8"
        style={{ color: "var(--ah-ink-soft)" }}
      >
        {pct}%
      </span>
    </div>
  );
}
