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
  violet: "bg-[var(--ah-lavender-soft)]",
  blue: "bg-[var(--ah-sage-soft)]",
  cyan: "bg-[var(--ah-cream-warm)]",
};
const TINT_TEXT: Record<Feature["tint"], string> = {
  violet: "text-[var(--ah-lavender-deep)]",
  blue: "text-[var(--ah-sage-deep)]",
  cyan: "text-[var(--ah-sage-deep)]",
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
      {/* Soft sage halo behind the browser */}
      <div className="absolute inset-x-6 top-2 bottom-6 rounded-3xl bg-[radial-gradient(ellipse_at_center,rgba(168,184,155,0.30),transparent_70%)] blur-2xl pointer-events-none" />

      {/* Browser window */}
      <div className="relative w-full max-w-[320px] rounded-2xl border border-white/10 bg-(--ah-bg-raised)/80 backdrop-blur-md overflow-hidden shadow-[0_24px_64px_-24px_rgba(2,6,23,0.8)] transition-transform duration-500 group-hover:-translate-y-1">
        {/* Browser chrome */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/8 bg-white/2">
          <span className="w-2 h-2 rounded-full" style={{ background: "rgba(184, 92, 92, 0.7)" }} />
          <span className="w-2 h-2 rounded-full" style={{ background: "rgba(176, 122, 46, 0.7)" }} />
          <span className="w-2 h-2 rounded-full" style={{ background: "var(--ah-sage-deep)" }} />
          <div className="ml-2 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/4 text-[9px] text-white/55 flex-1 font-mono">
            <Globe className="w-2.5 h-2.5" style={{ color: "var(--ah-sage-deep)" }} strokeWidth={2.5} />
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
        <div
          className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-2 rounded-full transition-transform duration-500 group-hover:scale-105"
          style={{
            background: "var(--ah-cta)",
            boxShadow: "0 8px 20px -8px rgba(47, 74, 42, 0.55)",
          }}
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(255, 252, 246, 0.20)" }}>
            <Phone className="w-3 h-3" style={{ color: "#FFFCF6" }} strokeWidth={2.5} />
          </div>
          <div className="text-[10px] font-medium tracking-tight" style={{ color: "#FFFCF6" }}>Talk to AI</div>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#FFFCF6" }} />
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

      <div
        className="relative w-full max-w-70 p-3.5 transition-transform duration-500 group-hover:translate-y-0.5"
        style={{
          background: "var(--ah-bg-raised)",
          border: "1px solid var(--ah-border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 12px 28px -16px rgba(26, 26, 26, 0.18)",
        }}
      >
        <div className="flex items-start gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "var(--ah-cta)" }}
          >
            <Mail className="w-3.5 h-3.5" style={{ color: "#FFFCF6" }} strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold truncate" style={{ color: "var(--ah-ink)" }}>
                New lead · Bella Vista
              </span>
              <span className="text-[9px] shrink-0" style={{ color: "var(--ah-ink-muted)" }}>now</span>
            </div>
            <p className="text-[10px] leading-relaxed mt-0.5 line-clamp-2" style={{ color: "var(--ah-ink-soft)" }}>
              Sarah Chen · +1 555-014-2293 · table for 4 tonight at 8pm
            </p>
            <div className="flex items-center gap-1 mt-1.5">
              <span
                className="text-[8px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: "var(--ah-sage-soft)", color: "var(--ah-sage-deep)", border: "1px solid var(--ah-sage)" }}
              >
                Captured
              </span>
              <span
                className="text-[8px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: "var(--ah-lavender-soft)", color: "var(--ah-lavender-deep)", border: "1px solid var(--ah-lavender)" }}
              >
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
            <stop offset="0%" stopColor="#5E7355" stopOpacity="0" />
            <stop offset="50%" stopColor="#5E7355" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#5E7355" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Connector lines from center node to right pills */}
        <path d="M 100 60 Q 140 60 175 28" stroke="url(#wh-line)" strokeWidth="1.2" />
        <path d="M 100 60 L 175 60" stroke="url(#wh-line)" strokeWidth="1.2" />
        <path d="M 100 60 Q 140 60 175 92" stroke="url(#wh-line)" strokeWidth="1.2" />

        {/* Animated dots along the wires */}
        <circle r="2" fill="#5E7355">
          <animateMotion dur="2.4s" repeatCount="indefinite" path="M 100 60 Q 140 60 175 28" />
        </circle>
        <circle r="2" fill="#5E7355">
          <animateMotion dur="2.4s" begin="0.6s" repeatCount="indefinite" path="M 100 60 L 175 60" />
        </circle>
        <circle r="2" fill="#5E7355">
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
    { Icon: Hotel, tint: "var(--ah-lavender-deep)", bg: "var(--ah-lavender-soft)", border: "var(--ah-lavender)" },
    { Icon: Stethoscope, tint: "var(--ah-sage-deep)", bg: "var(--ah-sage-soft)", border: "var(--ah-sage)" },
    { Icon: UtensilsCrossed, tint: "#B07A2E", bg: "var(--ah-cream-warm)", border: "rgba(176, 122, 46, 0.30)" },
    { Icon: Scale, tint: "var(--ah-sage-deep)", bg: "var(--ah-bg-inset)", border: "var(--ah-border-strong)" },
    { Icon: Code, tint: "#B85C5C", bg: "var(--ah-rose-soft)", border: "rgba(184, 92, 92, 0.30)" },
  ];
  return (
    <div className="relative w-full h-full min-h-30 flex items-center justify-center px-2">
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {templates.map(({ Icon, tint, bg, border }, i) => (
          <div
            key={i}
            className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:-translate-y-0.5"
            style={{
              background: bg,
              border: `1px solid ${border}`,
              transitionDelay: `${i * 60}ms`,
            }}
          >
            <Icon className="w-4 h-4" style={{ color: tint }} strokeWidth={2} />
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
      {/* Soft sage halo */}
      <div className="absolute inset-x-8 top-4 bottom-4 rounded-3xl bg-[radial-gradient(ellipse_at_center,rgba(168,184,155,0.30),transparent_70%)] blur-2xl pointer-events-none" />

      {/* Waveform */}
      <div className="relative flex items-center justify-center gap-1 h-12">
        {bars.map((h, i) => (
          <span
            key={i}
            className="w-1 rounded-full"
            style={{
              height: `${Math.round(h * 0.7)}px`,
              background: "var(--ah-sage-deep)",
              opacity: 0.85,
              animation: `wave-bar 1.4s ease-in-out ${i * 0.08}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Caller / AI bubbles */}
      <div className="relative w-full max-w-[320px] space-y-2 px-2">
        <div className="flex justify-end">
          <div
            className="rounded-2xl rounded-tr-md px-3 py-1.5 max-w-[80%]"
            style={{ background: "var(--ah-bg-inset)", border: "1px solid var(--ah-border)" }}
          >
            <p className="text-[10px]" style={{ color: "var(--ah-ink-soft)" }}>Can I book for 8 tonight?</p>
          </div>
        </div>
        <div className="flex justify-start">
          <div
            className="rounded-2xl rounded-tl-md px-3 py-1.5 max-w-[80%]"
            style={{ background: "var(--ah-cta)" }}
          >
            <p className="text-[10px]" style={{ color: "#FFFCF6" }}>Of course — table for two? Window-side is open.</p>
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
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl transition-transform duration-500 group-hover:translate-x-0.5"
          style={{ background: "var(--ah-sage-soft)", border: "1px solid var(--ah-sage)" }}
        >
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--ah-sage-deep)" }} strokeWidth={2.5} />
          <p className="text-[10px]" style={{ color: "var(--ah-ink-soft)" }}>
            <span className="font-semibold" style={{ color: "var(--ah-sage-deep)" }}>Intent captured</span> · party of 6, 8pm
          </p>
        </div>
        {/* ✗ Never claimed */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl opacity-70"
          style={{ background: "rgba(232, 199, 199, 0.30)", border: "1px solid rgba(184, 92, 92, 0.30)" }}
        >
          <span
            className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "rgba(184, 92, 92, 0.45)" }}
          >
            <span className="block w-1.5 h-0.5" style={{ background: "#E8C7C7" }} />
          </span>
          <p className="text-[10px] line-through" style={{ color: "var(--ah-ink-muted)", textDecorationColor: "rgba(184, 92, 92, 0.60)" }}>
            Reservation booked at 8pm
          </p>
        </div>
        <p className="text-[9px] px-1 pt-0.5" style={{ color: "var(--ah-ink-muted)" }}>
          Agents capture intent, not promises.
        </p>
      </div>
    </div>
  );
}

/** 7. AI summaries — transcript snippet with Claude annotations. */
function SummariesVisual() {
  return (
    <div className="relative w-full h-full min-h-35 flex items-center justify-center px-2">
      <div
        className="relative w-full max-w-110 p-4"
        style={{
          background: "var(--ah-bg-raised)",
          border: "1px solid var(--ah-border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 12px 28px -16px rgba(26, 26, 26, 0.16)",
        }}
      >
        {/* Top: sentiment + topics row */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
          <span
            className="text-[9px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1"
            style={{ background: "var(--ah-sage-soft)", color: "var(--ah-sage-deep)", border: "1px solid var(--ah-sage)" }}
          >
            <Sparkles className="w-2.5 h-2.5" strokeWidth={2.5} />
            Positive
          </span>
          <span
            className="text-[9px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: "var(--ah-lavender-soft)", color: "var(--ah-lavender-deep)", border: "1px solid var(--ah-lavender)" }}
          >
            booking
          </span>
          <span
            className="text-[9px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: "var(--ah-cream-warm)", color: "#B07A2E", border: "1px solid rgba(176, 122, 46, 0.30)" }}
          >
            urgent
          </span>
          <span className="text-[9px] ml-auto font-mono" style={{ color: "var(--ah-ink-muted)" }}>02:14</span>
        </div>
        {/* Summary line */}
        <p className="text-[11px] leading-relaxed" style={{ color: "var(--ah-ink-soft)" }}>
          Caller wants a window-side table for{" "}
          <span
            className="px-1 rounded"
            style={{ background: "var(--ah-sage-soft)", color: "var(--ah-ink)" }}
          >
            6 guests tonight at 8pm
          </span>
          . Asked about wheelchair access — confirmed available.
        </p>
        {/* Action items */}
        <div className="mt-2.5 pt-2.5 space-y-1" style={{ borderTop: "1px solid var(--ah-border)" }}>
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full" style={{ background: "var(--ah-lavender-deep)" }} />
            <p className="text-[10px]" style={{ color: "var(--ah-ink-soft)" }}>Confirm reservation by 6pm</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full" style={{ background: "var(--ah-sage-deep)" }} />
            <p className="text-[10px]" style={{ color: "var(--ah-ink-soft)" }}>Note dietary: 1 vegetarian, 1 gluten-free</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 8. Lead workflow + CSV — three-stage pipeline with export. */
function WorkflowVisual() {
  const columns = [
    { label: "New", bg: "var(--ah-lavender-soft)", border: "var(--ah-lavender)", text: "var(--ah-lavender-deep)", count: 4 },
    { label: "Contacted", bg: "var(--ah-sage-soft)", border: "var(--ah-sage)", text: "var(--ah-sage-deep)", count: 2 },
    { label: "Won", bg: "var(--ah-cta)", border: "var(--ah-cta)", text: "#FFFCF6", count: 1 },
  ];
  return (
    <div className="relative w-full h-full min-h-35 flex items-center justify-center px-2 gap-2">
      {columns.map((c, idx) => (
        <div key={c.label} className="flex-1 max-w-27.5">
          <div
            className="rounded-xl p-2"
            style={{ background: c.bg, border: `1px solid ${c.border}` }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-medium" style={{ color: c.text }}>{c.label}</span>
              <span className="text-[9px] tabular-nums" style={{ color: c.text, opacity: 0.65 }}>{c.count}</span>
            </div>
            <div className="space-y-1">
              <div className="h-3 rounded-md" style={{ background: idx === 2 ? "rgba(255, 252, 246, 0.30)" : "rgba(26, 26, 26, 0.08)" }} />
              {idx === 0 && <div className="h-3 rounded-md" style={{ width: "70%", background: "rgba(26, 26, 26, 0.06)" }} />}
            </div>
          </div>
        </div>
      ))}
      {/* Floating CSV badge */}
      <div
        className="absolute right-1 top-1 flex items-center gap-1 px-2 py-1 rounded-lg"
        style={{ background: "var(--ah-cta)", boxShadow: "0 6px 14px -6px rgba(47, 74, 42, 0.50)" }}
      >
        <FileSpreadsheet className="w-3 h-3" style={{ color: "#FFFCF6" }} strokeWidth={2.5} />
        <span className="text-[9px] font-medium" style={{ color: "#FFFCF6" }}>CSV</span>
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
    <section id="features" className="relative py-20 px-2 md:py-32 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <p
            className="text-sm font-medium uppercase tracking-[0.2em] mb-4"
            style={{ color: "var(--ah-ink-muted)" }}
          >
            Built for SMBs
          </p>
          <h2
            className="font-serif text-5xl md:text-7xl tracking-[-0.02em] mb-5 leading-[1.08]"
            style={{ color: "var(--ah-ink)" }}
          >
            Everything you need to{" "}
            <span style={{ color: "var(--ah-sage-deep)" }}>
              turn calls into customers
            </span>
          </h2>
          <p className="text-xl max-w-2xl mx-auto" style={{ color: "var(--ah-ink-soft)" }}>
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
                    <h3
                      className="font-serif text-xl md:text-2xl tracking-tight mb-1.5"
                      style={{ color: "var(--ah-ink)" }}
                    >
                      {feature.title}
                    </h3>
                    <p className="text-base leading-relaxed" style={{ color: "var(--ah-ink-soft)" }}>
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
