"use client";

import { motion } from "framer-motion";
import { Hotel, Stethoscope, Code, UtensilsCrossed, Scale, User } from "lucide-react";
import { AGENTS } from "@/lib/agents";
import { GlassPanel } from "@/components/ui/glass-panel";

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
          <p
            className="text-sm font-medium uppercase tracking-[0.2em] mb-4"
            style={{ color: "var(--ah-ink-muted)" }}
          >
            Templates
          </p>
          <h2
            className="font-serif text-4xl md:text-6xl tracking-[-0.02em] mb-5 leading-[1.08]"
            style={{ color: "var(--ah-ink)" }}
          >
            Meet your{" "}
            <span className="italic" style={{ color: "var(--ah-sage-deep)" }}>
              AI agents
            </span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--ah-ink-soft)" }}>
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
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-all"
                    style={{ background: "var(--ah-sage-soft)" }}
                  >
                    <Icon className="w-5 h-5" style={{ color: "var(--ah-sage-deep)" }} strokeWidth={2} />
                  </div>

                  <h3
                    className="font-serif text-base tracking-tight mb-1"
                    style={{ color: "var(--ah-ink)" }}
                  >
                    {agent.name}
                  </h3>
                  <p
                    className="text-xs mb-4 leading-relaxed"
                    style={{ color: "var(--ah-ink-soft)" }}
                  >
                    {agent.tagline}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {agent.capabilities.slice(0, 2).map((cap) => (
                      <span
                        key={cap}
                        className="text-[10px] tracking-wide px-2 py-0.5 rounded-full"
                        style={{
                          background: "var(--ah-bg-inset)",
                          border: "1px solid var(--ah-border)",
                          color: "var(--ah-ink-soft)",
                        }}
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
