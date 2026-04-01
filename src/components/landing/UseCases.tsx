"use client";

import { motion } from "framer-motion";
import {
  Hotel,
  UtensilsCrossed,
  Stethoscope,
  Scale,
} from "lucide-react";

const cases = [
  {
    icon: Hotel,
    title: "Hotels & Hospitality",
    color: "#FFB800",
    features: [
      "Room availability & pricing from your actual inventory",
      "Check-in/out times, amenities, parking info — all configured",
      "Guests call your public link — no app download needed",
    ],
  },
  {
    icon: UtensilsCrossed,
    title: "Restaurants",
    color: "#EF4444",
    features: [
      "Interactive menu builder with categories, prices & allergens",
      "Callers see your menu before the call, then order by voice",
      "Delivery info, specials & dietary options — all live data",
    ],
  },
  {
    icon: Stethoscope,
    title: "Medical Clinics",
    color: "#10B981",
    features: [
      "Doctor roster with specializations & availability",
      "Patients choose 'Book Appointment' or 'Ask a Question'",
      "Insurance info, emergency protocol & working hours built in",
    ],
  },
  {
    icon: Scale,
    title: "Law Firms",
    color: "#6366F1",
    features: [
      "Practice areas, fee structure & consultation process configured",
      "Callers select their legal topic before the call starts",
      "Automatic disclaimer: 'informational only, not legal advice'",
    ],
  },
];

export function UseCases() {
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
            Built for Your Industry
          </h2>
          <p className="text-[#8888AA] text-lg max-w-2xl mx-auto">
            Not a generic chatbot. Each agent type has its own onboarding, data model, and caller experience.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cases.map((c, index) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-2xl p-6 group hover:border-white/10 transition-all"
              style={{ borderColor: `${c.color}15`, borderWidth: "1px" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${c.color}15` }}
                >
                  <c.icon className="w-5 h-5" style={{ color: c.color }} />
                </div>
                <h3 className="font-(family-name:--font-heading) font-semibold text-lg text-white">
                  {c.title}
                </h3>
              </div>
              <ul className="space-y-2.5">
                {c.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[#8888AA]">
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
