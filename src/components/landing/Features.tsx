"use client";

import { motion } from "framer-motion";
import { Globe, Mic2, Brain, Volume2 } from "lucide-react";

const features = [
  {
    icon: Globe,
    title: "90+ Languages",
    description: "Speak naturally in any language. Our agents understand and respond fluently.",
    color: "#00D4FF",
  },
  {
    icon: Mic2,
    title: "Real-time Voice",
    description: "Natural, low-latency voice conversations powered by Gemini Live API.",
    color: "#FFB800",
  },
  {
    icon: Brain,
    title: "Domain Expert",
    description: "Each agent is specialized for its industry with deep domain knowledge.",
    color: "#6366F1",
  },
  {
    icon: Volume2,
    title: "Noise Filtering",
    description: "Advanced audio processing ensures clear communication in any environment.",
    color: "#10B981",
  },
];

export function Features() {
  return (
    <section className="py-24 px-6 bg-[#0A0A12]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-(family-name:--font-heading) text-4xl md:text-5xl font-bold text-white mb-4">
            Built for the Future of Voice
          </h2>
          <p className="text-[#8888AA] text-lg">
            Enterprise-grade AI voice agents with cutting-edge capabilities.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-2xl p-6 text-center group hover:border-white/10 transition-all"
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 transition-all group-hover:scale-110"
                style={{ backgroundColor: `${feature.color}15` }}
              >
                <feature.icon className="w-7 h-7" style={{ color: feature.color }} />
              </div>
              <h3 className="font-(family-name:--font-heading) font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-[#8888AA]">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
