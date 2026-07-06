"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, MessageCircle, User, Bot, Hand, Play, UserCheck } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { GlassPanel } from "@/components/ui/glass-panel";
import { formatIST } from "@/lib/format-date";

interface ChatMessage {
  role: "user" | "agent";
  text: string;
  at: string;
}

interface Conversation {
  id: string;
  fromNumber: string;
  messages: ChatMessage[];
  capturedLead: { name?: string; intent?: string } | null;
  sessionId: string | null;
  lastInboundAt: string;
  humanTakeoverUntil: string | null;
}

export default function WhatsAppConversationsPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const businessId = useSearchParams().get("bid") || "";
  const base = `/api/business/${businessId}/agents/${agentId}/whatsapp`;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchConversations = useCallback(() => {
    fetch(base)
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [base]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const setTakeover = async (id: string, takeover: boolean) => {
    setUpdating(id);
    try {
      const res = await fetch(`${base}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ takeover }),
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, humanTakeoverUntil: d.conversation.humanTakeoverUntil } : c)));
      toast.success(takeover ? "AI paused for 4 hours — you've got this thread" : "AI resumed on this thread");
    } catch {
      toast.error("Couldn't update");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-2 py-6 md:p-10">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-7">
        <Link
          href={`/business/agents/${agentId}?bid=${businessId}`}
          className="inline-flex items-center gap-1.5 text-sm text-white/55 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to agent
        </Link>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/40 mb-2">Omnichannel</p>
        <h1 className="font-serif text-3xl md:text-4xl tracking-[-0.02em] text-white">WhatsApp conversations</h1>
        <p className="text-base text-white/55 mt-2">
          Your agent answers WhatsApp messages with the same brain as voice calls. Take over any thread when you want to reply personally.
        </p>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-2xl p-5 animate-pulse">
              <div className="h-5 w-1/4 bg-white/[0.06] rounded mb-2" />
              <div className="h-4 w-2/3 bg-white/[0.06] rounded" />
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <GlassPanel elevation="subtle" radius="lg" className="text-center py-16 px-6">
          <MessageCircle className="w-12 h-12 text-white/15 mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-white/65">No WhatsApp conversations yet</p>
          <p className="text-sm text-white/40 mt-1 max-w-md mx-auto">
            Enable WhatsApp in Settings and point your BSP webhook at Voxie — inbound chats will appear here.
          </p>
        </GlassPanel>
      ) : (
        <div className="space-y-3">
          {conversations.map((c, i) => {
            const takeoverActive = !!c.humanTakeoverUntil && new Date(c.humanTakeoverUntil) > new Date();
            const last = c.messages[c.messages.length - 1];
            const open = openId === c.id;
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, duration: 0.3 }}>
                <GlassPanel elevation="subtle" radius="md" className="p-5">
                  <button type="button" className="w-full text-left" onClick={() => setOpenId(open ? null : c.id)}>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono text-white font-medium">+{c.fromNumber}</span>
                        {c.capturedLead && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium border bg-emerald-500/15 text-emerald-300 border-emerald-300/25 inline-flex items-center gap-1">
                            <UserCheck className="w-2.5 h-2.5" /> Lead captured
                          </span>
                        )}
                        {takeoverActive && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium border bg-amber-500/10 text-amber-300 border-amber-300/20 inline-flex items-center gap-1">
                            <Hand className="w-2.5 h-2.5" /> You&apos;re on this thread
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-white/40">{formatIST(c.lastInboundAt)}</span>
                    </div>
                    {!open && last && (
                      <p className="text-sm text-white/55 line-clamp-1 mt-2">
                        {last.role === "user" ? "Them: " : "AI: "}
                        {last.text}
                      </p>
                    )}
                  </button>

                  {open && (
                    <div className="mt-4 space-y-3">
                      <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
                        {c.messages.map((m, mi) => (
                          <div key={mi} className={`flex gap-2 ${m.role === "user" ? "" : "flex-row-reverse"}`}>
                            <div className="w-6 h-6 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                              {m.role === "user" ? (
                                <User className="w-3 h-3 text-emerald-300" strokeWidth={2} />
                              ) : (
                                <Bot className="w-3 h-3 text-violet-300" strokeWidth={2} />
                              )}
                            </div>
                            <div
                              className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                                m.role === "user"
                                  ? "bg-emerald-500/10 border border-emerald-300/15 text-white/90"
                                  : "bg-white/[0.04] border border-white/10 text-white/80"
                              }`}
                            >
                              {m.text}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={updating === c.id}
                          onClick={() => setTakeover(c.id, !takeoverActive)}
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all ah-focus-ring disabled:opacity-50 ${
                            takeoverActive
                              ? "bg-violet-500/15 text-violet-200 border-violet-300/25 hover:bg-violet-500/25"
                              : "bg-amber-500/10 text-amber-300 border-amber-300/20 hover:bg-amber-500/20"
                          }`}
                        >
                          {takeoverActive ? (
                            <>
                              <Play className="w-3 h-3" /> Resume AI
                            </>
                          ) : (
                            <>
                              <Hand className="w-3 h-3" /> Take over from AI
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </GlassPanel>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
