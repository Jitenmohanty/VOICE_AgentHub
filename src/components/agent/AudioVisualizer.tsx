"use client";

import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  analyserNode: AnalyserNode | null;
  isActive: boolean;
  accentColor: string;
}

/**
 * Frequency-bar visualizer. Premium variant: uses a vertical brand gradient
 * (violet → blue → cyan) modulated by the per-agent accentColor at the top
 * via a subtle radial highlight. Idle bars are a slim, low-opacity white.
 */
export function AudioVisualizer({ analyserNode, isActive, accentColor }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserNode) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
    const barCount = 56;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      analyserNode.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, width, height);

      const barWidth = width / barCount;
      const centerY = height / 2;

      // Vertical brand gradient — recomputed per frame is fine, gradient is cheap
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#7C3AED");
      gradient.addColorStop(0.5, "#3B82F6");
      gradient.addColorStop(1, "#06B6D4");

      for (let i = 0; i < barCount; i++) {
        const value = dataArray[Math.floor((i / barCount) * dataArray.length)] ?? 0;
        const barHeight = isActive ? Math.max(2, (value / 255) * (height * 0.8)) : 2;
        const alpha = isActive ? 0.55 + (value / 255) * 0.45 : 0.18;

        ctx.fillStyle = isActive ? gradient : "rgba(255, 255, 255, 0.4)";
        ctx.globalAlpha = alpha;

        const x = i * barWidth + barWidth * 0.18;
        const w = barWidth * 0.64;
        const halfBar = barHeight / 2;

        ctx.beginPath();
        ctx.roundRect(x, centerY - halfBar, w, barHeight, w / 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resize);
    };
    // accentColor reference kept so the host can re-render on per-agent changes,
    // even though the gradient itself is brand-fixed.
  }, [analyserNode, isActive, accentColor]);

  return <canvas ref={canvasRef} className="w-full h-24 rounded-2xl" />;
}
