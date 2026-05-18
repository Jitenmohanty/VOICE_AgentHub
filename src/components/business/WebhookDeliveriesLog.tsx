"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, Webhook } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { formatIST } from "@/lib/format-date";

interface Delivery {
  id: string;
  url: string;
  event: string;
  statusCode: number | null;
  latencyMs: number | null;
  errorMessage: string | null;
  ok: boolean;
  attempt: number;
  createdAt: string;
}

interface Props {
  businessId: string;
}

function statusInfo(d: Delivery) {
  if (d.ok) {
    return {
      Icon: CheckCircle2,
      tone: "text-emerald-300",
      bg: "bg-emerald-500/10 border-emerald-300/25",
      label: `${d.statusCode ?? "200"} OK`,
    };
  }
  if (d.statusCode !== null) {
    return {
      Icon: XCircle,
      tone: "text-rose-300",
      bg: "bg-rose-500/10 border-rose-300/25",
      label: `${d.statusCode} error`,
    };
  }
  return {
    Icon: AlertTriangle,
    tone: "text-amber-300",
    bg: "bg-amber-500/10 border-amber-300/25",
    label: "Network",
  };
}

export function WebhookDeliveriesLog({ businessId }: Props) {
  const [deliveries, setDeliveries] = useState<Delivery[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (silent: boolean) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await fetch(`/api/business/${businessId}/webhook-deliveries`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setDeliveries(data.deliveries || []);
      } catch {
        // surface nothing — the panel just shows its empty state
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [businessId],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
    >
      <GlassPanel elevation="raised" radius="lg" className="p-6 md:p-7 space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-300/20 flex items-center justify-center">
            <Webhook className="w-4 h-4 text-blue-300" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-white text-lg tracking-tight">Recent webhook deliveries</h2>
            <p className="text-xs text-white/45 mt-0.5">
              Last 50 attempts. Use this to confirm your receiver is acking 2xx.
            </p>
          </div>
          <button
            type="button"
            onClick={() => load(true)}
            disabled={loading || refreshing}
            aria-label="Refresh deliveries"
            className="p-2 rounded-lg text-white/55 hover:text-white hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed transition-all ah-focus-ring"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} strokeWidth={2} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 bg-white/[0.04] rounded-xl border border-white/[0.06] animate-pulse"
              />
            ))}
          </div>
        ) : !deliveries || deliveries.length === 0 ? (
          <div className="text-center py-8 px-4">
            <p className="text-sm text-white/55">No webhook attempts yet</p>
            <p className="text-xs text-white/40 mt-1">
              Each delivered lead will appear here with status & latency.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {deliveries.map((d) => {
              const info = statusInfo(d);
              return (
                <div
                  key={d.id}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium border inline-flex items-center gap-1 shrink-0 ${info.bg} ${info.tone}`}
                    >
                      <info.Icon className="w-3 h-3" strokeWidth={2} />
                      {info.label}
                    </span>
                    <span className="text-xs text-white/55 truncate">
                      {formatIST(d.createdAt)}
                    </span>
                    {d.errorMessage && (
                      <span className="text-[11px] text-white/40 truncate">· {d.errorMessage}</span>
                    )}
                  </div>
                  {d.latencyMs !== null && (
                    <span className="text-[11px] text-white/45 font-mono tabular-nums shrink-0">
                      {d.latencyMs}ms
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </GlassPanel>
    </motion.div>
  );
}
