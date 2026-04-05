"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { toast } from "sonner";

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
            Forgot password?
          </h1>
          <p className="text-[#8888AA]">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <div className="glass rounded-2xl p-8">
          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="w-14 h-14 rounded-full bg-[#00D4FF]/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-[#00D4FF]" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">
                Check your inbox
              </h2>
              <p className="text-[#8888AA] text-sm leading-relaxed">
                If <span className="text-white">{email}</span> is registered,
                you&apos;ll receive a password reset link shortly. The link
                expires in 1 hour.
              </p>
              <p className="text-[#555577] text-xs mt-4">
                Didn&apos;t receive it? Check your spam folder or{" "}
                <button
                  onClick={() => setSent(false)}
                  className="text-[#00D4FF] hover:underline"
                >
                  try again
                </button>
                .
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-[#8888AA]">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="mt-1 bg-white/5 border-[#2A2A3E] focus:border-[#00D4FF] text-white"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-linear-to-r from-[#00D4FF] to-[#6366F1] text-white border-0 hover:opacity-90"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send reset link
                  </>
                )}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-[#8888AA] text-sm">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-[#00D4FF] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
