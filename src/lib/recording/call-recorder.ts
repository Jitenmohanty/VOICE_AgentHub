/**
 * Browser-side call recorder (Item 12). Mixes the caller's mic with the
 * agent's synthesized voice into one MediaRecorder stream (webm/opus) and
 * uploads the finished blob to the authenticated recording endpoint.
 *
 * Consent contract: construct + start this ONLY after the caller accepted
 * the recording notice on the pre-call screen. No consent → this class is
 * never instantiated and nothing is captured.
 *
 * Wiring (PublicAgentExperience):
 *   const recorder = new CallRecorder(liveSession.getPlaybackAudioContext()!,
 *                                     liveSession.getRecordingDestination()!);
 *   recorder.addMicStream(micMediaStream);   // from getUserMedia
 *   recorder.start();
 *   ... call runs ...
 *   await recorder.stopAndUpload(slug, sessionId, updateToken);
 */
export class CallRecorder {
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private micSource: MediaStreamAudioSourceNode | null = null;

  constructor(
    private audioContext: AudioContext,
    private destination: MediaStreamAudioDestinationNode,
  ) {}

  /** Mix the caller's mic into the recording (agent audio is already routed). */
  addMicStream(micStream: MediaStream) {
    try {
      this.micSource = this.audioContext.createMediaStreamSource(micStream);
      this.micSource.connect(this.destination);
    } catch (err) {
      console.warn("[CallRecorder] mic mix failed (agent-only recording):", err);
    }
  }

  start() {
    if (this.recorder) return;
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";
    this.recorder = new MediaRecorder(this.destination.stream, {
      mimeType,
      audioBitsPerSecond: 32_000, // voice-quality; ~2.2 MB for a 9-min call
    });
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.recorder.start(2_000); // 2s timeslices so a crash loses little
  }

  /** Stop capturing and return the finished blob (null if nothing recorded). */
  private stop(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const rec = this.recorder;
      this.micSource?.disconnect();
      this.micSource = null;
      if (!rec || rec.state === "inactive") {
        resolve(this.chunks.length ? new Blob(this.chunks, { type: "audio/webm" }) : null);
        return;
      }
      rec.onstop = () => {
        resolve(this.chunks.length ? new Blob(this.chunks, { type: "audio/webm" }) : null);
      };
      try {
        rec.stop();
      } catch {
        resolve(null);
      }
      this.recorder = null;
    });
  }

  /**
   * Stop and upload. Best-effort: an upload failure never affects the call
   * flow (the transcript + lead are already persisted separately).
   */
  async stopAndUpload(agentSlug: string, sessionId: string, updateToken: string): Promise<boolean> {
    const blob = await this.stop();
    if (!blob || blob.size === 0) return false;
    try {
      const res = await fetch(
        `/api/public/agent/${agentSlug}/recording?sessionId=${encodeURIComponent(sessionId)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": blob.type || "audio/webm",
            Authorization: `Bearer ${updateToken}`,
          },
          body: blob,
          keepalive: blob.size < 60_000, // keepalive has a ~64KB body cap
        },
      );
      return res.ok;
    } catch (err) {
      console.warn("[CallRecorder] upload failed:", err);
      return false;
    }
  }
}
