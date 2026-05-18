"use client";

import { motion } from "framer-motion";
import {
  Hotel,
  UtensilsCrossed,
  Stethoscope,
  Scale,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GradientText } from "@/components/ui/gradient-text";

interface UseCase {
  icon: LucideIcon;
  title: string;
  /** Constrained to brand palette so the section keeps its calm polish. */
  tint: "violet" | "blue" | "cyan";
  features: string[];
}

const TINT_BG: Record<UseCase["tint"], string> = {
  violet: "bg-violet-500/10",
  blue: "bg-blue-500/10",
  cyan: "bg-cyan-500/10",
};
const TINT_TEXT: Record<UseCase["tint"], string> = {
  violet: "text-violet-300",
  blue: "text-blue-300",
  cyan: "text-cyan-300",
};
const TINT_DOT: Record<UseCase["tint"], string> = {
  violet: "bg-violet-300",
  blue: "bg-blue-300",
  cyan: "bg-cyan-300",
};

const cases: UseCase[] = [
  {
    icon: Hotel,
    title: "Hotels & hospitality",
    tint: "violet",
    features: [
      "Room availability & pricing from your actual inventory",
      "Check-in/out, amenities, parking — all configured",
      "Guests call your public link, no app download",
    ],
  },
  {
    icon: UtensilsCrossed,
    title: "Restaurants",
    tint: "cyan",
    features: [
      "Menu builder with categories, prices & allergens",
      "Callers see your menu before the call, then order by voice",
      "Delivery info, specials, dietary options — all live",
    ],
  },
  {
    icon: Stethoscope,
    title: "Medical clinics",
    tint: "blue",
    features: [
      "Doctor roster with specializations & availability",
      "Patients pick 'Book' or 'Ask a Question'",
      "Insurance info, emergency protocol, hours",
    ],
  },
  {
    icon: Scale,
    title: "Law firms",
    tint: "violet",
    features: [
      "Practice areas, fee structure & consultation flow",
      "Callers select their legal topic before the call",
      "Auto disclaimer: informational, not legal advice",
    ],
  },
  {
    icon: User,
    title: "Personal · portfolios",
    tint: "cyan",
    features: [
      "An AI version of you, embedded on your site",
      "Visitors talk to you 24/7 — recruiters, clients, peers",
      "Trained on your resume, projects & bio",
    ],
  },
];

export function UseCases() {
  return (
    <section className="relative py-20 px-2 md:py-32 md:px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/40 mb-4">
            Industry-tuned
          </p>
          <h2 className="font-(family-name:--font-heading) text-4xl md:text-6xl font-semibold tracking-[-0.03em] text-white mb-5 leading-[1.05]">
            Built for <GradientText>your industry</GradientText>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Not a generic chatbot. Each agent has its own onboarding, data model, and caller experience.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cases.map((c, index) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <GlassPanel
                elevation="subtle"
                interactive
                radius="lg"
                className="h-full p-7 group"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${TINT_BG[c.tint]} transition-transform duration-500 group-hover:scale-110`}
                  >
                    <c.icon className={`w-5 h-5 ${TINT_TEXT[c.tint]}`} strokeWidth={2} />
                  </div>
                  <h3 className="font-semibold text-white text-lg tracking-tight">
                    {c.title}
                  </h3>
                </div>

                <ul className="space-y-3">
                  {c.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-white/65 leading-relaxed">
                      <span className={`w-1 h-1 rounded-full mt-2 shrink-0 ${TINT_DOT[c.tint]}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
