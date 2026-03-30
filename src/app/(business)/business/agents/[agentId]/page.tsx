"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bot, Save, BookOpen, Database, MessageSquare, ArrowLeft,
  Globe, Volume2, Building2, Phone, MapPin, ChevronDown, Code,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { getTemplateById } from "@/lib/templates";
import type { AgentConfigField } from "@/types/agent";

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
  business: { id: string; slug: string; name: string; description: string | null; phone: string | null; address: string | null; website: string | null };
  _count: { agentSessions: number; knowledgeItems: number; businessData: number };
}

const LANGUAGES = [
  { code: "en", label: "English" }, { code: "hi", label: "Hindi" },
  { code: "es", label: "Spanish" }, { code: "fr", label: "French" },
  { code: "de", label: "German" }, { code: "ja", label: "Japanese" },
  { code: "zh", label: "Chinese" }, { code: "ar", label: "Arabic" },
  { code: "pt", label: "Portuguese" }, { code: "ko", label: "Korean" },
];

const VOICES = [
  { id: "Puck", label: "Puck (Energetic)" }, { id: "Charon", label: "Charon (Calm)" },
  { id: "Kore", label: "Kore (Warm)" }, { id: "Fenrir", label: "Fenrir (Deep)" },
  { id: "Aoede", label: "Aoede (Bright)" },
];

