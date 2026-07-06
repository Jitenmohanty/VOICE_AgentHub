"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Gauge, Save } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GradientButton } from "@/components/ui/gradient-button";

interface OverageCardProps {
  businessId: string;
  initialEnabled: boolean;
  initialCapMinutes: number;
}

/**
 * Metered overage settings (ROADMAP_NEXT.md Item 13).
 * Off (default) = hard cap: callers get a friendly "quota reached" at 100%.
 * On = calls keep flowing past the plan cap up to the extra-minute ceiling,
 * invoiced monthly at the plan's per-minute rate (paid plans only).
 */
export function OverageCard({ businessId, initialEnabled, initialCapMinutes }: OverageCardProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [capMinutes, setCapMinutes] = useState(String(initialCapMinutes || 120));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/business/${businessId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overageEnabled: enabled,
          overageCapMinutes: Math.max(0, parseInt(capMinutes, 10) || 0),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(
        enabled
          ? "Overage on — calls keep flowing past your plan cap"
          : "Overage off — calls pause at 100% of plan minutes",
      );
    } catch {
      toast.error("Couldn't save overage settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.14 }}>
      <GlassPanel elevation="subtle" radius="lg" className="p-6 md:p-7 space-y-4">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-amber-300" />
          <h3 className="font-semibold text-white tracking-tight">Overage billing</h3>
        </div>

        <p className="text-xs text-white/40 leading-relaxed">
          By default your agents stop taking calls at 100% of your plan&apos;s minutes. Turn this on and they
          keep answering past the cap — extra minutes are invoiced monthly at your plan&apos;s per-minute rate
          (Starter ₹3/min, Pro ₹2.50/min; not available on Free). You&apos;ll get a UPI payment link by email
          on the 1st of each month.
        </p>

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-4 h-4 rounded accent-violet-500"
          />
          <span className="text-sm text-white/75">Keep taking calls past my plan limit</span>
        </label>

        {enabled && (
          <div className="max-w-xs">
            <p className="text-xs text-white/40 mb-1.5">
              Safety ceiling: maximum EXTRA minutes per month (so a viral day can&apos;t run up an unbounded bill).
            </p>
            <Input
              type="number"
              min={0}
              max={10000}
              value={capMinutes}
              onChange={(e) => setCapMinutes(e.target.value)}
              placeholder="120"
            />
          </div>
        )}

        <div className="flex justify-end">
          <GradientButton onClick={handleSave} disabled={saving} size="sm">
            <Save className="w-3.5 h-3.5" /> {saving ? "Saving…" : "Save overage settings"}
          </GradientButton>
        </div>
      </GlassPanel>
    </motion.div>
  );
}
