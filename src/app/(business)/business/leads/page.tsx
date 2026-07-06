"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Inbox,
  Download,
  Search,
  Phone,
  Mail,
  Sparkles,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Flame,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GradientButton } from "@/components/ui/gradient-button";
import { SessionDetailModal } from "@/components/dashboard/SessionDetailModal";
import { formatIST } from "@/lib/format-date";
import { toast } from "sonner";

type LeadStatus = "new" | "contacted" | "qualified" | "won" | "lost" | "archived";

interface CapturedLead {
  name?: string;
  phone?: string;
  email?: string;
  intent: string;
  urgency?: "low" | "medium" | "high";
  notes?: string;
  capturedAt?: string;
}

interface LeadRow {
  id: string;
  createdAt: string;
  duration: number | null;
  status: string;
  leadStatus: LeadStatus;
  callerName: string | null;
  callerPhone: string | null;
  callerEmail: string | null;
  capturedLead: CapturedLead | null;
  summary: string | null;
  sentiment: string | null;
  leadScore: number | null;
  intentCategory: string | null;
  agent: { id: string; name: string; templateType: string } | null;
}

interface LeadsResponse {
  leads: LeadRow[];
  total: number;
  page: number;
  totalPages: number;
  counts: Record<string, number>;
}

interface BusinessInfo {
  id: string;
  slug: string;
  agents: { id: string; name: string }[];
}

const STATUS_TABS: { value: LeadStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "archived", label: "Archived" },
];

const STATUS_PILL: Record<LeadStatus, string> = {
  new: "bg-violet-500/15 text-violet-300 border-violet-300/25",
  contacted: "bg-blue-500/15 text-blue-300 border-blue-300/25",
  qualified: "bg-amber-500/15 text-amber-300 border-amber-300/25",
  won: "bg-emerald-500/15 text-emerald-300 border-emerald-300/25",
  lost: "bg-rose-500/15 text-rose-300 border-rose-300/25",
  archived: "bg-white/[0.06] text-white/55 border-white/15",
};

const URGENCY_PILL: Record<NonNullable<CapturedLead["urgency"]>, string> = {
  low: "bg-white/[0.04] text-white/55 border-white/10",
  medium: "bg-amber-500/10 text-amber-300 border-amber-300/20",
  high: "bg-rose-500/15 text-rose-300 border-rose-300/30",
};

/** Pill styling for the AI lead score, by heat tier. */
function scorePillClass(score: number): string {
  if (score >= 70) return "bg-orange-500/15 text-orange-300 border-orange-300/30";
  if (score >= 40) return "bg-amber-500/10 text-amber-300 border-amber-300/20";
  return "bg-white/[0.04] text-white/55 border-white/10";
}

