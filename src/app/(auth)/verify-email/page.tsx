"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

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
          setState({
            kind: "error",
            message: data.error || "Verification failed.",
          });
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
      <div className="glass rounded-2xl p-8 text-center">
        <Loader2 className="w-8 h-8 text-[#00D4FF] mx-auto mb-3 animate-spin" />
        <p className="text-[#8888AA] text-sm">Verifying your email…</p>
      </div>
    );
  }

  if (state.kind === "success") {
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
          {state.alreadyVerified ? "Already verified" : "Email verified!"}
        </h2>
        <p className="text-[#8888AA] text-sm mb-6">
          {state.alreadyVerified
            ? "Your account was already active. You can sign in."
            : "Your account is active. You can now sign in to AgentHub."}
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-2.5 rounded-lg bg-linear-to-r from-[#00D4FF] to-[#6366F1] text-white text-sm font-medium hover:opacity-90"
        >
          Sign in
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="glass rounded-2xl p-8 text-center">
      <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-7 h-7 text-red-400" />
      </div>
      <h2 className="text-lg font-semibold text-white mb-2">
        Verification failed
      </h2>
      <p className="text-[#8888AA] text-sm mb-4">{state.message}</p>
      <Link
        href="/verify-email-sent"
        className="text-[#00D4FF] text-sm hover:underline"
      >
        Request a new verification email
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
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
            Email verification
          </h1>
        </div>

        <Suspense
          fallback={
            <div className="glass rounded-2xl p-8 text-center text-[#8888AA]">
              Loading…
            </div>
          }
        >
          <VerifyInner />
        </Suspense>
      </motion.div>
    </div>
  );
}
