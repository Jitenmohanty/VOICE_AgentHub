"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGeminiLive } from "@/hooks/useGeminiLive";
import { useSessionStore } from "@/stores/session-store";
import { useAgentStore } from "@/stores/agent-store";
import { getAgentById } from "@/lib/agents";
import { AgentAvatar } from "./AgentAvatar";
import { AudioVisualizer } from "./AudioVisualizer";
import { TranscriptPanel } from "./TranscriptPanel";
import { ControlBar } from "./ControlBar";
import { RatingModal } from "@/components/dashboard/RatingModal";
import { ConnectionLoader } from "@/components/shared/LoadingStates";

interface VoiceInterfaceProps {
  agentType: string;
}

export function VoiceInterface({ agentType }: VoiceInterfaceProps) {
  const router = useRouter();
  const agent = getAgentById(agentType);
  const config = useAgentStore((s) => s.config);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [showRating, setShowRating] = useState(false);

  const {
    connectionState,
    isAgentSpeaking,
    isMuted,
    transcript,
    elapsedSeconds,
    error,
    sessionId,
    toggleMute,
    setElapsedSeconds,
    reset,
  } = useSessionStore();

  const { connect, disconnect, analyserNode } = useGeminiLive(agentType, config);

  // Timer
  useEffect(() => {
    if (connectionState === "connected") {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(useSessionStore.getState().elapsedSeconds + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [connectionState, setElapsedSeconds]);

  /**
   * Save session data (duration, transcript, status) to the server
   * when the call ends.
   */
  const saveSession = useCallback(async () => {
    const store = useSessionStore.getState();
    const sid = store.sessionId;
    if (!sid) return;

    try {
      await fetch(`/api/sessions/${sid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration: store.elapsedSeconds,
          transcript: store.transcript.map((m) => ({
            speaker: m.speaker,
            text: m.text,
            timestamp: m.timestamp,
          })),
          status: "completed",
        }),
      });
    } catch {
      // Silent fail — session save is best-effort
    }
  }, []);

  const handleEndCall = useCallback(async () => {
    await disconnect();
    await saveSession();
    setShowRating(true);
  }, [disconnect, saveSession]);

  const handleBack = useCallback(() => {
    disconnect();
    reset();
    router.push("/dashboard");
  }, [disconnect, reset, router]);

  if (!agent) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <p>Agent not found</p>
      </div>
    );
  }

  const isConnected = connectionState === "connected";
  const isDisconnected = connectionState === "disconnected";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: `radial-gradient(ellipse at top, ${agent.accentColor}08, #0A0A0F 60%)` }}
    >
      {/* Header */}
      <header className="flex items-center justify-between p-4 md:p-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-[#8888AA] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>
        <div className="text-center">
          <h1 className="font-(family-name:--font-heading) font-semibold text-white">
            {agent.name}
          </h1>
          <p className="text-xs text-[#8888AA]">{agent.tagline}</p>
        </div>
        <div className="w-16" /> {/* Spacer */}
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-4 md:px-8 max-w-4xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {isDisconnected && !error && (
            <motion.div
              key="start"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center gap-6"
            >
              <AgentAvatar
                icon={agent.icon}
                accentColor={agent.accentColor}
                connectionState={connectionState}
                isSpeaking={false}
              />
              <div className="text-center">
                <h2 className="text-xl font-semibold text-white mb-2">
                  Ready to chat with {agent.name}?
                </h2>
                <p className="text-sm text-[#8888AA] max-w-md">
                  Click the button below to start a voice conversation.
                  Make sure your microphone is ready.
                </p>
              </div>
              <Button
                onClick={connect}
                className="px-8 py-3 text-white border-0 hover:opacity-90"
                style={{
                  background: `linear-gradient(135deg, ${agent.accentColor}, ${agent.accentColor}CC)`,
                }}
              >
                <Phone className="w-5 h-5 mr-2" />
                Start Call
              </Button>
            </motion.div>
          )}

          {connectionState === "connecting" && (
            <motion.div
              key="connecting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ConnectionLoader agentName={agent.name} />
            </motion.div>
          )}

          {(isConnected || (isDisconnected && transcript.length > 0)) && (
            <motion.div
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-6 w-full flex-1 min-h-0"
            >
              <AgentAvatar
                icon={agent.icon}
                accentColor={agent.accentColor}
                connectionState={connectionState}
                isSpeaking={isAgentSpeaking}
              />

              <AudioVisualizer
                analyserNode={analyserNode}
                isActive={isConnected && (isAgentSpeaking || !isMuted)}
                accentColor={agent.accentColor}
              />

              <div className="w-full flex-1 min-h-0 max-h-64 glass rounded-2xl p-4 flex flex-col">
                <TranscriptPanel
                  messages={transcript}
                  accentColor={agent.accentColor}
                />
              </div>

              {isConnected && (
                <ControlBar
                  isMuted={isMuted}
                  elapsedSeconds={elapsedSeconds}
                  isConnected={isConnected}
                  accentColor={agent.accentColor}
                  onToggleMute={toggleMute}
                  onEndCall={handleEndCall}
                />
              )}

              {isDisconnected && transcript.length > 0 && (
                <div className="flex gap-3">
                  <Button
                    onClick={connect}
                    className="text-white border-0 hover:opacity-90"
                    style={{
                      background: `linear-gradient(135deg, ${agent.accentColor}, ${agent.accentColor}CC)`,
                    }}
                  >
                    Reconnect
                  </Button>
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="border-[#2A2A3E] text-white"
                  >
                    Back to Dashboard
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-red-400 text-2xl">!</span>
              </div>
              <p className="text-red-400 mb-2 font-medium">Connection Error</p>
              <p className="text-[#8888AA] text-sm mb-4 max-w-md">{error}</p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={connect}
                  className="text-white border-0 hover:opacity-90"
                  style={{
                    background: `linear-gradient(135deg, ${agent.accentColor}, ${agent.accentColor}CC)`,
                  }}
                >
                  Retry
                </Button>
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="border-[#2A2A3E] text-white"
                >
                  Go Back
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rating modal after call ends */}
      {showRating && sessionId && (
        <RatingModal
          agentName={agent.name}
          accentColor={agent.accentColor}
          sessionId={sessionId}
          onClose={() => setShowRating(false)}
        />
      )}
    </div>
  );
}
