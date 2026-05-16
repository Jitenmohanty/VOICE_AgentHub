"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GradientButton } from "@/components/ui/gradient-button";
import { Textarea } from "@/components/ui/textarea";

interface RatingModalProps {
  agentName: string;
  accentColor: string;
  sessionId: string;
  /** Override the API endpoint for public (no-auth) pages */
  apiUrl?: string;
  /** Per-session bearer token for the public PATCH route */
  updateToken?: string | null;
  onClose: () => void;
}

export function RatingModal({ agentName, sessionId, apiUrl, updateToken, onClose }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (updateToken) headers.Authorization = `Bearer ${updateToken}`;
      await fetch(apiUrl || `/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ rating, feedback, status: "completed" }),
      });
    } catch {
      /* silent fail — rating is best-effort */
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ah-bg-deep)]/80 backdrop-blur-md p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md"
        >
          <GlassPanel elevation="floating" gradientBorder radius="lg" className="p-8 text-center relative">
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/[0.06] text-white/55 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-xl font-semibold tracking-tight text-white mb-2">
              Rate your experience
            </h2>
            <p className="text-sm text-white/55 mb-7">
              How was your conversation with {agentName}?
            </p>

            <div className="flex justify-center gap-1.5 mb-7">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = star <= (hoveredRating || rating);
                return (
                  <button
                    key={star}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-9 h-9 transition-colors ${active ? "fill-current text-amber-300" : "text-white/15"}`}
                      strokeWidth={1.5}
                    />
                  </button>
                );
              })}
            </div>

            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Any feedback? (optional)"
              rows={3}
              className="mb-5"
            />

            <div className="flex gap-2.5">
              <GradientButton onClick={onClose} variant="outline" className="flex-1">
                Skip
              </GradientButton>
              <GradientButton
                onClick={handleSubmit}
                disabled={rating === 0 || submitting}
                className="flex-1"
              >
                {submitting ? "Submitting…" : "Submit"}
              </GradientButton>
            </div>
          </GlassPanel>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
