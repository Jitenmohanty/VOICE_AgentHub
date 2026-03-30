"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Zap,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  Hotel,
  Stethoscope,
  Code,
  UtensilsCrossed,
  Scale,
} from "lucide-react";
import { toast } from "sonner";

const INDUSTRY_OPTIONS = [
  { id: "hotel", name: "Hotel", icon: Hotel, color: "#F59E0B" },
  { id: "medical", name: "Medical", icon: Stethoscope, color: "#10B981" },
  { id: "interview", name: "Interview", icon: Code, color: "#6366F1" },
  { id: "restaurant", name: "Restaurant", icon: UtensilsCrossed, color: "#EF4444" },
  { id: "legal", name: "Legal", icon: Scale, color: "#8B5CF6" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1: Account
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2: Business
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");

  const [loading, setLoading] = useState(false);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill all fields");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setStep(2);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !industry) {
      toast.error("Please fill business name and select an industry");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, businessName, industry }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Registration failed");
        return;
      }

      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        toast.error("Account created. Please sign in.");
        router.push("/login");
      } else {
        toast.success("Welcome to AgentHub!");
        router.push("/business/dashboard");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] px-6 relative overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-[#6366F1]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-[#00D4FF]/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#00D4FF] to-[#6366F1] flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-(family-name:--font-heading) font-bold text-2xl text-white">
              AgentHub
            </span>
          </Link>
          <h1 className="font-(family-name:--font-heading) text-3xl font-bold text-white mb-2">
            {step === 1 ? "Create your account" : "Set up your business"}
          </h1>
          <p className="text-[#8888AA]">
            {step === 1
              ? "Get your AI agent running in minutes"
              : "Tell us about your business"}
          </p>
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className={`w-8 h-1 rounded-full ${step >= 1 ? "bg-[#00D4FF]" : "bg-[#2A2A3E]"}`} />
            <div className={`w-8 h-1 rounded-full ${step >= 2 ? "bg-[#00D4FF]" : "bg-[#2A2A3E]"}`} />
          </div>
        </div>

        <div className="glass rounded-2xl p-8">
          {step === 1 && (
            <>
              <div className="flex flex-col gap-3 mb-6">
                <Button
                  variant="outline"
                  className="w-full border-[#2A2A3E] bg-transparent hover:bg-white/5"
                  onClick={() => signIn("google", { callbackUrl: "/business/dashboard" })}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </Button>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-[#2A2A3E]" />
                <span className="text-xs text-[#8888AA] uppercase">or</span>
                <div className="flex-1 h-px bg-[#2A2A3E]" />
              </div>

              <form onSubmit={handleStep1} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-[#8888AA]">Name</Label>
                  <Input
                    id="name" type="text" value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name" required
                    className="mt-1 bg-white/5 border-[#2A2A3E] focus:border-[#00D4FF] text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-[#8888AA]">Email</Label>
                  <Input
                    id="email" type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" required
                    className="mt-1 bg-white/5 border-[#2A2A3E] focus:border-[#00D4FF] text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-[#8888AA]">Password</Label>
                  <Input
                    id="password" type="password" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" required minLength={8}
                    className="mt-1 bg-white/5 border-[#2A2A3E] focus:border-[#00D4FF] text-white"
                  />
                </div>
                <Button type="submit" className="w-full bg-linear-to-r from-[#00D4FF] to-[#6366F1] text-white border-0 hover:opacity-90">
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </>
          )}

          {step === 2 && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <Label htmlFor="businessName" className="text-[#8888AA]">Business Name</Label>
                <Input
                  id="businessName" type="text" value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Grand Hotel, City Clinic" required
                  className="mt-1 bg-white/5 border-[#2A2A3E] focus:border-[#00D4FF] text-white"
                />
              </div>

              <div>
                <Label className="text-[#8888AA] mb-3 block">Industry</Label>
                <div className="grid grid-cols-2 gap-3">
                  {INDUSTRY_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const selected = industry === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setIndustry(opt.id)}
                        className="p-4 rounded-xl text-left transition-all"
                        style={{
                          backgroundColor: selected ? `${opt.color}15` : "rgba(255,255,255,0.03)",
                          borderWidth: "1px",
                          borderColor: selected ? `${opt.color}50` : "#2A2A3E",
                        }}
                      >
                        <Icon
                          className="w-5 h-5 mb-2"
                          style={{ color: selected ? opt.color : "#8888AA" }}
                        />
                        <p className="text-sm font-medium" style={{ color: selected ? opt.color : "#F0F0F5" }}>
                          {opt.name}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="border-[#2A2A3E] text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !industry || !businessName}
                  className="flex-1 bg-linear-to-r from-[#00D4FF] to-[#6366F1] text-white border-0 hover:opacity-90"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" /> Create Account
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-[#8888AA] text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-[#00D4FF] hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
