"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, CalendarCheck, AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GradientButton } from "@/components/ui/gradient-button";

interface GoogleCalendarCardProps {
  businessId: string;
}

interface CalendarStatus {
  connected: boolean;
  accountEmail: string | null;
  status: "active" | "needs_reauth" | null;
}

/**
 * Google Calendar connector card (ROADMAP_NEXT.md Item 7).
 * While connected + active, every SMB agent for this business gains real
 * bookAppointment / confirmAppointment tools on the next call.
 */
export function GoogleCalendarCard({ businessId }: GoogleCalendarCardProps) {
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/integrations/google-calendar?businessId=${businessId}`)
      .then((r) => r.json())
      .then((d) => setStatus(d))
      .catch(() => setStatus({ connected: false, accountEmail: null, status: null }));
  }, [businessId]);

  const handleDisconnect = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/integrations/google-calendar?businessId=${businessId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setStatus({ connected: false, accountEmail: null, status: null });
      toast.success("Google Calendar disconnected — agents fall back to lead capture");
    } catch {
      toast.error("Couldn't disconnect");
    } finally {
      setBusy(false);
    }
  };

  const connectHref = `/api/integrations/google-calendar/connect?businessId=${businessId}`;
  const needsReauth = status?.status === "needs_reauth";

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.12 }}>
      <GlassPanel elevation="subtle" radius="lg" className="p-6 md:p-7 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet-300" />
            <h3 className="font-semibold text-white tracking-tight">Appointment booking</h3>
            {status?.connected && !needsReauth && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium border bg-emerald-500/15 text-emerald-300 border-emerald-300/25 inline-flex items-center gap-1">
                <CalendarCheck className="w-2.5 h-2.5" /> {status.accountEmail || "Connected"}
              </span>
            )}
            {needsReauth && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium border bg-amber-500/10 text-amber-300 border-amber-300/20 inline-flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" /> Reconnect needed
              </span>
            )}
          </div>
          {status?.connected && (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={busy}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border bg-rose-500/10 border-rose-300/20 text-rose-300 hover:bg-rose-500/20 transition-all ah-focus-ring disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" /> Disconnect
            </button>
          )}
        </div>

        <p className="text-xs text-white/40 leading-relaxed">
          Connect your Google Calendar and your voice agents book REAL appointments mid-call: the AI offers
          live free slots (IST working hours), confirms the caller&apos;s pick, creates the event, and emails
          them an invite. Without it, agents capture the request as a lead for manual follow-up — nothing breaks.
        </p>

        {(!status?.connected || needsReauth) && (
          <div className="flex justify-end">
            <GradientButton href={connectHref} size="sm">
              <Calendar className="w-3.5 h-3.5" /> {needsReauth ? "Reconnect Google Calendar" : "Connect Google Calendar"}
            </GradientButton>
          </div>
        )}
      </GlassPanel>
    </motion.div>
  );
}
