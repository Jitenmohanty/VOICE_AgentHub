"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Zap,
  Hotel,
  Stethoscope,
  Code,
  UtensilsCrossed,
  Scale,
  ArrowRight,
  ArrowLeft,
  Check,
  Building2,
  Bot,
  BookOpen,
  ExternalLink,
  Copy,
  Plus,
  X,
  Globe,
  Phone,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { getTemplateById, type AgentTemplate } from "@/lib/templates";
import { MenuBuilder } from "@/components/business/MenuBuilder";
import { DoctorRoster } from "@/components/business/DoctorRoster";

const INDUSTRY_OPTIONS = [
  { id: "hotel", name: "Hotel", icon: Hotel, color: "#F59E0B", desc: "Concierge, bookings, room service" },
  { id: "medical", name: "Medical", icon: Stethoscope, color: "#10B981", desc: "Appointments, patient support" },
  { id: "interview", name: "Interview", icon: Code, color: "#6366F1", desc: "Mock interviews, coaching" },
  { id: "restaurant", name: "Restaurant", icon: UtensilsCrossed, color: "#EF4444", desc: "Orders, reservations, menu" },
  { id: "legal", name: "Legal", icon: Scale, color: "#8B5CF6", desc: "Legal info, procedures" },
];

interface BusinessInfo {
  id: string;
  slug: string;
  name: string;
  industry: string;
  description: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  agents: { id: string; templateType: string; name: string; greeting: string | null; personality: string | null; config: Record<string, unknown> }[];
}

