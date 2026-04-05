"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, KeyRound, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

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
      <div className="glass rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">
          Invalid reset link
        </h2>
        <p className="text-[#8888AA] text-sm mb-4">
          This reset link is missing or malformed.
        </p>
        <Link
          href="/forgot-password"
          className="text-[#00D4FF] text-sm hover:underline"
        >
          Request a new link
        </Link>
      </div>
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
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-2xl p-8 text-center"
      >
        <div className="w-14 h-14 rounded-full bg-[#00D4FF]/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-7 h-7 text-[#00D4FF]" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">
          Password updated!
        </h2>
        <p className="text-[#8888AA] text-sm">
          Redirecting you to sign in…
        </p>
      </motion.div>
    );
  }

  return (
    <div className="glass rounded-2xl p-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="password" className="text-[#8888AA]">
            New password
          </Label>
          <div className="relative mt-1">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
              minLength={8}
              className="bg-white/5 border-[#2A2A3E] focus:border-[#00D4FF] text-white pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8888AA] hover:text-white transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {password.length > 0 && password.length < 8 && (
            <p className="mt-1 text-xs text-red-400">
              At least 8 characters required
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="confirm" className="text-[#8888AA]">
            Confirm new password
          </Label>
          <Input
            id="confirm"
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            required
            className="mt-1 bg-white/5 border-[#2A2A3E] focus:border-[#00D4FF] text-white"
          />
          {confirm.length > 0 && confirm !== password && (
            <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading || password.length < 8 || password !== confirm}
          className="w-full bg-linear-to-r from-[#00D4FF] to-[#6366F1] text-white border-0 hover:opacity-90"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Updating...
            </span>
          ) : (
            <>
              <KeyRound className="w-4 h-4 mr-2" />
              Set new password
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] px-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#00D4FF]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#6366F1]/5 rounded-full blur-3xl" />

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
            Set new password
          </h1>
          <p className="text-[#8888AA]">Choose a strong password for your account</p>
        </div>

        <Suspense fallback={<div className="glass rounded-2xl p-8 text-center text-[#8888AA]">Loading…</div>}>
          <ResetPasswordForm />
        </Suspense>

        <p className="text-center mt-6 text-[#8888AA] text-sm">
          Remember your password?{" "}
          <Link href="/login" className="text-[#00D4FF] hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
