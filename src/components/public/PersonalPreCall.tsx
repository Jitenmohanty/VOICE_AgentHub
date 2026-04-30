"use client";

import { motion } from "framer-motion";
import { Phone, Code2, Briefcase, Globe, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

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
 *
 * Intentionally minimal: no form fields, just a click-to-start CTA.
 */
export function PersonalPreCall({
  fullName,
  role,
  briefBio,
  techStack,
  links,
  accentColor,
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto flex flex-col items-center gap-6 text-center"
    >
      {/* Avatar with initials */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0"
        style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}99)` }}
      >
        {initials || <Mic className="w-8 h-8" />}
      </div>

      {/* Identity */}
      <div>
        <h2 className="text-2xl font-(family-name:--font-heading) font-bold text-white">
          {fullName || "Personal AI"}
        </h2>
        {role && <p className="text-sm text-[#8888AA] mt-1">{role}</p>}
      </div>

      {/* Bio */}
      {briefBio && (
        <p className="text-sm text-[#C0C0D8] leading-relaxed max-w-sm">
          {briefBio.length > 220 ? briefBio.slice(0, 220) + "..." : briefBio}
        </p>
      )}

      {/* Tech stack chips */}
      {techStack.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {techStack.slice(0, 8).map((t) => (
            <span
              key={t}
              className="text-[11px] px-2 py-0.5 rounded-md border"
              style={{
                color: accentColor,
                borderColor: `${accentColor}40`,
                backgroundColor: `${accentColor}10`,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Start call */}
      <div className="flex flex-col items-center gap-2 mt-2">
        <Button
          onClick={onStartCall}
          disabled={loading}
          className="px-8 py-3 text-white border-0 hover:opacity-90 text-base"
          style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)` }}
        >
          <Phone className="w-5 h-5 mr-2" /> Talk to {fullName?.split(" ")[0] || "me"}
        </Button>
        <span className="text-xs text-[#666680]">
          Voice conversation · No signup · 9 min/call
        </span>
      </div>

      {/* Links */}
      {(links.linkedin || links.github || links.website) && (
        <div className="flex items-center gap-3 mt-2">
          {links.github && (
            <a
              href={links.github}
              target="_blank"
              rel="noreferrer"
              className="text-[#8888AA] hover:text-white transition-colors"
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
              className="text-[#8888AA] hover:text-white transition-colors"
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
              className="text-[#8888AA] hover:text-white transition-colors"
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
