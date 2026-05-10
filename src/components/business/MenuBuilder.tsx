"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, X, ChefHat } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
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

const CATEGORIES = ["Starters", "Mains", "Desserts", "Drinks", "Sides"];
const ALLERGENS = ["Gluten", "Dairy", "Nuts", "Shellfish", "Soy", "Eggs", "Vegan", "Vegetarian"];

interface MenuBuilderProps {
  businessId: string;
  agentId: string;
  /** Reserved for backwards-compatibility — palette is now brand-fixed. */
  accentColor?: string;
}

const inputClass =
  "mt-1 bg-white/[0.04] border-white/10 text-white placeholder:text-white/30 focus-visible:border-violet-300/50 focus-visible:ring-violet-300/20 rounded-xl text-sm h-9";

export function MenuBuilder({ businessId, agentId }: MenuBuilderProps) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Omit<MenuItem, "id">>({
    name: "",
    price: "",
    category: "Mains",
    description: "",
    allergens: [],
    isSpecial: false,
  });

  const saveToServer = useCallback(
    async (updatedItems: MenuItem[]) => {
      setSaving(true);
      try {
        const res = await fetch(`/api/business/${businessId}/agents/${agentId}/data`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataType: "menu", data: { items: updatedItems } }),
        });
        if (!res.ok) throw new Error();
      } catch {
        toast.error("Failed to save menu");
      } finally {
        setSaving(false);
      }
    },
    [businessId, agentId],
  );

  useEffect(() => {
    fetch(`/api/business/${businessId}/agents/${agentId}/data`)
      .then((r) => r.json())
      .then((d) => {
        const menuData = d.data?.find(
          (item: { dataType: string }) => item.dataType === "menu",
        );
        if (menuData?.data?.items) setItems(menuData.data.items as MenuItem[]);
      })
      .catch(() => {});
  }, [businessId, agentId]);

  const addItem = () => {
    if (!form.name.trim() || !form.price.trim()) {
      toast.error("Name and price are required");
      return;
    }
    const newItem: MenuItem = { ...form, id: crypto.randomUUID() };
    const updated = [...items, newItem];
    setItems(updated);
    void saveToServer(updated);
    setForm({
      name: "",
      price: "",
      category: "Mains",
      description: "",
      allergens: [],
      isSpecial: false,
    });
  };

  const removeItem = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    void saveToServer(updated);
  };

  const toggleAllergen = (allergen: string) => {
    setForm((f) => ({
      ...f,
      allergens: f.allergens.includes(allergen)
        ? f.allergens.filter((a) => a !== allergen)
        : [...f.allergens, allergen],
    }));
  };

  return (
    <GlassPanel elevation="raised" radius="lg" className="p-7 space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-300/20 flex items-center justify-center">
          <ChefHat className="w-4 h-4 text-cyan-300" strokeWidth={2} />
        </div>
        <h3 className="text-base font-semibold tracking-tight text-white">Menu builder</h3>
        <span className="text-xs text-white/40 ml-auto">{items.length} items</span>
      </div>

      {items.length > 0 && (
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {CATEGORIES.map((cat) => {
            const catItems = items.filter((i) => i.category === cat);
            if (catItems.length === 0) return null;
            return (
              <div key={cat}>
                <p className="text-[10px] font-medium text-white/40 uppercase tracking-[0.18em] mb-1.5">{cat}</p>
                {catItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-white/[0.03] rounded-2xl px-3.5 py-2.5 border border-white/[0.06] mb-1.5"
                  >
                    <div className="min-w-0">
                      <span className="text-sm text-white">{item.name}</span>
                      <span className="text-xs text-white/55 ml-2">{item.price}</span>
                      {item.isSpecial && (
                        <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded-full ah-gradient-bg text-white font-medium">
                          Special
                        </span>
                      )}
                      {item.allergens.length > 0 && (
                        <span className="text-[11px] text-white/40 ml-2">· {item.allergens.join(", ")}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-white/40 hover:text-rose-300 p-1 shrink-0 ml-2 rounded transition-colors"
                      aria-label="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06] space-y-4">
        <p className="text-xs font-medium text-white/55 uppercase tracking-wider">Add menu item</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-medium text-white/60">Item name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g., Margherita Pizza"
              className={inputClass}
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-white/60">Price *</Label>
            <Input
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="e.g., $14.99"
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-medium text-white/60">Category</Label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="mt-1 w-full h-9 bg-white/[0.04] border border-white/10 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-violet-300/50"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-[#0B1020]">{c}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs font-medium text-white/60">Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional description…"
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <Label className="text-xs font-medium text-white/60 mb-2 block">Allergens / dietary tags</Label>
          <div className="flex flex-wrap gap-1.5">
            {ALLERGENS.map((a) => {
              const sel = form.allergens.includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAllergen(a)}
                  className={`text-xs px-3 py-1 rounded-full transition-all border ${
                    sel
                      ? "bg-gradient-to-br from-violet-500/15 to-cyan-500/10 border-violet-300/40 text-white"
                      : "bg-white/[0.03] border-white/10 text-white/55 hover:bg-white/[0.06] hover:text-white/85"
                  }`}
                >
                  {a}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, isSpecial: !f.isSpecial }))}
            className="flex items-center gap-2"
          >
            <div className={`w-9 h-5 rounded-full transition-all relative border ${form.isSpecial ? "ah-gradient-bg border-violet-300/40" : "bg-white/[0.06] border-white/10"}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${form.isSpecial ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
            <span className="text-xs text-white/65">Daily special</span>
          </button>
          <GradientButton type="button" onClick={addItem} disabled={saving} size="sm">
            <Plus className="w-3.5 h-3.5" />
            {saving ? "Saving…" : "Add item"}
          </GradientButton>
        </div>
      </div>
    </GlassPanel>
  );
}
