"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "agenthub-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if user hasn't made a choice yet
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      // localStorage unavailable (SSR guard already handled by useEffect, but just in case)
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {}
    setVisible(false);
  };

  const decline = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "declined");
    } catch {}
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="cookie-banner"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 220 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-sm"
        >
          <div className="bg-[#0E0E16] border border-[#2A2A3E] rounded-2xl p-5 shadow-2xl shadow-black/40">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#00D4FF]/10 flex items-center justify-center shrink-0">
                  <Cookie className="w-3.5 h-3.5 text-[#00D4FF]" />
                </div>
                <span className="text-sm font-semibold text-white">
                  Cookie preferences
                </span>
              </div>
              <button
                onClick={decline}
                className="text-[#555577] hover:text-white transition-colors mt-0.5"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <p className="text-xs text-[#8888AA] leading-relaxed mb-4">
              We use essential cookies to keep you signed in and remember your
              preferences. We don&apos;t use tracking or advertising cookies.{" "}
              <Link
                href="/legal/cookies"
                className="text-[#00D4FF] hover:underline"
              >
                Cookie Policy
              </Link>
              .
            </p>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={accept}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-white bg-linear-to-r from-[#00D4FF] to-[#6366F1] hover:opacity-90 transition-opacity"
              >
                Accept all
              </button>
              <button
                onClick={decline}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-[#8888AA] border border-[#2A2A3E] hover:text-white hover:bg-white/5 transition-all"
              >
                Essential only
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
