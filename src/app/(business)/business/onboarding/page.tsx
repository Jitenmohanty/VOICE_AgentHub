"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
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
import { GlassPanel } from "@/components/ui/glass-panel";
import { GradientButton } from "@/components/ui/gradient-button";
import { SelectableCard } from "@/components/ui/selectable-card";

const INDUSTRY_OPTIONS = [
  { id: "hotel", name: "Hotel", icon: Hotel, desc: "Concierge & bookings" },
  { id: "medical", name: "Medical", icon: Stethoscope, desc: "Appointments & support" },
  { id: "interview", name: "Interview", icon: Code, desc: "Mock interviews" },
  { id: "restaurant", name: "Restaurant", icon: UtensilsCrossed, desc: "Orders & menu" },
  { id: "legal", name: "Legal", icon: Scale, desc: "Legal information" },
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

  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");

  const [agentName, setAgentName] = useState("");
  const [greeting, setGreeting] = useState("");
  const [personality, setPersonality] = useState("");
  const [config, setConfig] = useState<Record<string, string | string[] | number | boolean>>({});

  const [faqs, setFaqs] = useState<{ title: string; content: string }[]>([]);
  const [newFaqTitle, setNewFaqTitle] = useState("");
  const [newFaqContent, setNewFaqContent] = useState("");

  const [copied, setCopied] = useState(false);

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

  const saveStep1 = useCallback(async () => {
    if (!businessName.trim() || !industry) {
      toast.error("Please fill business name and select an industry");
      return false;
    }
    setLoading(true);
    try {
      if (!business) {
        const res = await fetch("/api/business/onboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessName, industry }),
        });
        if (!res.ok) { toast.error("Failed to create business"); return false; }
        await res.json();
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

  const saveStep3 = useCallback(async () => {
    if (!business?.agents[0] || faqs.length === 0) return true;
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
        <span className="ah-spinner ah-spinner-violet text-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 md:py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-8">
        <div className="relative inline-block mb-4">
          <div className="w-12 h-12 rounded-2xl ah-gradient-bg flex items-center justify-center mx-auto shadow-[0_8px_24px_-8px_rgba(124,58,237,0.6)]">
            <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="absolute inset-0 ah-gradient-bg rounded-2xl blur-xl opacity-40 -z-10" />
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] text-white">Set up your AI agent</h1>
        <p className="text-sm text-white/55 mt-1.5">Complete these steps to get your agent live.</p>

        <div className="flex items-center justify-center gap-1.5 mt-6">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${
                i + 1 <= step ? "ah-gradient-bg" : "bg-white/10"
              }`}
              style={{ width: i + 1 === step ? 32 : 16 }}
            />
          ))}
        </div>
        <p className="text-xs text-white/40 mt-2">Step {step} of {TOTAL_STEPS}</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* STEP 1 */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.35 }}>
            <GlassPanel elevation="raised" radius="lg" className="p-7 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-300/20 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-violet-300" strokeWidth={2} />
                </div>
                <h2 className="font-semibold text-white text-lg tracking-tight">Business details</h2>
              </div>

              <div>
                <Label>Business name *</Label>
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g., Grand Hotel Mumbai" required className="mt-1.5" />
              </div>

              {!business && (
                <div>
                  <Label className="mb-2.5">Industry *</Label>
                  <div role="radiogroup" className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {INDUSTRY_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const sel = industry === opt.id;
                      return (
                        <SelectableCard
                          key={opt.id}
                          selected={sel}
                          onSelect={() => setIndustry(opt.id)}
                        >
                          <Icon className={`w-4 h-4 mb-1.5 ${sel ? "text-violet-300" : "text-white/55"}`} strokeWidth={2} />
                          <p className={`text-xs font-medium ${sel ? "text-white" : "text-white/75"}`}>{opt.name}</p>
                          <p className="text-[10px] text-white/40 mt-0.5">{opt.desc}</p>
                        </SelectableCard>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of your business…" rows={2} className="mt-1.5" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>
                    <Phone className="w-3 h-3" /> Phone
                  </Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="mt-1.5" />
                </div>
                <div>
                  <Label>
                    <Globe className="w-3 h-3" /> Website
                  </Label>
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" className="mt-1.5" />
                </div>
              </div>

              <div>
                <Label>
                  <MapPin className="w-3 h-3" /> Address
                </Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full business address" className="mt-1.5" />
              </div>
            </GlassPanel>
          </motion.div>
        )}

        {/* STEP 2 */}
        {step === 2 && template && (
          <motion.div key="step2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.35 }}>
            <GlassPanel elevation="raised" radius="lg" className="p-7 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl ah-gradient-bg flex items-center justify-center shadow-[0_4px_16px_-4px_rgba(124,58,237,0.5)]">
                  <Bot className="w-4 h-4 text-white" strokeWidth={2} />
                </div>
                <h2 className="font-semibold text-white text-lg tracking-tight">Configure your agent</h2>
              </div>

              <div>
                <Label>Agent name</Label>
                <Input value={agentName} onChange={(e) => setAgentName(e.target.value)} className="mt-1.5" />
              </div>

              <div>
                <Label>Greeting message</Label>
                <Input value={greeting} onChange={(e) => setGreeting(e.target.value)} placeholder={template.defaultGreeting} className="mt-1.5" />
              </div>

              <div>
                <Label>Personality &amp; tone</Label>
                <Textarea value={personality} onChange={(e) => setPersonality(e.target.value)} placeholder={template.defaultPersonality} rows={2} className="mt-1.5" />
              </div>

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
                    <p className="text-[10px] font-medium text-white/40 uppercase tracking-[0.18em] pt-2 border-t border-white/[0.06]">{section.name}</p>
                    {section.fields.map((field) => (
                      <div key={field.id}>
                        <Label>{field.label}</Label>
                        {field.description && <p className="text-[11px] text-white/40 mt-0.5">{field.description}</p>}

                        {field.type === "text" && (
                          <Input value={(config[field.id] as string) || ""} onChange={(e) => updateConfig(field.id, e.target.value)} placeholder={field.placeholder || (typeof field.defaultValue === "string" ? field.defaultValue : "")} className="mt-1.5" />
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
                          <button type="button" onClick={() => updateConfig(field.id, !config[field.id])} className="mt-2 flex items-center gap-2.5">
                            <div className={`w-11 h-6 rounded-full transition-all relative border ${config[field.id] ? "ah-gradient-bg border-violet-300/40" : "bg-white/[0.06] border-white/10"}`}>
                              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${config[field.id] ? "translate-x-5" : "translate-x-0.5"}`} />
                            </div>
                            <span className="text-sm text-white/65">{config[field.id] ? "Yes" : "No"}</span>
                          </button>
                        )}
                        {field.type === "select" && field.options && (
                          <select value={(config[field.id] as string) || ""} onChange={(e) => updateConfig(field.id, e.target.value)} className="mt-1.5 w-full h-10 bg-white/[0.04] border border-white/10 rounded-xl px-3 text-sm text-white outline-none transition-[border-color,box-shadow,background-color] duration-200 hover:bg-white/[0.06] hover:border-white/14 focus-visible:border-violet-300/55 focus-visible:bg-white/[0.06] focus-visible:shadow-[0_0_0_3px_rgba(124,58,237,0.18)]">
                            <option value="" className="bg-[var(--ah-bg-raised)]">Select…</option>
                            {field.options.map((o) => <option key={o} value={o} className="bg-[var(--ah-bg-raised)]">{o}</option>)}
                          </select>
                        )}
                        {field.type === "multi-select" && field.options && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {field.options.map((o) => {
                              const sel = ((config[field.id] as string[]) || []).includes(o);
                              return (
                                <button
                                  key={o}
                                  type="button"
                                  onClick={() => toggleMulti(field.id, o)}
                                  className={`px-3 py-1.5 rounded-xl text-sm transition-all border ${
                                    sel
                                      ? "bg-gradient-to-br from-violet-500/15 to-cyan-500/10 border-violet-300/40 text-white"
                                      : "bg-white/[0.03] border-white/10 text-white/55 hover:bg-white/[0.06] hover:text-white/85"
                                  }`}
                                >
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

              {template.id === "restaurant" && business?.agents[0] && (
                <div className="space-y-3 border-t border-white/[0.06] pt-5">
                  <p className="text-[10px] font-medium text-white/40 uppercase tracking-[0.18em]">Menu items</p>
                  <p className="text-xs text-white/55 -mt-1">Add menu items so the agent can read them and take orders.</p>
                  <MenuBuilder businessId={business.id} agentId={business.agents[0].id} />
                </div>
              )}

              {template.id === "medical" && business?.agents[0] && (
                <div className="space-y-3 border-t border-white/[0.06] pt-5">
                  <p className="text-[10px] font-medium text-white/40 uppercase tracking-[0.18em]">Doctor roster</p>
                  <p className="text-xs text-white/55 -mt-1">Add doctors so the agent can answer availability questions.</p>
                  <DoctorRoster businessId={business.id} agentId={business.agents[0].id} />
                </div>
              )}
            </GlassPanel>
          </motion.div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.35 }}>
            <GlassPanel elevation="raised" radius="lg" className="p-7 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-300/20 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-cyan-300" strokeWidth={2} />
                </div>
                <h2 className="font-semibold text-white text-lg tracking-tight">Add quick FAQs</h2>
              </div>
              <p className="text-xs text-white/55 -mt-3">Add common questions your customers ask. You can add more later.</p>

              {template && (
                <div>
                  <p className="text-[11px] text-white/45 mb-2">Suggested for {template.name}:</p>
                  <div className="flex flex-wrap gap-2">
                    {getSuggestedFaqs(template).map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setNewFaqTitle(s.title); setNewFaqContent(s.content); }}
                        className="text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-white/65 hover:bg-white/[0.08] hover:text-white hover:border-white/20 transition-all"
                      >
                        {s.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06] space-y-3">
                <Input value={newFaqTitle} onChange={(e) => setNewFaqTitle(e.target.value)} placeholder="Question (e.g., What is check-in time?)" />
                <Textarea value={newFaqContent} onChange={(e) => setNewFaqContent(e.target.value)} placeholder="Answer (e.g., Check-in is at 2:00 PM and check-out is at 11:00 AM)" rows={2} />
                <GradientButton type="button" onClick={addFaq} disabled={!newFaqTitle.trim() || !newFaqContent.trim()} size="sm">
                  <Plus className="w-3.5 h-3.5" /> Add FAQ
                </GradientButton>
              </div>

              {faqs.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] text-white/45">{faqs.length} FAQ{faqs.length !== 1 ? "s" : ""} ready to save</p>
                  {faqs.map((faq, i) => (
                    <div key={i} className="flex items-start justify-between bg-white/[0.03] rounded-2xl p-3.5 border border-white/[0.06]">
                      <div className="min-w-0">
                        <p className="text-sm text-white font-medium">{faq.title}</p>
                        <p className="text-xs text-white/55 line-clamp-1">{faq.content}</p>
                      </div>
                      <button
                        onClick={() => setFaqs((prev) => prev.filter((_, j) => j !== i))}
                        className="p-1 text-white/40 hover:text-rose-300 shrink-0 ml-2 rounded transition-colors"
                        aria-label="Remove FAQ"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </GlassPanel>
          </motion.div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.35 }}>
            <GlassPanel elevation="floating" gradientBorder radius="lg" className="p-8 text-center space-y-6">
              <div className="relative inline-block mx-auto">
                <div className="w-16 h-16 rounded-2xl ah-gradient-bg flex items-center justify-center shadow-[0_8px_32px_-8px_rgba(124,58,237,0.6)]">
                  <Check className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
                <div className="absolute inset-0 ah-gradient-bg rounded-2xl blur-xl opacity-40 -z-10" />
              </div>
              <div>
                <h2 className="font-semibold text-white text-xl tracking-tight">Your agent is ready!</h2>
                <p className="text-sm text-white/55 mt-1">Share this link with your customers</p>
              </div>

              <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/[0.06] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <ExternalLink className="w-4 h-4 text-violet-300 shrink-0" />
                  <span className="text-sm text-white/65 truncate font-mono">{publicUrl}</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(publicUrl);
                    setCopied(true);
                    toast.success("Link copied!");
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="p-2 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-white/75 hover:text-white shrink-0 transition-all"
                  aria-label="Copy link"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex gap-3 justify-center flex-wrap">
                <GradientButton href={publicUrl} external size="default">
                  <ExternalLink className="w-4 h-4" /> Test your agent
                </GradientButton>
                <GradientButton onClick={() => router.push("/business/dashboard")} variant="outline" size="default">
                  Go to dashboard
                </GradientButton>
              </div>

              <p className="text-[11px] text-white/40">You can always customize your agent further from the dashboard.</p>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>

      {step < TOTAL_STEPS && (
        <div className="flex items-center justify-between mt-6">
          <GradientButton
            onClick={() => setStep((s) => Math.max(s - 1, 1))}
            disabled={step === 1}
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </GradientButton>

          <div className="flex gap-2.5">
            {step === 3 && (
              <GradientButton onClick={handleFinish} variant="outline">
                Skip &amp; finish
              </GradientButton>
            )}
            <GradientButton
              onClick={handleNext}
              disabled={loading || (step === 1 && (!businessName.trim() || !industry))}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="ah-spinner" />
                  Saving…
                </span>
              ) : (
                <>{step === 3 ? "Save & continue" : "Next"} <ArrowRight className="w-4 h-4" /></>
              )}
            </GradientButton>
          </div>
        </div>
      )}
    </div>
  );
}

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
