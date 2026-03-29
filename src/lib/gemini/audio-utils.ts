/**
 * Audio utilities for Gemini Live API interaction.
 * Handles microphone capture, audio playback, and format conversion.
 */

export async function getUserMicrophone(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      sampleRate: 16000,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });
}

export function createAudioContext(): AudioContext {
  return new AudioContext({ sampleRate: 24000 });
}

export function createAnalyserNode(ctx: AudioContext): AnalyserNode {
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.8;
  return analyser;
}

/**
 * Convert Float32Array audio data to base64-encoded PCM16 for Gemini.
 */
export function float32ToPcm16Base64(float32: Float32Array): string {
  const pcm16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]!));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(pcm16.buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

/**
 * Decode base64 PCM16 audio from Gemini to Float32Array for playback.
 */
export function pcm16Base64ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const pcm16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(pcm16.length);
  for (let i = 0; i < pcm16.length; i++) {
    float32[i] = pcm16[i]! / (pcm16[i]! < 0 ? 0x8000 : 0x7fff);
  }
  return float32;
}

/**
 * Play a Float32Array audio buffer through the given AudioContext.
 */
export function playAudioBuffer(
  ctx: AudioContext,
  audioData: Float32Array,
  onEnded?: () => void
): AudioBufferSourceNode {
  const buffer = ctx.createBuffer(1, audioData.length, 24000);
  buffer.copyToChannel(new Float32Array(audioData.buffer) as Float32Array<ArrayBuffer>, 0);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  if (onEnded) source.onended = onEnded;
  source.start();
  return source;
}