const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Business data
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");

  // Agent data
  const [agentName, setAgentName] = useState("");
  const [greeting, setGreeting] = useState("");
  const [personality, setPersonality] = useState("");
  const [config, setConfig] = useState<Record<string, string | string[] | number | boolean>>({});

  // Knowledge quick-add
  const [faqs, setFaqs] = useState<{ title: string; content: string }[]>([]);
  const [newFaqTitle, setNewFaqTitle] = useState("");
  const [newFaqContent, setNewFaqContent] = useState("");

  const [copied, setCopied] = useState(false);

  // Check existing business state
  useEffect(() => {
    fetch("/api/business")
      .then((r) => r.json())
      .then((d) => {
        const biz = d.businesses?.[0] as BusinessInfo | undefined;
        if (biz) {
          setBusiness(biz);
          setBusinessName(biz.name);
          setIndustry(biz.industry);
          setDescription(biz.description || "");
          setPhone(biz.phone || "");
          setAddress(biz.address || "");
          setWebsite(biz.website || "");

          const agent = biz.agents[0];
          if (agent) {
            setAgentName(agent.name);
            setGreeting(agent.greeting || "");
            setPersonality(agent.personality || "");
            setConfig((agent.config || {}) as Record<string, string | string[]>);
          }
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const template = getTemplateById(industry) || null;

  // Step 1: Save business details
  const saveStep1 = useCallback(async () => {
    if (!businessName.trim() || !industry) {
      toast.error("Please fill business name and select an industry");
      return false;
    }
    setLoading(true);
    try {
      if (!business) {
        // Create business (OAuth user)
        const res = await fetch("/api/business/onboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessName, industry }),
        });
        if (!res.ok) { toast.error("Failed to create business"); return false; }
        const data = await res.json();
        // Refetch full business
        const bRes = await fetch("/api/business");
        const bData = await bRes.json();
        setBusiness(bData.businesses?.[0] || null);
        const agent = bData.businesses?.[0]?.agents?.[0];
        if (agent) {
          setAgentName(agent.name);
          setGreeting(agent.greeting || "");
          setPersonality(agent.personality || "");
          const tmpl = getTemplateById(industry);
          if (tmpl) {
            const dc: Record<string, string | string[] | number | boolean> = {};
            for (const f of tmpl.configFields) {
              if (f.defaultValue !== undefined) dc[f.id] = f.defaultValue;
            }
            setConfig(dc);
          }
        }
      } else {
        // Update existing business
        await fetch(`/api/business/${business.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: businessName,
            description: description || null,
            phone: phone || null,
            address: address || null,
            website: website || null,
          }),
        });
      }
      return true;
    } catch { toast.error("Something went wrong"); return false; }
    finally { setLoading(false); }
  }, [business, businessName, industry, description, phone, address, website]);

  // Step 2: Save agent config
  const saveStep2 = useCallback(async () => {
    if (!business?.agents[0]) return false;
    setLoading(true);
    try {
      await fetch(`/api/business/${business.id}/agents/${business.agents[0].id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: agentName || undefined,
          greeting: greeting || null,
          personality: personality || null,
          config,
        }),
      });
      return true;
    } catch { toast.error("Failed to save agent"); return false; }
    finally { setLoading(false); }
  }, [business, agentName, greeting, personality, config]);

  // Step 3: Save knowledge
  const saveStep3 = useCallback(async () => {
    if (!business?.agents[0] || faqs.length === 0) return true; // skip if empty
    setLoading(true);
    try {
      for (const faq of faqs) {
        await fetch(`/api/business/${business.id}/agents/${business.agents[0].id}/knowledge`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: faq.title, content: faq.content, category: "faq" }),
        });
      }
      return true;
    } catch { toast.error("Failed to save knowledge"); return false; }
    finally { setLoading(false); }
  }, [business, faqs]);

  const handleNext = async () => {
    let success = true;
    if (step === 1) success = await saveStep1();
    if (step === 2) success = await saveStep2();
    if (step === 3) success = await saveStep3();
    if (success) setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const handleFinish = async () => {
    if (step === 3) await saveStep3();
    toast.success("Your agent is ready!");
    router.push("/business/dashboard");
  };

  const updateConfig = (key: string, value: string | string[] | number | boolean) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const toggleMulti = (key: string, opt: string) => {
    const cur = (config[key] as string[]) || [];
    updateConfig(key, cur.includes(opt) ? cur.filter((v) => v !== opt) : [...cur, opt]);
  };

  const addFaq = () => {
    if (!newFaqTitle.trim() || !newFaqContent.trim()) return;
    setFaqs((prev) => [...prev, { title: newFaqTitle, content: newFaqContent }]);
    setNewFaqTitle("");
    setNewFaqContent("");
  };

  const publicUrl = business ? `${typeof window !== "undefined" ? window.location.origin : ""}/a/${business.slug}` : "";

  if (checking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00D4FF]/30 border-t-[#00D4FF] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-[#00D4FF] to-[#6366F1] flex items-center justify-center mx-auto mb-4">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <h1 className="font-(family-name:--font-heading) text-2xl font-bold text-white">Set up your AI Agent</h1>
        <p className="text-sm text-[#8888AA] mt-1">Complete these steps to get your agent live</p>

        {/* Progress bar */}
        <div className="flex items-center justify-center gap-1.5 mt-5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i + 1 === step ? 32 : 16,
                backgroundColor: i + 1 <= step ? "#00D4FF" : "#2A2A3E",
              }}
            />
          ))}
        </div>
        <p className="text-xs text-[#666680] mt-2">Step {step} of {TOTAL_STEPS}</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ── STEP 1: Business Details ── */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-5 h-5 text-[#00D4FF]" />
              <h2 className="font-semibold text-white text-lg">Business Details</h2>
            </div>

            <div>
              <Label className="text-[#8888AA]">Business Name *</Label>
              <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g., Grand Hotel Mumbai" required className="mt-1.5 bg-white/5 border-[#2A2A3E] text-white" />
            </div>

            {!business && (
              <div>
                <Label className="text-[#8888AA] mb-3 block">Industry *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {INDUSTRY_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const sel = industry === opt.id;
                    return (
                      <button key={opt.id} type="button" onClick={() => setIndustry(opt.id)}
                        className="p-3 rounded-xl text-left transition-all relative"
                        style={{ backgroundColor: sel ? `${opt.color}15` : "rgba(255,255,255,0.03)", borderWidth: "1px", borderColor: sel ? `${opt.color}50` : "#2A2A3E" }}>
                        {sel && <Check className="w-3.5 h-3.5 absolute top-2 right-2" style={{ color: opt.color }} />}
                        <Icon className="w-5 h-5 mb-1.5" style={{ color: sel ? opt.color : "#8888AA" }} />
                        <p className="text-xs font-medium" style={{ color: sel ? opt.color : "#F0F0F5" }}>{opt.name}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <Label className="text-[#8888AA]">Description</Label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of your business for customers..." rows={2} className="w-full mt-1.5 bg-white/5 border border-[#2A2A3E] rounded-lg p-3 text-sm text-white placeholder:text-[#666680] resize-none focus:outline-none focus:border-[#00D4FF]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#8888AA] flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="mt-1.5 bg-white/5 border-[#2A2A3E] text-white" />
              </div>
              <div>
                <Label className="text-[#8888AA] flex items-center gap-1"><Globe className="w-3 h-3" /> Website</Label>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." className="mt-1.5 bg-white/5 border-[#2A2A3E] text-white" />
              </div>
            </div>

            <div>
              <Label className="text-[#8888AA] flex items-center gap-1"><MapPin className="w-3 h-3" /> Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full business address" className="mt-1.5 bg-white/5 border-[#2A2A3E] text-white" />
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: Agent Config ── */}
        {step === 2 && template && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <Bot className="w-5 h-5" style={{ color: template.accentColor }} />
              <h2 className="font-semibold text-white text-lg">Configure Your Agent</h2>
            </div>

            <div>
              <Label className="text-[#8888AA]">Agent Name</Label>
              <Input value={agentName} onChange={(e) => setAgentName(e.target.value)} className="mt-1.5 bg-white/5 border-[#2A2A3E] text-white" />
            </div>

            <div>
              <Label className="text-[#8888AA]">Greeting Message</Label>
              <Input value={greeting} onChange={(e) => setGreeting(e.target.value)} placeholder={template.defaultGreeting} className="mt-1.5 bg-white/5 border-[#2A2A3E] text-white" />
            </div>

            <div>
              <Label className="text-[#8888AA]">Personality & Tone</Label>
              <textarea value={personality} onChange={(e) => setPersonality(e.target.value)} placeholder={template.defaultPersonality} rows={2} className="w-full mt-1.5 bg-white/5 border border-[#2A2A3E] rounded-lg p-3 text-sm text-white placeholder:text-[#666680] resize-none focus:outline-none focus:border-[#00D4FF]" />
            </div>

            {/* Template-specific fields grouped by section */}
            {(() => {
              const sections: { name: string; fields: typeof template.configFields }[] = [];
              for (const field of template.configFields) {
                const sectionName = field.section || "Details";
                let section = sections.find((s) => s.name === sectionName);
                if (!section) { section = { name: sectionName, fields: [] }; sections.push(section); }
                section.fields.push(field);
              }
              return sections.map((section) => (
                <div key={section.name} className="space-y-4">
                  <p className="text-xs font-medium text-[#666680] uppercase tracking-wider pt-2 border-t border-[#2A2A3E]/50">{section.name}</p>
                  {section.fields.map((field) => (
                    <div key={field.id}>
                      <Label className="text-[#8888AA]">{field.label}</Label>
                      {field.description && <p className="text-xs text-[#666680] mt-0.5">{field.description}</p>}

                      {field.type === "text" && (
                        <Input value={(config[field.id] as string) || ""} onChange={(e) => updateConfig(field.id, e.target.value)} placeholder={field.placeholder || (typeof field.defaultValue === "string" ? field.defaultValue : "")} className="mt-1.5 bg-white/5 border-[#2A2A3E] text-white" />
                      )}

                      {field.type === "number" && (
                        <Input type="number" value={config[field.id] !== undefined ? String(config[field.id]) : ""} onChange={(e) => updateConfig(field.id, e.target.value === "" ? 0 : Number(e.target.value))} min={field.min} max={field.max} className="mt-1.5 bg-white/5 border-[#2A2A3E] text-white w-32" />
                      )}

                      {field.type === "time" && (
                        <Input type="time" value={(config[field.id] as string) || ""} onChange={(e) => updateConfig(field.id, e.target.value)} className="mt-1.5 bg-white/5 border-[#2A2A3E] text-white w-40" />
                      )}

                      {field.type === "textarea" && (
                        <textarea value={(config[field.id] as string) || ""} onChange={(e) => updateConfig(field.id, e.target.value)} placeholder={field.placeholder || ""} rows={3} className="w-full mt-1.5 bg-white/5 border border-[#2A2A3E] rounded-lg p-3 text-sm text-white placeholder:text-[#666680] resize-none focus:outline-none focus:border-[#00D4FF]" />
                      )}

                      {field.type === "toggle" && (
                        <button type="button" onClick={() => updateConfig(field.id, !config[field.id])} className="mt-1.5 flex items-center gap-2">
                          <div className={`w-10 h-5 rounded-full transition-colors relative ${config[field.id] ? "bg-[#00D4FF]" : "bg-[#2A2A3E]"}`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${config[field.id] ? "translate-x-5" : "translate-x-0.5"}`} />
                          </div>
                          <span className="text-sm text-[#8888AA]">{config[field.id] ? "Yes" : "No"}</span>
                        </button>
                      )}

                      {field.type === "select" && field.options && (
                        <select value={(config[field.id] as string) || ""} onChange={(e) => updateConfig(field.id, e.target.value)} className="mt-1.5 w-full h-10 bg-white/5 border border-[#2A2A3E] rounded-lg px-3 text-sm text-white focus:outline-none focus:border-[#00D4FF]">
                          <option value="" className="bg-[#1A1A2E]">Select...</option>
                          {field.options.map((o) => <option key={o} value={o} className="bg-[#1A1A2E]">{o}</option>)}
                        </select>
                      )}

                      {field.type === "multi-select" && field.options && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {field.options.map((o) => {
                            const sel = ((config[field.id] as string[]) || []).includes(o);
                            return (
                              <button key={o} type="button" onClick={() => toggleMulti(field.id, o)} className="px-3 py-1.5 rounded-lg text-sm transition-all" style={{ backgroundColor: sel ? `${template.accentColor}20` : "rgba(255,255,255,0.05)", color: sel ? template.accentColor : "#8888AA", borderWidth: "1px", borderColor: sel ? `${template.accentColor}40` : "transparent" }}>
                                {o}
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

            {/* ── Restaurant: Menu Builder sub-step ── */}
            {template.id === "restaurant" && business?.agents[0] && (
              <div className="space-y-3 border-t border-[#2A2A3E]/50 pt-4">
                <p className="text-xs font-medium text-[#666680] uppercase tracking-wider">
                  Menu Items
                </p>
                <p className="text-xs text-[#8888AA] -mt-1">
                  Add your menu items so the agent can read them out and take orders.
                </p>
                <MenuBuilder
                  businessId={business.id}
                  agentId={business.agents[0].id}
                  accentColor={template.accentColor}
                />
              </div>
            )}

            {/* ── Medical: Doctor Roster sub-step ── */}
            {template.id === "medical" && business?.agents[0] && (
              <div className="space-y-3 border-t border-[#2A2A3E]/50 pt-4">
                <p className="text-xs font-medium text-[#666680] uppercase tracking-wider">
                  Doctor Roster
                </p>
                <p className="text-xs text-[#8888AA] -mt-1">
                  Add doctors so the agent can answer availability and appointment questions.
                </p>
                <DoctorRoster
                  businessId={business.id}
                  agentId={business.agents[0].id}
                  accentColor={template.accentColor}
                />
              </div>
            )}
          </motion.div>
        )}

        {/* ── STEP 3: Quick Knowledge ── */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-5 h-5 text-[#00D4FF]" />
              <h2 className="font-semibold text-white text-lg">Add Quick FAQs</h2>
            </div>
            <p className="text-xs text-[#8888AA] -mt-3">Add common questions your customers ask. You can add more later.</p>

            {/* Suggestion chips */}
            {template && (
              <div>
                <p className="text-xs text-[#666680] mb-2">Suggested for {template.name}:</p>
                <div className="flex flex-wrap gap-2">
                  {getSuggestedFaqs(template).map((s, i) => (
                    <button key={i} type="button" onClick={() => { setNewFaqTitle(s.title); setNewFaqContent(s.content); }} className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-[#8888AA] hover:text-white hover:bg-white/10 transition-colors">
                      {s.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add FAQ form */}
            <div className="bg-white/[0.03] rounded-xl p-4 border border-[#2A2A3E] space-y-3">
              <Input value={newFaqTitle} onChange={(e) => setNewFaqTitle(e.target.value)} placeholder="Question (e.g., What is check-in time?)" className="bg-white/5 border-[#2A2A3E] text-white text-sm" />
              <textarea value={newFaqContent} onChange={(e) => setNewFaqContent(e.target.value)} placeholder="Answer (e.g., Check-in is at 2:00 PM and check-out is at 11:00 AM)" rows={2} className="w-full bg-white/5 border border-[#2A2A3E] rounded-lg p-3 text-sm text-white placeholder:text-[#666680] resize-none focus:outline-none focus:border-[#00D4FF]" />
              <Button type="button" onClick={addFaq} disabled={!newFaqTitle.trim() || !newFaqContent.trim()} size="sm" className="bg-[#00D4FF] text-black hover:bg-[#00D4FF]/80 border-0">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add FAQ
              </Button>
            </div>

            {/* Added FAQs */}
            {faqs.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-[#8888AA]">{faqs.length} FAQ{faqs.length !== 1 ? "s" : ""} ready to save</p>
                {faqs.map((faq, i) => (
                  <div key={i} className="flex items-start justify-between bg-white/[0.03] rounded-lg p-3 border border-[#2A2A3E]">
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium">{faq.title}</p>
                      <p className="text-xs text-[#8888AA] line-clamp-1">{faq.content}</p>
                    </div>
                    <button onClick={() => setFaqs((prev) => prev.filter((_, j) => j !== i))} className="p-1 text-[#8888AA] hover:text-red-400 shrink-0 ml-2">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── STEP 4: Go Live ── */}
        {step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass rounded-2xl p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-xl">Your Agent is Ready!</h2>
              <p className="text-sm text-[#8888AA] mt-1">Share this link with your customers</p>
            </div>

            {/* Public link */}
            <div className="p-4 bg-white/[0.03] rounded-xl border border-[#2A2A3E] flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <ExternalLink className="w-4 h-4 text-[#00D4FF] shrink-0" />
                <span className="text-sm text-[#8888AA] truncate">{publicUrl}</span>
              </div>
              <Button size="sm" variant="outline" className="border-[#2A2A3E] text-white shrink-0 ml-3" onClick={() => {
                navigator.clipboard.writeText(publicUrl);
                setCopied(true);
                toast.success("Link copied!");
                setTimeout(() => setCopied(false), 2000);
              }}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            <div className="flex gap-3 justify-center">
              <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-black bg-[#00D4FF] hover:bg-[#00D4FF]/80 transition-colors">
                <ExternalLink className="w-4 h-4" /> Test Your Agent
              </a>
              <Button onClick={() => router.push("/business/dashboard")} variant="outline" className="border-[#2A2A3E] text-white">
                Go to Dashboard
              </Button>
            </div>

            <p className="text-xs text-[#666680]">You can always customize your agent further from the dashboard</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation buttons */}
      {step < TOTAL_STEPS && (
        <div className="flex items-center justify-between mt-6">
          <Button
            onClick={() => setStep((s) => Math.max(s - 1, 1))}
            disabled={step === 1}
            variant="outline"
            className="border-[#2A2A3E] text-white disabled:opacity-30"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>

          <div className="flex gap-3">
            {step === 3 && (
              <Button onClick={handleFinish} variant="outline" className="border-[#2A2A3E] text-white">
                Skip & Finish
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={loading || (step === 1 && (!businessName.trim() || !industry))}
              className="bg-linear-to-r from-[#00D4FF] to-[#6366F1] text-white border-0 hover:opacity-90"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <>{step === 3 ? "Save & Continue" : "Next"} <ArrowRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Industry-specific FAQ suggestions */
function getSuggestedFaqs(template: AgentTemplate): { title: string; content: string }[] {
  const suggestions: Record<string, { title: string; content: string }[]> = {
    hotel: [
      { title: "Check-in / Check-out time", content: "Check-in is at 2:00 PM and check-out is at 11:00 AM. Early check-in and late check-out available on request." },
      { title: "Parking availability", content: "We offer complimentary valet parking for all guests. Self-parking is also available." },
      { title: "Cancellation policy", content: "Free cancellation up to 24 hours before check-in. Late cancellations are charged one night's stay." },
      { title: "Wi-Fi", content: "Complimentary high-speed Wi-Fi is available in all rooms and common areas." },
      { title: "Room service hours", content: "Room service is available 24/7. A limited menu is available between 11 PM and 6 AM." },
    ],
    medical: [
      { title: "Appointment booking", content: "Appointments can be booked online or by calling us. Walk-ins are welcome but may have a wait." },
      { title: "Insurance accepted", content: "We accept most major insurance plans. Please call to verify your specific plan." },
      { title: "Working hours", content: "Monday to Friday: 9 AM - 6 PM. Saturday: 9 AM - 1 PM. Closed on Sundays." },
      { title: "Emergency protocol", content: "For emergencies, please call 108 or go to the nearest emergency room immediately." },
    ],
    restaurant: [
      { title: "Opening hours", content: "Open daily from 11:00 AM to 11:00 PM. Kitchen closes at 10:30 PM." },
      { title: "Reservations", content: "Reservations recommended for groups of 4 or more. Walk-ins welcome based on availability." },
      { title: "Dietary accommodations", content: "We cater to vegetarian, vegan, gluten-free, and common allergy requirements. Please inform your server." },
      { title: "Delivery", content: "We deliver within a 5 km radius. Minimum order value applies. Available via our website and major food apps." },
    ],
    interview: [
      { title: "Session format", content: "Each session is a 30-45 minute mock interview covering technical and behavioral questions tailored to your level." },
      { title: "Feedback style", content: "After each answer, you'll receive a score (1-10), specific feedback on what was strong, and areas to improve." },
      { title: "Preparation tips", content: "Review core concepts for your tech stack, practice the STAR method for behavioral questions, and speak clearly." },
    ],
    legal: [
      { title: "Consultation process", content: "Initial consultations are informational. We provide general legal guidance but recommend consulting a licensed attorney for specific advice." },
      { title: "Disclaimer", content: "This service provides general legal information only, not legal advice. Always consult a qualified attorney for your specific situation." },
      { title: "Areas of expertise", content: "We cover corporate law, employment law, real estate, intellectual property, family law, and criminal law basics." },
    ],
  };

  return suggestions[template.id] || [];
}
