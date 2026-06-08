"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2, Bot, MessageSquare, ExternalLink, Copy, Check, CreditCard, ArrowRight, PlayCircle,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GradientButton } from "@/components/ui/gradient-button";
import { GradientText } from "@/components/ui/gradient-text";

interface BusinessData {
  id: string;
  name: string;
  slug: string;
  industry: string;
  agents: {
    id: string;
    name: string;
    templateType: string;
    isActive: boolean;
    _count: { agentSessions: number };
  }[];
}

interface UsageSnapshot {
  planId: string;
  monthlyMinutes: number;
  usedMinutes: number;
  remainingMinutes: number;
  percentUsed: number;
}

export default function BusinessDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [businesses, setBusinesses] = useState<BusinessData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [usage, setUsage] = useState<UsageSnapshot | null>(null);

  useEffect(() => {
    fetch("/api/business")
      .then((res) => res.json())
      .then((data) => {
        const biz = data.businesses || [];
        setBusinesses(biz);
        if (biz.length === 0) {
          router.replace("/business/onboarding");
          return;
        }
        fetch(`/api/business/${biz[0].id}/usage`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => d?.usage && setUsage(d.usage))
          .catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const business = businesses[0];
  const agent = business?.agents[0];
  const publicUrl = business ? `${typeof window !== "undefined" ? window.location.origin : ""}/a/${business.slug}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success("Public link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-2 py-6 md:p-10 space-y-6">
        <div>
          <div className="h-3 w-16 bg-white/[0.06] rounded animate-pulse mb-3" />
          <div className="h-9 w-64 bg-white/[0.06] rounded-lg animate-pulse" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <GlassPanel key={i} elevation="subtle" radius="lg" className="p-6 md:p-7 animate-pulse">
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-white/[0.06]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 bg-white/[0.06] rounded" />
                <div className="h-3 w-1/2 bg-white/[0.06] rounded" />
              </div>
            </div>
            <div className="h-14 bg-white/[0.04] rounded-2xl" />
          </GlassPanel>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-2 py-6 md:p-10 space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/40 mb-2">Overview</p>
        <h1 className="font-serif text-4xl md:text-5xl tracking-[-0.02em] text-white">
          Welcome back{session?.user?.name ? <>, <GradientText>{session.user.name.split(" ")[0]}</GradientText></> : ""}
        </h1>
        <p className="text-white/55 mt-2 text-base">Manage your AI agent and track lead capture in real time.</p>
      </motion.div>

      {business && (
        <>
          {/* Business + public link */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.5 }}
          >
            <GlassPanel elevation="raised" radius="lg" className="p-6 md:p-7">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl ah-gradient-bg flex items-center justify-center shadow-[0_8px_24px_-8px_rgba(124,58,237,0.5)]">
                      <Building2 className="w-5 h-5 text-white" strokeWidth={2} />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight text-white">{business.name}</h2>
                    <p className="text-xs text-white/55 capitalize mt-0.5">{business.industry} business</p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <ExternalLink className="w-4 h-4 text-violet-300 shrink-0" />
                  <span className="text-sm text-white/65 truncate font-mono">{publicUrl}</span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={copyLink}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-white/75 hover:bg-white/[0.08] hover:text-white transition-all text-sm flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy
                  </button>
                  <GradientButton href={`/a/${business.slug}`} external size="sm">
                    Open <ArrowRight className="w-3.5 h-3.5" />
                  </GradientButton>
                </div>
              </div>
            </GlassPanel>
          </motion.div>

          {/* Plan + usage */}
          {usage && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <GlassPanel elevation="raised" radius="lg" className="p-6 md:p-7">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-300/20 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-violet-300" strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="font-semibold tracking-tight text-white capitalize">{usage.planId} plan</h3>
                      <p className="text-xs text-white/55">
                        <span className="text-white/85 font-medium">{usage.usedMinutes}</span>
                        {" "}of {usage.monthlyMinutes} min used this month
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/business/billing"
                    className="text-xs px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-white/75 hover:text-white hover:bg-white/[0.08] hover:border-white/20 transition-all"
                  >
                    {usage.percentUsed >= 80 ? "Upgrade" : "Manage"}
                  </Link>
                </div>
                <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, usage.percentUsed)}%` }}
                    transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full"
                    style={{
                      background:
                        usage.percentUsed >= 100
                          ? "linear-gradient(90deg, #F43F5E, #FB7185)"
                          : usage.percentUsed >= 80
                            ? "linear-gradient(90deg, #F59E0B, #FCD34D)"
                            : "linear-gradient(90deg, #7C3AED, #3B82F6, #06B6D4)",
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-white/40 tabular-nums">
                  <span>{Math.round(usage.percentUsed)}% used</span>
                  <span>{usage.remainingMinutes} min remaining</span>
                </div>
              </GlassPanel>
            </motion.div>
          )}

          {/* Agent card */}
          {agent && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              <GlassPanel elevation="raised" radius="lg" className="p-6 md:p-7">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-300/20 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-blue-300" strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="font-semibold tracking-tight text-white">{agent.name}</h3>
                      <p className="text-xs text-white/55 capitalize">{agent.templateType} template</p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                      agent.isActive
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-300/20"
                        : "bg-rose-500/15 text-rose-300 border-rose-300/20"
                    }`}
                  >
                    {agent.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl p-4 text-center bg-white/[0.03] border border-white/[0.06]">
                    <MessageSquare className="w-4 h-4 mx-auto mb-2 text-violet-300" />
                    <p className="text-2xl font-semibold tracking-tight text-white">
                      {agent._count.agentSessions}
                    </p>
                    <p className="text-xs text-white/45 mt-0.5 uppercase tracking-wider">Total sessions</p>
                  </div>
                  <Link
                    href="/business/sessions"
                    className="rounded-2xl p-4 text-center bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/12 transition-all"
                  >
                    <ArrowRight className="w-4 h-4 mx-auto mb-2 text-cyan-300" />
                    <p className="text-sm font-medium text-white">View sessions</p>
                    <p className="text-xs text-white/45 mt-0.5">History & analytics</p>
                  </Link>
                  <Link
                    href={`/a/${business.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl p-4 text-center bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/12 transition-all"
                  >
                    <PlayCircle className="w-4 h-4 mx-auto mb-2 text-blue-300" />
                    <p className="text-sm font-medium text-white">Test agent</p>
                    <p className="text-xs text-white/45 mt-0.5">Try as a caller</p>
                  </Link>
                </div>
              </GlassPanel>
            </motion.div>
          )}
        </>
      )}

      {!business && !loading && (
        <GlassPanel elevation="subtle" radius="lg" className="text-center py-16 px-6">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7 text-white/40" strokeWidth={1.5} />
          </div>
          <p className="text-white/85 text-lg">No business set up yet</p>
          <p className="text-white/45 text-sm mt-1 mb-5">Finish onboarding to bring your agent online.</p>
          <GradientButton href="/business/onboarding" size="sm">
            Start onboarding <ArrowRight className="w-3.5 h-3.5" />
          </GradientButton>
        </GlassPanel>
      )}
    </div>
  );
}
