"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Inbox, Gauge, Save } from "lucide-react";
import { toast } from "sonner";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GradientButton } from "@/components/ui/gradient-button";

export interface NotificationPrefs {
  leadCapture: boolean;
  quotaWarning: boolean;
}

interface Props {
  businessId: string;
  initial: Partial<NotificationPrefs> | null;
}

/** Missing keys default to ON — matches the API coercion. */
function normalize(p: Partial<NotificationPrefs> | null): NotificationPrefs {
  return {
    leadCapture: p?.leadCapture !== false,
    quotaWarning: p?.quotaWarning !== false,
  };
}

export function NotificationPrefsCard({ businessId, initial }: Props) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(normalize(initial));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const toggle = (key: keyof NotificationPrefs) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/business/${businessId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationPrefs: prefs }),
      });
      if (!res.ok) throw new Error();
      toast.success("Notification preferences saved");
      setDirty(false);
    } catch {
      toast.error("Couldn't save preferences");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.12 }}
    >
      <GlassPanel elevation="raised" radius="lg" className="p-6 md:p-7 space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-300/20 flex items-center justify-center">
            <Bell className="w-4 h-4 text-amber-300" strokeWidth={2} />
          </div>
          <div>
            <h2 className="font-semibold text-white text-lg tracking-tight">Notification preferences</h2>
            <p className="text-xs text-white/45 mt-0.5">
              Choose which emails your team receives.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <PrefRow
            icon={Inbox}
            tint="violet"
            title="Lead-capture emails"
            description="Sent after every analyzed call with a captured lead or transcript summary."
            checked={prefs.leadCapture}
            onToggle={() => toggle("leadCapture")}
          />
          <PrefRow
            icon={Gauge}
            tint="cyan"
            title="Quota warnings"
            description="Heads-up at 80%, 95%, and 100% of your monthly call-minute cap."
            checked={prefs.quotaWarning}
            onToggle={() => toggle("quotaWarning")}
          />
        </div>

        <div className="pt-1 flex items-center justify-end">
          <GradientButton onClick={handleSave} disabled={saving || !dirty} size="default">
            {saving ? (
              <>
                <span className="ah-spinner" /> Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save preferences
              </>
            )}
          </GradientButton>
        </div>
      </GlassPanel>
    </motion.div>
  );
}

const TINT_BG: Record<string, string> = {
  violet: "bg-violet-500/10 border-violet-300/20",
  cyan: "bg-cyan-500/10 border-cyan-300/20",
};
const TINT_TEXT: Record<string, string> = {
  violet: "text-violet-300",
  cyan: "text-cyan-300",
};

interface PrefRowProps {
  icon: typeof Bell;
  tint: "violet" | "cyan";
  title: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}

function PrefRow({ icon: Icon, tint, title, description, checked, onToggle }: PrefRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
      <div className="flex gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${TINT_BG[tint]}`}>
          <Icon className={`w-4 h-4 ${TINT_TEXT[tint]}`} strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="text-xs text-white/55 leading-relaxed mt-0.5">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        className={`shrink-0 mt-1 w-11 h-6 rounded-full relative border transition-all ah-focus-ring ${
          checked
            ? "ah-gradient-bg border-violet-300/40 shadow-[0_0_16px_-4px_rgba(124,58,237,0.5)]"
            : "bg-white/[0.06] border-white/10"
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
