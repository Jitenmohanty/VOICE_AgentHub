"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, X, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

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
  accentColor?: string;
}

export function MenuBuilder({ businessId, agentId, accentColor = "#EF4444" }: MenuBuilderProps) {
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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ChefHat className="w-4 h-4" style={{ color: accentColor }} />
        <h3 className="text-sm font-medium text-white">Menu Builder</h3>
        <span className="text-xs text-[#666680]">({items.length} items)</span>
      </div>

      {/* Current items grouped by category */}
      {items.length > 0 && (
        <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
          {CATEGORIES.map((cat) => {
            const catItems = items.filter((i) => i.category === cat);
            if (catItems.length === 0) return null;
            return (
              <div key={cat}>
                <p className="text-xs font-medium text-[#666680] uppercase tracking-wider mb-1 mt-2">
                  {cat}
                </p>
                {catItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-white/[0.03] rounded-lg px-3 py-2 border border-[#2A2A3E] mb-1"
                  >
                    <div className="min-w-0">
                      <span className="text-sm text-white">{item.name}</span>
                      <span className="text-xs text-[#8888AA] ml-2">{item.price}</span>
                      {item.isSpecial && (
                        <span
                          className="text-xs ml-1.5 px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: `${accentColor}20`,
                            color: accentColor,
                          }}
                        >
                          Special
                        </span>
                      )}
                      {item.allergens.length > 0 && (
                        <span className="text-xs text-[#666680] ml-1.5">
                          · {item.allergens.join(", ")}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-[#8888AA] hover:text-red-400 p-1 shrink-0 ml-2"
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

      {/* Add item form */}
      <div className="bg-white/[0.03] rounded-xl p-4 border border-[#2A2A3E] space-y-3">
        <p className="text-xs font-medium text-[#8888AA]">Add Menu Item</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[#8888AA] text-xs">Item Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g., Margherita Pizza"
              className="mt-1 bg-white/5 border-[#2A2A3E] text-white text-sm h-8"
            />
          </div>
          <div>
            <Label className="text-[#8888AA] text-xs">Price *</Label>
            <Input
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="e.g., $14.99"
              className="mt-1 bg-white/5 border-[#2A2A3E] text-white text-sm h-8"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[#8888AA] text-xs">Category</Label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="mt-1 w-full h-8 bg-white/5 border border-[#2A2A3E] rounded-lg px-2 text-sm text-white focus:outline-none focus:border-[#00D4FF]"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-[#1A1A2E]">
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-[#8888AA] text-xs">Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional description..."
              className="mt-1 bg-white/5 border-[#2A2A3E] text-white text-sm h-8"
            />
          </div>
        </div>
        <div>
          <Label className="text-[#8888AA] text-xs mb-1.5 block">Allergens / Dietary Tags</Label>
          <div className="flex flex-wrap gap-1.5">
            {ALLERGENS.map((a) => {
              const sel = form.allergens.includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAllergen(a)}
                  className="text-xs px-2.5 py-1 rounded-full transition-all"
                  style={{
                    backgroundColor: sel ? `${accentColor}20` : "rgba(255,255,255,0.05)",
                    color: sel ? accentColor : "#8888AA",
                    border: `1px solid ${sel ? `${accentColor}40` : "transparent"}`,
                  }}
                >
                  {a}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, isSpecial: !f.isSpecial }))}
            className="flex items-center gap-2"
          >
            <div
              className={`w-8 h-4 rounded-full transition-colors relative ${form.isSpecial ? "bg-[#00D4FF]" : "bg-[#2A2A3E]"}`}
            >
              <div
                className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${form.isSpecial ? "translate-x-4" : "translate-x-0.5"}`}
              />
            </div>
            <span className="text-xs text-[#8888AA]">Daily Special</span>
          </button>
          <Button
            type="button"
            onClick={addItem}
            disabled={saving}
            size="sm"
            className="h-7 text-xs bg-[#00D4FF] text-black hover:bg-[#00D4FF]/80 border-0"
          >
            <Plus className="w-3 h-3 mr-1" />
            {saving ? "Saving..." : "Add Item"}
          </Button>
        </div>
      </div>
    </div>
  );
}
