"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Database, Plug, PlugZap, Trash2, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GradientButton } from "@/components/ui/gradient-button";

interface CrmSettingsCardProps {
  businessId: string;
  initialProvider: string | null;
  initialConfig: { region?: string } | null;
}

const REGIONS = [
  { value: "in", label: "India (zoho.in)" },
  { value: "com", label: "Global (zoho.com)" },
  { value: "eu", label: "Europe (zoho.eu)" },
];

/**
 * Zoho CRM connector card (ROADMAP_NEXT.md Item 9).
 * Credentials are write-only: sent once on connect, AES-encrypted at rest,
 * never echoed back — the form always renders blank when already connected.
 */
export function CrmSettingsCard({ businessId, initialProvider, initialConfig }: CrmSettingsCardProps) {
  const [provider, setProvider] = useState<string | null>(initialProvider);
  const [region, setRegion] = useState(initialConfig?.region || "in");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [showForm, setShowForm] = useState(!initialProvider);
  const [busy, setBusy] = useState<"save" | "test" | "disconnect" | null>(null);

  const connected = !!provider;

  const handleConnect = async () => {
    if (!clientId.trim() || !clientSecret.trim() || !refreshToken.trim()) {
      toast.error("Client ID, Client Secret, and Refresh Token are all required");
      return;
    }
    setBusy("save");
    try {
      const res = await fetch(`/api/business/${businessId}/crm`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "zoho",
          region,
          credentials: {
            clientId: clientId.trim(),
            clientSecret: clientSecret.trim(),
            refreshToken: refreshToken.trim(),
          },
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed");
      setProvider("zoho");
      setClientId("");
      setClientSecret("");
      setRefreshToken("");
      setShowForm(false);
      toast.success("Zoho CRM connected — run a test push to verify");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't connect CRM");
    } finally {
      setBusy(null);
    }
  };

  const handleTest = async () => {
    setBusy("test");
    try {
      const res = await fetch(`/api/business/${businessId}/crm/test`, { method: "POST" });
      const d = await res.json();
      if (res.ok && d.result?.ok) {
        toast.success(`Test lead landed in Zoho${d.result.recordId ? ` (record ${d.result.recordId})` : ""} — check your Leads module`);
      } else {
        toast.error(`Test push failed: ${d.result?.error || d.error || "unknown error"}`);
      }
    } catch {
      toast.error("Test push failed");
    } finally {
      setBusy(null);
    }
  };

  const handleDisconnect = async () => {
    setBusy("disconnect");
    try {
      const res = await fetch(`/api/business/${businessId}/crm`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setProvider(null);
      setShowForm(true);
      toast.success("CRM disconnected — stored credentials wiped");
    } catch {
      toast.error("Couldn't disconnect");
    } finally {
      setBusy(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
      <GlassPanel elevation="subtle" radius="lg" className="p-6 md:p-7 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-300" />
            <h3 className="font-semibold text-white tracking-tight">CRM push</h3>
            {connected && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium border bg-emerald-500/15 text-emerald-300 border-emerald-300/25 inline-flex items-center gap-1">
                <PlugZap className="w-2.5 h-2.5" /> Zoho connected
              </span>
            )}
          </div>
          {connected && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTest}
                disabled={busy !== null}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border bg-white/[0.04] border-white/10 text-white/75 hover:bg-white/[0.08] hover:text-white transition-all ah-focus-ring disabled:opacity-50"
              >
                <FlaskConical className="w-3 h-3" /> {busy === "test" ? "Pushing…" : "Test connection"}
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={busy !== null}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border bg-rose-500/10 border-rose-300/20 text-rose-300 hover:bg-rose-500/20 transition-all ah-focus-ring disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" /> Disconnect
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-white/40 leading-relaxed">
          Every captured lead is pushed into your Zoho CRM Leads module automatically (alongside the email
          and webhook). Create a <span className="text-white/60">Self Client</span> in the Zoho API console with scope{" "}
          <code className="font-mono text-white/60">ZohoCRM.modules.leads.CREATE</code>, then paste the credentials below.
          They&apos;re encrypted at rest and never shown again.
        </p>

        {connected && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="text-xs text-violet-300 hover:text-violet-200 transition-colors"
          >
            Replace credentials…
          </button>
        )}

        {showForm && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Region</Label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="mt-1.5 w-full h-10 bg-white/[0.04] border border-white/10 rounded-xl px-3 text-sm text-white outline-none transition-[border-color,box-shadow,background-color] duration-200 hover:bg-white/[0.06] hover:border-white/14 focus-visible:border-violet-300/55 focus-visible:bg-white/[0.06] focus-visible:shadow-[0_0_0_3px_rgba(124,58,237,0.18)]"
                >
                  {REGIONS.map((r) => (
                    <option key={r.value} value={r.value} className="bg-[var(--ah-bg-raised)]">
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Client ID</Label>
                <Input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="1000.XXXX…" className="mt-1.5" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Client Secret</Label>
                <Input type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} placeholder="••••••••" className="mt-1.5" />
              </div>
              <div>
                <Label>Refresh Token</Label>
                <Input type="password" value={refreshToken} onChange={(e) => setRefreshToken(e.target.value)} placeholder="1000.XXXX…" className="mt-1.5" />
              </div>
            </div>
            <div className="flex justify-end">
              <GradientButton onClick={handleConnect} disabled={busy !== null} size="sm">
                <Plug className="w-3.5 h-3.5" /> {busy === "save" ? "Connecting…" : connected ? "Update credentials" : "Connect Zoho"}
              </GradientButton>
            </div>
          </div>
        )}
      </GlassPanel>
    </motion.div>
  );
}
