"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RatingModalProps {
  agentName: string;
  accentColor: string;
  sessionId: string;
  onClose: () => void;
}

export function RatingModal({ agentName, accentColor, sessionId, onClose }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, feedback, status: "completed" }),
      });
    } catch {
      // silent fail
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md glass rounded-2xl p-8 text-center"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/5 text-[#8888AA]"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="font-(family-name:--font-heading) font-bold text-xl text-white mb-2">
            Rate your experience
          </h2>
          <p className="text-sm text-[#8888AA] mb-6">
            How was your conversation with {agentName}?
          </p>

          {/* Stars */}
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className="w-8 h-8"
                  style={{
                    color: star <= (hoveredRating || rating) ? "#FFB800" : "#2A2A3E",
                    fill: star <= (hoveredRating || rating) ? "#FFB800" : "transparent",
                  }}
                />
              </button>
            ))}
          </div>

          {/* Feedback */}
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Any feedback? (optional)"
            className="w-full h-24 bg-white/5 border border-[#2A2A3E] rounded-xl p-3 text-sm text-white placeholder:text-[#8888AA] resize-none focus:outline-none focus:border-[#00D4FF] mb-4"
          />

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-[#2A2A3E] text-white"
            >
              Skip
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || submitting}
              className="flex-1 text-white border-0 hover:opacity-90"
              style={{
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`,
              }}
            >
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