export default function AgentConfigPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const searchParams = useSearchParams();
  const businessId = searchParams.get("bid") || "";

  const [agent, setAgent] = useState<AgentFullData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Agent fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [greeting, setGreeting] = useState("");
  const [personality, setPersonality] = useState("");
  const [rules, setRules] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [language, setLanguage] = useState("en");
  const [voiceName, setVoiceName] = useState("");
  const [config, setConfig] = useState<Record<string, string | string[]>>({});

  // Business fields (editable here too)
  const [bizDescription, setBizDescription] = useState("");
  const [bizPhone, setBizPhone] = useState("");
  const [bizAddress, setBizAddress] = useState("");
  const [bizWebsite, setBizWebsite] = useState("");

  const fetchAgent = useCallback(() => {
    if (!businessId || !agentId) return;
    fetch(`/api/business/${businessId}/agents/${agentId}`)
      .then((r) => r.json())
      .then((d) => {
        const a = d.agent as AgentFullData;
        setAgent(a);
        setName(a.name);
        setDescription(a.description || "");
        setGreeting(a.greeting || "");
        setPersonality(a.personality || "");
        setRules(a.rules || "");
        setSystemPrompt(a.systemPrompt || "");
        setLanguage(a.language || "en");
        setVoiceName(a.voiceName || "");
        setConfig((a.config || {}) as Record<string, string | string[]>);
        // Business fields
        setBizDescription(a.business.description || "");
        setBizPhone(a.business.phone || "");
        setBizAddress(a.business.address || "");
        setBizWebsite(a.business.website || "");
      })
      .catch(() => toast.error("Failed to load agent"))
      .finally(() => setLoading(false));
  }, [businessId, agentId]);

  useEffect(() => { fetchAgent(); }, [fetchAgent]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save agent
      const agentRes = await fetch(`/api/business/${businessId}/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, description: description || null,
          greeting: greeting || null, personality: personality || null,
          rules: rules || null, systemPrompt: systemPrompt || null,
          language, voiceName: voiceName || null, config,
        }),
      });

      // Save business details
      const bizRes = await fetch(`/api/business/${businessId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: bizDescription || null,
          phone: bizPhone || null,
          address: bizAddress || null,
          website: bizWebsite || null,
        }),
      });

      if (!agentRes.ok || !bizRes.ok) throw new Error();
      toast.success("All changes saved!");
      fetchAgent();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (key: string, value: string | string[]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const toggleMultiSelect = (key: string, option: string) => {
    const current = (config[key] as string[]) || [];
    updateConfig(key, current.includes(option) ? current.filter((v) => v !== option) : [...current, option]);
  };

  const template = agent ? getTemplateById(agent.templateType) : null;

  // Update the agent API to include business details
  // We need to update the API to return business details too
  // For now, we fetch separately

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

  if (!agent) return <div className="text-center py-16 text-[#8888AA]">Agent not found</div>;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <Link href="/business/agents" className="flex items-center gap-1 text-sm text-[#8888AA] hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Agents
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${template?.accentColor || "#6366F1"}15` }}>
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
        <Link href={`/business/agents/${agentId}/knowledge?bid=${businessId}`} className="glass rounded-xl p-4 text-center hover:bg-white/[0.04] transition-colors">
          <BookOpen className="w-5 h-5 mx-auto mb-1 text-[#00D4FF]" />
          <p className="text-sm text-white font-medium">{agent._count.knowledgeItems}</p>
          <p className="text-[10px] text-[#8888AA]">Knowledge Items</p>
        </Link>
        <Link href={`/business/agents/${agentId}/data?bid=${businessId}`} className="glass rounded-xl p-4 text-center hover:bg-white/[0.04] transition-colors">
          <Database className="w-5 h-5 mx-auto mb-1 text-[#FFB800]" />
          <p className="text-sm text-white font-medium">{agent._count.businessData}</p>
          <p className="text-[10px] text-[#8888AA]">Data Sets</p>
        </Link>
        <Link href={`/business/agents/${agentId}/sessions?bid=${businessId}`} className="glass rounded-xl p-4 text-center hover:bg-white/[0.04] transition-colors">
          <MessageSquare className="w-5 h-5 mx-auto mb-1 text-[#6366F1]" />
          <p className="text-sm text-white font-medium">{agent._count.agentSessions}</p>
          <p className="text-[10px] text-[#8888AA]">Sessions</p>
        </Link>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

        {/* ── Section 1: Business Location & Contact ── */}
        <div className="glass rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#00D4FF]" />
            <h2 className="font-semibold text-white text-lg">Business Location & Contact</h2>
          </div>
          <p className="text-xs text-[#666680] -mt-3">Your agent will share these details when customers ask</p>

          <div>
            <Label className="text-[#8888AA]">About Your Business</Label>
            <textarea value={bizDescription} onChange={(e) => setBizDescription(e.target.value)} placeholder="e.g., A luxury 5-star hotel in the heart of Mumbai with 200 rooms and world-class dining..." rows={2} className="w-full mt-1.5 bg-white/5 border border-[#2A2A3E] rounded-lg p-3 text-sm text-white placeholder:text-[#666680] resize-none focus:outline-none focus:border-[#00D4FF]" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[#8888AA] flex items-center gap-1"><Phone className="w-3 h-3" /> Phone Number</Label>
              <Input value={bizPhone} onChange={(e) => setBizPhone(e.target.value)} placeholder="+91 98765 43210" className="mt-1.5 bg-white/5 border-[#2A2A3E] text-white" />
            </div>
            <div>
              <Label className="text-[#8888AA] flex items-center gap-1"><Globe className="w-3 h-3" /> Website</Label>
              <Input value={bizWebsite} onChange={(e) => setBizWebsite(e.target.value)} placeholder="https://www.yourhotel.com" className="mt-1.5 bg-white/5 border-[#2A2A3E] text-white" />
            </div>
          </div>

          <div>
            <Label className="text-[#8888AA] flex items-center gap-1"><MapPin className="w-3 h-3" /> Address</Label>
            <Input value={bizAddress} onChange={(e) => setBizAddress(e.target.value)} placeholder="123 Marine Drive, Mumbai, Maharashtra 400001" className="mt-1.5 bg-white/5 border-[#2A2A3E] text-white" />
          </div>
        </div>

        {/* ── Section 2: How Your Agent Talks ── */}
        <div className="glass rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-white text-lg">How Your Agent Talks</h2>

          <div>
            <Label className="text-[#8888AA]">Agent Name</Label>
            <p className="text-xs text-[#666680] mb-1">The name customers will see</p>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 bg-white/5 border-[#2A2A3E] text-white" />
          </div>

          <div>
            <Label className="text-[#8888AA]">Welcome Message</Label>
            <p className="text-xs text-[#666680] mb-1">First thing the agent says when a customer calls</p>
            <Input value={greeting} onChange={(e) => setGreeting(e.target.value)} placeholder={template?.defaultGreeting} className="mt-1 bg-white/5 border-[#2A2A3E] text-white" />
          </div>

          <div>
            <Label className="text-[#8888AA]">Tone & Style</Label>
            <p className="text-xs text-[#666680] mb-1">How should the agent sound? Formal, friendly, casual?</p>
            <textarea value={personality} onChange={(e) => setPersonality(e.target.value)} placeholder={template?.defaultPersonality} rows={2} className="w-full bg-white/5 border border-[#2A2A3E] rounded-lg p-3 text-sm text-white placeholder:text-[#666680] resize-none focus:outline-none focus:border-[#00D4FF]" />
          </div>

          <div>
            <Label className="text-[#8888AA]">Important Instructions</Label>
            <p className="text-xs text-[#666680] mb-1">Things the agent must always do or never do</p>
            <textarea value={rules} onChange={(e) => setRules(e.target.value)} placeholder={"Examples:\n- Always greet by name if the caller introduces themselves\n- Never share room prices, direct to website\n- For complaints, apologize and offer to connect with manager"} rows={4} className="w-full bg-white/5 border border-[#2A2A3E] rounded-lg p-3 text-sm text-white placeholder:text-[#666680] resize-none focus:outline-none focus:border-[#00D4FF]" />
          </div>
        </div>

        {/* ── Section 3: Template-Specific Details ── */}
        {template && template.configFields.length > 0 && (
          <div className="glass rounded-2xl p-6 space-y-5">
            <h2 className="font-semibold text-white text-lg capitalize">{agent.templateType} Details</h2>
            <p className="text-xs text-[#666680] -mt-3">Specific information about your {agent.templateType} business</p>

            {template.configFields.map((field: AgentConfigField) => (
              <div key={field.id}>
                <Label className="text-[#8888AA]">{field.label}</Label>

                {field.type === "text" && (
                  <Input value={(config[field.id] as string) || ""} onChange={(e) => updateConfig(field.id, e.target.value)} placeholder={typeof field.defaultValue === "string" ? field.defaultValue : `Enter ${field.label.toLowerCase()}`} className="mt-1.5 bg-white/5 border-[#2A2A3E] text-white" />
                )}

                {field.type === "select" && field.options && (
                  <select value={(config[field.id] as string) || ""} onChange={(e) => updateConfig(field.id, e.target.value)} className="mt-1.5 w-full h-10 bg-white/5 border border-[#2A2A3E] rounded-lg px-3 text-sm text-white focus:outline-none focus:border-[#00D4FF]">
                    <option value="" className="bg-[#1A1A2E]">Select {field.label.toLowerCase()}</option>
                    {field.options.map((opt) => <option key={opt} value={opt} className="bg-[#1A1A2E]">{opt}</option>)}
                  </select>
                )}

                {field.type === "multi-select" && field.options && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {field.options.map((opt) => {
                      const selected = ((config[field.id] as string[]) || []).includes(opt);
                      return (
                        <button key={opt} type="button" onClick={() => toggleMultiSelect(field.id, opt)} className="px-3 py-1.5 rounded-lg text-sm transition-all" style={{ backgroundColor: selected ? `${template.accentColor}20` : "rgba(255,255,255,0.05)", color: selected ? template.accentColor : "#8888AA", borderWidth: "1px", borderColor: selected ? `${template.accentColor}40` : "transparent" }}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Section 4: Voice & Language ── */}
        <div className="glass rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-[#FFB800]" />
            <h2 className="font-semibold text-white text-lg">Voice & Language</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[#8888AA]">Language</Label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="mt-1.5 w-full h-10 bg-white/5 border border-[#2A2A3E] rounded-lg px-3 text-sm text-white focus:outline-none focus:border-[#00D4FF]">
                {LANGUAGES.map((l) => <option key={l.code} value={l.code} className="bg-[#1A1A2E]">{l.label}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-[#8888AA]">Voice Style</Label>
              <select value={voiceName} onChange={(e) => setVoiceName(e.target.value)} className="mt-1.5 w-full h-10 bg-white/5 border border-[#2A2A3E] rounded-lg px-3 text-sm text-white focus:outline-none focus:border-[#00D4FF]">
                <option value="" className="bg-[#1A1A2E]">Default</option>
                {VOICES.map((v) => <option key={v.id} value={v.id} className="bg-[#1A1A2E]">{v.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── Section 5: Developer Mode (collapsed) ── */}
        <div className="glass rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-[#8888AA]" />
              <span className="text-sm text-[#8888AA]">Developer Mode</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-[#8888AA] transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
          </button>

          {showAdvanced && (
            <div className="px-6 pb-6 space-y-4">
              <div>
                <Label className="text-[#8888AA]">Custom System Prompt</Label>
                <p className="text-xs text-[#666680] mb-1">
                  Override the auto-generated AI instructions. Leave empty to use your settings above.
                  This is the raw instruction text sent to the AI model.
                </p>
                <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} placeholder="Leave empty — your agent&apos;s prompt is automatically built from your business details, tone, rules, and knowledge base above." rows={8} className="w-full bg-black/30 border border-[#2A2A3E] rounded-lg p-3 text-sm text-white font-mono placeholder:text-[#666680] resize-none focus:outline-none focus:border-[#00D4FF]" />
              </div>
              <div>
                <Label className="text-[#8888AA]">Agent Description</Label>
                <p className="text-xs text-[#666680] mb-1">Internal description (not shown to customers)</p>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Handles booking inquiries and room service" className="bg-white/5 border-[#2A2A3E] text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Save */}
        <div className="flex justify-end pb-8">
          <Button onClick={handleSave} disabled={saving} className="px-8 bg-linear-to-r from-[#00D4FF] to-[#6366F1] text-white border-0 hover:opacity-90">
            {saving ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save All Changes</>}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