export default function LeadsPage() {
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [bootLoading, setBootLoading] = useState(true);

  const [status, setStatus] = useState<LeadStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [agentId, setAgentId] = useState<string>("");
  const [sort, setSort] = useState<"recent" | "score">("recent");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<LeadsResponse | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Load the business once, then drive everything else off it.
  useEffect(() => {
    fetch("/api/business")
      .then((r) => r.json())
      .then((d) => setBusiness(d.businesses?.[0] || null))
      .catch(() => {})
      .finally(() => setBootLoading(false));
  }, []);

  const fetchLeads = useCallback(
    (opts: { silent?: boolean } = {}) => {
      if (!business) return;
      if (!opts.silent) setListLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (status !== "all") params.set("status", status);
      if (agentId) params.set("agentId", agentId);
      if (search.trim()) params.set("search", search.trim());
      if (sort !== "recent") params.set("sort", sort);
      fetch(`/api/business/${business.id}/leads?${params.toString()}`)
        .then((r) => r.json())
        .then((d: LeadsResponse) => setData(d))
        .catch(() => toast.error("Couldn't load leads"))
        .finally(() => setListLoading(false));
    },
    [business, page, status, agentId, search, sort],
  );

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Re-fetch after closing the modal, in case the status was changed inside it.
  const handleCloseModal = () => {
    setSelectedId(null);
    fetchLeads({ silent: true });
  };

  // Debounce search a touch so we don't hammer the API while typing.
  useEffect(() => {
    setPage(1);
  }, [search, status, agentId, sort]);

  const handleExport = async () => {
    if (!business) return;
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      const res = await fetch(`/api/business/${business.id}/leads/export?${params.toString()}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `voxie-leads-${business.slug}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      const rows = res.headers.get("X-Total-Rows");
      toast.success(rows ? `Exported ${rows} leads` : "Export ready");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const counts = data?.counts;
  const totalAll = counts?.all ?? 0;

  const agentOptions = useMemo(() => business?.agents ?? [], [business]);

  if (bootLoading) {
    return (
      <div className="max-w-5xl mx-auto px-2 py-6 md:p-10 space-y-6">
        <div>
          <div className="h-3 w-12 bg-white/[0.06] rounded animate-pulse mb-3" />
          <div className="h-9 w-32 bg-white/[0.06] rounded-lg animate-pulse" />
        </div>
        <GlassPanel elevation="subtle" radius="lg" className="p-6 animate-pulse">
          <div className="h-10 bg-white/[0.04] rounded-xl" />
        </GlassPanel>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="max-w-5xl mx-auto px-2 py-6 md:p-10">
        <GlassPanel elevation="subtle" radius="lg" className="text-center py-16 px-6">
          <Inbox className="w-12 h-12 text-white/15 mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-white/65">No business yet</p>
          <p className="text-white/45 text-sm mt-1">Finish onboarding first.</p>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-2 py-6 md:p-10 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/40 mb-2">Pipeline</p>
          <h1 className="font-serif text-4xl md:text-5xl tracking-[-0.02em] text-white">Leads</h1>
          <p className="text-base text-white/55 mt-2">
            Every caller who left a lead, ready to action.
            {totalAll > 0 && <span className="ml-2 text-white/40">· {totalAll} total</span>}
          </p>
        </div>
        <GradientButton
          onClick={handleExport}
          disabled={exporting || totalAll === 0}
          variant="outline"
          size="default"
        >
          {exporting ? (
            <>
              <span className="ah-spinner" /> Exporting…
            </>
          ) : (
            <>
              <Download className="w-4 h-4" /> Export CSV
            </>
          )}
        </GradientButton>
      </motion.div>

      {/* Filter bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
      >
        <GlassPanel elevation="subtle" radius="lg" className="p-4 space-y-3">
          {/* Status tabs */}
          <div className="flex flex-wrap gap-1.5">
            {STATUS_TABS.map((tab) => {
              const count = tab.value === "all" ? counts?.all : counts?.[tab.value];
              const active = status === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setStatus(tab.value)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-xl border transition-all ah-focus-ring ${
                    active
                      ? "bg-gradient-to-br from-violet-500/20 to-cyan-500/15 border-violet-300/40 text-white shadow-[0_0_16px_-6px_rgba(124,58,237,0.4)]"
                      : "bg-white/[0.03] border-white/10 text-white/65 hover:bg-white/[0.06] hover:text-white hover:border-white/15"
                  }`}
                >
                  {tab.label}
                  {count !== undefined && count > 0 && (
                    <span className={`ml-1.5 tabular-nums ${active ? "text-white/85" : "text-white/40"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search + agent filter */}
          <div className="flex gap-2.5 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone, email, or summary…"
                className="pl-9"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {agentOptions.length > 1 && (
              <select
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="h-10 bg-white/[0.04] border border-white/10 rounded-xl px-3 text-sm text-white outline-none transition-[border-color,box-shadow,background-color] duration-200 hover:bg-white/[0.06] hover:border-white/14 focus-visible:border-violet-300/55 focus-visible:bg-white/[0.06] focus-visible:shadow-[0_0_0_3px_rgba(124,58,237,0.18)]"
              >
                <option value="" className="bg-[var(--ah-bg-raised)]">All agents</option>
                {agentOptions.map((a) => (
                  <option key={a.id} value={a.id} className="bg-[var(--ah-bg-raised)]">
                    {a.name}
                  </option>
                ))}
              </select>
            )}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "recent" | "score")}
              className="h-10 bg-white/[0.04] border border-white/10 rounded-xl px-3 text-sm text-white outline-none transition-[border-color,box-shadow,background-color] duration-200 hover:bg-white/[0.06] hover:border-white/14 focus-visible:border-violet-300/55 focus-visible:bg-white/[0.06] focus-visible:shadow-[0_0_0_3px_rgba(124,58,237,0.18)]"
              aria-label="Sort leads"
            >
              <option value="recent" className="bg-[var(--ah-bg-raised)]">Newest first</option>
              <option value="score" className="bg-[var(--ah-bg-raised)]">Hot leads first</option>
            </select>
          </div>
        </GlassPanel>
      </motion.div>

      {/* List */}
      {listLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <GlassPanel key={i} elevation="subtle" radius="md" className="p-5 animate-pulse">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-white/[0.06] rounded" />
                  <div className="h-3 w-1/2 bg-white/[0.04] rounded" />
                  <div className="h-3 w-2/3 bg-white/[0.04] rounded" />
                </div>
                <div className="h-6 w-16 bg-white/[0.04] rounded-full" />
              </div>
            </GlassPanel>
          ))}
        </div>
      ) : !data || data.leads.length === 0 ? (
        <GlassPanel elevation="subtle" radius="lg" className="text-center py-16 px-6">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-7 h-7 text-white/40" strokeWidth={1.5} />
          </div>
          <p className="text-white/85 text-lg">
            {status === "all" && !search && !agentId
              ? "No leads yet"
              : "No leads match this filter"}
          </p>
          <p className="text-white/45 text-sm mt-1 mb-5 max-w-sm mx-auto">
            {status === "all" && !search && !agentId
              ? "Share your agent link — every captured lead lands here."
              : "Try a different status, agent, or search term."}
          </p>
          {status === "all" && !search && !agentId && (
            <GradientButton href={`/a/${business.slug}`} external size="sm">
              Open your agent
            </GradientButton>
          )}
        </GlassPanel>
      ) : (
        <>
          <AnimatePresence>
            <div className="space-y-3">
              {data.leads.map((lead, i) => {
                const captured = lead.capturedLead;
                const displayName =
                  captured?.name ||
                  lead.callerName ||
                  captured?.phone ||
                  captured?.email ||
                  "Anonymous caller";
                return (
                  <motion.div
                    key={lead.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                    onClick={() => setSelectedId(lead.id)}
                  >
                    <GlassPanel
                      elevation="subtle"
                      interactive
                      radius="md"
                      className="p-5 cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                            <h3 className="font-semibold text-white tracking-tight truncate">
                              {displayName}
                            </h3>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium border capitalize ${
                                STATUS_PILL[lead.leadStatus]
                              }`}
                            >
                              {lead.leadStatus}
                            </span>
                            {captured?.urgency && (
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium border capitalize inline-flex items-center gap-1 ${
                                  URGENCY_PILL[captured.urgency]
                                }`}
                              >
                                {captured.urgency === "high" && <AlertCircle className="w-2.5 h-2.5" />}
                                {captured.urgency}
                              </span>
                            )}
                            {lead.leadScore != null && (
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium border inline-flex items-center gap-1 tabular-nums ${scorePillClass(
                                  lead.leadScore,
                                )}`}
                                title="AI lead score (0–100)"
                              >
                                <Flame className="w-2.5 h-2.5" />
                                {lead.leadScore}
                              </span>
                            )}
                            {lead.intentCategory && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium border capitalize bg-cyan-500/10 text-cyan-300 border-cyan-300/20">
                                {lead.intentCategory}
                              </span>
                            )}
                          </div>

                          {/* Contact line */}
                          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-white/55 mb-2">
                            {(captured?.phone || lead.callerPhone) && (
                              <span className="flex items-center gap-1 font-mono">
                                <Phone className="w-3 h-3" />
                                {captured?.phone || lead.callerPhone}
                              </span>
                            )}
                            {(captured?.email || lead.callerEmail) && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {captured?.email || lead.callerEmail}
                              </span>
                            )}
                          </div>

                          {/* Intent / notes */}
                          {captured?.intent && (
                            <p className="text-sm text-white/75 line-clamp-2 mb-1.5">
                              <Sparkles className="w-3 h-3 text-violet-300 inline mr-1.5 -translate-y-px" />
                              {captured.intent}
                            </p>
                          )}
                          {captured?.notes && captured.notes !== captured.intent && (
                            <p className="text-xs text-white/45 line-clamp-1">{captured.notes}</p>
                          )}

                          {/* Footer meta */}
                          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-3 text-xs text-white/40">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatIST(lead.createdAt)}
                            </span>
                            {lead.agent?.name && (
                              <span className="text-white/40">via {lead.agent.name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </GlassPanel>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-sm text-white/75 disabled:opacity-30 disabled:cursor-not-allowed transition-all ah-focus-ring"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <span className="text-xs text-white/55 tabular-nums">
                Page {page} of {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-sm text-white/75 disabled:opacity-30 disabled:cursor-not-allowed transition-all ah-focus-ring"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {selectedId && <SessionDetailModal sessionId={selectedId} onClose={handleCloseModal} />}
    </div>
  );
}
