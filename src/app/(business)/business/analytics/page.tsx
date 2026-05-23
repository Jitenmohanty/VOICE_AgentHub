"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Phone,
  CheckCircle2,
  Inbox,
  Trophy,
  Clock,
  AlertTriangle,
  Smile,
  Meh,
  Frown,
  Sparkles,
} from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";

interface AnalyticsData {
  windowDays: number;
  totalCalls: number;
  completedCalls: number;
  leadsCaptured: number;
  wonLeads: number;
  conversionRate: number;
  wonRate: number;
  escalatedCount: number;
  avgDurationSeconds: number;
  sentimentBreakdown: Record<string, number>;
  topTopics: { topic: string; count: number }[];
  hourCounts: number[];
  peakHour: number;
  daily: { date: string; calls: number; leads: number }[];
}

const WINDOW_OPTIONS = [
  { value: 7, label: "7d" },
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
];

function fmtDuration(seconds: number): string {
  if (seconds === 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function fmtPct(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

export default function AnalyticsPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [bootLoading, setBootLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/business")
      .then((r) => r.json())
      .then((d) => setBusinessId(d.businesses?.[0]?.id || null))
      .catch(() => {})
      .finally(() => setBootLoading(false));
  }, []);

  useEffect(() => {
    if (!businessId) return;
    setLoading(true);
    fetch(`/api/business/${businessId}/analytics?days=${days}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [businessId, days]);

  const maxDaily = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, ...data.daily.map((d) => d.calls));
  }, [data]);

  const totalSentiment = useMemo(() => {
    if (!data) return 0;
    return Object.values(data.sentimentBreakdown).reduce((a, b) => a + b, 0);
  }, [data]);

  if (bootLoading) {
    return (
      <div className="max-w-6xl mx-auto px-2 py-6 md:p-10 space-y-6">
        <div>
          <div className="h-3 w-16 bg-white/[0.06] rounded animate-pulse mb-3" />
          <div className="h-9 w-48 bg-white/[0.06] rounded-lg animate-pulse" />
        </div>
        <GlassPanel elevation="subtle" radius="lg" className="p-6 animate-pulse">
          <div className="h-32 bg-white/[0.04] rounded-2xl" />
        </GlassPanel>
      </div>
    );
  }

  if (!businessId) {
    return (
      <div className="max-w-6xl mx-auto px-2 py-6 md:p-10">
        <GlassPanel elevation="subtle" radius="lg" className="text-center py-16 px-6">
          <TrendingUp className="w-12 h-12 text-white/15 mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-white/65">No business yet</p>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-2 py-6 md:p-10 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/40 mb-2">Insights</p>
          <h1 className="font-serif text-4xl md:text-5xl tracking-[-0.02em] text-white">Analytics</h1>
          <p className="text-base text-white/55 mt-2">
            Calls, captured leads, and conversion across the last {days} days.
          </p>
        </div>
        <div role="radiogroup" className="inline-flex bg-white/[0.04] border border-white/10 rounded-xl p-1 gap-1">
          {WINDOW_OPTIONS.map((opt) => {
            const active = days === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setDays(opt.value)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ah-focus-ring ${
                  active
                    ? "bg-gradient-to-br from-violet-500/25 to-cyan-500/20 text-white shadow-[0_0_12px_-4px_rgba(124,58,237,0.5)]"
                    : "text-white/55 hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* KPI grid */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <KpiCard
          loading={loading}
          icon={Phone}
          tint="violet"
          label="Total calls"
          value={data?.totalCalls ?? 0}
        />
        <KpiCard
          loading={loading}
          icon={CheckCircle2}
          tint="blue"
          label="Completed"
          value={data?.completedCalls ?? 0}
          sub={data ? `${fmtPct(data.totalCalls > 0 ? data.completedCalls / data.totalCalls : 0)} of calls` : ""}
        />
        <KpiCard
          loading={loading}
          icon={Inbox}
          tint="cyan"
          label="Leads captured"
          value={data?.leadsCaptured ?? 0}
          sub={data ? `${fmtPct(data.conversionRate)} conversion` : ""}
        />
        <KpiCard
          loading={loading}
          icon={Trophy}
          tint="emerald"
          label="Won leads"
          value={data?.wonLeads ?? 0}
          sub={data && data.leadsCaptured > 0 ? `${fmtPct(data.wonRate)} of leads` : ""}
        />
      </motion.div>

      {/* Daily volume + secondary KPIs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-3"
      >
        <GlassPanel elevation="raised" radius="lg" className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white tracking-tight">Calls per day</h2>
            <div className="flex items-center gap-3 text-xs text-white/55">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-violet-400/80" /> Calls
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-cyan-300" /> Leads
              </span>
            </div>
          </div>
          {loading || !data ? (
            <div className="h-40 bg-white/[0.04] rounded-2xl animate-pulse" />
          ) : (
            <DailyChart daily={data.daily} maxValue={maxDaily} />
          )}
        </GlassPanel>

        <div className="space-y-3">
          <SmallStat
            loading={loading}
            icon={Clock}
            label="Avg call duration"
            value={data ? fmtDuration(data.avgDurationSeconds) : "—"}
          />
          <SmallStat
            loading={loading}
            icon={AlertTriangle}
            label="Escalated calls"
            value={data?.escalatedCount ?? 0}
            tint="amber"
          />
          <SmallStat
            loading={loading}
            icon={Sparkles}
            label="Peak hour (UTC)"
            value={
              data && data.totalCalls > 0
                ? `${String(data.peakHour).padStart(2, "0")}:00`
                : "—"
            }
          />
        </div>
      </motion.div>

      {/* Sentiment + topics */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-3"
      >
        <GlassPanel elevation="raised" radius="lg" className="p-6">
          <h2 className="font-semibold text-white tracking-tight mb-5">Sentiment</h2>
          {loading || !data ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-7 bg-white/[0.04] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : totalSentiment === 0 ? (
            <p className="text-sm text-white/45">No analyzed calls in this window yet.</p>
          ) : (
            <div className="space-y-3">
              <SentimentBar
                Icon={Smile}
                tint="emerald"
                label="Positive"
                count={data.sentimentBreakdown.positive ?? 0}
                total={totalSentiment}
              />
              <SentimentBar
                Icon={Meh}
                tint="blue"
                label="Neutral"
                count={data.sentimentBreakdown.neutral ?? 0}
                total={totalSentiment}
              />
              <SentimentBar
                Icon={Meh}
                tint="amber"
                label="Mixed"
                count={data.sentimentBreakdown.mixed ?? 0}
                total={totalSentiment}
              />
              <SentimentBar
                Icon={Frown}
                tint="rose"
                label="Negative"
                count={data.sentimentBreakdown.negative ?? 0}
                total={totalSentiment}
              />
            </div>
          )}
        </GlassPanel>

        <GlassPanel elevation="raised" radius="lg" className="p-6">
          <h2 className="font-semibold text-white tracking-tight mb-5">Top topics</h2>
          {loading || !data ? (
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-7 w-20 bg-white/[0.04] rounded-full animate-pulse" />
              ))}
            </div>
          ) : data.topTopics.length === 0 ? (
            <p className="text-sm text-white/45">Topics will appear once Claude analyzes a few calls.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.topTopics.map((t) => (
                <span
                  key={t.topic}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs text-white/75"
                >
                  {t.topic}
                  <span className="text-xs text-white/40 tabular-nums">{t.count}</span>
                </span>
              ))}
            </div>
          )}
        </GlassPanel>
      </motion.div>
    </div>
  );
}

interface KpiProps {
  loading: boolean;
  icon: typeof Phone;
  tint: "violet" | "blue" | "cyan" | "emerald" | "amber";
  label: string;
  value: number | string;
  sub?: string;
}

const TINT_BG: Record<KpiProps["tint"], string> = {
  violet: "bg-violet-500/10 border-violet-300/20",
  blue: "bg-blue-500/10 border-blue-300/20",
  cyan: "bg-cyan-500/10 border-cyan-300/20",
  emerald: "bg-emerald-500/10 border-emerald-300/20",
  amber: "bg-amber-500/10 border-amber-300/20",
};
const TINT_TEXT: Record<KpiProps["tint"], string> = {
  violet: "text-violet-300",
  blue: "text-blue-300",
  cyan: "text-cyan-300",
  emerald: "text-emerald-300",
  amber: "text-amber-300",
};

function KpiCard({ loading, icon: Icon, tint, label, value, sub }: KpiProps) {
  return (
    <GlassPanel elevation="raised" radius="lg" className="p-5">
      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3 ${TINT_BG[tint]}`}>
        <Icon className={`w-4 h-4 ${TINT_TEXT[tint]}`} strokeWidth={2} />
      </div>
      {loading ? (
        <>
          <div className="h-7 w-14 bg-white/[0.06] rounded animate-pulse mb-1" />
          <div className="h-3 w-20 bg-white/[0.04] rounded animate-pulse" />
        </>
      ) : (
        <>
          <p className="text-2xl font-semibold tracking-tight text-white tabular-nums">{value}</p>
          <p className="text-xs text-white/55 mt-0.5">{label}</p>
          {sub && <p className="text-xs text-white/40 mt-1">{sub}</p>}
        </>
      )}
    </GlassPanel>
  );
}

function SmallStat({
  loading,
  icon: Icon,
  label,
  value,
  tint = "violet",
}: {
  loading: boolean;
  icon: typeof Phone;
  label: string;
  value: number | string;
  tint?: KpiProps["tint"];
}) {
  return (
    <GlassPanel elevation="subtle" radius="md" className="p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${TINT_BG[tint]}`}>
        <Icon className={`w-4 h-4 ${TINT_TEXT[tint]}`} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        {loading ? (
          <>
            <div className="h-5 w-16 bg-white/[0.06] rounded animate-pulse mb-1" />
            <div className="h-3 w-24 bg-white/[0.04] rounded animate-pulse" />
          </>
        ) : (
          <>
            <p className="text-lg font-semibold tracking-tight text-white tabular-nums">{value}</p>
            <p className="text-xs text-white/55">{label}</p>
          </>
        )}
      </div>
    </GlassPanel>
  );
}

function SentimentBar({
  Icon,
  tint,
  label,
  count,
  total,
}: {
  Icon: typeof Smile;
  tint: "emerald" | "blue" | "amber" | "rose";
  label: string;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const fillColor: Record<typeof tint, string> = {
    emerald: "bg-emerald-400",
    blue: "bg-blue-400",
    amber: "bg-amber-400",
    rose: "bg-rose-400",
  };
  const textColor: Record<typeof tint, string> = {
    emerald: "text-emerald-300",
    blue: "text-blue-300",
    amber: "text-amber-300",
    rose: "text-rose-300",
  };
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className={`inline-flex items-center gap-1.5 ${textColor[tint]}`}>
          <Icon className="w-3.5 h-3.5" /> {label}
        </span>
        <span className="text-white/55 tabular-nums">
          {count} <span className="text-white/35">· {pct}%</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${fillColor[tint]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface DailyProps {
  daily: { date: string; calls: number; leads: number }[];
  maxValue: number;
}

function DailyChart({ daily, maxValue }: DailyProps) {
  // Show the date label every Nth bar so wide windows don't overflow.
  const stride = daily.length > 60 ? 14 : daily.length > 30 ? 7 : 3;
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1 h-40">
        {daily.map((d, i) => {
          const callPct = (d.calls / maxValue) * 100;
          const leadPct = d.calls > 0 ? (d.leads / d.calls) * callPct : 0;
          return (
            <div key={d.date} className="flex-1 flex flex-col justify-end group relative min-w-0">
              <div
                className="w-full rounded-t-sm bg-gradient-to-t from-violet-500/50 to-violet-400/70 transition-all"
                style={{ height: `${callPct}%`, minHeight: d.calls > 0 ? 2 : 0 }}
              >
                {d.leads > 0 && (
                  <div
                    className="w-full bg-gradient-to-t from-cyan-400/80 to-cyan-300 rounded-t-sm"
                    style={{ height: `${(leadPct / callPct) * 100}%` }}
                  />
                )}
              </div>
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block pointer-events-none z-10 whitespace-nowrap text-xs bg-[var(--ah-bg-raised)] border border-white/10 rounded-lg px-2 py-1 text-white/85 shadow-lg">
                <p className="font-mono tabular-nums">{d.date}</p>
                <p>
                  <span className="text-violet-300">{d.calls}</span> calls
                  {d.leads > 0 && (
                    <>
                      {" "}· <span className="text-cyan-300">{d.leads}</span> leads
                    </>
                  )}
                </p>
              </div>
              {i % stride === 0 && (
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-white/35 font-mono tabular-nums">
                  {d.date.slice(5)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
