"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mic, Save } from "lucide-react";
import { toast } from "sonner";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GradientButton } from "@/components/ui/gradient-button";

interface RecordingCardProps {
  businessId: string;
  initialEnabled: boolean;
}

/**
 * Call recording settings (ROADMAP_NEXT.md Item 12).
 * Consent-first: when on, callers see "this call may be recorded" before the
 * call and can decline — the call still proceeds, just unrecorded. Requires
 * the platform R2_* storage env; without it the toggle saves but nothing
 * records (same silent gating as WhatsApp/Stripe).
 */
export function RecordingCard({ businessId, initialEnabled }: RecordingCardProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/business/${businessId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordingEnabled: enabled }),
      });
      if (!res.ok) throw new Error();
      toast.success(enabled ? "Call recording on — callers will see a consent notice" : "Call recording off");
    } catch {
      toast.error("Couldn't save recording setting");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.16 }}>
      <GlassPanel elevation="subtle" radius="lg" className="p-6 md:p-7 space-y-4">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-rose-300" />
          <h3 className="font-semibold text-white tracking-tight">Call recording</h3>
        </div>

        <p className="text-xs text-white/40 leading-relaxed">
          Record calls (caller + agent audio) for quality review, playable from each session&apos;s detail
          view. Callers see a consent notice before the call starts and can decline — the call continues
          unrecorded. You are responsible for complying with recording-consent laws in your region.
        </p>

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-4 h-4 rounded accent-violet-500"
          />
          <span className="text-sm text-white/75">Record calls (with caller consent)</span>
        </label>

        <div className="flex justify-end">
          <GradientButton onClick={handleSave} disabled={saving} size="sm">
            <Save className="w-3.5 h-3.5" /> {saving ? "Saving…" : "Save recording setting"}
          </GradientButton>
        </div>
      </GlassPanel>
    </motion.div>
  );
}
