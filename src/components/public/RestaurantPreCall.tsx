"use client";

import { motion } from "framer-motion";
import { Phone, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  accentColor,
  menuItems,
  onStartCall,
  loading = false,
}: RestaurantPreCallProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-5"
    >
      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg font-semibold text-white">{businessName}</h2>
        <p className="text-sm text-[#8888AA]">{agentName} — ready to take your order</p>
      </div>

      {/* Menu */}
      {menuItems.length > 0 && (
        <div className="glass rounded-2xl p-4 space-y-3 max-h-64 overflow-y-auto">
          <p className="text-xs font-medium text-[#8888AA] uppercase tracking-wider">Our Menu</p>
          {CATEGORIES.map((cat) => {
            const items = menuItems.filter((i) => i.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <p className="text-xs font-medium text-[#666680] mb-1.5">{cat}</p>
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between py-1.5 border-b border-white/[0.04] last:border-0"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-white">{item.name}</span>
                        {item.isSpecial && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                          >
                            Special
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-[#666680] line-clamp-1">{item.description}</p>
                      )}
                      {item.allergens.length > 0 && (
                        <p className="text-[10px] text-[#8888AA]">{item.allergens.join(" · ")}</p>
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
        </div>
      )}

      {/* Call buttons */}
      <div className="space-y-2">
        <Button
          onClick={() => onStartCall("order")}
          disabled={loading}
          className="w-full py-6 text-base font-semibold text-white border-0 hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}99)` }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Connecting...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" /> Call to Order
            </span>
          )}
        </Button>
        <Button
          onClick={() => onStartCall("reservation")}
          disabled={loading}
          variant="outline"
          className="w-full border-[#2A2A3E] text-white hover:bg-white/5"
        >
          <Phone className="w-4 h-4 mr-2" /> Make a Reservation
        </Button>
      </div>

      <p className="text-center text-xs text-[#666680]">No sign-up needed · Voice call</p>
    </motion.div>
  );
}
