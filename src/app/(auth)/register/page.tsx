"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  UserPlus,
  ArrowRight,
  ArrowLeft,
  Hotel,
  Stethoscope,
  Code,
  UtensilsCrossed,
  Scale,
  User,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { AuthShell, AuthStepDots } from "@/components/auth/AuthShell";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GradientButton } from "@/components/ui/gradient-button";
import { SelectableCard } from "@/components/ui/selectable-card";

const INDUSTRY_OPTIONS = [
  { id: "hotel", name: "Hotel", icon: Hotel },
  { id: "medical", name: "Medical", icon: Stethoscope },
  { id: "interview", name: "Interview", icon: Code },
  { id: "restaurant", name: "Restaurant", icon: UtensilsCrossed },
  { id: "legal", name: "Legal", icon: Scale },
  { id: "personal", name: "Personal", icon: User },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

      toast.success("Account created — check your inbox to verify your email.");
      router.push(`/verify-email-sent?email=${encodeURIComponent(email)}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={step === 1 ? "Create your account" : "Set up your business"}
      subtitle={
        step === 1
          ? "Get your AI agent running in minutes"
          : "Tell us about your business"
      }
      meta={<AuthStepDots current={step} total={2} />}
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="ah-gradient-text font-medium hover:opacity-80">
            Sign in
          </Link>
        </>
      }
    >
      <GlassPanel elevation="raised" radius="lg" className="p-6 md:p-8">
        {step === 1 && (
          <>
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/business/dashboard" })}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm hover:bg-white/[0.08] hover:border-white/20 transition-all mb-6"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] font-medium tracking-[0.2em] text-white/40 uppercase">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <form onSubmit={handleStep1} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password.length > 0 && password.length < 8 && (
                  <p className="mt-1.5 text-xs text-rose-400/90">At least 8 characters required</p>
                )}
              </div>
              <GradientButton type="submit" className="w-full">
                Next
                <ArrowRight className="w-4 h-4" />
              </GradientButton>
            </form>
          </>
        )}

        {step === 2 && (
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <Label htmlFor="businessName">Business name</Label>
              <Input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Grand Hotel, City Clinic"
                required
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="mb-2.5">Industry</Label>
              <div role="radiogroup" className="grid grid-cols-2 gap-2.5">
                {INDUSTRY_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const selected = industry === opt.id;
                  return (
                    <SelectableCard
                      key={opt.id}
                      selected={selected}
                      onSelect={() => setIndustry(opt.id)}
                      density="lg"
                      showCheck={false}
                      className="p-4 rounded-2xl"
                    >
                      <Icon
                        className={`w-5 h-5 mb-2 ${selected ? "text-violet-300" : "text-white/55"}`}
                        strokeWidth={2}
                      />
                      <p className={`text-sm font-medium ${selected ? "text-white" : "text-white/75"}`}>
                        {opt.name}
                      </p>
                    </SelectableCard>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2.5">
              <GradientButton
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </GradientButton>
              <GradientButton
                type="submit"
                disabled={loading || !industry || !businessName}
                className="flex-1"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="ah-spinner" />
                    Creating…
                  </span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Create account
                  </>
                )}
              </GradientButton>
            </div>
          </form>
        )}
      </GlassPanel>
    </AuthShell>
  );
}
