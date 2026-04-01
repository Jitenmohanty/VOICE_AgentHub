"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Code, ArrowRight, User, Target, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EXPERIENCE_LEVELS = ["Junior", "Mid", "Senior", "Lead", "Principal"];

export interface CandidateContext {
  name: string;
  techStack: string;
  level: string;
  targetRole: string;
  resumeSkills?: string;
}

interface InterviewPreCallFormProps {
  agentName: string;
  accentColor: string;
  /** Owner-configured tech stack options */
  ownerTechStack: string[];
  onSubmit: (ctx: CandidateContext) => void;
  loading?: boolean;
}

export function InterviewPreCallForm({
  agentName,
  accentColor,
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
      }
    } catch {
      // Non-critical — interview works without resume
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
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto space-y-5"
    >
      {/* Header */}
      <div className="text-center">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <Code className="w-6 h-6" style={{ color: accentColor }} />
        </div>
        <h2 className="text-lg font-semibold text-white">{agentName}</h2>
        <p className="text-sm text-[#8888AA] mt-1">
          Tell us about yourself before we start
        </p>
      </div>

      {/* Form */}
      <div className="glass rounded-2xl p-5 space-y-4">
        {/* Name */}
        <div>
          <Label className="text-[#8888AA] flex items-center gap-1.5 mb-1.5">
            <User className="w-3.5 h-3.5" /> Your Name *
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Alex Johnson"
            className="bg-white/5 border-[#2A2A3E] text-white"
          />
        </div>

        {/* Experience Level */}
        <div>
          <Label className="text-[#8888AA] mb-2 block">Experience Level *</Label>
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_LEVELS.map((lvl) => {
              const sel = level === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className="px-3 py-1.5 rounded-lg text-sm transition-all"
                  style={{
                    backgroundColor: sel ? `${accentColor}20` : "rgba(255,255,255,0.05)",
                    color: sel ? accentColor : "#8888AA",
                    border: `1px solid ${sel ? `${accentColor}40` : "transparent"}`,
                  }}
                >
                  {lvl}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tech Stack */}
        {ownerTechStack.length > 0 && (
          <div>
            <Label className="text-[#8888AA] mb-2 block">
              Your Tech Stack{" "}
              <span className="text-[#666680] font-normal">(select what applies to you)</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {ownerTechStack.map((tech) => {
                const sel = selectedStack.includes(tech);
                return (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => toggleStack(tech)}
                    className="px-3 py-1.5 rounded-lg text-sm transition-all"
                    style={{
                      backgroundColor: sel ? `${accentColor}20` : "rgba(255,255,255,0.05)",
                      color: sel ? accentColor : "#8888AA",
                      border: `1px solid ${sel ? `${accentColor}40` : "transparent"}`,
                    }}
                  >
                    {tech}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Target Role */}
        <div>
          <Label className="text-[#8888AA] flex items-center gap-1.5 mb-1.5">
            <Target className="w-3.5 h-3.5" /> Target Role{" "}
            <span className="text-[#666680] font-normal">(optional)</span>
          </Label>
          <Input
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g., Frontend Engineer at Google"
            className="bg-white/5 border-[#2A2A3E] text-white"
          />
        </div>

        {/* Resume Upload */}
        <div>
          <Label className="text-[#8888AA] flex items-center gap-1.5 mb-1.5">
            <FileText className="w-3.5 h-3.5" /> Resume{" "}
            <span className="text-[#666680] font-normal">(optional, PDF)</span>
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
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-[#2A2A3E]">
              <FileText className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
              <span className="text-sm text-white truncate flex-1">{resumeFile.name}</span>
              {uploadingResume && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
              )}
              {resumeSkills && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 shrink-0">Parsed</span>
              )}
              <button
                type="button"
                onClick={() => { setResumeFile(null); setResumeSkills(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                className="p-0.5 rounded hover:bg-white/10 text-[#8888AA]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-3 py-2.5 rounded-lg border border-dashed border-[#2A2A3E] text-sm text-[#8888AA] hover:border-[#444] hover:text-white transition-colors"
            >
              Click to upload PDF resume
            </button>
          )}
        </div>
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!name.trim() || loading}
        className="w-full text-white border-0 hover:opacity-90 py-6 text-base font-semibold"
        style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}99)` }}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Starting Interview...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Start Interview <ArrowRight className="w-5 h-5" />
          </span>
        )}
      </Button>

      <p className="text-center text-xs text-[#666680]">
        No sign-up needed · Voice interview · Usually 15-30 minutes
      </p>
    </motion.div>
  );
}
