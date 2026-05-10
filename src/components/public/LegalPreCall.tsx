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
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left ${
                  active
                    ? "bg-gradient-to-br from-violet-500/15 to-cyan-500/10 border-violet-300/40"
                    : "bg-white/[0.03] border-white/8 hover:bg-white/[0.06] hover:border-white/14"
                }`}
              >
                <span className="text-sm text-white/90">{area}</span>
                <ChevronRight
                  className={`w-4 h-4 shrink-0 transition-all ${active ? "text-violet-300 rotate-90" : "text-white/40"}`}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2.5 p-3.5 rounded-2xl bg-amber-500/[0.06] border border-amber-300/15">
        <AlertTriangle className="w-4 h-4 text-amber-300/80 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-200/80 leading-relaxed">
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
