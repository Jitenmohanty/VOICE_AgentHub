"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Trash2, Database, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";

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
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Link href={`/business/agents/${agentId}?bid=${businessId}`} className="flex items-center gap-1 text-sm text-[#8888AA] hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Agent
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-(family-name:--font-heading) text-2xl font-bold text-white">Business Data</h1>
            <p className="text-sm text-[#8888AA]">Structured data your agent uses (rooms, menu items, services, etc.)</p>
          </div>
          <Button onClick={() => setShowAdd(!showAdd)} className="bg-linear-to-r from-[#00D4FF] to-[#6366F1] text-white border-0">
            <Plus className="w-4 h-4 mr-1" /> Add Data Type
          </Button>
        </div>
      </motion.div>

      {showAdd && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label className="text-[#8888AA]">Data Type Name</Label>
              <Input
                value={newType} onChange={(e) => setNewType(e.target.value)}
                placeholder="e.g., rooms, menu_items, doctors"
                className="mt-1 bg-white/5 border-[#2A2A3E] text-white"
              />
            </div>
            <Button onClick={handleAdd} className="mt-6 bg-[#00D4FF] text-black border-0"><Plus className="w-4 h-4" /></Button>
            <button onClick={() => setShowAdd(false)} className="mt-6 p-2 text-[#8888AA] hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="glass rounded-xl p-5 animate-pulse">
              <div className="h-5 w-1/4 bg-white/5 rounded mb-2" />
              <div className="h-20 w-full bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : dataItems.length === 0 ? (
        <div className="text-center py-16">
          <Database className="w-16 h-16 text-[#8888AA]/30 mx-auto mb-4" />
          <p className="text-[#8888AA]">No business data yet</p>
          <p className="text-sm text-[#666680] mt-1">Add structured data like room listings, menu items, or service catalogs</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dataItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass rounded-xl p-5 group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#FFB800]" />
                  <h4 className="font-medium text-white">{item.dataType.replace(/_/g, " ")}</h4>
                  <span className="text-[10px] text-[#666680]">
                    {Array.isArray(item.data) ? `${item.data.length} entries` : "object"}
                  </span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {editingType === item.dataType ? (
                    <>
                      <button onClick={() => handleSaveJson(item.dataType)} className="p-1.5 rounded-lg hover:bg-white/5 text-green-400"><Save className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditingType(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-[#8888AA]"><X className="w-3.5 h-3.5" /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditingType(item.dataType); setEditJson(JSON.stringify(item.data, null, 2)); }} className="p-1.5 rounded-lg hover:bg-white/5 text-[#8888AA]"><Save className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(item.dataType)} className="p-1.5 rounded-lg hover:bg-white/5 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </>
                  )}
                </div>
              </div>

              {editingType === item.dataType ? (
                <textarea
                  value={editJson} onChange={(e) => setEditJson(e.target.value)}
                  rows={12}
                  className="w-full bg-black/30 border border-[#2A2A3E] rounded-lg p-3 text-sm text-white font-mono resize-none focus:outline-none focus:border-[#00D4FF]"
                />
              ) : (
                <pre className="text-xs text-[#8888AA] bg-black/20 rounded-lg p-3 overflow-auto max-h-40">
                  {JSON.stringify(item.data, null, 2)}
                </pre>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
