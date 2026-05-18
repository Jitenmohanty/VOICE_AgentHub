"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Crown,
  Mail,
  Trash2,
  Copy,
  Check,
  X,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GradientButton } from "@/components/ui/gradient-button";
import { formatIST } from "@/lib/format-date";

interface TeamUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface Member {
  id: string;
  role: string;
  joinedAt: string;
  user: TeamUser;
}

interface InviteRow {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
}

interface TeamResponse {
  owner: TeamUser;
  members: Member[];
  invites: InviteRow[];
  currentUserIsOwner: boolean;
}

interface BusinessLite {
  id: string;
  name: string;
}

function initialsOf(name: string | null, email: string): string {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0]?.[0] ?? "?").toUpperCase();
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

function timeUntil(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days >= 1) return `${days}d left`;
  const hours = Math.floor(ms / (60 * 60 * 1000));
  if (hours >= 1) return `${hours}h left`;
  return "<1h left";
}

export default function TeamPage() {
  const [business, setBusiness] = useState<BusinessLite | null>(null);
  const [bootLoading, setBootLoading] = useState(true);

  const [team, setTeam] = useState<TeamResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [copyId, setCopyId] = useState<string | null>(null);
  const [lastFallbackLink, setLastFallbackLink] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/business")
      .then((r) => r.json())
      .then((d) => setBusiness(d.businesses?.[0] || null))
      .catch(() => {})
      .finally(() => setBootLoading(false));
  }, []);

  const loadTeam = useCallback(
    async (silent = false) => {
      if (!business) return;
      if (!silent) setLoading(true);
      try {
        const res = await fetch(`/api/business/${business.id}/team`);
        if (!res.ok) throw new Error();
        const data: TeamResponse = await res.json();
        setTeam(data);
      } catch {
        toast.error("Couldn't load team");
      } finally {
        setLoading(false);
      }
    },
    [business],
  );

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !inviteEmail.trim()) return;
    setInviting(true);
    setLastFallbackLink(null);
    try {
      const res = await fetch(`/api/business/${business.id}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Couldn't send invite");
        return;
      }
      toast.success(`Invite sent to ${data.invite.email}`);
      // Show a copy-able fallback link in case the email fails to deliver.
      if (data.invite?.token) {
        setLastFallbackLink(`${window.location.origin}/invites/${data.invite.token}`);
      }
      setInviteEmail("");
      loadTeam(true);
    } catch {
      toast.error("Couldn't send invite");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, name: string) => {
    if (!business) return;
    if (!confirm(`Remove ${name} from the team?`)) return;
    try {
      const res = await fetch(`/api/business/${business.id}/team/${memberId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Member removed");
      loadTeam(true);
    } catch {
      toast.error("Couldn't remove member");
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!business) return;
    try {
      const res = await fetch(`/api/business/${business.id}/invites/${inviteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Invite revoked");
      loadTeam(true);
    } catch {
      toast.error("Couldn't revoke invite");
    }
  };

  const copyFallback = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopyId("fallback");
    toast.success("Invite link copied");
    setTimeout(() => setCopyId(null), 2000);
  };

  if (bootLoading) {
    return (
      <div className="max-w-4xl mx-auto px-2 py-6 md:p-10 space-y-6">
        <div>
          <div className="h-3 w-12 bg-white/[0.06] rounded animate-pulse mb-3" />
          <div className="h-9 w-32 bg-white/[0.06] rounded-lg animate-pulse" />
        </div>
        <GlassPanel elevation="subtle" radius="lg" className="p-6 animate-pulse">
          <div className="h-32 bg-white/[0.04] rounded-2xl" />
        </GlassPanel>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="max-w-4xl mx-auto px-2 py-6 md:p-10">
        <GlassPanel elevation="subtle" radius="lg" className="text-center py-16 px-6">
          <Users className="w-12 h-12 text-white/15 mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-white/65">No business yet</p>
        </GlassPanel>
      </div>
    );
  }

  const isOwner = team?.currentUserIsOwner ?? false;

  return (
    <div className="max-w-4xl mx-auto px-2 py-6 md:p-10 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/40 mb-2">Collaborators</p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-white">Team</h1>
        <p className="text-sm text-white/55 mt-1.5">
          Invite teammates to view and manage <span className="text-white/85">{business.name}</span>.
        </p>
      </motion.div>

      {/* Invite form — owner only */}
      {isOwner && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <GlassPanel elevation="raised" radius="lg" className="p-6 md:p-7 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-300/20 flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-violet-300" strokeWidth={2} />
              </div>
              <div>
                <h2 className="font-semibold text-white text-lg tracking-tight">Invite a teammate</h2>
                <p className="text-xs text-white/45 mt-0.5">
                  They&apos;ll get an email with a link that expires in 7 days.
                </p>
              </div>
            </div>
            <form onSubmit={handleInvite} className="flex gap-2.5 flex-wrap">
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@example.com"
                required
                className="flex-1 min-w-[200px]"
              />
              <GradientButton type="submit" disabled={inviting || !inviteEmail.trim()}>
                {inviting ? (
                  <>
                    <span className="ah-spinner" /> Sending…
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" /> Send invite
                  </>
                )}
              </GradientButton>
            </form>
            <AnimatePresence>
              {lastFallbackLink && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3.5 rounded-2xl bg-violet-500/[0.06] border border-violet-300/20"
                >
                  <p className="text-[11px] font-medium text-violet-200 uppercase tracking-[0.18em] mb-1.5">
                    Backup invite link
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-white/75 truncate flex-1 break-all">
                      {lastFallbackLink}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyFallback(lastFallbackLink)}
                      className="p-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-white/75 hover:bg-white/[0.08] transition-all shrink-0"
                      aria-label="Copy link"
                    >
                      {copyId === "fallback" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-white/45 mt-2">
                    Copy this in case the email doesn&apos;t arrive — same effect either way.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassPanel>
        </motion.div>
      )}

      {/* Members list */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <GlassPanel elevation="raised" radius="lg" className="p-6 md:p-7 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-300/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-cyan-300" strokeWidth={2} />
            </div>
            <div>
              <h2 className="font-semibold text-white text-lg tracking-tight">Members</h2>
              <p className="text-xs text-white/45 mt-0.5">
                {team
                  ? `${1 + team.members.length} ${1 + team.members.length === 1 ? "person" : "people"}`
                  : "Loading…"}
              </p>
            </div>
          </div>

          {loading || !team ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-white/[0.04] rounded-2xl border border-white/[0.06] animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <MemberRow user={team.owner} role="owner" />
              {team.members.map((m) => (
                <MemberRow
                  key={m.id}
                  user={m.user}
                  role={m.role}
                  joinedAt={m.joinedAt}
                  onRemove={isOwner ? () => handleRemoveMember(m.id, m.user.name || m.user.email) : undefined}
                />
              ))}
            </div>
          )}
        </GlassPanel>
      </motion.div>

      {/* Pending invites — only visible if there are any */}
      {team && team.invites.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <GlassPanel elevation="raised" radius="lg" className="p-6 md:p-7 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-300/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-300" strokeWidth={2} />
              </div>
              <div>
                <h2 className="font-semibold text-white text-lg tracking-tight">Pending invites</h2>
                <p className="text-xs text-white/45 mt-0.5">
                  {team.invites.length} awaiting acceptance.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {team.invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-white/55" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{invite.email}</p>
                      <p className="text-[11px] text-white/45 mt-0.5">
                        Invited {formatIST(invite.createdAt)} · {timeUntil(invite.expiresAt)}
                      </p>
                    </div>
                  </div>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => handleRevokeInvite(invite.id)}
                      className="p-2 rounded-lg text-white/40 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
                      aria-label="Revoke invite"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </GlassPanel>
        </motion.div>
      )}
    </div>
  );
}

function MemberRow({
  user,
  role,
  joinedAt,
  onRemove,
}: {
  user: TeamUser;
  role: string;
  joinedAt?: string;
  onRemove?: () => void;
}) {
  const isOwner = role === "owner";
  return (
    <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold shrink-0 ${
            isOwner
              ? "ah-gradient-bg text-white shadow-[0_4px_16px_-4px_rgba(124,58,237,0.5)]"
              : "bg-white/[0.04] border border-white/10 text-white/75"
          }`}
        >
          {initialsOf(user.name, user.email)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {user.name || user.email.split("@")[0]}
          </p>
          <p className="text-xs text-white/55 truncate">{user.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-medium border capitalize inline-flex items-center gap-1 ${
            isOwner
              ? "bg-violet-500/15 text-violet-300 border-violet-300/25"
              : "bg-white/[0.04] text-white/65 border-white/10"
          }`}
        >
          {isOwner && <Crown className="w-2.5 h-2.5" />}
          {role}
        </span>
        {joinedAt && (
          <span className="hidden md:inline text-[11px] text-white/40">{formatIST(joinedAt)}</span>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-2 rounded-lg text-white/40 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
            aria-label="Remove member"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
