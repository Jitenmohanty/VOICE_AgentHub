"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Bot, Save, BookOpen, Database, MessageSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { getTemplateById } from "@/lib/templates";

interface AgentFullData {
  id: string;
  name: string;
  description: string | null;
  templateType: string;
  isActive: boolean;
  systemPrompt: string | null;
  greeting: string | null;
  personality: string | null;
  rules: string | null;
  config: Record<string, unknown>;
  enabledTools: string[];
  voiceName: string | null;
  language: string;
  business: { slug: string; name: string };
  _count: { agentSessions: number; knowledgeItems: number; businessData: number };
}

export default function AgentConfigPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const searchParams = useSearchParams();
  const businessId = searchParams.get("bid") || "";

  const [agent, setAgent] = useState<AgentFullData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState("");
  const [greeting, setGreeting] = useState("");
  const [personality, setPersonality] = useState("");
  const [rules, setRules] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");

  const fetchAgent = useCallback(() => {
    if (!businessId || !agentId) return;
    fetch(`/api/business/${businessId}/agents/${agentId}`)
      .then((r) => r.json())
      .then((d) => {
        const a = d.agent as AgentFullData;
        setAgent(a);
        setName(a.name);
        setGreeting(a.greeting || "");
        setPersonality(a.personality || "");
        setRules(a.rules || "");
        setSystemPrompt(a.systemPrompt || "");
      })
      .catch(() => toast.error("Failed to load agent"))
      .finally(() => setLoading(false));
  }, [businessId, agentId]);

  useEffect(() => { fetchAgent(); }, [fetchAgent]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/business/${businessId}/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          greeting: greeting || null,
          personality: personality || null,
          rules: rules || null,
          systemPrompt: systemPrompt || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Agent updated!");
      fetchAgent();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const template = agent ? getTemplateById(agent.templateType) : null;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass rounded-xl p-6 animate-pulse">
            <div className="h-5 w-1/4 bg-white/5 rounded mb-3" />
            <div className="h-10 w-full bg-white/5 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!agent) {
    return <div className="text-center py-16 text-[#8888AA]">Agent not found</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <Link href="/business/agents" className="flex items-center gap-1 text-sm text-[#8888AA] hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Agents
        </Link>
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: `${template?.accentColor || "#6366F1"}15` }}
          >
            <Bot className="w-6 h-6" style={{ color: template?.accentColor || "#6366F1" }} />
          </div>
          <div>
            <h1 className="font-(family-name:--font-heading) text-2xl font-bold text-white">{agent.name}</h1>
            <p className="text-sm text-[#8888AA] capitalize">{agent.templateType} template</p>
          </div>
        </div>
      </motion.div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <Link
          href={`/business/agents/${agentId}/knowledge?bid=${businessId}`}
          className="glass rounded-xl p-4 text-center hover:bg-white/[0.04] transition-colors"
        >
          <BookOpen className="w-5 h-5 mx-auto mb-1 text-[#00D4FF]" />
          <p className="text-sm text-white font-medium">{agent._count.knowledgeItems}</p>
          <p className="text-[10px] text-[#8888AA]">Knowledge Items</p>
        </Link>
        <Link
          href={`/business/agents/${agentId}/data?bid=${businessId}`}
          className="glass rounded-xl p-4 text-center hover:bg-white/[0.04] transition-colors"
        >
          <Database className="w-5 h-5 mx-auto mb-1 text-[#FFB800]" />
          <p className="text-sm text-white font-medium">{agent._count.businessData}</p>
          <p className="text-[10px] text-[#8888AA]">Data Sets</p>
        </Link>
        <Link
          href={`/business/agents/${agentId}/sessions?bid=${businessId}`}
          className="glass rounded-xl p-4 text-center hover:bg-white/[0.04] transition-colors"
        >
          <MessageSquare className="w-5 h-5 mx-auto mb-1 text-[#6366F1]" />
          <p className="text-sm text-white font-medium">{agent._count.agentSessions}</p>
          <p className="text-[10px] text-[#8888AA]">Sessions</p>
        </Link>
      </div>

      {/* Config form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="glass rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-white text-lg">Agent Configuration</h2>

          <div>
            <Label className="text-[#8888AA]">Agent Name</Label>
            <Input
              value={name} onChange={(e) => setName(e.target.value)}
              className="mt-1.5 bg-white/5 border-[#2A2A3E] text-white"
            />
          </div>

          <div>
            <Label className="text-[#8888AA]">Greeting Message</Label>
            <p className="text-xs text-[#666680] mb-1">What the agent says first when a customer connects</p>
            <Input
              value={greeting} onChange={(e) => setGreeting(e.target.value)}
              placeholder={template?.defaultGreeting}
              className="mt-1 bg-white/5 border-[#2A2A3E] text-white"
            />
          </div>

          <div>
            <Label className="text-[#8888AA]">Personality & Tone</Label>
            <p className="text-xs text-[#666680] mb-1">Describe how the agent should talk</p>
            <textarea
              value={personality} onChange={(e) => setPersonality(e.target.value)}
              placeholder={template?.defaultPersonality}
              rows={3}
              className="w-full bg-white/5 border border-[#2A2A3E] rounded-lg p-3 text-sm text-white placeholder:text-[#666680] resize-none focus:outline-none focus:border-[#00D4FF]"
            />
          </div>

          <div>
            <Label className="text-[#8888AA]">Custom Rules</Label>
            <p className="text-xs text-[#666680] mb-1">Specific instructions the agent must follow (e.g., &quot;Never discuss pricing over phone&quot;)</p>
            <textarea
              value={rules} onChange={(e) => setRules(e.target.value)}
              placeholder="e.g., Always confirm the customer's name before proceeding..."
              rows={4}
              className="w-full bg-white/5 border border-[#2A2A3E] rounded-lg p-3 text-sm text-white placeholder:text-[#666680] resize-none focus:outline-none focus:border-[#00D4FF]"
            />
          </div>

          <div>
            <Label className="text-[#8888AA]">System Prompt Override (Advanced)</Label>
            <p className="text-xs text-[#666680] mb-1">Leave empty to use the auto-generated prompt from your template + settings above</p>
            <textarea
              value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Leave empty for auto-generated prompt..."
              rows={6}
              className="w-full bg-white/5 border border-[#2A2A3E] rounded-lg p-3 text-sm text-white font-mono placeholder:text-[#666680] resize-none focus:outline-none focus:border-[#00D4FF]"
            />
          </div>

          <Button
            onClick={handleSave} disabled={saving}
            className="bg-linear-to-r from-[#00D4FF] to-[#6366F1] text-white border-0 hover:opacity-90"
          >
            {saving ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
