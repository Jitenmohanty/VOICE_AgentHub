"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Save, Globe, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

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
        body: JSON.stringify({ name, description: description || null, website: website || null, phone: phone || null, address: address || null }),
      });
      if (!res.ok) throw new Error();
      toast.success("Business updated!");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {[1, 2].map((i) => <div key={i} className="glass rounded-xl p-6 animate-pulse"><div className="h-10 bg-white/5 rounded" /></div>)}
      </div>
    );
  }

  if (!business) return <div className="text-center py-16 text-[#8888AA]">No business found</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-(family-name:--font-heading) text-3xl font-bold text-white">Business Settings</h1>
        <p className="text-[#8888AA] mt-1">Update your business profile</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="w-5 h-5 text-[#00D4FF]" />
          <h2 className="font-semibold text-white">Business Profile</h2>
        </div>

        <div>
          <Label className="text-[#8888AA]">Business Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 bg-white/5 border-[#2A2A3E] text-white" />
        </div>

        <div>
          <Label className="text-[#8888AA]">Description</Label>
          <textarea
            value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell customers about your business..."
            rows={3}
            className="w-full mt-1 bg-white/5 border border-[#2A2A3E] rounded-lg p-3 text-sm text-white placeholder:text-[#666680] resize-none focus:outline-none focus:border-[#00D4FF]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-[#8888AA] flex items-center gap-1"><Globe className="w-3 h-3" /> Website</Label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." className="mt-1 bg-white/5 border-[#2A2A3E] text-white" />
          </div>
          <div>
            <Label className="text-[#8888AA] flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91..." className="mt-1 bg-white/5 border-[#2A2A3E] text-white" />
          </div>
        </div>

        <div>
          <Label className="text-[#8888AA] flex items-center gap-1"><MapPin className="w-3 h-3" /> Address</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Your business address" className="mt-1 bg-white/5 border-[#2A2A3E] text-white" />
        </div>

        <div className="pt-2 flex items-center justify-between">
          <p className="text-xs text-[#666680]">Public URL: /a/{business.slug}</p>
          <Button onClick={handleSave} disabled={saving} className="bg-linear-to-r from-[#00D4FF] to-[#6366F1] text-white border-0 hover:opacity-90">
            {saving ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save</>}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
