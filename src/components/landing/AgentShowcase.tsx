"use client";

import { motion } from "framer-motion";
import { Hotel, Stethoscope, Code, UtensilsCrossed, Scale } from "lucide-react";
import { AGENTS } from "@/lib/agents";

const iconMap: Record<string, React.ElementType> = {
  Hotel,
  Stethoscope,
  Code,
  UtensilsCrossed,
  Scale,
};

export function AgentShowcase() {
  return (
    <section id="agents" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-(family-name:--font-heading) text-4xl md:text-5xl font-bold text-white mb-4">
            Meet Your AI Agents
          </h2>
          <p className="text-[#8888AA] text-lg max-w-2xl mx-auto">
            Specialized voice agents for every business domain. Each agent is an expert in its field.
          </p>
        </motion.div>

        <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-3 lg:grid-cols-5 md:overflow-visible">
          {AGENTS.map((agent, index) => {
            const Icon = iconMap[agent.icon] ?? Hotel;
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="min-w-70 md:min-w-0 snap-center glass rounded-2xl p-6 cursor-pointer group"
                style={{
                  borderColor: `${agent.accentColor}20`,
                  borderWidth: "1px",
                }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110"
                  style={{ backgroundColor: `${agent.accentColor}15` }}
                >
                  <Icon className="w-7 h-7" style={{ color: agent.accentColor }} />
                </div>

                <h3 className="font-(family-name:--font-heading) font-semibold text-lg text-white mb-1">
                  {agent.name}
                </h3>
                <p className="text-sm text-[#8888AA] mb-4">{agent.tagline}</p>
                <p className="text-sm text-[#666680] mb-4 line-clamp-2">{agent.description}</p>

                <div className="flex flex-wrap gap-1.5">
                  {agent.capabilities.slice(0, 3).map((cap) => (
                    <span
                      key={cap}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${agent.accentColor}10`,
                        color: agent.accentColor,
                      }}
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
