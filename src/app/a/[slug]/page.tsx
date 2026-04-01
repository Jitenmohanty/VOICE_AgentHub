"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Zap, Mic, MicOff, PhoneOff, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
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
}

interface BusinessInfo {
  name: string;
  logoUrl: string | null;
  slug: string;
}

export default function PublicAgentPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Template-specific pre-call state
  const [publicData, setPublicData] = useState<{ templateType: string; data: { dataType: string; data: unknown }[] } | null>(null);
  const [candidateContext, setCandidateContext] = useState<CandidateContext | null>(null);
  const [preCallDone, setPreCallDone] = useState(false);

  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [isAgentSpeaking, setAgentSpeaking] = useState(false);
  const [isMuted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showRating, setShowRating] = useState(false);

  const sessionRef = useRef<GeminiLiveSession | null>(null);
  const activeRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const savedRef = useRef(false);
  const partialIds = useRef<{ user?: string; agent?: string }>({});

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
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [connectionState]);

  const saveSession = useCallback(async () => {
    if (savedRef.current || !sessionId) return;
    savedRef.current = true;
    try {
      // Collect interview scoring data if available
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
        headers: { "Content-Type": "application/json" },
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

      const body: Record<string, unknown> = {};
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

      const session = new GeminiLiveSession(
        agentInfo.templateType,
        (data.agent?.config || {}) as Record<string, string | string[]>,
        { systemPrompt: data.systemPrompt, tools: data.tools, agentSlug: slug },
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
        }
      });

      await session.connect(data.apiKey);
      sessionRef.current = session;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
      setConnectionState("error");
    }
  }, [agentInfo, slug, startCapture, stopCapture]);

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

  useEffect(() => {
    const handler = () => { if (connectionState === "connected") saveSession(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [connectionState, saveSession]);

  useEffect(() => {
    return () => { activeRef.current = false; stopCapture(); sessionRef.current?.disconnect(); };
  }, [stopCapture]);

  const fmtTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#0A0A0F]">
        <div className="w-8 h-8 border-2 border-[#00D4FF]/30 border-t-[#00D4FF] rounded-full animate-spin" />
      </div>
    );
  }

  // ── Not found ──
  if (notFound || !agentInfo || !businessInfo) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#0A0A0F] text-center px-6">
        <div className="w-16 h-16 rounded-full bg-[#2A2A3E] flex items-center justify-center mb-4">
          <Phone className="w-7 h-7 text-[#8888AA]" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Agent Not Found</h1>
        <p className="text-sm text-[#8888AA] max-w-xs">
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
      className="min-h-[100dvh] flex flex-col overflow-hidden"
      style={{ background: `radial-gradient(ellipse at top, ${accentColor}06, #0A0A0F 50%)` }}
    >
      {/* ── Header ── */}
      <header className="shrink-0 flex items-center justify-center px-4 py-3 md:py-4 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${accentColor}15` }}
          >
            <Zap className="w-4 h-4" style={{ color: accentColor }} />
          </div>
          <div className="text-center">
            <p className="font-(family-name:--font-heading) font-semibold text-white text-sm leading-tight">
              {businessInfo.name}
            </p>
            <p className="text-[10px] text-[#8888AA] leading-tight">{agentInfo.name}</p>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col min-h-0 w-full max-w-lg mx-auto px-4 py-4 md:py-6">
        <AnimatePresence mode="wait">

          {/* ── Idle state ── */}
          {isDisconnected && !error && transcript.length === 0 && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col items-center justify-center gap-6 w-full"
            >
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
                /* Restaurant: menu preview */
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
                /* Medical: doctor roster + intent */
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
                /* Legal: practice area selector */
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
                    <h2 className="text-lg md:text-xl font-semibold text-white mb-2 px-4">
                      {agentInfo.greeting || `Talk to ${agentInfo.name}`}
                    </h2>
                    <p className="text-sm text-[#8888AA] max-w-xs mx-auto">
                      Tap the button below to start a voice conversation. No sign-up needed.
                    </p>
                  </div>
                  <Button
                    onClick={() => connect()}
                    className="px-8 py-3 text-white border-0 hover:opacity-90 text-base"
                    style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)` }}
                  >
                    <Phone className="w-5 h-5 mr-2" /> Start Call
                  </Button>
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
              {/* Top section: avatar + visualizer */}
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

              {/* Transcript area — fills remaining space */}
              <div className="flex-1 min-h-0 glass rounded-2xl p-3 md:p-4 flex flex-col">
                <TranscriptPanel messages={transcript} accentColor={accentColor} />
              </div>

              {/* Controls */}
              {isConnected && (
                <div className="shrink-0 flex items-center justify-center gap-5 py-2">
                  <button
                    onClick={() => setMuted(!isMuted)}
                    className="w-12 h-12 rounded-full flex items-center justify-center border transition-colors"
                    style={{
                      backgroundColor: isMuted ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)",
                      borderColor: isMuted ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)",
                    }}
                  >
                    {isMuted ? <MicOff className="w-5 h-5 text-red-400" /> : <Mic className="w-5 h-5 text-white" />}
                  </button>

                  <button
                    onClick={handleEndCall}
                    className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg shadow-red-500/20"
                  >
                    <PhoneOff className="w-6 h-6 text-white" />
                  </button>

                  <div className="w-12 h-12 flex items-center justify-center">
                    <span className="flex items-center gap-1 text-sm text-[#8888AA] tabular-nums">
                      <Clock className="w-3.5 h-3.5" />
                      {fmtTime(elapsedSeconds)}
                    </span>
                  </div>
                </div>
              )}

              {/* Post-call actions */}
              {isDisconnected && transcript.length > 0 && (
                <div className="shrink-0 flex justify-center gap-3 py-2">
                  <Button
                    onClick={() => { setPreCallDone(false); setCandidateContext(null); }}
                    className="text-white border-0 hover:opacity-90"
                    style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)` }}
                  >
                    <Phone className="w-4 h-4 mr-2" /> Call Again
                  </Button>
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
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
                <PhoneOff className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-red-400 font-medium mb-1">Connection Error</p>
                <p className="text-[#8888AA] text-sm max-w-xs mx-auto">{error}</p>
              </div>
              <Button
                onClick={() => { setError(null); setPreCallDone(false); setCandidateContext(null); }}
                className="text-white border-0 hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)` }}
              >
                Retry
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ── Footer ── */}
      <footer className="shrink-0 flex items-center justify-center py-2 text-[10px] text-[#666680]">
        Powered by <span className="font-medium text-[#8888AA] ml-1">AgentHub</span>
      </footer>

      {/* ── Rating modal ── */}
      {showRating && sessionId && (
        <RatingModal
          agentName={agentInfo.name}
          accentColor={accentColor}
          sessionId={sessionId}
          apiUrl={`/api/public/agent/${slug}/session/${sessionId}`}
          onClose={() => setShowRating(false)}
        />
      )}
    </div>
  );
}
