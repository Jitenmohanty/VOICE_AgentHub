"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Sparkles, Mic, MicOff, PhoneOff, Clock } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GeminiLiveSession } from "@/lib/gemini/live-session";
import { useAudioStream } from "@/hooks/useAudioStream";
import { AgentAvatar } from "@/components/agent/AgentAvatar";
import { AudioVisualizer } from "@/components/agent/AudioVisualizer";
import { TranscriptPanel } from "@/components/agent/TranscriptPanel";
import { RatingModal } from "@/components/dashboard/RatingModal";
import { ConnectionLoader } from "@/components/shared/LoadingStates";
import { InterviewPreCallForm, type CandidateContext } from "@/components/agent/InterviewPreCallForm";
import { RestaurantPreCall, type MenuItem } from "@/components/public/RestaurantPreCall";
import { MedicalPreCall, type DoctorInfo } from "@/components/public/MedicalPreCall";
import { LegalPreCall } from "@/components/public/LegalPreCall";
import { PersonalPreCall } from "@/components/public/PersonalPreCall";
import { LanguagePicker } from "@/components/agent/LanguagePicker";
import { DEFAULT_LANGUAGE_CODE, normalizeLanguage } from "@/lib/languages";
import type { TranscriptMessage } from "@/types/session";
import type { ConnectionState } from "@/types/gemini";

interface AgentInfo {
  id: string;
  name: string;
  greeting: string | null;
  templateType: string;
  config: Record<string, unknown>;
  accentColor: string;
  icon: string;
  defaultLanguage?: string;
}

interface BusinessInfo {
  name: string;
  logoUrl: string | null;
  slug: string;
}

export type AgentExperienceMode = "standalone" | "embed";

interface Props {
  slug: string;
  mode?: AgentExperienceMode;
}

/**
 * The full voice-call UX rendered both at /a/[slug] (standalone page) and
 * /embed/[slug] (iframe widget). Embed mode hides chrome (header) and uses
 * height-100% layout so it sizes to its container instead of the viewport.
 */
