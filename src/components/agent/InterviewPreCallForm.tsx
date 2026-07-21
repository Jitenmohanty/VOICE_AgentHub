"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Code, ArrowRight, User, Target, FileText, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GradientButton } from "@/components/ui/gradient-button";

const EXPERIENCE_LEVELS = ["Junior", "Mid", "Senior", "Lead", "Principal"];

const inputClass = "mt-1.5";

export interface CandidateContext {
  name: string;
  techStack: string;
  level: string;
  targetRole: string;
  resumeSkills?: string;
  resumeSummary?: string;
  resumeText?: string;
}

interface InterviewPreCallFormProps {
  agentName: string;
  accentColor: string;
  ownerTechStack: string[];
  onSubmit: (ctx: CandidateContext) => void;
  loading?: boolean;
}

export function InterviewPreCallForm({
  agentName,
  ownerTechStack,
  onSubmit,
  loading = false,
}: InterviewPreCallFormProps) {
  const [name, setName] = useState("");
  const [selectedStack, setSelectedStack] = useState<string[]>([]);
  const [level, setLevel] = useState("Mid");
  const [targetRole, setTargetRole] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeSkills, setResumeSkills] = useState<string | null>(null);
  const [resumeSummary, setResumeSummary] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleStack = (tech: string) => {
    setSelectedStack((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech],
    );
  };

  const handleResumeUpload = async (file: File) => {
    if (file.type !== "application/pdf") return;
    setResumeFile(file);
    setUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const res = await fetch("/api/public/resume/parse", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        if (data.skills) setResumeSkills(data.skills);
        if (data.summary) setResumeSummary(data.summary);
        if (data.resumeText) setResumeText(data.resumeText);
        if (data.name && !name.trim()) setName(data.name);
      }
    } catch {
      /* Non-critical — interview works without resume */
    } finally {
      setUploadingResume(false);
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      techStack: selectedStack.length > 0 ? selectedStack.join(", ") : ownerTechStack.join(", "),
      level,
      targetRole: targetRole.trim(),
      ...(resumeSkills ? { resumeSkills } : {}),
      ...(resumeSummary ? { resumeSummary } : {}),
      ...(resumeText ? { resumeText } : {}),
    });
  };

  const ChipButton = ({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-xl text-xs transition-all"
      style={
        active
          ? {
              background: "var(--ah-sage-soft)",
              border: "1px solid var(--ah-sage)",
              color: "var(--ah-ink)",
            }
          : {
              background: "var(--ah-bg-inset)",
              border: "1px solid var(--ah-border)",
              color: "var(--ah-ink-soft)",
            }
      }
    >
      {children}
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-md mx-auto space-y-5"
    >
      <div className="text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "var(--ah-cta)" }}
        >
          <Code className="w-6 h-6" style={{ color: "#FFFCF6" }} strokeWidth={2} />
        </div>
        <h2 className="font-serif text-3xl md:text-4xl tracking-[-0.02em] text-white">{agentName}</h2>
        <p className="text-base text-white/65 mt-2">Tell us about yourself before we start</p>
      </div>

      <GlassPanel elevation="raised" radius="lg" className="p-5 space-y-5">
        <div>
          <Label>
            <User className="w-3.5 h-3.5" /> Your name *
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Alex Johnson"
            className={inputClass}
          />
        </div>

        <div>
          <Label className="mb-2">Experience level *</Label>
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_LEVELS.map((lvl) => (
              <ChipButton key={lvl} active={level === lvl} onClick={() => setLevel(lvl)}>
                {lvl}
              </ChipButton>
            ))}
          </div>
        </div>

        {ownerTechStack.length > 0 && (
          <div>
            <Label className="mb-2">
              Your tech stack <span className="text-white/35 font-normal">(select what applies)</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {ownerTechStack.map((tech) => (
                <ChipButton key={tech} active={selectedStack.includes(tech)} onClick={() => toggleStack(tech)}>
                  {tech}
                </ChipButton>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label>
            <Target className="w-3.5 h-3.5" /> Target role <span className="text-white/35 font-normal">(optional)</span>
          </Label>
          <Input
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g., Frontend Engineer at Google"
            className={inputClass}
          />
        </div>

        <div>
          <Label className="mb-1.5">
            <FileText className="w-3.5 h-3.5" /> Resume <span className="text-white/35 font-normal">(optional, PDF)</span>
          </Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleResumeUpload(f);
            }}
          />
          {resumeFile ? (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/4 border border-white/10">
              <FileText className="w-4 h-4 shrink-0" style={{ color: "var(--ah-lavender-deep)" }} />
              <span className="text-sm truncate flex-1" style={{ color: "var(--ah-ink)" }}>{resumeFile.name}</span>
              {uploadingResume && (
                <span className="ah-spinner shrink-0" />
              )}
              {resumeSkills && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    background: "var(--ah-sage-soft)",
                    color: "var(--ah-sage-deep)",
                    border: "1px solid var(--ah-sage)",
                  }}
                >
                  Parsed
                </span>
              )}
              <button
                type="button"
                onClick={() => { setResumeFile(null); setResumeSkills(null); setResumeSummary(null); setResumeText(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                aria-label="Remove resume"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-3 py-3 rounded-xl border border-dashed border-white/15 text-sm text-white/55 hover:border-white/30 hover:text-white/85 hover:bg-white/3 transition-all"
            >
              Click to upload PDF resume
            </button>
          )}
        </div>
      </GlassPanel>

      <GradientButton
        onClick={handleSubmit}
        disabled={!name.trim() || loading}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="ah-spinner" />
            Starting interview…
          </span>
        ) : (
          <>
            Start interview <ArrowRight className="w-4 h-4" />
          </>
        )}
      </GradientButton>

      <p className="text-center text-xs text-white/40">
        No sign-up needed · Voice interview · Usually 15–30 minutes
      </p>
    </motion.div>
  );
}
