"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GradientButton } from "@/components/ui/gradient-button";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error("Missing reset token");
    }
  }, [token]);

  if (!token) {
    return (
      <GlassPanel elevation="raised" radius="lg" className="p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-300/20 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-rose-300" strokeWidth={2} />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Invalid reset link</h2>
        <p className="text-sm text-white/55 mb-4">This reset link is missing or malformed.</p>
        <Link href="/forgot-password" className="text-sm ah-gradient-text font-medium hover:opacity-80">
          Request a new link
        </Link>
      </GlassPanel>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Something went wrong");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
        <GlassPanel elevation="raised" radius="lg" className="p-8 text-center">
          <div className="w-14 h-14 rounded-2xl ah-gradient-bg flex items-center justify-center mx-auto mb-4 shadow-[0_8px_24px_-8px_rgba(124,58,237,0.5)]">
            <CheckCircle className="w-7 h-7 text-white" strokeWidth={2} />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Password updated!</h2>
          <p className="text-sm text-white/55">Redirecting you to sign in…</p>
        </GlassPanel>
      </motion.div>
    );
  }

  return (
    <GlassPanel elevation="raised" radius="lg" className="p-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="password">New password</Label>
          <div className="relative mt-1.5">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
              minLength={8}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {password.length > 0 && password.length < 8 && (
            <p className="mt-1.5 text-xs text-rose-400/90">At least 8 characters required</p>
          )}
        </div>

        <div>
          <Label htmlFor="confirm">Confirm new password</Label>
          <Input
            id="confirm"
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            required
            className="mt-1.5"
          />
          {confirm.length > 0 && confirm !== password && (
            <p className="mt-1.5 text-xs text-rose-400/90">Passwords do not match</p>
          )}
        </div>

        <GradientButton
          type="submit"
          disabled={loading || password.length < 8 || password !== confirm}
          className="w-full"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="ah-spinner" />
              Updating…
            </span>
          ) : (
            <>
              <KeyRound className="w-4 h-4" />
              Set new password
            </>
          )}
        </GradientButton>
      </form>
    </GlassPanel>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Set new password"
      subtitle="Choose a strong password for your account"
      footer={
        <>
          Remember your password?{" "}
          <Link href="/login" className="ah-gradient-text font-medium hover:opacity-80">
            Sign in
          </Link>
        </>
      }
    >
      <Suspense
        fallback={
          <GlassPanel elevation="raised" radius="lg" className="p-8 text-center text-sm text-white/55">
            Loading…
          </GlassPanel>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
