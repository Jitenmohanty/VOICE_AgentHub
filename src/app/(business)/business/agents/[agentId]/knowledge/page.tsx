"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Trash2, BookOpen, Edit2, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GradientButton } from "@/components/ui/gradient-button";

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  sourceType: string;
  isActive: boolean;
  createdAt: string;
}

const CATEGORIES = ["faq", "policy", "service", "general", "menu", "amenities", "procedures"];

const inputClass =
  "mt-1 bg-white/[0.04] border-white/10 text-white placeholder:text-white/30 focus-visible:border-violet-300/50 focus-visible:ring-violet-300/20 rounded-xl";

export default function KnowledgePage() {
  const { agentId } = useParams<{ agentId: string }>();
  const businessId = useSearchParams().get("bid") || "";
  const base = `/api/business/${businessId}/agents/${agentId}/knowledge`;

  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("faq");

  const fetchItems = useCallback(() => {
    fetch(base)
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [base]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleAdd = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error("Title and content are required");
      return;
    }
    try {
      const res = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, content: newContent, category: newCategory }),
      });
      if (!res.ok) throw new Error();
      toast.success("Knowledge item added!");
      setNewTitle(""); setNewContent(""); setShowAdd(false);
      fetchItems();
    } catch {
      toast.error("Failed to add");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${base}/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleUpdate = async (id: string, data: Partial<KnowledgeItem>) => {
    try {
      const res = await fetch(`${base}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      toast.success("Updated");
      setEditingId(null);
      fetchItems();
    } catch {
      toast.error("Failed to update");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-7">
        <Link
          href={`/business/agents/${agentId}?bid=${businessId}`}
          className="inline-flex items-center gap-1.5 text-sm text-white/55 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to agent
        </Link>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/40 mb-2">Agent Memory</p>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] text-white">Knowledge base</h1>
            <p className="text-sm text-white/55 mt-1">Add FAQs, policies, and info your agent should know.</p>
          </div>
          <GradientButton onClick={() => setShowAdd(!showAdd)} size="default">
            <Plus className="w-4 h-4" /> Add item
          </GradientButton>
        </div>
      </motion.div>

      {showAdd && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-6"
        >
          <GlassPanel elevation="raised" radius="lg" className="p-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white tracking-tight">New knowledge item</h3>
              <button
                onClick={() => setShowAdd(false)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-white/60">Title</Label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Check-in Policy"
                  className={inputClass}
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-white/60">Category</Label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="mt-1 w-full h-11 bg-white/[0.04] border border-white/10 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-violet-300/50"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-[#0B1020]">{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-white/60">Content</Label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Enter the information your agent should know…"
                rows={4}
                className="w-full mt-1 bg-white/[0.04] border border-white/10 rounded-xl p-3.5 text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-violet-300/50"
              />
            </div>
            <GradientButton onClick={handleAdd} size="default">
              <Check className="w-4 h-4" /> Save item
            </GradientButton>
          </GlassPanel>
        </motion.div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-2xl p-5 animate-pulse">
              <div className="h-5 w-1/4 bg-white/[0.06] rounded mb-2" />
              <div className="h-4 w-full bg-white/[0.06] rounded" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <GlassPanel elevation="subtle" radius="lg" className="text-center py-16 px-6">
          <BookOpen className="w-12 h-12 text-white/15 mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-white/65">No knowledge items yet</p>
          <p className="text-sm text-white/40 mt-1">
            Add FAQs, policies, and info so your agent can help customers.
          </p>
        </GlassPanel>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <KnowledgeItemCard
              key={item.id}
              item={item}
              index={i}
              isEditing={editingId === item.id}
              onEdit={() => setEditingId(item.id)}
              onCancelEdit={() => setEditingId(null)}
              onSave={(data) => handleUpdate(item.id, data)}
              onDelete={() => handleDelete(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function KnowledgeItemCard({
  item, index, isEditing, onEdit, onCancelEdit, onSave, onDelete,
}: {
  item: KnowledgeItem;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (data: Partial<KnowledgeItem>) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
    >
      <GlassPanel elevation="subtle" interactive={!isEditing} radius="md" className="p-5 group">
        <div className="flex items-start justify-between mb-2 gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {isEditing ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-white/[0.04] border-white/10 text-white h-9 text-sm rounded-xl"
              />
            ) : (
              <h4 className="font-medium text-white tracking-tight truncate">{item.title}</h4>
            )}
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-white/55 shrink-0">
              {item.category}
            </span>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
            {isEditing ? (
              <>
                <button onClick={() => onSave({ title, content })} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-emerald-300 transition-colors" aria-label="Save">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={onCancelEdit} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/55 transition-colors" aria-label="Cancel">
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/55 transition-colors" aria-label="Edit">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-300/70 hover:text-rose-300 transition-colors" aria-label="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-2.5 text-sm text-white resize-none focus:outline-none focus:border-violet-300/50"
          />
        ) : (
          <p className="text-sm text-white/55 line-clamp-3">{item.content}</p>
        )}
      </GlassPanel>
    </motion.div>
  );
}
