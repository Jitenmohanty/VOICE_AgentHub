"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Trash2, Database, Save, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GradientButton } from "@/components/ui/gradient-button";

interface DataItem {
  id: string;
  dataType: string;
  data: Record<string, unknown>[] | Record<string, unknown>;
  createdAt: string;
}

export default function BusinessDataPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const businessId = useSearchParams().get("bid") || "";
  const base = `/api/business/${businessId}/agents/${agentId}/data`;

  const [dataItems, setDataItems] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState("");
  const [editingType, setEditingType] = useState<string | null>(null);
  const [editJson, setEditJson] = useState("");

  const fetchData = useCallback(() => {
    fetch(base)
      .then((r) => r.json())
      .then((d) => setDataItems(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [base]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async () => {
    if (!newType.trim()) { toast.error("Data type is required"); return; }
    try {
      const res = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataType: newType.toLowerCase().replace(/\s+/g, "_"), data: [] }),
      });
      if (!res.ok) throw new Error();
      toast.success("Data type created!");
      setNewType(""); setShowAdd(false);
      fetchData();
    } catch {
      toast.error("Failed to create");
    }
  };

  const handleSaveJson = async (dataType: string) => {
    try {
      const parsed = JSON.parse(editJson);
      const res = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataType, data: parsed }),
      });
      if (!res.ok) throw new Error();
      toast.success("Data saved!");
      setEditingType(null);
      fetchData();
    } catch (e) {
      if (e instanceof SyntaxError) toast.error("Invalid JSON");
      else toast.error("Failed to save");
    }
  };

  const handleDelete = async (dataType: string) => {
    try {
      await fetch(`${base}/${dataType}`, { method: "DELETE" });
      setDataItems((prev) => prev.filter((d) => d.dataType !== dataType));
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-2 py-6 md:p-10">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-7">
        <Link
          href={`/business/agents/${agentId}?bid=${businessId}`}
          className="inline-flex items-center gap-1.5 text-sm text-white/55 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to agent
        </Link>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/40 mb-2">Live data</p>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] text-white">Business data</h1>
            <p className="text-sm text-white/55 mt-1">Structured data your agent uses (rooms, menu, services, etc.)</p>
          </div>
          <GradientButton onClick={() => setShowAdd(!showAdd)} size="default">
            <Plus className="w-4 h-4" /> Add data type
          </GradientButton>
        </div>
      </motion.div>

      {showAdd && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <GlassPanel elevation="raised" radius="lg" className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Label>Data type name</Label>
                <Input
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  placeholder="e.g., rooms, menu_items, doctors"
                  className="mt-1.5"
                />
              </div>
              <GradientButton onClick={handleAdd} size="default" className="mt-6">
                <Plus className="w-4 h-4" />
              </GradientButton>
              <button
                onClick={() => setShowAdd(false)}
                className="mt-6 p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </GlassPanel>
        </motion.div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="glass rounded-2xl p-5 animate-pulse">
              <div className="h-5 w-1/4 bg-white/[0.06] rounded mb-2" />
              <div className="h-20 w-full bg-white/[0.06] rounded" />
            </div>
          ))}
        </div>
      ) : dataItems.length === 0 ? (
        <GlassPanel elevation="subtle" radius="lg" className="text-center py-16 px-6">
          <Database className="w-12 h-12 text-white/15 mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-white/65">No business data yet</p>
          <p className="text-sm text-white/40 mt-1">
            Add structured data like rooms, menu items, or service catalogs.
          </p>
        </GlassPanel>
      ) : (
        <div className="space-y-4">
          {dataItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.4 }}
            >
              <GlassPanel elevation="subtle" radius="md" className="p-5 group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-300/20 flex items-center justify-center">
                      <Database className="w-3.5 h-3.5 text-cyan-300" strokeWidth={2} />
                    </div>
                    <h4 className="font-medium text-white tracking-tight capitalize">{item.dataType.replace(/_/g, " ")}</h4>
                    <span className="text-[10px] text-white/40">
                      {Array.isArray(item.data) ? `${item.data.length} entries` : "object"}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    {editingType === item.dataType ? (
                      <>
                        <button onClick={() => handleSaveJson(item.dataType)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-emerald-300 transition-colors" aria-label="Save">
                          <Save className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditingType(null)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/55 transition-colors" aria-label="Cancel">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setEditingType(item.dataType); setEditJson(JSON.stringify(item.data, null, 2)); }}
                          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/55 transition-colors"
                          aria-label="Edit"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(item.dataType)} className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-300/70 hover:text-rose-300 transition-colors" aria-label="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {editingType === item.dataType ? (
                  <textarea
                    value={editJson}
                    onChange={(e) => setEditJson(e.target.value)}
                    rows={12}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-xs text-white font-mono resize-none focus:outline-none focus:border-violet-300/50"
                  />
                ) : (
                  <pre className="text-xs text-white/65 bg-black/30 border border-white/[0.06] rounded-xl p-3.5 overflow-auto max-h-40 font-mono">
                    {JSON.stringify(item.data, null, 2)}
                  </pre>
                )}
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
