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

interface UseCase {
  icon: LucideIcon;
  title: string;
  /** Constrained to brand palette so the section keeps its calm polish. */
  tint: "violet" | "blue" | "cyan";
  features: string[];
}

const TINT_BG: Record<UseCase["tint"], string> = {
  violet: "bg-[var(--ah-lavender-soft)]",
  blue: "bg-[var(--ah-sage-soft)]",
  cyan: "bg-[var(--ah-cream-warm)]",
};
const TINT_TEXT: Record<UseCase["tint"], string> = {
  violet: "text-[var(--ah-lavender-deep)]",
  blue: "text-[var(--ah-sage-deep)]",
  cyan: "text-[var(--ah-sage-deep)]",
};
const TINT_DOT: Record<UseCase["tint"], string> = {
  violet: "bg-[var(--ah-lavender-deep)]",
  blue: "bg-[var(--ah-sage-deep)]",
  cyan: "bg-[var(--ah-sage-deep)]",
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
          <p
            className="text-sm font-medium uppercase tracking-[0.2em] mb-4"
            style={{ color: "var(--ah-ink-muted)" }}
          >
            Industry-tuned
          </p>
          <h2
            className="font-serif text-5xl md:text-7xl tracking-[-0.02em] mb-5 leading-[1.08]"
            style={{ color: "var(--ah-ink)" }}
          >
            Built for{" "}
            <span style={{ color: "var(--ah-sage-deep)" }}>
              your industry
            </span>
          </h2>
          <p className="text-xl max-w-2xl mx-auto" style={{ color: "var(--ah-ink-soft)" }}>
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
                  <h3
                    className="font-serif text-xl tracking-tight"
                    style={{ color: "var(--ah-ink)" }}
                  >
                    {c.title}
                  </h3>
                </div>

                <ul className="space-y-3">
                  {c.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-3 text-base leading-relaxed"
                      style={{ color: "var(--ah-ink-soft)" }}
                    >
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
