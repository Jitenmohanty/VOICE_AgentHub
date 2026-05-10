"use client";

import { motion } from "framer-motion";
import { Phone, Calendar, HelpCircle, User, Clock } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GradientButton } from "@/components/ui/gradient-button";

export interface DoctorInfo {
  name: string;
  specialization: string;
  availableDays: string[];
  hours: string;
  acceptingNewPatients: boolean;
}

interface MedicalPreCallProps {
  agentName: string;
  businessName: string;
  accentColor: string;
  doctors: DoctorInfo[];
  onStartCall: (context?: string) => void;
  loading?: boolean;
}

const DAYS_SHORT: Record<string, string> = {
  Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed",
  Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun",
};

export function MedicalPreCall({
  agentName,
  businessName,
  doctors,
  onStartCall,
  loading = false,
}: MedicalPreCallProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full space-y-5"
    >
      <div className="text-center">
        <h2 className="text-lg font-semibold tracking-tight text-white">{businessName}</h2>
        <p className="text-xs text-white/55 mt-0.5">{agentName} — here to help</p>
      </div>

      {doctors.length > 0 && (
        <GlassPanel elevation="raised" radius="lg" className="p-4 space-y-2.5 max-h-60 overflow-y-auto">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/40">Our Doctors</p>
          {doctors.map((doc, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
            >
              <div className="w-9 h-9 rounded-2xl bg-violet-500/10 border border-violet-300/20 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4 text-violet-300" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-white truncate">{doc.name}</p>
                  {doc.acceptingNewPatients && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-300/20">
                      Accepting
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/55">{doc.specialization}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-[11px] text-white/40">
                    <Clock className="w-3 h-3" /> {doc.hours}
                  </span>
                  <span className="text-[11px] text-white/40">
                    {doc.availableDays.map((d) => DAYS_SHORT[d] ?? d).join(" · ")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </GlassPanel>
      )}

      <p className="text-[11px] text-white/40 text-center px-2 leading-relaxed">
        This assistant provides general information only and is not a substitute for professional medical advice.
      </p>

      <div className="flex flex-col gap-2.5">
        <GradientButton onClick={() => onStartCall("book_appointment")} disabled={loading} className="w-full justify-start" size="default">
          <Calendar className="w-4 h-4" />
          Book an Appointment
        </GradientButton>
        <GradientButton onClick={() => onStartCall("health_question")} disabled={loading} variant="outline" className="w-full justify-start" size="default">
          <HelpCircle className="w-4 h-4" />
          Ask a Health Question
        </GradientButton>
        <button
          onClick={() => onStartCall()}
          disabled={loading}
          className="w-full py-2 text-xs text-white/55 hover:text-white inline-flex items-center justify-center gap-2 transition-colors"
        >
          <Phone className="w-3.5 h-3.5" /> General Inquiry
        </button>
      </div>
    </motion.div>
  );
}