export function PublicAgentExperience({ slug, mode = "standalone" }: Props) {
  const isEmbed = mode === "embed";

  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Template-specific pre-call state
  const [publicData, setPublicData] = useState<{ templateType: string; data: { dataType: string; data: unknown }[] } | null>(null);
  const [candidateContext, setCandidateContext] = useState<CandidateContext | null>(null);
  const [preCallDone, setPreCallDone] = useState(false);

  // Caller-chosen language (BCP-47). Defaults to the agent's owner-configured
  // default once the metadata fetch lands; caller can override it before
  // tapping Start Call. Locked once the call begins.
  const [selectedLanguage, setSelectedLanguage] = useState<string>(DEFAULT_LANGUAGE_CODE);

  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [isAgentSpeaking, setAgentSpeaking] = useState(false);
  const [isMuted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const CALL_LIMIT_SECONDS = 9 * 60; // 9 min — 1 min buffer before Gemini's 10-min hard limit
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showEndingWarning, setShowEndingWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showRating, setShowRating] = useState(false);

  const sessionRef = useRef<GeminiLiveSession | null>(null);
  const activeRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const savedRef = useRef(false);
  const partialIds = useRef<{ user?: string; agent?: string }>({});
  const updateTokenRef = useRef<string | null>(null);
  // The session.on(...) handler and the call-limit interval are both
  // registered ONCE at connect-time and never re-bound. They must call the
  // *latest* handleEndCall, otherwise after 8+ minutes of conversation the
  // stale closure would PATCH only the transcript snapshot from connect-time.
  const handleEndCallRef = useRef<() => Promise<void> | void>(() => {});

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      fetch(`/api/public/agent/${slug}`)
        .then((res) => { if (!res.ok) throw new Error(); return res.json(); }),
      fetch(`/api/public/agent/${slug}/data`)
        .then((res) => res.ok ? res.json() : null)
        .catch(() => null),
    ])
      .then(([agentData, data]) => {
        setAgentInfo(agentData.agent);
        setBusinessInfo(agentData.business);
        if (data) setPublicData(data);
        // Seed the caller's picker with the owner's default. Normalized to
        // tolerate legacy bare codes ("en" → "en-US").
        if (agentData.agent?.defaultLanguage) {
          setSelectedLanguage(normalizeLanguage(agentData.agent.defaultLanguage));
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const { startCapture, stopCapture } = useAudioStream({
    onAudioData: (b64) => { if (activeRef.current) sessionRef.current?.sendAudio(b64); },
    onAnalyserReady: (node) => setAnalyserNode(node),
  });

  useEffect(() => {
    if (connectionState === "connected") {
      setElapsedSeconds(0);
      setShowEndingWarning(false);
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => {
          const next = s + 1;
          const rem = CALL_LIMIT_SECONDS - next;
          if (rem === 60) setShowEndingWarning(true);
          if (rem <= 0) void handleEndCallRef.current?.();
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setShowEndingWarning(false);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionState]);

  const saveSession = useCallback(async () => {
    if (savedRef.current || !sessionId) return;
    const token = updateTokenRef.current;
    if (!token) return;
    savedRef.current = true;
    try {
      const interviewData = sessionRef.current?.getInterviewData();
      const patchBody: Record<string, unknown> = {
        duration: elapsedSeconds,
        transcript: transcript.map((m) => ({ speaker: m.speaker, text: m.text, timestamp: m.timestamp })),
        status: "completed",
      };
      if (interviewData) {
        patchBody.interviewData = interviewData;
      }
      await fetch(`/api/public/agent/${slug}/session/${sessionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(patchBody),
        keepalive: true,
      });
    } catch { savedRef.current = false; }
  }, [sessionId, slug, elapsedSeconds, transcript]);

  const connect = useCallback(async (callContext?: string) => {
    if (!agentInfo) return;
    try {
      setConnectionState("connecting");
      setError(null);
      setTranscript([]);
      setElapsedSeconds(0);
      savedRef.current = false;

      const body: Record<string, unknown> = { language: selectedLanguage };
      if (candidateContext) body.candidateContext = candidateContext;
      if (callContext) body.callContext = callContext;

      const res = await fetch(`/api/public/agent/${slug}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to create session");
      const data = await res.json();
      setSessionId(data.sessionId);
      updateTokenRef.current = data.updateToken ?? null;

      const session = new GeminiLiveSession(
        agentInfo.templateType,
        (data.agent?.config || {}) as Record<string, string | string[]>,
        {
          systemPrompt: data.systemPrompt,
          tools: data.tools,
          agentSlug: slug,
          voiceName: data.voiceName ?? null,
          language: data.language ?? selectedLanguage,
          sessionId: data.sessionId,
          updateToken: data.updateToken,
        },
      );

      session.on((event) => {
        switch (event.type) {
          case "connected":
            setConnectionState("connected");
            activeRef.current = true;
            startCapture().catch(() => {});
            break;
          case "disconnected":
            activeRef.current = false;
            setConnectionState("disconnected");
            stopCapture();
            break;
          case "agent-speaking": setAgentSpeaking(true); break;
          case "agent-done": setAgentSpeaking(false); break;
          case "transcript": {
            const d = event.data as { speaker: string; text: string; isPartial?: boolean };
            const speaker = d.speaker as "user" | "agent";
            if (d.isPartial) {
              const eid = partialIds.current[speaker];
              if (eid) {
                setTranscript((prev) => prev.map((m) => m.id === eid ? { ...m, text: d.text } : m));
              } else {
                const id = crypto.randomUUID();
                partialIds.current[speaker] = id;
                setTranscript((prev) => [...prev, { id, speaker, text: d.text, timestamp: new Date() }]);
              }
            } else {
              const eid = partialIds.current[speaker];
              if (eid) {
                setTranscript((prev) => prev.map((m) => m.id === eid ? { ...m, text: d.text } : m));
              } else {
                setTranscript((prev) => [...prev, { id: crypto.randomUUID(), speaker, text: d.text, timestamp: new Date() }]);
              }
              partialIds.current[speaker] = undefined;
            }
            break;
          }
          case "error":
            setError(typeof event.data === "string" ? event.data : "Connection error");
            setConnectionState("error");
            break;
          case "session-expiring":
            void handleEndCallRef.current?.();
            break;
        }
      });

      await session.connect(data.apiKey);
      sessionRef.current = session;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
      setConnectionState("error");
    }
  }, [agentInfo, slug, startCapture, stopCapture, candidateContext, selectedLanguage]);

  const disconnect = useCallback(() => {
    activeRef.current = false;
    stopCapture();
    sessionRef.current?.disconnect();
    sessionRef.current = null;
    setConnectionState("disconnected");
  }, [stopCapture]);

  const handleEndCall = useCallback(async () => {
    disconnect();
    await saveSession();
    setShowRating(true);
  }, [disconnect, saveSession]);

  // Keep the ref pointing at the freshest handleEndCall so the once-registered
  // session.on listener and the timer both invoke the up-to-date version.
  useEffect(() => {
    handleEndCallRef.current = handleEndCall;
  }, [handleEndCall]);

  useEffect(() => {
    const handler = () => { if (connectionState === "connected") saveSession(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [connectionState, saveSession]);

  useEffect(() => {
    return () => { activeRef.current = false; stopCapture(); sessionRef.current?.disconnect(); };
  }, [stopCapture]);

  const remaining = Math.max(0, CALL_LIMIT_SECONDS - elapsedSeconds);
  const fmtTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // Layout heights: standalone uses dvh so it fills the viewport; embed uses
  // h-full so it fills its iframe parent. Embed callers must set the iframe
  // height themselves (e.g. height="640").
  const rootHeight = isEmbed ? "h-full min-h-full" : "min-h-dvh";

  // ── Loading ──
  if (loading) {
    return (
      <div className={`${rootHeight} flex items-center justify-center bg-[#050816]`}>
        <div className="w-8 h-8 border-2 border-violet-300/30 border-t-violet-300 rounded-full animate-spin" />
      </div>
    );
  }

  // ── Not found ──
  if (notFound || !agentInfo || !businessInfo) {
    return (
      <div className={`${rootHeight} flex flex-col items-center justify-center bg-[#050816] text-center px-6`}>
        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-4">
          <Phone className="w-6 h-6 text-white/40" strokeWidth={1.75} />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-white mb-2">Agent not found</h1>
        <p className="text-sm text-white/55 max-w-xs">
          This link is invalid or the agent has been deactivated.
        </p>
      </div>
    );
  }

  const isConnected = connectionState === "connected";
  const isDisconnected = connectionState === "disconnected";
  const accentColor = agentInfo.accentColor;

  return (
    <div
      className={`${rootHeight} flex flex-col overflow-hidden relative`}
      style={{
        background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${accentColor}10, transparent 60%), #050816`,
      }}
    >
      {/* Soft aurora orbs — fixed, low opacity */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-32 -left-20 w-80 h-80 rounded-full blur-3xl opacity-25"
          style={{ background: `${accentColor}` }}
        />
        <div className="absolute -bottom-32 -right-20 w-80 h-80 rounded-full blur-3xl opacity-15 bg-cyan-500" />
      </div>

      {/* ── Header (standalone only) ── */}
      {!isEmbed && (
        <header className="relative shrink-0 flex items-center justify-center px-4 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div
                className="w-8 h-8 rounded-2xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}10)`,
                  border: `1px solid ${accentColor}30`,
                }}
              >
                <Sparkles className="w-3.5 h-3.5" style={{ color: accentColor }} strokeWidth={2.5} />
              </div>
            </div>
            <div className="text-center">
              <p className="font-semibold tracking-tight text-white text-sm leading-tight">
                {businessInfo.name}
              </p>
              <p className="text-[10px] text-white/45 leading-tight">{agentInfo.name}</p>
            </div>
          </div>
        </header>
      )}

      {/* ── Main content ── */}
      <main className={`relative flex-1 flex flex-col min-h-0 w-full max-w-lg mx-auto px-4 ${isEmbed ? "py-3" : "py-4 md:py-6"}`}>
        <AnimatePresence mode="sync">

          {/* ── Idle state ── */}
          {isDisconnected && !error && transcript.length === 0 && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col items-center justify-center gap-4 w-full"
            >
              {/* Universal language picker — caller selects the language they
                  want to speak in. Sits above every pre-call template so the
                  UX is consistent across hotel/restaurant/medical/legal/
                  personal/interview. */}
              <LanguagePicker
                value={selectedLanguage}
                onChange={setSelectedLanguage}
                accentColor={accentColor}
              />

              {/* Interview: pre-call form */}
              {agentInfo.templateType === "interview" && !preCallDone ? (
                <InterviewPreCallForm
                  agentName={agentInfo.name}
                  accentColor={accentColor}
                  ownerTechStack={
                    Array.isArray(agentInfo.config?.techStack)
                      ? (agentInfo.config.techStack as string[])
                      : []
                  }
                  onSubmit={(ctx) => {
                    setCandidateContext(ctx);
                    setPreCallDone(true);
                    connect();
                  }}
                />
              ) : agentInfo.templateType === "restaurant" && !preCallDone ? (
                <RestaurantPreCall
                  agentName={agentInfo.name}
                  businessName={businessInfo.name}
                  accentColor={accentColor}
                  menuItems={
                    (publicData?.data.find((d) => d.dataType === "menu")?.data as { items?: MenuItem[] })?.items ?? []
                  }
                  onStartCall={(ctx) => {
                    setPreCallDone(true);
                    connect(ctx);
                  }}
                />
              ) : agentInfo.templateType === "medical" && !preCallDone ? (
                <MedicalPreCall
                  agentName={agentInfo.name}
                  businessName={businessInfo.name}
                  accentColor={accentColor}
                  doctors={
                    (publicData?.data.find((d) => d.dataType === "doctors")?.data as { doctors?: DoctorInfo[] })?.doctors ?? []
                  }
                  onStartCall={(ctx) => {
                    setPreCallDone(true);
                    connect(ctx);
                  }}
                />
              ) : agentInfo.templateType === "legal" && !preCallDone ? (
                <LegalPreCall
                  agentName={agentInfo.name}
                  businessName={businessInfo.name}
                  accentColor={accentColor}
                  practiceAreas={[
                    ...(agentInfo.config?.legalArea ? [agentInfo.config.legalArea as string] : []),
                    ...(Array.isArray(agentInfo.config?.additionalAreas)
                      ? (agentInfo.config.additionalAreas as string[])
                      : []),
                  ]}
                  onStartCall={(ctx) => {
                    setPreCallDone(true);
                    connect(ctx);
                  }}
                />
              ) : agentInfo.templateType === "personal" && !preCallDone ? (
                /* Personal: portfolio AI — minimal pre-call */
                <PersonalPreCall
                  fullName={(agentInfo.config?.fullName as string) || businessInfo.name}
                  role={(agentInfo.config?.role as string) || ""}
                  briefBio={(agentInfo.config?.briefBio as string) || ""}
                  techStack={Array.isArray(agentInfo.config?.techStack) ? (agentInfo.config.techStack as string[]) : []}
                  links={{
                    linkedin: (agentInfo.config?.linkedinUrl as string) || undefined,
                    github: (agentInfo.config?.githubUrl as string) || undefined,
                    website: (agentInfo.config?.websiteUrl as string) || undefined,
                  }}
                  accentColor={accentColor}
                  onStartCall={() => {
                    setPreCallDone(true);
                    connect();
                  }}
                />
              ) : (
                /* Default / Hotel: direct call */
                <>
                  <AgentAvatar
                    icon={agentInfo.icon}
                    accentColor={accentColor}
                    connectionState="disconnected"
                    isSpeaking={false}
                  />
                  <div className="text-center">
                    <h2 className="text-lg md:text-xl font-semibold tracking-tight text-white mb-2 px-4">
                      {agentInfo.greeting || `Talk to ${agentInfo.name}`}
                    </h2>
                    <p className="text-sm text-white/55 max-w-xs mx-auto leading-relaxed">
                      {isEmbed
                        ? `Tap below to talk to ${businessInfo.name}'s assistant. No sign-up needed.`
                        : "Tap below to start a voice conversation. No sign-up needed."}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <GradientButton onClick={() => connect()} size="lg">
                      <Phone className="w-4 h-4" /> Start call
                    </GradientButton>
                    <span className="text-[11px] text-white/40">Free · 9 min per call</span>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ── Connecting ── */}
          {connectionState === "connecting" && (
            <motion.div
              key="connecting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center"
            >
              <ConnectionLoader agentName={agentInfo.name} />
            </motion.div>
          )}

          {/* ── Active call / Post-call transcript ── */}
          {(isConnected || (isDisconnected && transcript.length > 0)) && (
            <motion.div
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col min-h-0 gap-4"
            >
              <div className="shrink-0 flex flex-col items-center gap-3">
                <AgentAvatar
                  icon={agentInfo.icon}
                  accentColor={accentColor}
                  connectionState={connectionState}
                  isSpeaking={isAgentSpeaking}
                />
                <div className="w-full max-w-sm">
                  <AudioVisualizer
                    analyserNode={analyserNode}
                    isActive={isConnected && (isAgentSpeaking || !isMuted)}
                    accentColor={accentColor}
                  />
                </div>
              </div>

              <GlassPanel elevation="raised" radius="lg" className="flex-1 min-h-0 p-3.5 md:p-4 flex flex-col">
                <TranscriptPanel messages={transcript} accentColor={accentColor} />
              </GlassPanel>

              {isConnected && showEndingWarning && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-300/25 text-amber-300 text-xs font-medium"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Call ending in {fmtTime(remaining)}
                </motion.div>
              )}

              {isConnected && (
                <div className="shrink-0 flex items-center justify-center gap-5 py-2">
                  <button
                    onClick={() => setMuted(!isMuted)}
                    aria-label={isMuted ? "Unmute" : "Mute"}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
                      isMuted
                        ? "bg-rose-500/15 border-rose-300/40 hover:bg-rose-500/25"
                        : "bg-white/[0.05] border-white/10 hover:bg-white/[0.09] hover:border-white/20"
                    }`}
                  >
                    {isMuted ? <MicOff className="w-5 h-5 text-rose-300" /> : <Mic className="w-5 h-5 text-white" />}
                  </button>

                  <button
                    onClick={handleEndCall}
                    aria-label="End call"
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 flex items-center justify-center transition-all shadow-[0_8px_24px_-8px_rgba(244,63,94,0.6)] hover:shadow-[0_12px_32px_-8px_rgba(244,63,94,0.7)] hover:scale-105 active:scale-95"
                  >
                    <PhoneOff className="w-6 h-6 text-white" />
                  </button>

                  <div className="w-12 h-12 flex items-center justify-center">
                    <span
                      className="flex items-center gap-1 text-xs font-mono tabular-nums transition-colors"
                      style={{ color: remaining <= 60 ? "#fbbf24" : "rgba(255,255,255,0.55)" }}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {fmtTime(remaining)}
                    </span>
                  </div>
                </div>
              )}

              {isDisconnected && transcript.length > 0 && (
                <div className="shrink-0 flex justify-center gap-3 py-2">
                  <GradientButton onClick={() => { setPreCallDone(false); setCandidateContext(null); }} size="default">
                    <Phone className="w-4 h-4" /> Call again
                  </GradientButton>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Error state ── */}
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-300/20 flex items-center justify-center">
                <PhoneOff className="w-6 h-6 text-rose-300" />
              </div>
              <div>
                <p className="text-rose-300 font-medium mb-1">Connection error</p>
                <p className="text-sm text-white/55 max-w-xs mx-auto">{error}</p>
              </div>
              <GradientButton
                onClick={() => { setError(null); setPreCallDone(false); setCandidateContext(null); }}
                size="default"
              >
                Retry
              </GradientButton>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ── Footer ── */}
      <footer className={`relative shrink-0 flex items-center justify-center text-[10px] text-white/35 ${isEmbed ? "py-1.5" : "py-2.5"}`}>
        Powered by <span className="ah-gradient-text font-medium ml-1">AgentHub</span>
      </footer>

      {/* ── Rating modal ── */}
      {showRating && sessionId && (
        <RatingModal
          agentName={agentInfo.name}
          accentColor={accentColor}
          sessionId={sessionId}
          apiUrl={`/api/public/agent/${slug}/session/${sessionId}`}
          updateToken={updateTokenRef.current}
          onClose={() => setShowRating(false)}
        />
      )}
    </div>
  );
}
