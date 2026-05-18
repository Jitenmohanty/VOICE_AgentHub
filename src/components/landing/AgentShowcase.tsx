"use client";

import { motion } from "framer-motion";
import { Hotel, Stethoscope, Code, UtensilsCrossed, Scale, User } from "lucide-react";
import { AGENTS } from "@/lib/agents";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GradientText } from "@/components/ui/gradient-text";

const iconMap: Record<string, React.ElementType> = {
  Hotel,
  Stethoscope,
  Code,
  UtensilsCrossed,
  Scale,
  User,
};

export function AgentShowcase() {
  return (
    <section id="agents" className="relative py-20 px-2 md:py-32 md:px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/40 mb-4">
            Templates
          </p>
          <h2 className="font-(family-name:--font-heading) text-4xl md:text-6xl font-semibold tracking-[-0.03em] text-white mb-5 leading-[1.05]">
            Meet your <GradientText>AI agents</GradientText>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Specialized voice agents for every business domain. Each one is an expert in its field.
          </p>
        </motion.div>

        <div className="flex gap-5 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-3 lg:grid-cols-6 md:overflow-visible">
          {AGENTS.map((agent, index) => {
            const Icon = iconMap[agent.icon] ?? Hotel;
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
                className="min-w-[260px] md:min-w-0 snap-center"
              >
                <GlassPanel
                  elevation="subtle"
                  interactive
                  radius="lg"
                  className="h-full p-6 cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ah-gradient-bg opacity-90 shadow-[0_8px_24px_-8px_rgba(124,58,237,0.4)] group-hover:opacity-100 group-hover:shadow-[0_8px_24px_-4px_rgba(59,130,246,0.55)] transition-all">
                    <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>

                  <h3 className="font-semibold text-white text-base tracking-tight mb-1">
                    {agent.name}
                  </h3>
                  <p className="text-xs text-white/55 mb-4 leading-relaxed">
                    {agent.tagline}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {agent.capabilities.slice(0, 2).map((cap) => (
                      <span
                        key={cap}
                        className="text-[10px] tracking-wide px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/8 text-white/60"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </GlassPanel>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
