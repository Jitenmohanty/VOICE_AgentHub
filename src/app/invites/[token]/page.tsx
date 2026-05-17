"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, CheckCircle, AlertTriangle, Clock, Mail, LogIn } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GradientButton } from "@/components/ui/gradient-button";

interface InvitePreview {
  email: string;
  businessName: string;
  businessSlug: string;
  inviterName: string | null;
  expiresAt: string;
}

type State =
  | { kind: "loading" }
  | { kind: "preview"; invite: InvitePreview }
  | { kind: "error"; message: string }
  | { kind: "accepted"; businessId: string };

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  const [state, setState] = useState<State>({ kind: "loading" });
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!token) {
      setState({ kind: "error", message: "Missing invite token." });
      return;
    }
    fetch(`/api/invites/${token}`)
      .then(async (r) => {
        if (r.ok) {
          const data: InvitePreview = await r.json();
          setState({ kind: "preview", invite: data });
        } else {
          const data = await r.json().catch(() => ({}));
          setState({ kind: "error", message: data.error || "Invite is no longer valid." });
        }
      })
      .catch(() => setState({ kind: "error", message: "Couldn't load this invite." }));
  }, [token]);

  // After login, the user returns here; auto-accept once we have a session.
  useEffect(() => {
    if (state.kind !== "preview") return;
    if (authStatus !== "authenticated" || !session?.user?.email) return;
    if (session.user.email.toLowerCase() !== state.invite.email.toLowerCase()) return;
    handleAccept();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, session?.user?.email, state.kind]);

  const handleAccept = async () => {
    if (accepting || state.kind !== "preview") return;
    setAccepting(true);
    try {
      const res = await fetch(`/api/invites/${token}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Couldn't accept invite");
        setAccepting(false);
        return;
      }
      toast.success(`Welcome to ${state.invite.businessName}`);
      setState({ kind: "accepted", businessId: data.businessId });
      setTimeout(() => router.push("/business/dashboard"), 1200);
    } catch {
      toast.error("Something went wrong. Try again.");
      setAccepting(false);
    }
  };

  const renderInner = () => {
    if (state.kind === "loading") {
      return (
        <GlassPanel elevation="raised" radius="lg" className="p-8 text-center">
          <span className="ah-spinner ah-spinner-violet text-2xl" />
          <p className="text-sm text-white/55 mt-4">Checking invite…</p>
        </GlassPanel>
      );
    }

    if (state.kind === "error") {
      return (
        <GlassPanel elevation="raised" radius="lg" className="p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-300/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-rose-300" strokeWidth={2} />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Invite unavailable</h2>
          <p className="text-sm text-white/55 mb-5 max-w-xs mx-auto">{state.message}</p>
          <GradientButton href="/business/dashboard" size="sm">
            Go to dashboard
          </GradientButton>
        </GlassPanel>
      );
    }

    if (state.kind === "accepted") {
      return (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
          <GlassPanel elevation="raised" radius="lg" className="p-8 text-center">
            <div className="w-14 h-14 rounded-2xl ah-gradient-bg flex items-center justify-center mx-auto mb-4 shadow-[0_8px_24px_-8px_rgba(124,58,237,0.5)]">
              <CheckCircle className="w-7 h-7 text-white" strokeWidth={2} />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">You&apos;re in!</h2>
            <p className="text-sm text-white/55">Redirecting to the dashboard…</p>
          </GlassPanel>
        </motion.div>
      );
    }

    // kind === "preview"
    const invite = state.invite;
    const expires = new Date(invite.expiresAt);
    const expiresLabel = expires.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const sameEmail =
      authStatus === "authenticated" &&
      session?.user?.email?.toLowerCase() === invite.email.toLowerCase();

    const wrongEmail =
      authStatus === "authenticated" &&
      !!session?.user?.email &&
      session.user.email.toLowerCase() !== invite.email.toLowerCase();

    return (
      <GlassPanel elevation="raised" radius="lg" className="p-8 text-center">
        <div className="w-14 h-14 rounded-2xl ah-gradient-bg flex items-center justify-center mx-auto mb-4 shadow-[0_8px_24px_-8px_rgba(124,58,237,0.5)]">
          <Users className="w-7 h-7 text-white" strokeWidth={2} />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-white mb-2">
          You&apos;re invited to <span className="ah-gradient-text">{invite.businessName}</span>
        </h2>
        <p className="text-sm text-white/55 mb-1">
          {invite.inviterName ? `${invite.inviterName} added you` : "You were added"} as a teammate.
        </p>

        <div className="my-6 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-left space-y-2.5">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-3.5 h-3.5 text-violet-300" />
            <span className="text-white/55">Sent to</span>
            <span className="font-mono text-white truncate">{invite.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-3.5 h-3.5 text-cyan-300" />
            <span className="text-white/55">Expires</span>
            <span className="text-white">{expiresLabel}</span>
          </div>
        </div>

        {authStatus === "loading" ? (
          <span className="ah-spinner ah-spinner-violet text-xl mx-auto block" />
        ) : sameEmail ? (
          <GradientButton onClick={handleAccept} disabled={accepting} className="w-full" size="lg">
            {accepting ? (
              <>
                <span className="ah-spinner" /> Accepting…
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" /> Accept invitation
              </>
            )}
          </GradientButton>
        ) : wrongEmail ? (
          <div className="space-y-3">
            <p className="text-xs text-rose-300 px-2">
              You&apos;re signed in as <span className="font-mono">{session?.user?.email}</span>, but this
              invite is for <span className="font-mono">{invite.email}</span>.
            </p>
            <GradientButton
              onClick={() => signIn(undefined, { callbackUrl: `/invites/${token}` })}
              variant="outline"
              className="w-full"
            >
              <LogIn className="w-4 h-4" /> Switch account
            </GradientButton>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-white/55 px-2">
              Sign in with <span className="font-mono text-white">{invite.email}</span> to accept.
            </p>
            <GradientButton
              href={`/login?callbackUrl=${encodeURIComponent(`/invites/${token}`)}`}
              className="w-full"
              size="lg"
            >
              <LogIn className="w-4 h-4" /> Sign in to accept
            </GradientButton>
            <p className="text-[11px] text-white/45">
              Don&apos;t have an account?{" "}
              <Link
                href={`/register?callbackUrl=${encodeURIComponent(`/invites/${token}`)}`}
                className="ah-gradient-text font-medium hover:opacity-80"
              >
                Sign up
              </Link>
            </p>
          </div>
        )}
      </GlassPanel>
    );
  };

  return (
    <AuthShell title="Team invitation" subtitle="Confirm the invite to join the business">
      {renderInner()}
    </AuthShell>
  );
}
