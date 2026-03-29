"use client";

import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  analyserNode: AnalyserNode | null;
  isActive: boolean;
  accentColor: string;
}

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
    const barCount = 64;
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyserNode.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, width, height);

      const barWidth = width / barCount;
      const centerY = height / 2;

      for (let i = 0; i < barCount; i++) {
        const value = dataArray[Math.floor((i / barCount) * dataArray.length)] ?? 0;
        const barHeight = isActive ? (value / 255) * (height * 0.8) : 2;

        const alpha = 0.3 + (value / 255) * 0.7;
        ctx.fillStyle = isActive ? `${accentColor}` : "rgba(136, 136, 170, 0.3)";
        ctx.globalAlpha = alpha;

        const x = i * barWidth + barWidth * 0.15;
        const w = barWidth * 0.7;
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
  }, [analyserNode, isActive, accentColor]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-32 rounded-xl"
    />
  );
}
