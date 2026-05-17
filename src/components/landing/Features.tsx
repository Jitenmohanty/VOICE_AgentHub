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
  Hotel,
  Stethoscope,
  UtensilsCrossed,
  Scale,
  Code,
  Phone,
  Mail,
  Globe,
  FileSpreadsheet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GradientText } from "@/components/ui/gradient-text";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Bento grid placement — uses Tailwind grid-area utilities. */
  span: string;
  /** Tint applied to the icon halo. Constrained to the brand palette. */
  tint: "violet" | "blue" | "cyan";
  /** Featured cells get the gradient border + lower text density. */
  featured?: boolean;
  /** Hero illustration rendered above the heading. */
  visual: React.ComponentType;
}

const TINT_BG: Record<Feature["tint"], string> = {
  violet: "bg-violet-500/10",
  blue: "bg-blue-500/10",
  cyan: "bg-cyan-500/10",
};
const TINT_TEXT: Record<Feature["tint"], string> = {
  violet: "text-violet-300",
  blue: "text-blue-300",
  cyan: "text-cyan-300",
};

// ──────────────────────────────────────────────────────────────────────────
// Visual scenes — each one is a self-contained SVG/JSX illustration tuned
// to the brand palette (#7C3AED violet → #3B82F6 blue → #06B6D4 cyan).
// They all use `group-hover` from the parent card to come alive on hover.
// ──────────────────────────────────────────────────────────────────────────

