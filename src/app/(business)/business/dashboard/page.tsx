"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, Bot, MessageSquare, ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

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

export default function BusinessDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [businesses, setBusinesses] = useState<BusinessData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/business")
      .then((res) => res.json())
      .then((data) => {
        const biz = data.businesses || [];
        setBusinesses(biz);
        // Redirect to onboarding if no business (e.g., Google OAuth first login)
        if (biz.length === 0) {
          router.replace("/business/onboarding");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const business = businesses[0];
  const agent = business?.agents[0];
  const publicUrl = business ? `${window.location.origin}/a/${business.slug}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success("Public link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass rounded-xl p-6 animate-pulse">
            <div className="h-6 w-1/3 bg-white/5 rounded mb-3" />
            <div className="h-4 w-2/3 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-(family-name:--font-heading) text-3xl font-bold text-white">
          Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}
        </h1>
        <p className="text-[#8888AA] mt-1">Manage your AI agent and business</p>
      </motion.div>

      {business && (
        <>
          {/* Business Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#00D4FF]/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-[#00D4FF]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{business.name}</h2>
                  <p className="text-sm text-[#8888AA] capitalize">{business.industry} Business</p>
                </div>
              </div>
            </div>

            {/* Public link */}
            <div className="mt-4 p-3 bg-white/[0.03] rounded-xl border border-[#2A2A3E] flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <ExternalLink className="w-4 h-4 text-[#00D4FF] shrink-0" />
                <span className="text-sm text-[#8888AA] truncate">{publicUrl}</span>
              </div>
              <div className="flex gap-2 shrink-0 ml-3">
                <Button size="sm" variant="outline" className="border-[#2A2A3E] text-white" onClick={copyLink}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
                <a
                  href={`/a/${business.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-8 px-3 text-sm rounded-md bg-[#00D4FF] text-black hover:bg-[#00D4FF]/80 transition-colors"
                >
                  Open
                </a>
              </div>
            </div>
          </motion.div>

          {/* Agent Card */}
          {agent && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#6366F1]/10 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-[#6366F1]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{agent.name}</h3>
                    <p className="text-xs text-[#8888AA] capitalize">{agent.templateType} template</p>
                  </div>
                </div>
                <span
                  className="text-xs px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: agent.isActive ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                    color: agent.isActive ? "#10B981" : "#EF4444",
                  }}
                >
                  {agent.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white/[0.03] rounded-xl p-3 text-center border border-[#2A2A3E]">
                  <MessageSquare className="w-4 h-4 mx-auto mb-1 text-[#00D4FF]" />
                  <p className="text-lg font-bold text-white">{agent._count.agentSessions}</p>
                  <p className="text-[10px] text-[#8888AA]">Total Sessions</p>
                </div>
                <Link
                  href="/dashboard"
                  className="bg-white/[0.03] rounded-xl p-3 text-center border border-[#2A2A3E] hover:bg-white/[0.06] transition-colors"
                >
                  <p className="text-sm text-[#00D4FF] font-medium">View Sessions</p>
                  <p className="text-[10px] text-[#8888AA] mt-1">Session history & analytics</p>
                </Link>
                <Link
                  href={`/a/${business.slug}`}
                  className="bg-white/[0.03] rounded-xl p-3 text-center border border-[#2A2A3E] hover:bg-white/[0.06] transition-colors"
                >
                  <p className="text-sm text-[#6366F1] font-medium">Test Agent</p>
                  <p className="text-[10px] text-[#8888AA] mt-1">Try your agent as a customer</p>
                </Link>
              </div>
            </motion.div>
          )}
        </>
      )}

      {!business && !loading && (
        <div className="text-center py-16">
          <Building2 className="w-16 h-16 text-[#8888AA]/30 mx-auto mb-4" />
          <p className="text-[#8888AA] text-lg">No business set up yet</p>
          <p className="text-[#666680] text-sm mt-1">Something went wrong during registration.</p>
        </div>
      )}
    </div>
  );
}
