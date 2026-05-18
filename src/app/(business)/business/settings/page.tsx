"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Save, Globe, Phone, MapPin, Mail, Webhook, Eye, EyeOff, Copy, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GradientButton } from "@/components/ui/gradient-button";
import { WebhookDeliveriesLog } from "@/components/business/WebhookDeliveriesLog";
import { NotificationPrefsCard, type NotificationPrefs } from "@/components/business/NotificationPrefsCard";

interface BusinessInfo {
  id: string;
  name: string;
  slug: string;
  industry: string;
  description: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  notificationEmail: string | null;
  webhookUrl: string | null;
  webhookSecret: string | null;
  notificationPrefs: Partial<NotificationPrefs> | null;
}

export default function BusinessSettingsPage() {
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);

  useEffect(() => {
    fetch("/api/business")
      .then((r) => r.json())
      .then((d) => {
        const b = d.businesses?.[0] as BusinessInfo | undefined;
        if (b) {
          setBusiness(b);
          setName(b.name);
          setDescription(b.description || "");
          setWebsite(b.website || "");
          setPhone(b.phone || "");
          setAddress(b.address || "");
          setNotificationEmail(b.notificationEmail || "");
          setWebhookUrl(b.webhookUrl || "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!business) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/business/${business.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          website: website || null,
          phone: phone || null,
          address: address || null,
          notificationEmail: notificationEmail || null,
          webhookUrl: webhookUrl || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Save failed");
      }
      toast.success("Saved");
      const refreshed = await fetch("/api/business").then((r) => r.json()).catch(() => null);
      const b = refreshed?.businesses?.[0] as BusinessInfo | undefined;
      if (b) setBusiness(b);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const copySecret = () => {
    if (!business?.webhookSecret) return;
    navigator.clipboard.writeText(business.webhookSecret);
    setSecretCopied(true);
    toast.success("Signing secret copied");
    setTimeout(() => setSecretCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-2 py-6 md:p-10 space-y-6">
        {[1, 2].map((i) => (
          <div key={i} className="glass-raised rounded-3xl p-7 animate-pulse">
            <div className="h-10 bg-white/[0.06] rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!business) return <div className="text-center py-16 text-white/55">No business found</div>;

  return (
    <div className="max-w-2xl mx-auto px-2 py-6 md:p-10 space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/40 mb-2">Settings</p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-white">Business settings</h1>
        <p className="text-sm text-white/55 mt-1.5">Update your business profile and lead-delivery destinations.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}>
        <GlassPanel elevation="raised" radius="lg" className="p-6 md:p-7 space-y-5">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-300/20 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-violet-300" strokeWidth={2} />
            </div>
            <h2 className="font-semibold text-white text-lg tracking-tight">Business profile</h2>
          </div>

          <div>
            <Label >Business name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
          </div>

          <div>
            <Label >Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell customers about your business…"
              rows={3}
              className="mt-1.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label >
                <Globe className="w-3 h-3" /> Website
              </Label>
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" className="mt-1.5" />
            </div>
            <div>
              <Label >
                <Phone className="w-3 h-3" /> Phone
              </Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91…" className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label >
              <MapPin className="w-3 h-3" /> Address
            </Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Your business address" className="mt-1.5" />
          </div>

          <div className="pt-1">
            <p className="text-[11px] text-white/40">
              Public URL: <span className="ah-gradient-text font-mono">/a/{business.slug}</span>
            </p>
          </div>
        </GlassPanel>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <GlassPanel elevation="raised" radius="lg" className="p-6 md:p-7 space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-300/20 flex items-center justify-center">
              <Mail className="w-4 h-4 text-cyan-300" strokeWidth={2} />
            </div>
            <h2 className="font-semibold text-white text-lg tracking-tight">Lead delivery</h2>
          </div>
          <p className="text-xs text-white/45 -mt-2">
            Where lead-capture summaries get sent after every analyzed call.
          </p>

          <div>
            <Label >
              <Mail className="w-3 h-3" /> Notification email
            </Label>
            <p className="text-[11px] text-white/40 mb-1.5 mt-0.5">Defaults to your account email if blank.</p>
            <Input
              type="email"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              placeholder="leads@yourbusiness.com"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label >
              <Webhook className="w-3 h-3" /> Webhook URL (optional)
            </Label>
            <p className="text-[11px] text-white/40 mb-1.5 mt-0.5 leading-relaxed">
              POST receives a signed JSON payload for every captured lead. Slack incoming webhooks, Zapier catches, HubSpot — anything that takes a JSON POST.
            </p>
            <Input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/…"
              className="mt-1.5"
            />
            {business.webhookSecret && (
              <div className="mt-3 p-4 rounded-2xl bg-[var(--ah-bg-deep)]/60 border border-white/10">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-medium text-white/45 uppercase tracking-[0.18em]">Signing secret</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/55 transition-colors"
                      aria-label={showSecret ? "Hide secret" : "Show secret"}
                    >
                      {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={copySecret}
                      className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/55 transition-colors"
                      aria-label="Copy secret"
                    >
                      {secretCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <p className="text-[11px] font-mono text-white/85 break-all">
                  {showSecret ? business.webhookSecret : "•".repeat(48)}
                </p>
                <p className="text-[10px] text-white/40 mt-2 leading-relaxed">
                  Each request is signed with HMAC-SHA256 in the{" "}
                  <code className="ah-gradient-text font-mono">X-Voxie-Signature</code> header as{" "}
                  <code className="ah-gradient-text font-mono">sha256=&lt;hex&gt;</code>. Verify on your endpoint before trusting the body.
                </p>
              </div>
            )}
            {!business.webhookSecret && webhookUrl && (
              <p className="text-[11px] text-white/40 mt-2">
                A signing secret will be generated automatically the first time a lead fires.
              </p>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end">
            <GradientButton onClick={handleSave} disabled={saving} size="default">
              {saving ? "Saving…" : <><Save className="w-4 h-4" /> Save changes</>}
            </GradientButton>
          </div>
        </GlassPanel>
      </motion.div>

      <NotificationPrefsCard businessId={business.id} initial={business.notificationPrefs} />

      {business.webhookUrl && <WebhookDeliveriesLog businessId={business.id} />}
    </div>
  );
}