/** 1. Embed on any website — mock browser with floating widget. */
function EmbedVisual() {
  return (
    <div className="relative w-full h-full min-h-30 flex items-end justify-center pt-2">
      {/* Soft halo behind the browser */}
      <div className="absolute inset-x-6 top-2 bottom-6 rounded-3xl bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.25),transparent_70%)] blur-2xl pointer-events-none" />

      {/* Browser window */}
      <div className="relative w-full max-w-[320px] rounded-2xl border border-white/10 bg-(--ah-bg-raised)/80 backdrop-blur-md overflow-hidden shadow-[0_24px_64px_-24px_rgba(2,6,23,0.8)] transition-transform duration-500 group-hover:-translate-y-1">
        {/* Browser chrome */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/8 bg-white/2">
          <span className="w-2 h-2 rounded-full bg-rose-400/70" />
          <span className="w-2 h-2 rounded-full bg-amber-400/70" />
          <span className="w-2 h-2 rounded-full bg-emerald-400/70" />
          <div className="ml-2 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/4 text-[9px] text-white/55 flex-1 font-mono">
            <Globe className="w-2.5 h-2.5 text-violet-300" strokeWidth={2.5} />
            yourbusiness.com
          </div>
        </div>
        {/* Browser body */}
        <div className="px-4 py-4 space-y-1.5">
          <div className="h-2 rounded-full bg-white/6" style={{ width: "70%" }} />
          <div className="h-2 rounded-full bg-white/4" style={{ width: "90%" }} />
          <div className="h-2 rounded-full bg-white/4" style={{ width: "55%" }} />
          <div className="h-2 rounded-full bg-white/4" style={{ width: "80%" }} />
        </div>

        {/* Voxie widget — pinned bottom-right inside the browser */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-2 rounded-xl ah-gradient-bg shadow-[0_8px_20px_-8px_rgba(124,58,237,0.7)] transition-transform duration-500 group-hover:scale-105">
          <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center">
            <Phone className="w-3 h-3 text-white" strokeWidth={2.5} />
          </div>
          <div className="text-[10px] font-medium text-white tracking-tight">Talk to AI</div>
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/** 2. Leads in your inbox — stacked email card with avatar. */
function InboxVisual() {
  return (
    <div className="relative w-full h-full min-h-30 flex items-center justify-center px-2">
      {/* Background card peeking behind */}
      <div className="absolute left-4 right-4 top-2 h-16 rounded-xl bg-white/3 border border-white/6" />

      <div className="relative w-full max-w-70 rounded-xl bg-(--ah-bg-raised)/85 border border-white/10 p-3.5 backdrop-blur-md shadow-[0_12px_32px_-12px_rgba(2,6,23,0.6)] transition-transform duration-500 group-hover:translate-y-0.5">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg ah-gradient-bg flex items-center justify-center shrink-0 shadow-[0_4px_12px_-4px_rgba(124,58,237,0.6)]">
            <Mail className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold text-white truncate">New lead · Bella Vista</span>
              <span className="text-[9px] text-white/40 shrink-0">now</span>
            </div>
            <p className="text-[10px] text-white/60 leading-relaxed mt-0.5 line-clamp-2">
              Sarah Chen · +1 555-014-2293 · table for 4 tonight at 8pm
            </p>
            <div className="flex items-center gap-1 mt-1.5">
              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-300/25 font-medium">
                Captured
              </span>
              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-300/25 font-medium">
                High intent
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 3. CRM-ready — signed JSON fanout to 3 destinations. */
function WebhookVisual() {
  return (
    <div className="relative w-full h-full min-h-30 flex items-center justify-center">
      <svg
        viewBox="0 0 280 120"
        className="w-full max-w-70 h-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="wh-line" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0" />
            <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Connector lines from center node to right pills */}
        <path d="M 100 60 Q 140 60 175 28" stroke="url(#wh-line)" strokeWidth="1.2" />
        <path d="M 100 60 L 175 60" stroke="url(#wh-line)" strokeWidth="1.2" />
        <path d="M 100 60 Q 140 60 175 92" stroke="url(#wh-line)" strokeWidth="1.2" />

        {/* Animated dots along the wires */}
        <circle r="2" fill="#06B6D4">
          <animateMotion dur="2.4s" repeatCount="indefinite" path="M 100 60 Q 140 60 175 28" />
        </circle>
        <circle r="2" fill="#06B6D4">
          <animateMotion dur="2.4s" begin="0.6s" repeatCount="indefinite" path="M 100 60 L 175 60" />
        </circle>
        <circle r="2" fill="#06B6D4">
          <animateMotion dur="2.4s" begin="1.2s" repeatCount="indefinite" path="M 100 60 Q 140 60 175 92" />
        </circle>
      </svg>

      {/* Center: JSON node */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 rounded-xl bg-(--ah-bg-raised)/85 border border-white/10 px-2.5 py-2 backdrop-blur-md shadow-[0_8px_24px_-8px_rgba(2,6,23,0.6)]">
        <div className="text-[9px] font-mono text-white/85">{`{ lead }`}</div>
        <div className="text-[8px] text-white/40 font-mono mt-0.5">HMAC-SHA256</div>
      </div>

      {/* Right: destination pills */}
      <div className="absolute right-2 top-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] text-white/75 font-medium backdrop-blur-md">
        Slack
      </div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] text-white/75 font-medium backdrop-blur-md">
        HubSpot
      </div>
      <div className="absolute right-2 bottom-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] text-white/75 font-medium backdrop-blur-md">
        Zapier
      </div>
    </div>
  );
}

/** 4. Industry-tuned — row of template chips. */
function TemplatesVisual() {
  const templates = [
    { Icon: Hotel, tint: "text-violet-300", bg: "bg-violet-500/10 border-violet-300/25" },
    { Icon: Stethoscope, tint: "text-blue-300", bg: "bg-blue-500/10 border-blue-300/25" },
    { Icon: UtensilsCrossed, tint: "text-amber-300", bg: "bg-amber-500/10 border-amber-300/25" },
    { Icon: Scale, tint: "text-cyan-300", bg: "bg-cyan-500/10 border-cyan-300/25" },
    { Icon: Code, tint: "text-rose-300", bg: "bg-rose-500/10 border-rose-300/25" },
  ];
  return (
    <div className="relative w-full h-full min-h-30 flex items-center justify-center px-2">
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {templates.map(({ Icon, tint, bg }, i) => (
          <div
            key={i}
            className={`w-11 h-11 rounded-2xl border flex items-center justify-center backdrop-blur-md transition-all duration-500 ${bg} group-hover:-translate-y-0.5`}
            style={{ transitionDelay: `${i * 60}ms` }}
          >
            <Icon className={`w-4 h-4 ${tint}`} strokeWidth={2} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** 5. Real-time voice — animated waveform with caller + AI bubbles. */
function VoiceVisual() {
  // Bar heights chosen to read as an audio wave, with the middle weighted heavier.
  const bars = [10, 18, 28, 22, 34, 44, 30, 48, 36, 26, 42, 30, 22, 16, 10];
  return (
    <div className="relative w-full h-full min-h-30 flex flex-col items-center justify-center gap-3">
      {/* Soft halo */}
      <div className="absolute inset-x-8 top-4 bottom-4 rounded-3xl bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.3),transparent_70%)] blur-2xl pointer-events-none" />

      {/* Waveform */}
      <div className="relative flex items-center justify-center gap-1 h-12">
        {bars.map((h, i) => (
          <span
            key={i}
            className="w-1 rounded-full bg-linear-to-t from-cyan-400/80 via-blue-400/90 to-violet-400 opacity-90"
            style={{
              height: `${Math.round(h * 0.7)}px`,
              animation: `wave-bar 1.4s ease-in-out ${i * 0.08}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Caller / AI bubbles */}
      <div className="relative w-full max-w-[320px] space-y-2 px-2">
        <div className="flex justify-end">
          <div className="bg-white/6 border border-white/10 rounded-2xl rounded-tr-md px-3 py-1.5 max-w-[80%] backdrop-blur-md">
            <p className="text-[10px] text-white/85">Can I book for 8 tonight?</p>
          </div>
        </div>
        <div className="flex justify-start">
          <div className="ah-gradient-bg rounded-2xl rounded-tl-md px-3 py-1.5 max-w-[80%] shadow-[0_8px_20px_-12px_rgba(124,58,237,0.7)]">
            <p className="text-[10px] text-white">Of course — table for two? Window-side is open.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 6. Honest by design — captured vs claimed. */
function HonestVisual() {
  return (
    <div className="relative w-full h-full min-h-30 flex items-center justify-center px-2">
      <div className="relative w-full max-w-70 space-y-1.5">
        {/* ✓ Captured */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/8 border border-emerald-300/25 backdrop-blur-md transition-transform duration-500 group-hover:translate-x-0.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" strokeWidth={2.5} />
          <p className="text-[10px] text-white/85">
            <span className="font-semibold text-emerald-300">Intent captured</span> · party of 6, 8pm
          </p>
        </div>
        {/* ✗ Never claimed */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/6 border border-rose-300/20 backdrop-blur-md opacity-70">
          <span className="w-3.5 h-3.5 rounded-full bg-rose-500/40 flex items-center justify-center shrink-0">
            <span className="block w-1.5 h-0.5 bg-rose-200" />
          </span>
          <p className="text-[10px] text-white/55 line-through decoration-rose-400/60">
            Reservation booked at 8pm
          </p>
        </div>
        <p className="text-[9px] text-white/40 px-1 pt-0.5">Agents capture intent, not promises.</p>
      </div>
    </div>
  );
}

/** 7. AI summaries — transcript snippet with Claude annotations. */
function SummariesVisual() {
  return (
    <div className="relative w-full h-full min-h-35 flex items-center justify-center px-2">
      <div className="relative w-full max-w-110 rounded-2xl bg-(--ah-bg-raised)/85 border border-white/10 p-4 backdrop-blur-md shadow-[0_12px_32px_-12px_rgba(2,6,23,0.6)]">
        {/* Top: sentiment + topics row */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-300/25 font-medium inline-flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" strokeWidth={2.5} />
            Positive
          </span>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-300/25 font-medium">
            booking
          </span>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-300/25 font-medium">
            urgent
          </span>
          <span className="text-[9px] text-white/40 ml-auto font-mono">02:14</span>
        </div>
        {/* Summary line */}
        <p className="text-[11px] text-white/80 leading-relaxed">
          Caller wants a window-side table for{" "}
          <span className="bg-linear-to-r from-violet-500/30 to-cyan-500/30 px-1 rounded text-white">
            6 guests tonight at 8pm
          </span>
          . Asked about wheelchair access — confirmed available.
        </p>
        {/* Action items */}
        <div className="mt-2.5 pt-2.5 border-t border-white/6 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-violet-300" />
            <p className="text-[10px] text-white/65">Confirm reservation by 6pm</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-cyan-300" />
            <p className="text-[10px] text-white/65">Note dietary: 1 vegetarian, 1 gluten-free</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 8. Lead workflow + CSV — three-stage pipeline with export. */
function WorkflowVisual() {
  const columns = [
    { label: "New", tint: "from-violet-500/15 to-violet-500/5", border: "border-violet-300/25", text: "text-violet-300", count: 4 },
    { label: "Contacted", tint: "from-blue-500/15 to-blue-500/5", border: "border-blue-300/25", text: "text-blue-300", count: 2 },
    { label: "Won", tint: "from-emerald-500/15 to-emerald-500/5", border: "border-emerald-300/25", text: "text-emerald-300", count: 1 },
  ];
  return (
    <div className="relative w-full h-full min-h-35 flex items-center justify-center px-2 gap-2">
      {columns.map((c, idx) => (
        <div key={c.label} className="flex-1 max-w-27.5">
          <div className={`rounded-xl border bg-linear-to-b p-2 backdrop-blur-md ${c.tint} ${c.border}`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[9px] font-medium ${c.text}`}>{c.label}</span>
              <span className="text-[9px] text-white/40 tabular-nums">{c.count}</span>
            </div>
            <div className="space-y-1">
              <div className="h-3 rounded-md bg-white/6" />
              {idx === 0 && <div className="h-3 rounded-md bg-white/4" style={{ width: "70%" }} />}
            </div>
          </div>
        </div>
      ))}
      {/* Floating CSV badge */}
      <div className="absolute right-1 top-1 flex items-center gap-1 px-2 py-1 rounded-lg ah-gradient-bg shadow-[0_6px_16px_-6px_rgba(124,58,237,0.7)]">
        <FileSpreadsheet className="w-3 h-3 text-white" strokeWidth={2.5} />
        <span className="text-[9px] font-medium text-white">CSV</span>
      </div>
    </div>
  );
}

const features: Feature[] = [
  {
    icon: Code2,
    title: "Embed on any website",
    description:
      "One iframe snippet — no rebuild, no new domain. The widget appears as a floating module wherever you paste it.",
    span: "md:col-span-2",
    tint: "violet",
    featured: true,
    visual: EmbedVisual,
  },
  {
    icon: Inbox,
    title: "Leads in your inbox",
    description: "Caller name, phone, email, intent — delivered within 30 seconds of hangup.",
    span: "md:col-span-2",
    tint: "blue",
    visual: InboxVisual,
  },
  {
    icon: Webhook,
    title: "CRM ready",
    description: "Signed JSON webhook to Slack, HubSpot, Zapier.",
    span: "md:col-span-2",
    tint: "cyan",
    visual: WebhookVisual,
  },
  {
    icon: Brain,
    title: "Industry-tuned agents",
    description:
      "Hotel, restaurant, medical, legal, interview templates. Each one knows the right questions and protocols.",
    span: "md:col-span-2",
    tint: "violet",
    visual: TemplatesVisual,
  },
  {
    icon: Mic2,
    title: "Real-time voice",
    description: "Low-latency Gemini Live with per-agent VAD. Pause to think — never get cut off.",
    span: "md:col-span-2",
    tint: "cyan",
    featured: true,
    visual: VoiceVisual,
  },
  {
    icon: ShieldCheck,
    title: "Honest by design",
    description: "Agents capture lead intent. They never claim to have booked or scheduled.",
    span: "md:col-span-2",
    tint: "blue",
    visual: HonestVisual,
  },
  {
    icon: Sparkles,
    title: "AI summaries",
    description: "Claude analyzes every transcript: summary, sentiment, action items.",
    span: "md:col-span-3",
    tint: "violet",
    visual: SummariesVisual,
  },
  {
    icon: ListChecks,
    title: "Lead workflow + CSV",
    description: "Mark new → contacted → won. Filter dates, export to CSV.",
    span: "md:col-span-3",
    tint: "cyan",
    visual: WorkflowVisual,
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/40 mb-4">
            Built for SMBs
          </p>
          <h2 className="font-heading text-4xl md:text-6xl font-semibold tracking-[-0.03em] text-white mb-5 leading-[1.05]">
            Everything you need to <GradientText>turn calls into customers</GradientText>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            From the iframe install to the structured lead in your inbox — all the pieces, none of the busywork.
          </p>
        </motion.div>

        {/* Bento grid — 6 columns desktop, asymmetric spans for visual rhythm.
            Bumped min row height so the new illustrations have room to breathe. */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-5 auto-rows-[minmax(220px,auto)]">
          {features.map((feature, index) => {
            const Visual = feature.visual;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className={feature.span}
              >
                <GlassPanel
                  elevation={feature.featured ? "raised" : "subtle"}
                  gradientBorder={feature.featured}
                  interactive
                  radius="lg"
                  className="h-full p-6 md:p-7 flex flex-col gap-5 group overflow-hidden"
                >
                  {/* Top row: tinted icon chip */}
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center ${TINT_BG[feature.tint]} transition-transform duration-500 group-hover:scale-110 shrink-0`}
                  >
                    <feature.icon className={`w-4 h-4 ${TINT_TEXT[feature.tint]}`} strokeWidth={2.25} />
                  </div>

                  {/* Hero visual — takes the slack between header and text */}
                  <div className="flex-1 flex items-center justify-center min-h-0">
                    <Visual />
                  </div>

                  {/* Title + description */}
                  <div>
                    <h3 className="font-semibold text-white text-lg md:text-xl tracking-tight mb-1.5">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-white/55 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </GlassPanel>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
