"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bot, MessageSquare, BookOpen, Database, ChevronRight } from "lucide-react";
import Link from "next/link";
import { getTemplateById } from "@/lib/templates";

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
      <div className="max-w-4xl mx-auto space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="glass rounded-xl p-6 animate-pulse">
            <div className="h-6 w-1/3 bg-white/5 rounded mb-3" />
            <div className="h-4 w-2/3 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-(family-name:--font-heading) text-3xl font-bold text-white">Your Agents</h1>
        <p className="text-[#8888AA] mt-1">Configure and manage your AI agents</p>
      </motion.div>

      {business?.agents.map((agent, i) => {
        const template = getTemplateById(agent.templateType);
        return (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              href={`/business/agents/${agent.id}?bid=${agent.businessId}`}
              className="block glass rounded-2xl p-6 mb-4 hover:bg-white/[0.04] transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: `${template?.accentColor || "#6366F1"}15` }}
                  >
                    <Bot className="w-6 h-6" style={{ color: template?.accentColor || "#6366F1" }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{agent.name}</h3>
                    <p className="text-xs text-[#8888AA] capitalize">{agent.templateType} template</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#8888AA] group-hover:text-white transition-colors" />
              </div>

              <div className="flex gap-6 mt-4 text-sm text-[#8888AA]">
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
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
