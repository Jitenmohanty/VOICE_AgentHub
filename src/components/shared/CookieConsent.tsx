"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "agenthub-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  // Suppress on iframe-embed routes — the host site is responsible for its
  // own consent, and a banner would obscure the agent UI in a small widget.
  const suppress = pathname?.startsWith("/embed/");

  useEffect(() => {
    if (suppress) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      /* localStorage unavailable */
    }
  }, [suppress]);

  if (suppress) return null;

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
          <div className="glass-floating rounded-3xl p-5 shadow-2xl shadow-black/60">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-300/20 flex items-center justify-center shrink-0">
                  <Cookie className="w-3.5 h-3.5 text-violet-300" strokeWidth={2} />
                </div>
                <span className="text-sm font-semibold text-white tracking-tight">
                  Cookie preferences
                </span>
              </div>
              <button
                onClick={decline}
                className="text-white/40 hover:text-white transition-colors mt-0.5"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-white/60 leading-relaxed mb-4">
              We use essential cookies to keep you signed in and remember your preferences.
              We don&apos;t use tracking or advertising cookies.{" "}
              <Link href="/legal/cookies" className="ah-gradient-text font-medium hover:opacity-80">
                Cookie Policy
              </Link>
              .
            </p>

            <div className="flex gap-2">
              <button
                onClick={accept}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-white ah-gradient-bg shadow-[0_4px_16px_-4px_rgba(124,58,237,0.5)] hover:shadow-[0_6px_20px_-4px_rgba(59,130,246,0.6)] transition-shadow"
              >
                Accept all
              </button>
              <button
                onClick={decline}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-white/65 border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:text-white hover:border-white/20 transition-all"
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
