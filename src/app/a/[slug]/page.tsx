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
import type { TranscriptMessage } from "@/types/session";
import type { ConnectionState } from "@/types/gemini";
import type { GeminiToolDeclaration } from "@/types/gemini";

interface AgentInfo {
  id: string;
  name: string;
  greeting: string | null;
  templateType: string;
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

  // Session state
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

  // Fetch agent info
  useEffect(() => {
    if (!slug) return;
    fetch(`/api/public/agent/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setAgentInfo(data.agent);
        setBusinessInfo(data.business);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const { startCapture, stopCapture } = useAudioStream({
    onAudioData: (b64) => {
      if (activeRef.current) sessionRef.current?.sendAudio(b64);
    },
    onAnalyserReady: (node) => setAnalyserNode(node),
  });

  // Timer
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
      await fetch(`/api/public/agent/${slug}/session/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration: elapsedSeconds,
          transcript: transcript.map((m) => ({ speaker: m.speaker, text: m.text, timestamp: m.timestamp })),
          status: "completed",
        }),
        keepalive: true,
      });
    } catch { savedRef.current = false; }
  }, [sessionId, slug, elapsedSeconds, transcript]);

  const connect = useCallback(async () => {
    if (!agentInfo) return;
    try {
      setConnectionState("connecting");
      setError(null);
      setTranscript([]);
      setElapsedSeconds(0);
      savedRef.current = false;

      const res = await fetch(`/api/public/agent/${slug}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to create session");
      const data = await res.json();

      setSessionId(data.sessionId);

      // Use server-provided RAG-enhanced prompt and tools
      const session = new GeminiLiveSession(
        agentInfo.templateType,
        (data.agent?.config || {}) as Record<string, string | string[]>,
        { systemPrompt: data.systemPrompt, tools: data.tools },
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

  // Save on browser close
  useEffect(() => {
    const handler = () => { if (connectionState === "connected") saveSession(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [connectionState, saveSession]);

  // Cleanup
  useEffect(() => {
    return () => { activeRef.current = false; stopCapture(); sessionRef.current?.disconnect(); };
  }, [stopCapture]);

  const fmtTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]">
        <div className="w-8 h-8 border-2 border-[#00D4FF]/30 border-t-[#00D4FF] rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !agentInfo || !businessInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0F] text-center px-6">
        <h1 className="text-2xl font-bold text-white mb-2">Agent Not Found</h1>
        <p className="text-[#8888AA]">This agent link is invalid or has been deactivated.</p>
      </div>
    );
  }

  const isConnected = connectionState === "connected";
  const isDisconnected = connectionState === "disconnected";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: `radial-gradient(ellipse at top, ${agentInfo.accentColor}08, #0A0A0F 60%)` }}
    >
      {/* Header */}
      <header className="flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[#00D4FF] to-[#6366F1] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs text-[#8888AA]">Powered by AgentHub</span>
        </div>
        <div className="text-center">
          <h1 className="font-(family-name:--font-heading) font-semibold text-white text-sm">
            {businessInfo.name}
          </h1>
          <p className="text-xs text-[#8888AA]">{agentInfo.name}</p>
        </div>
        <div className="w-16" />
      </header>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 md:px-8 max-w-4xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {isDisconnected && !error && transcript.length === 0 && (
            <motion.div key="start" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-6">
              <AgentAvatar icon={agentInfo.icon} accentColor={agentInfo.accentColor} connectionState="disconnected" isSpeaking={false} />
              <div className="text-center">
                <h2 className="text-xl font-semibold text-white mb-2">{agentInfo.greeting || `Talk to ${agentInfo.name}`}</h2>
                <p className="text-sm text-[#8888AA] max-w-md">Click the button below to start a voice conversation. No sign-up needed.</p>
              </div>
              <Button onClick={connect} className="px-8 py-3 text-white border-0 hover:opacity-90" style={{ background: `linear-gradient(135deg, ${agentInfo.accentColor}, ${agentInfo.accentColor}CC)` }}>
                <Phone className="w-5 h-5 mr-2" /> Start Call
              </Button>
            </motion.div>
          )}

          {connectionState === "connecting" && (
            <motion.div key="connecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ConnectionLoader agentName={agentInfo.name} />
            </motion.div>
          )}

          {(isConnected || (isDisconnected && transcript.length > 0)) && (
            <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6 w-full flex-1 min-h-0">
              <AgentAvatar icon={agentInfo.icon} accentColor={agentInfo.accentColor} connectionState={connectionState} isSpeaking={isAgentSpeaking} />
              <AudioVisualizer analyserNode={analyserNode} isActive={isConnected && (isAgentSpeaking || !isMuted)} accentColor={agentInfo.accentColor} />
              <div className="w-full flex-1 min-h-0 max-h-64 glass rounded-2xl p-4 flex flex-col">
                <TranscriptPanel messages={transcript} accentColor={agentInfo.accentColor} />
              </div>

              {isConnected && (
                <div className="flex items-center gap-4">
                  <button onClick={() => setMuted(!isMuted)} className="w-12 h-12 rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: isMuted ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.05)" }}>
                    {isMuted ? <MicOff className="w-5 h-5 text-red-400" /> : <Mic className="w-5 h-5 text-white" />}
                  </button>
                  <span className="flex items-center gap-1 text-sm text-[#8888AA]"><Clock className="w-3.5 h-3.5" />{fmtTime(elapsedSeconds)}</span>
                  <button onClick={handleEndCall} className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors">
                    <PhoneOff className="w-6 h-6 text-white" />
                  </button>
                </div>
              )}

              {isDisconnected && transcript.length > 0 && (
                <div className="flex gap-3">
                  <Button onClick={connect} className="text-white border-0 hover:opacity-90" style={{ background: `linear-gradient(135deg, ${agentInfo.accentColor}, ${agentInfo.accentColor}CC)` }}>
                    Call Again
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {error && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-red-400 text-2xl">!</span>
              </div>
              <p className="text-red-400 mb-2 font-medium">Connection Error</p>
              <p className="text-[#8888AA] text-sm mb-4 max-w-md">{error}</p>
              <Button onClick={connect} className="text-white border-0 hover:opacity-90" style={{ background: `linear-gradient(135deg, ${agentInfo.accentColor}, ${agentInfo.accentColor}CC)` }}>
                Retry
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showRating && sessionId && (
        <RatingModal
          agentName={agentInfo.name}
          accentColor={agentInfo.accentColor}
          sessionId={sessionId}
          apiUrl={`/api/public/agent/${slug}/session/${sessionId}`}
          onClose={() => setShowRating(false)}
        />
      )}
    </div>
  );
}
