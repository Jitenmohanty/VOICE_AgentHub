"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MailCheck, Send } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GradientButton } from "@/components/ui/gradient-button";

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
    <GlassPanel elevation="raised" radius="lg" className="p-8">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl ah-gradient-bg flex items-center justify-center mx-auto mb-4 shadow-[0_8px_24px_-8px_rgba(124,58,237,0.5)]">
          <MailCheck className="w-7 h-7 text-white" strokeWidth={2} />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Check your inbox</h2>
        <p className="text-sm text-white/60 leading-relaxed">
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
          <Label htmlFor="email">
            Didn&apos;t get it? Resend to
          </Label>
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
        <GradientButton type="submit" disabled={loading || sent} className="w-full">
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="ah-spinner" />
              Sending…
            </span>
          ) : sent ? (
            "Sent — check your inbox"
          ) : (
            <>
              <Send className="w-4 h-4" />
              Resend verification email
            </>
          )}
        </GradientButton>
      </form>
    </GlassPanel>
  );
}

export default function VerifyEmailSentPage() {
  return (
    <AuthShell
      title="Verify your email"
      footer={
        <>
          Already verified?{" "}
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
        <VerifySentInner />
      </Suspense>
    </AuthShell>
  );
}
