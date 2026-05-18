"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bot, MessageSquare, BookOpen, Database, ChevronRight } from "lucide-react";
import Link from "next/link";
import { GlassPanel } from "@/components/ui/glass-panel";

interface AgentData {
  id: string;
  name: string;
  templateType: string;
  isActive: boolean;
  businessId: string;
  greeting: string | null;
  _count: { agentSessions: number; knowledgeItems: number; businessData: number };
}

interface BusinessData {
  id: string;
  agents: AgentData[];
}

export default function AgentsPage() {
  const [businesses, setBusinesses] = useState<BusinessData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/business")
      .then((r) => r.json())
      .then((d) => setBusinesses(d.businesses || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const business = businesses[0];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-2 py-6 md:p-10 space-y-6">
        <div>
          <div className="h-3 w-16 bg-white/[0.06] rounded animate-pulse mb-3" />
          <div className="h-9 w-48 bg-white/[0.06] rounded-lg animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <GlassPanel key={i} elevation="subtle" radius="lg" className="p-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.06]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-white/[0.06] rounded" />
                  <div className="h-3 w-1/4 bg-white/[0.06] rounded" />
                </div>
              </div>
              <div className="flex gap-5 mt-5">
                <div className="h-3 w-20 bg-white/[0.04] rounded" />
                <div className="h-3 w-24 bg-white/[0.04] rounded" />
                <div className="h-3 w-20 bg-white/[0.04] rounded" />
              </div>
            </GlassPanel>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-2 py-6 md:p-10">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/40 mb-2">Agents</p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-white">Your agents</h1>
        <p className="text-sm text-white/55 mt-1.5">Configure, deploy, and manage your AI voice agents.</p>
      </motion.div>

      <div className="space-y-4">
        {business?.agents.map((agent, i) => {
          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
            >
              <Link href={`/business/agents/${agent.id}?bid=${agent.businessId}`} className="block group">
                <GlassPanel elevation="raised" interactive radius="lg" className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl ah-gradient-bg flex items-center justify-center shadow-[0_4px_16px_-4px_rgba(124,58,237,0.5)]">
                        <Bot className="w-5 h-5 text-white" strokeWidth={2} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white tracking-tight">{agent.name}</h3>
                        <p className="text-xs text-white/55 capitalize mt-0.5">{agent.templateType} template</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </div>

                  <div className="flex flex-wrap gap-x-5 gap-y-2 mt-5 text-xs text-white/55">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" /> {agent._count.agentSessions} sessions
                    </span>
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> {agent._count.knowledgeItems} knowledge items
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5" /> {agent._count.businessData} data sets
                    </span>
                  </div>
                </GlassPanel>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
