"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Scale, ChevronRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  accentColor,
  practiceAreas,
  onStartCall,
  loading = false,
}: LegalPreCallProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const areas = practiceAreas.length > 0 ? practiceAreas : ["General Legal Inquiry"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-5"
    >
      {/* Header */}
      <div className="text-center">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: `${accentColor}15` }}
        >
          <Scale className="w-6 h-6" style={{ color: accentColor }} />
        </div>
        <h2 className="text-lg font-semibold text-white">{businessName}</h2>
        <p className="text-sm text-[#8888AA]">{agentName} — legal information assistant</p>
      </div>

      {/* Practice area selector */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-[#8888AA] uppercase tracking-wider px-1">
          What can we help you with?
        </p>
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {areas.map((area) => (
            <button
              key={area}
              onClick={() => setSelected(area === selected ? null : area)}
              className="w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left"
              style={{
                background: selected === area ? `${accentColor}12` : "rgba(255,255,255,0.03)",
                borderColor: selected === area ? `${accentColor}40` : "rgba(255,255,255,0.06)",
              }}
            >
              <span className="text-sm text-white">{area}</span>
              <ChevronRight
                className="w-4 h-4 shrink-0 transition-transform"
                style={{
                  color: selected === area ? accentColor : "#666680",
                  transform: selected === area ? "rotate(90deg)" : "rotate(0deg)",
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex gap-2.5 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/15">
        <AlertTriangle className="w-4 h-4 text-yellow-500/70 shrink-0 mt-0.5" />
        <p className="text-[11px] text-yellow-500/70 leading-relaxed">
          This assistant provides general legal information only, not legal advice.
          For advice specific to your situation, consult a licensed attorney.
        </p>
      </div>

      {/* CTA */}
      <Button
        onClick={() => onStartCall(selected ?? undefined)}
        disabled={loading}
        className="w-full py-3 text-white border-0 hover:opacity-90"
        style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)` }}
      >
        <Phone className="w-4 h-4 mr-2" />
        {selected ? `Discuss ${selected}` : "Start Consultation"}
      </Button>
    </motion.div>
  );
}
