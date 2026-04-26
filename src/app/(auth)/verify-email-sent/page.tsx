"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, MailCheck, Send } from "lucide-react";
import { toast } from "sonner";

function VerifySentInner() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Enter your email address");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        toast.error("Could not send verification email. Try again later.");
        return;
      }
      setSent(true);
      toast.success("Verification email sent. Check your inbox.");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-8">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-full bg-[#00D4FF]/10 flex items-center justify-center mx-auto mb-4">
          <MailCheck className="w-7 h-7 text-[#00D4FF]" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">
          Check your inbox
        </h2>
        <p className="text-[#8888AA] text-sm">
          We&apos;ve sent a verification link
          {initialEmail ? (
            <>
              {" "}to <strong className="text-white">{initialEmail}</strong>
            </>
          ) : null}
          . Click the link to activate your account, then sign in.
        </p>
      </div>

      <form onSubmit={handleResend} className="space-y-4">
        <div>
          <Label htmlFor="email" className="text-[#8888AA]">
            Didn&apos;t get it? Resend to
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
          disabled={loading || sent}
          className="w-full bg-linear-to-r from-[#00D4FF] to-[#6366F1] text-white border-0 hover:opacity-90"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending…
            </span>
          ) : sent ? (
            "Sent — check your inbox"
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Resend verification email
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

export default function VerifyEmailSentPage() {
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
            Verify your email
          </h1>
        </div>

        <Suspense
          fallback={
            <div className="glass rounded-2xl p-8 text-center text-[#8888AA]">
              Loading…
            </div>
          }
        >
          <VerifySentInner />
        </Suspense>

        <p className="text-center mt-6 text-[#8888AA] text-sm">
          Already verified?{" "}
          <Link href="/login" className="text-[#00D4FF] hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
