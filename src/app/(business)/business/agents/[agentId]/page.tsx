"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bot, Save, BookOpen, Database, MessageSquare, ArrowLeft,
  Globe, Volume2, Building2, Phone, MapPin, ChevronDown, Code,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GradientButton } from "@/components/ui/gradient-button";
import { toast } from "sonner";
import Link from "next/link";
import { getTemplateById } from "@/lib/templates";
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE_CODE, normalizeLanguage } from "@/lib/languages";
import { MenuBuilder } from "@/components/business/MenuBuilder";
import { DoctorRoster } from "@/components/business/DoctorRoster";
import { EmbedInstallCard } from "@/components/business/EmbedInstallCard";
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

// Language list lives in src/lib/languages.ts — single source of truth shared
// with the caller-side picker and Gemini Live's speechConfig.languageCode.
const LANGUAGES = SUPPORTED_LANGUAGES;

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
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE_CODE);
  const [voiceName, setVoiceName] = useState("");
  const [config, setConfig] = useState<Record<string, string | string[] | number | boolean>>({});

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
        setLanguage(normalizeLanguage(a.language));
        setVoiceName(a.voiceName || "");
        setConfig((a.config || {}) as Record<string, string | string[] | number | boolean>);
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

  const updateConfig = (key: string, value: string | string[] | number | boolean) => {
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
      <div className="max-w-3xl mx-auto p-6 md:p-10 space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-raised rounded-3xl p-7 animate-pulse">
            <div className="h-5 w-1/4 bg-white/[0.06] rounded mb-3" />
            <div className="h-10 w-full bg-white/[0.06] rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!agent) return <div className="text-center py-16 text-white/55">Agent not found</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <Link href="/business/agents" className="inline-flex items-center gap-1.5 text-sm text-white/55 hover:text-white mb-5 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to agents
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl ah-gradient-bg flex items-center justify-center shadow-[0_8px_24px_-8px_rgba(124,58,237,0.5)]">
            <Bot className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] text-white">{agent.name}</h1>
            <p className="text-xs text-white/55 capitalize mt-0.5">{agent.templateType} template</p>
          </div>
        </div>
      </motion.div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <Link
          href={`/business/agents/${agentId}/knowledge?bid=${businessId}`}
          className="glass rounded-2xl p-4 text-center hover:bg-white/[0.07] transition-all"
        >
          <BookOpen className="w-4 h-4 mx-auto mb-1.5 text-violet-300" />
          <p className="text-lg font-semibold tracking-tight text-white tabular-nums">{agent._count.knowledgeItems}</p>
          <p className="text-[10px] text-white/45 uppercase tracking-wider mt-0.5">Knowledge</p>
        </Link>
        <Link
          href={`/business/agents/${agentId}/data?bid=${businessId}`}
          className="glass rounded-2xl p-4 text-center hover:bg-white/[0.07] transition-all"
        >
          <Database className="w-4 h-4 mx-auto mb-1.5 text-cyan-300" />
          <p className="text-lg font-semibold tracking-tight text-white tabular-nums">{agent._count.businessData}</p>
          <p className="text-[10px] text-white/45 uppercase tracking-wider mt-0.5">Data sets</p>
        </Link>
        <Link
          href={`/business/agents/${agentId}/sessions?bid=${businessId}`}
          className="glass rounded-2xl p-4 text-center hover:bg-white/[0.07] transition-all"
        >
          <MessageSquare className="w-4 h-4 mx-auto mb-1.5 text-blue-300" />
          <p className="text-lg font-semibold tracking-tight text-white tabular-nums">{agent._count.agentSessions}</p>
          <p className="text-[10px] text-white/45 uppercase tracking-wider mt-0.5">Sessions</p>
        </Link>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

        {/* ── Section 0: Install on customer's website ── */}
        <EmbedInstallCard slug={agent.business.slug} accentColor={template?.accentColor} />

        {/* ── Section 1: Business Location & Contact ── */}
        <div className="glass-raised rounded-3xl p-7 space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-300/20 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-violet-300" strokeWidth={2} />
            </div>
            <h2 className="font-semibold text-white text-lg tracking-tight">Business Location & Contact</h2>
          </div>
          <p className="text-xs text-white/40 -mt-3">Your agent will share these details when customers ask</p>

          <div>
            <Label>About Your Business</Label>
            <Textarea value={bizDescription} onChange={(e) => setBizDescription(e.target.value)} placeholder="e.g., A luxury 5-star hotel in the heart of Mumbai with 200 rooms and world-class dining..." rows={2} className="mt-1.5" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="gap-1"><Phone className="w-3 h-3" /> Phone Number</Label>
              <Input value={bizPhone} onChange={(e) => setBizPhone(e.target.value)} placeholder="+91 98765 43210" className="mt-1.5" />
            </div>
            <div>
              <Label className="gap-1"><Globe className="w-3 h-3" /> Website</Label>
              <Input value={bizWebsite} onChange={(e) => setBizWebsite(e.target.value)} placeholder="https://www.yourhotel.com" className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label className="gap-1"><MapPin className="w-3 h-3" /> Address</Label>
            <Input value={bizAddress} onChange={(e) => setBizAddress(e.target.value)} placeholder="123 Marine Drive, Mumbai, Maharashtra 400001" className="mt-1.5" />
          </div>
        </div>

        {/* ── Section 2: How Your Agent Talks ── */}
        <div className="glass-raised rounded-3xl p-7 space-y-5">
          <h2 className="font-semibold text-white text-lg tracking-tight">How Your Agent Talks</h2>

          <div>
            <Label>Agent Name</Label>
            <p className="text-xs text-white/40 mb-1">The name customers will see</p>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
          </div>

          <div>
            <Label>Welcome Message</Label>
            <p className="text-xs text-white/40 mb-1">First thing the agent says when a customer calls</p>
            <Input value={greeting} onChange={(e) => setGreeting(e.target.value)} placeholder={template?.defaultGreeting} className="mt-1.5" />
          </div>

          <div>
            <Label>Tone & Style</Label>
            <p className="text-xs text-white/40 mb-1">How should the agent sound? Formal, friendly, casual?</p>
            <Textarea value={personality} onChange={(e) => setPersonality(e.target.value)} placeholder={template?.defaultPersonality} rows={2} className="mt-1.5" />
          </div>

          <div>
            <Label>Important Instructions</Label>
            <p className="text-xs text-white/40 mb-1">Things the agent must always do or never do</p>
            <Textarea value={rules} onChange={(e) => setRules(e.target.value)} placeholder={"Examples:\n- Always greet by name if the caller introduces themselves\n- Never share room prices, direct to website\n- For complaints, apologize and offer to connect with manager"} rows={4} className="mt-1.5" />
          </div>
        </div>

        {/* ── Section 3: Template-Specific Details ── */}
        {template && template.configFields.length > 0 && (
          <div className="glass-raised rounded-3xl p-7 space-y-5">
            <h2 className="font-semibold text-white text-lg tracking-tight capitalize">{agent.templateType} Details</h2>
            <p className="text-xs text-white/40 -mt-3">Specific information about your {agent.templateType} business</p>

            {(() => {
              const sections: { name: string; fields: AgentConfigField[] }[] = [];
              for (const field of template.configFields) {
                const sectionName = field.section || "Details";
                let section = sections.find((s) => s.name === sectionName);
                if (!section) { section = { name: sectionName, fields: [] }; sections.push(section); }
                section.fields.push(field);
              }
              return sections.map((section) => (
                <div key={section.name} className="space-y-4">
                  <p className="text-xs font-medium text-white/40 uppercase tracking-wider pt-2 border-t border-white/[0.06]">{section.name}</p>
                  {section.fields.map((field: AgentConfigField) => (
                    <div key={field.id}>
                      <Label>{field.label}</Label>
                      {field.description && <p className="text-xs text-white/40 mt-0.5">{field.description}</p>}

                      {field.type === "text" && (
                        <Input value={(config[field.id] as string) || ""} onChange={(e) => updateConfig(field.id, e.target.value)} placeholder={field.placeholder || (typeof field.defaultValue === "string" ? field.defaultValue : `Enter ${field.label.toLowerCase()}`)} className="mt-1.5" />
                      )}

                      {field.type === "number" && (
                        <Input type="number" value={config[field.id] !== undefined ? String(config[field.id]) : ""} onChange={(e) => updateConfig(field.id, e.target.value === "" ? 0 : Number(e.target.value))} min={field.min} max={field.max} className="mt-1.5 w-32" />
                      )}

                      {field.type === "time" && (
                        <Input type="time" value={(config[field.id] as string) || ""} onChange={(e) => updateConfig(field.id, e.target.value)} className="mt-1.5 w-40" />
                      )}

                      {field.type === "textarea" && (
                        <Textarea value={(config[field.id] as string) || ""} onChange={(e) => updateConfig(field.id, e.target.value)} placeholder={field.placeholder || ""} rows={3} className="mt-1.5" />
                      )}

                      {field.type === "toggle" && (
                        <button
                          type="button"
                          onClick={() => updateConfig(field.id, !config[field.id])}
                          className="mt-2 flex items-center gap-2.5"
                        >
                          <div className={`w-11 h-6 rounded-full transition-all relative border ${config[field.id] ? "ah-gradient-bg border-violet-300/40 shadow-[0_0_16px_-4px_rgba(124,58,237,0.5)]" : "bg-white/[0.06] border-white/10"}`}>
                            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${config[field.id] ? "translate-x-5" : "translate-x-0.5"}`} />
                          </div>
                          <span className="text-sm text-white/65">{config[field.id] ? "Yes" : "No"}</span>
                        </button>
                      )}

                      {field.type === "select" && field.options && (
                        <select value={(config[field.id] as string) || ""} onChange={(e) => updateConfig(field.id, e.target.value)} className="mt-1.5 w-full h-10 bg-white/[0.04] border border-white/10 rounded-xl px-3 text-sm text-white outline-none transition-[border-color,box-shadow,background-color] duration-200 hover:bg-white/[0.06] hover:border-white/14 focus-visible:border-violet-300/55 focus-visible:bg-white/[0.06] focus-visible:shadow-[0_0_0_3px_rgba(124,58,237,0.18)]">
                          <option value="" className="bg-[var(--ah-bg-raised)]">Select {field.label.toLowerCase()}</option>
                          {field.options.map((opt) => <option key={opt} value={opt} className="bg-[var(--ah-bg-raised)]">{opt}</option>)}
                        </select>
                      )}

                      {field.type === "multi-select" && field.options && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {field.options.map((opt) => {
                            const selected = ((config[field.id] as string[]) || []).includes(opt);
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => toggleMultiSelect(field.id, opt)}
                                className={`px-3 py-1.5 rounded-xl text-sm transition-all border ${
                                  selected
                                    ? "bg-gradient-to-br from-violet-500/15 to-cyan-500/10 border-violet-300/40 text-white"
                                    : "bg-white/[0.03] border-white/10 text-white/55 hover:bg-white/[0.06] hover:text-white/85"
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        )}

        {/* ── Section 3b: Restaurant Menu Builder ── */}
        {agent.templateType === "restaurant" && (
          <MenuBuilder
            businessId={businessId}
            agentId={agentId}
            accentColor={template?.accentColor}
          />
        )}

        {/* ── Section 3c: Medical Doctor Roster ── */}
        {agent.templateType === "medical" && (
          <DoctorRoster
            businessId={businessId}
            agentId={agentId}
            accentColor={template?.accentColor}
          />
        )}

        {/* ── Section 4: Voice & Language ── */}
        <div className="glass-raised rounded-3xl p-7 space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-300/20 flex items-center justify-center">
              <Volume2 className="w-4 h-4 text-cyan-300" strokeWidth={2} />
            </div>
            <h2 className="font-semibold text-white text-lg tracking-tight">Voice & Language</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Language</Label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="mt-1.5 w-full h-10 bg-white/[0.04] border border-white/10 rounded-xl px-3 text-sm text-white outline-none transition-[border-color,box-shadow,background-color] duration-200 hover:bg-white/[0.06] hover:border-white/14 focus-visible:border-violet-300/55 focus-visible:bg-white/[0.06] focus-visible:shadow-[0_0_0_3px_rgba(124,58,237,0.18)]">
                {LANGUAGES.map((l) => <option key={l.code} value={l.code} className="bg-[var(--ah-bg-raised)]">{l.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Voice Style</Label>
              <select value={voiceName} onChange={(e) => setVoiceName(e.target.value)} className="mt-1.5 w-full h-10 bg-white/[0.04] border border-white/10 rounded-xl px-3 text-sm text-white outline-none transition-[border-color,box-shadow,background-color] duration-200 hover:bg-white/[0.06] hover:border-white/14 focus-visible:border-violet-300/55 focus-visible:bg-white/[0.06] focus-visible:shadow-[0_0_0_3px_rgba(124,58,237,0.18)]">
                <option value="" className="bg-[var(--ah-bg-raised)]">Default</option>
                {VOICES.map((v) => <option key={v.id} value={v.id} className="bg-[var(--ah-bg-raised)]">{v.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── Section 5: Developer Mode (collapsed) ── */}
        <GlassPanel elevation="raised" radius="lg" className="overflow-hidden">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full p-5 flex items-center justify-between text-left hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                <Code className="w-3.5 h-3.5 text-white/55" />
              </div>
              <span className="text-sm font-medium text-white/65">Developer mode</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
          </button>

          {showAdvanced && (
            <div className="px-7 pb-7 space-y-5">
              <div>
                <Label>Custom system prompt</Label>
                <p className="text-xs text-white/40 mb-1.5 mt-0.5">
                  Override the auto-generated AI instructions. Leave empty to use your settings above.
                </p>
                <Textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Leave empty — your agent's prompt is built automatically from the settings above."
                  rows={8}
                  className="mt-1.5 bg-[var(--ah-bg-deep)]/60 text-xs font-mono"
                />
              </div>
              <div>
                <Label>Agent description</Label>
                <p className="text-xs text-white/40 mb-1.5 mt-0.5">Internal description (not shown to customers)</p>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Handles booking inquiries and room service"
                                  />
              </div>
            </div>
          )}
        </GlassPanel>

        {/* Save */}
        <div className="flex justify-end pb-8">
          <GradientButton onClick={handleSave} disabled={saving} size="default">
            {saving ? "Saving…" : <><Save className="w-4 h-4" /> Save all changes</>}
          </GradientButton>
        </div>
      </motion.div>
    </div>
  );
}
