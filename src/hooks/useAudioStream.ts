"use client";

import { useCallback, useRef } from "react";
import {
  getUserMicrophone,
  createAnalyserNode,
  float32ToPcm16Base64,
} from "@/lib/gemini/audio-utils";

interface UseAudioStreamOptions {
  onAudioData: (base64Audio: string) => void;
  onAnalyserReady?: (node: AnalyserNode) => void;
}

export function useAudioStream({ onAudioData, onAnalyserReady }: UseAudioStreamOptions) {
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const onAudioDataRef = useRef(onAudioData);
  onAudioDataRef.current = onAudioData;

  const startCapture = useCallback(async () => {
    let stream: MediaStream;
    try {
      stream = await getUserMicrophone();
    } catch (micErr) {
      const msg =
        micErr instanceof DOMException && micErr.name === "NotAllowedError"
          ? "Microphone permission denied. Please allow microphone access in your browser settings."
          : micErr instanceof DOMException && micErr.name === "NotFoundError"
            ? "No microphone found. Please connect a microphone and try again."
            : `Microphone access failed: ${micErr instanceof Error ? micErr.message : "Unknown error"}`;
      throw new Error(msg);
    }
    streamRef.current = stream;

    const ctx = new AudioContext();
    // Resume AudioContext if browser has it suspended (autoplay policy)
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    contextRef.current = ctx;

    const source = ctx.createMediaStreamSource(stream);
    const analyser = createAnalyserNode(ctx);
    source.connect(analyser);

    onAnalyserReady?.(analyser);

    try {
      await ctx.audioWorklet.addModule("/audio-capture-worklet.js");
    } catch (workletErr) {
      throw new Error(
        `Failed to load audio worklet: ${workletErr instanceof Error ? workletErr.message : "Check that audio-capture-worklet.js exists in /public."}`
      );
    }

    const workletNode = new AudioWorkletNode(ctx, "audio-capture-processor");
    workletRef.current = workletNode;

    source.connect(workletNode);
    workletNode.connect(ctx.destination);

    const sampleRate = ctx.sampleRate;
    workletNode.port.onmessage = (e: MessageEvent<Float32Array>) => {
      const inputData = e.data;
      // Resample from audioContext sampleRate to 16kHz
      const ratio = sampleRate / 16000;
      const outputLength = Math.ceil(inputData.length / ratio);
      const output = new Float32Array(outputLength);
      for (let i = 0; i < outputLength; i++) {
        output[i] = inputData[Math.round(i * ratio)] ?? 0;
      }
      const base64 = float32ToPcm16Base64(output);
      onAudioDataRef.current(base64);
    };
  }, [onAnalyserReady]);

  const stopCapture = useCallback(() => {
    if (workletRef.current) {
      workletRef.current.port.close();
      workletRef.current.disconnect();
      workletRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (contextRef.current) {
      contextRef.current.close();
      contextRef.current = null;
    }
  }, []);

  return { startCapture, stopCapture };
}
