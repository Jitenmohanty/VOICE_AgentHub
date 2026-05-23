"use client";

import { motion } from "framer-motion";
import { Phone, ShoppingCart } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GradientButton } from "@/components/ui/gradient-button";

export interface MenuItem {
  id: string;
  name: string;
  price: string;
  category: string;
  description: string;
  allergens: string[];
  isSpecial: boolean;
}

interface RestaurantPreCallProps {
  agentName: string;
  businessName: string;
  accentColor: string;
  menuItems: MenuItem[];
  onStartCall: (context?: string) => void;
  loading?: boolean;
}

const CATEGORIES = ["Starters", "Mains", "Desserts", "Drinks", "Sides"];

export function RestaurantPreCall({
  agentName,
  businessName,
  menuItems,
  onStartCall,
  loading = false,
}: RestaurantPreCallProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full space-y-5"
    >
      <div className="text-center">
        <h2 className="text-lg font-semibold tracking-tight text-white">{businessName}</h2>
        <p className="text-xs text-white/55 mt-0.5">{agentName} — ready to take your order</p>
      </div>

      {menuItems.length > 0 && (
        <GlassPanel elevation="raised" radius="lg" className="p-4 space-y-3 max-h-64 overflow-y-auto">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/40">Our Menu</p>
          {CATEGORIES.map((cat) => {
            const items = menuItems.filter((i) => i.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <p className="text-xs font-medium text-white/45 mb-1.5">{cat}</p>
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between py-2 border-b border-white/[0.05] last:border-0"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white/90">{item.name}</span>
                        {item.isSpecial && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium ah-gradient-bg text-white">
                            Special
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-white/45 line-clamp-1">{item.description}</p>
                      )}
                      {item.allergens.length > 0 && (
                        <p className="text-xs text-white/35 mt-0.5">{item.allergens.join(" · ")}</p>
                      )}
                    </div>
                    <span className="text-sm font-medium text-white shrink-0 ml-3">
                      {item.price}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </GlassPanel>
      )}

      <div className="space-y-2.5">
        <GradientButton onClick={() => onStartCall("order")} disabled={loading} className="w-full" size="lg">
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Connecting…
            </span>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" /> Call to order
            </>
          )}
        </GradientButton>
        <GradientButton onClick={() => onStartCall("reservation")} disabled={loading} variant="outline" className="w-full" size="default">
          <Phone className="w-4 h-4" /> Make a reservation
        </GradientButton>
      </div>

      <p className="text-center text-xs text-white/40">No sign-up needed · Voice call</p>
    </motion.div>
  );
}
