"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AgentDefinition, AgentConfig } from "@/types/agent";

interface ConfigModalProps {
  agent: AgentDefinition;
  onSubmit: (config: AgentConfig) => void;
  onClose: () => void;
}

export function ConfigModal({ agent, onSubmit, onClose }: ConfigModalProps) {
  const [config, setConfig] = useState<AgentConfig>(() => {
    const initial: AgentConfig = {};
    for (const field of agent.configFields) {
      if (field.defaultValue !== undefined) initial[field.id] = field.defaultValue;
    }
    return initial;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(config);
  };

  const updateField = (id: string, value: string | string[]) => {
    setConfig((prev) => ({ ...prev, [id]: value }));
  };

  const toggleMultiSelect = (id: string, option: string) => {
    const current = (config[id] as string[]) || [];
    const updated = current.includes(option)
      ? current.filter((v) => v !== option)
      : [...current, option];
    updateField(id, updated);
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
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg glass-raised rounded-3xl p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-(family-name:--font-heading) font-bold text-xl text-white">
                Configure {agent.name}
              </h2>
              <p className="text-sm text-white/55 mt-1">
                Set up your agent before starting the conversation
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/[0.06] text-white/55 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {agent.configFields.map((field) => (
              <div key={field.id}>
                <Label>{field.label}</Label>

                {field.type === "text" && (
                  <Input
                    value={(config[field.id] as string) || ""}
                    onChange={(e) => updateField(field.id, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    className="mt-1.5"
                  />
                )}

                {field.type === "select" && field.options && (
                  <Select
                    value={(config[field.id] as string) || ""}
                    onValueChange={(v) => v && updateField(field.id, v)}
                  >
                    <SelectTrigger className="mt-1.5 bg-white/[0.04] border-white/10 text-white">
                      <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--ah-bg-raised)] border-white/10">
                      {field.options.map((opt) => (
                        <SelectItem key={opt} value={opt} className="text-white hover:bg-white/[0.06]">
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {field.type === "multi-select" && field.options && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {field.options.map((opt) => {
                      const selected = ((config[field.id] as string[]) || []).includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleMultiSelect(field.id, opt)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                            selected
                              ? "bg-gradient-to-br from-violet-500/15 to-cyan-500/10 border-violet-300/40 text-white"
                              : "bg-white/[0.03] border-white/10 text-white/55 hover:bg-white/[0.06] hover:text-white/85"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            <Button type="submit" className="w-full mt-2 ah-gradient-bg text-white border-0 hover:opacity-90 shadow-[0_8px_24px_-8px_rgba(124,58,237,0.5)]">
              <Play className="w-4 h-4 mr-2" />
              Start Session
            </Button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
