"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GradientButton } from "@/components/ui/gradient-button";

type State =
  | { kind: "loading" }
  | { kind: "success"; alreadyVerified: boolean }
  | { kind: "error"; message: string };

function VerifyInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!token) {
      setState({ kind: "error", message: "Missing verification token." });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setState({ kind: "error", message: data.error || "Verification failed." });
          return;
        }
        setState({ kind: "success", alreadyVerified: !!data.alreadyVerified });
      } catch {
        if (!cancelled) {
          setState({ kind: "error", message: "Something went wrong." });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state.kind === "loading") {
    return (
      <GlassPanel elevation="raised" radius="lg" className="p-10 text-center">
        <Loader2 className="w-8 h-8 text-violet-300 mx-auto mb-3 animate-spin" />
        <p className="text-sm text-white/55">Verifying your email…</p>
      </GlassPanel>
    );
  }

  if (state.kind === "success") {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
        <GlassPanel elevation="raised" radius="lg" className="p-8 text-center">
          <div className="w-14 h-14 rounded-2xl ah-gradient-bg flex items-center justify-center mx-auto mb-4 shadow-[0_8px_24px_-8px_rgba(124,58,237,0.5)]">
            <CheckCircle className="w-7 h-7 text-white" strokeWidth={2} />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">
            {state.alreadyVerified ? "Already verified" : "Email verified!"}
          </h2>
          <p className="text-sm text-white/60 mb-6">
            {state.alreadyVerified
              ? "Your account was already active. You can sign in."
              : "Your account is active. You can now sign in to Voxie."}
          </p>
          <GradientButton href="/login" size="default">
            Sign in
          </GradientButton>
        </GlassPanel>
      </motion.div>
    );
  }

  return (
    <GlassPanel elevation="raised" radius="lg" className="p-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-300/20 flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-7 h-7 text-rose-300" strokeWidth={2} />
      </div>
      <h2 className="text-lg font-semibold text-white mb-2">Verification failed</h2>
      <p className="text-sm text-white/55 mb-4">{state.message}</p>
      <Link href="/verify-email-sent" className="text-sm ah-gradient-text font-medium hover:opacity-80">
        Request a new verification email
      </Link>
    </GlassPanel>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthShell title="Email verification">
      <Suspense
        fallback={
          <GlassPanel elevation="raised" radius="lg" className="p-8 text-center text-sm text-white/55">
            Loading…
          </GlassPanel>
        }
      >
        <VerifyInner />
      </Suspense>
    </AuthShell>
  );
}
