"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
  Check,
} from "lucide-react";
import { toast } from "sonner";

const INDUSTRY_OPTIONS = [
  { id: "hotel", name: "Hotel", icon: Hotel, color: "#F59E0B", desc: "Concierge, bookings, room service" },
  { id: "medical", name: "Medical", icon: Stethoscope, color: "#10B981", desc: "Appointments, patient support" },
  { id: "interview", name: "Interview", icon: Code, color: "#6366F1", desc: "Mock interviews, coaching" },
  { id: "restaurant", name: "Restaurant", icon: UtensilsCrossed, color: "#EF4444", desc: "Orders, reservations, menu" },
  { id: "legal", name: "Legal", icon: Scale, color: "#8B5CF6", desc: "Legal info, procedures" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check if user already has a business — redirect if so
  useEffect(() => {
    fetch("/api/business")
      .then((r) => r.json())
      .then((d) => {
        if (d.businesses && d.businesses.length > 0) {
          router.replace("/business/dashboard");
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !industry) {
      toast.error("Please fill business name and select an industry");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/business/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, industry }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Setup failed");
        return;
      }

      toast.success("Business created! Welcome to AgentHub.");
      router.push("/business/dashboard");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00D4FF]/30 border-t-[#00D4FF] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-[#00D4FF] to-[#6366F1] flex items-center justify-center mx-auto mb-4">
          <Zap className="w-7 h-7 text-white" />
        </div>
        <h1 className="font-(family-name:--font-heading) text-3xl font-bold text-white mb-2">
          Set up your business
        </h1>
        <p className="text-[#8888AA]">
          Create your AI voice agent in just a few steps
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-6">
          <div>
            <Label className="text-[#8888AA] text-sm">Business Name</Label>
            <Input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g., Grand Hotel, City Clinic, The Kitchen"
              required
              className="mt-1.5 bg-white/5 border-[#2A2A3E] focus:border-[#00D4FF] text-white"
            />
          </div>

          <div>
            <Label className="text-[#8888AA] text-sm mb-3 block">Industry</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {INDUSTRY_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const selected = industry === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setIndustry(opt.id)}
                    className="p-4 rounded-xl text-left transition-all relative"
                    style={{
                      backgroundColor: selected ? `${opt.color}15` : "rgba(255,255,255,0.03)",
                      borderWidth: "1px",
                      borderColor: selected ? `${opt.color}50` : "#2A2A3E",
                    }}
                  >
                    {selected && (
                      <Check className="w-4 h-4 absolute top-2 right-2" style={{ color: opt.color }} />
                    )}
                    <Icon className="w-6 h-6 mb-2" style={{ color: selected ? opt.color : "#8888AA" }} />
                    <p className="text-sm font-medium" style={{ color: selected ? opt.color : "#F0F0F5" }}>
                      {opt.name}
                    </p>
                    <p className="text-[10px] text-[#666680] mt-0.5">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !industry || !businessName.trim()}
            className="w-full bg-linear-to-r from-[#00D4FF] to-[#6366F1] text-white border-0 hover:opacity-90"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Setting up...
              </span>
            ) : (
              <>Create Agent <ArrowRight className="w-4 h-4 ml-2" /></>
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
