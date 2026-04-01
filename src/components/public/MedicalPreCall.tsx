"use client";

import { motion } from "framer-motion";
import { Phone, Calendar, HelpCircle, User, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  accentColor,
  doctors,
  onStartCall,
  loading = false,
}: MedicalPreCallProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-5"
    >
      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg font-semibold text-white">{businessName}</h2>
        <p className="text-sm text-[#8888AA]">{agentName} — here to help</p>
      </div>

      {/* Doctor roster */}
      {doctors.length > 0 && (
        <div className="glass rounded-2xl p-4 space-y-3 max-h-56 overflow-y-auto">
          <p className="text-xs font-medium text-[#8888AA] uppercase tracking-wider">Our Doctors</p>
          {doctors.map((doc, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: `${accentColor}20` }}
              >
                <User className="w-4 h-4" style={{ color: accentColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-white truncate">{doc.name}</p>
                  {doc.acceptingNewPatients && (
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                      style={{ background: `${accentColor}20`, color: accentColor }}
                    >
                      Accepting Patients
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#8888AA]">{doc.specialization}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-[11px] text-[#666680]">
                    <Clock className="w-3 h-3" />
                    {doc.hours}
                  </span>
                  <span className="text-[11px] text-[#666680]">
                    {doc.availableDays.map((d) => DAYS_SHORT[d] ?? d).join(", ")}
                  </span>
                </div>
              </div>
              {!doc.acceptingNewPatients && (
                <CheckCircle className="w-4 h-4 text-[#444460] shrink-0 mt-1" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[11px] text-[#666680] text-center px-2">
        This assistant provides general information only and is not a substitute for professional medical advice.
      </p>

      {/* CTA buttons */}
      <div className="flex flex-col gap-3">
        <Button
          onClick={() => onStartCall("book_appointment")}
          disabled={loading}
          className="w-full py-3 text-white border-0 hover:opacity-90 justify-start px-5"
          style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)` }}
        >
          <Calendar className="w-4 h-4 mr-3" />
          Book an Appointment
        </Button>
        <Button
          onClick={() => onStartCall("health_question")}
          disabled={loading}
          variant="outline"
          className="w-full py-3 border-white/10 text-white hover:bg-white/5 justify-start px-5 bg-transparent"
        >
          <HelpCircle className="w-4 h-4 mr-3" />
          Ask a Health Question
        </Button>
        <Button
          onClick={() => onStartCall()}
          disabled={loading}
          variant="ghost"
          className="w-full py-2 text-[#8888AA] hover:text-white hover:bg-white/5 justify-center text-sm"
        >
          <Phone className="w-3.5 h-3.5 mr-2" />
          General Inquiry
        </Button>
      </div>
    </motion.div>
  );
}
