"use client";

import { motion } from "framer-motion";
import { Phone, Code2, Briefcase, Globe, Mic } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";

interface PersonalPreCallProps {
  fullName: string;
  role: string;
  briefBio: string;
  techStack: string[];
  links: { linkedin?: string; github?: string; website?: string };
  accentColor: string;
  onStartCall: () => void;
  loading?: boolean;
}

/**
 * Pre-call screen for Personal · Portfolio agents.
 *
 * Visitors usually land here from someone's portfolio site embed. They
 * already know who the person is — the screen's job is just to confirm
 * "yes, this is the AI version of {name}, click to talk."
 */
export function PersonalPreCall({
  fullName,
  role,
  briefBio,
  techStack,
  links,
  onStartCall,
  loading = false,
}: PersonalPreCallProps) {
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-md mx-auto flex flex-col items-center gap-5 text-center"
    >
      {/* Avatar with initials, framed by gradient halo */}
      <div className="relative">
        <div className="absolute inset-0 ah-gradient-bg rounded-full blur-xl opacity-50 -z-10" />
        <div className="w-20 h-20 rounded-full ah-gradient-bg flex items-center justify-center text-2xl font-semibold tracking-tight text-white shadow-[0_8px_32px_-8px_rgba(124,58,237,0.6)]">
          {initials || <Mic className="w-7 h-7" />}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold tracking-[-0.02em] text-white">
          {fullName || "Personal AI"}
        </h2>
        {role && <p className="text-sm text-white/60 mt-1">{role}</p>}
      </div>

      {briefBio && (
        <p className="text-sm text-white/70 leading-relaxed max-w-sm">
          {briefBio.length > 220 ? briefBio.slice(0, 220) + "…" : briefBio}
        </p>
      )}

      {techStack.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {techStack.slice(0, 8).map((t) => (
            <span
              key={t}
              className="text-xs px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-white/65"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col items-center gap-2 mt-1">
        <GradientButton onClick={onStartCall} disabled={loading} size="lg">
          <Phone className="w-4 h-4" /> Talk to {fullName?.split(" ")[0] || "me"}
        </GradientButton>
        <span className="text-xs text-white/40">
          Voice · No signup · 9 min per call
        </span>
      </div>

      {(links.linkedin || links.github || links.website) && (
        <div className="flex items-center gap-2 mt-1">
          {links.github && (
            <a
              href={links.github}
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/55 hover:text-white hover:bg-white/[0.08] transition-colors"
              aria-label="GitHub"
              title="GitHub"
            >
              <Code2 className="w-4 h-4" />
            </a>
          )}
          {links.linkedin && (
            <a
              href={links.linkedin}
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/55 hover:text-white hover:bg-white/[0.08] transition-colors"
              aria-label="LinkedIn"
              title="LinkedIn"
            >
              <Briefcase className="w-4 h-4" />
            </a>
          )}
          {links.website && (
            <a
              href={links.website}
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/55 hover:text-white hover:bg-white/[0.08] transition-colors"
              aria-label="Website"
            >
              <Globe className="w-4 h-4" />
            </a>
          )}
        </div>
      )}
    </motion.div>
  );
}
