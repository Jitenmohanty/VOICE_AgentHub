"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Scale, ChevronRight, AlertTriangle } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";

interface LegalPreCallProps {
  agentName: string;
  businessName: string;
  accentColor: string;
  practiceAreas: string[];
  onStartCall: (context?: string) => void;
  loading?: boolean;
}

export function LegalPreCall({
  agentName,
  businessName,
  practiceAreas,
  onStartCall,
  loading = false,
}: LegalPreCallProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const areas = practiceAreas.length > 0 ? practiceAreas : ["General Legal Inquiry"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full space-y-5"
    >
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl ah-gradient-bg flex items-center justify-center mx-auto mb-3 shadow-[0_8px_24px_-8px_rgba(124,58,237,0.5)]">
          <Scale className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-white">{businessName}</h2>
        <p className="text-xs text-white/55 mt-0.5">{agentName} — legal information assistant</p>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/40 px-1">
          What can we help you with?
        </p>
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {areas.map((area) => {
            const active = selected === area;
            return (
              <button
                key={area}
                onClick={() => setSelected(area === selected ? null : area)}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl transition-all text-left"
                style={
                  active
                    ? {
                        background: "var(--ah-sage-soft)",
                        border: "1px solid var(--ah-sage)",
                      }
                    : {
                        background: "var(--ah-bg-inset)",
                        border: "1px solid var(--ah-border)",
                      }
                }
              >
                <span className="text-sm" style={{ color: "var(--ah-ink)" }}>{area}</span>
                <ChevronRight
                  className={`w-4 h-4 shrink-0 transition-all ${active ? "rotate-90" : ""}`}
                  style={{ color: active ? "var(--ah-sage-deep)" : "var(--ah-ink-muted)" }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="flex gap-2.5 p-3.5 rounded-2xl"
        style={{
          background: "var(--ah-cream-warm)",
          border: "1px solid rgba(176, 122, 46, 0.25)",
        }}
      >
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#B07A2E" }} />
        <p className="text-[11px] leading-relaxed" style={{ color: "#7A5520" }}>
          This assistant provides general legal information only, not legal advice.
          For advice specific to your situation, consult a licensed attorney.
        </p>
      </div>

      <GradientButton onClick={() => onStartCall(selected ?? undefined)} disabled={loading} className="w-full" size="default">
        <Phone className="w-4 h-4" />
        {selected ? `Discuss ${selected}` : "Start consultation"}
      </GradientButton>
    </motion.div>
  );
}
