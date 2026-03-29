/**
 * AudioWorklet processor for capturing microphone audio.
 * Buffers input samples and posts chunks to the main thread for resampling.
 */
class AudioCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    // ~2048 samples at 48kHz ≈ 42ms chunks (Gemini recommends 20-40ms)
    this._bufferSize = 2048;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channelData = input[0];
    for (let i = 0; i < channelData.length; i++) {
      this._buffer.push(channelData[i]);
    }

    if (this._buffer.length >= this._bufferSize) {
      this.port.postMessage(new Float32Array(this._buffer));
      this._buffer = [];
    }

    return true;
  }
}

registerProcessor("audio-capture-processor", AudioCaptureProcessor);
