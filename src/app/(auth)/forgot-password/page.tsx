"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GradientButton } from "@/components/ui/gradient-button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Something went wrong");
        return;
      }
      setSent(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a reset link"
      footer={
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to sign in
        </Link>
      }
    >
      <GlassPanel elevation="raised" radius="lg" className="p-8">
        {sent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-2"
          >
            <div className="w-14 h-14 rounded-2xl ah-gradient-bg flex items-center justify-center mx-auto mb-4 shadow-[0_8px_24px_-8px_rgba(124,58,237,0.5)]">
              <CheckCircle className="w-7 h-7 text-white" strokeWidth={2} />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Check your inbox</h2>
            <p className="text-sm text-white/60 leading-relaxed">
              If <span className="text-white">{email}</span> is registered, you&apos;ll receive a
              password reset link shortly. The link expires in 1 hour.
            </p>
            <p className="text-xs text-white/40 mt-5">
              Didn&apos;t receive it? Check your spam folder or{" "}
              <button
                onClick={() => setSent(false)}
                className="ah-gradient-text font-medium hover:opacity-80"
              >
                try again
              </button>
              .
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email address</Label>
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
            <GradientButton type="submit" disabled={loading} className="w-full">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="ah-spinner" />
                  Sending…
                </span>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Send reset link
                </>
              )}
            </GradientButton>
          </form>
        )}
      </GlassPanel>
    </AuthShell>
  );
}
