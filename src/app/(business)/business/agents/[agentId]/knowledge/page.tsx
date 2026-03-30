"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Trash2, BookOpen, Edit2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";

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

export default function KnowledgePage() {
  const { agentId } = useParams<{ agentId: string }>();
  const businessId = useSearchParams().get("bid") || "";
  const base = `/api/business/${businessId}/agents/${agentId}/knowledge`;

  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Add form
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
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Link href={`/business/agents/${agentId}?bid=${businessId}`} className="flex items-center gap-1 text-sm text-[#8888AA] hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Agent
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-(family-name:--font-heading) text-2xl font-bold text-white">Knowledge Base</h1>
            <p className="text-sm text-[#8888AA]">Add FAQs, policies, and information your agent should know</p>
          </div>
          <Button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-linear-to-r from-[#00D4FF] to-[#6366F1] text-white border-0"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Item
          </Button>
        </div>
      </motion.div>

      {/* Add form */}
      {showAdd && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass rounded-2xl p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">New Knowledge Item</h3>
            <button onClick={() => setShowAdd(false)} className="text-[#8888AA] hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[#8888AA]">Title</Label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g., Check-in Policy" className="mt-1 bg-white/5 border-[#2A2A3E] text-white" />
            </div>
            <div>
              <Label className="text-[#8888AA]">Category</Label>
              <select
                value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                className="mt-1 w-full h-10 bg-white/5 border border-[#2A2A3E] rounded-lg px-3 text-sm text-white focus:outline-none focus:border-[#00D4FF]"
              >
                {CATEGORIES.map((c) => <option key={c} value={c} className="bg-[#1A1A2E]">{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label className="text-[#8888AA]">Content</Label>
            <textarea
              value={newContent} onChange={(e) => setNewContent(e.target.value)}
              placeholder="Enter the information your agent should know..."
              rows={4}
              className="w-full mt-1 bg-white/5 border border-[#2A2A3E] rounded-lg p-3 text-sm text-white placeholder:text-[#666680] resize-none focus:outline-none focus:border-[#00D4FF]"
            />
          </div>
          <Button onClick={handleAdd} className="bg-[#00D4FF] text-black hover:bg-[#00D4FF]/80 border-0">
            <Check className="w-4 h-4 mr-1" /> Save Item
          </Button>
        </motion.div>
      )}

      {/* Items list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-xl p-5 animate-pulse">
              <div className="h-5 w-1/4 bg-white/5 rounded mb-2" />
              <div className="h-4 w-full bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-16 h-16 text-[#8888AA]/30 mx-auto mb-4" />
          <p className="text-[#8888AA]">No knowledge items yet</p>
          <p className="text-sm text-[#666680] mt-1">Add FAQs, policies, and info so your agent can help customers</p>
        </div>
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="glass rounded-xl p-5 group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-white/5 border-[#2A2A3E] text-white h-8 text-sm" />
          ) : (
            <h4 className="font-medium text-white">{item.title}</h4>
          )}
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[#8888AA]">{item.category}</span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isEditing ? (
            <>
              <button onClick={() => onSave({ title, content })} className="p-1.5 rounded-lg hover:bg-white/5 text-green-400"><Check className="w-3.5 h-3.5" /></button>
              <button onClick={onCancelEdit} className="p-1.5 rounded-lg hover:bg-white/5 text-[#8888AA]"><X className="w-3.5 h-3.5" /></button>
            </>
          ) : (
            <>
              <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-white/5 text-[#8888AA]"><Edit2 className="w-3.5 h-3.5" /></button>
              <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-white/5 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
            </>
          )}
        </div>
      </div>
      {isEditing ? (
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} className="w-full bg-white/5 border border-[#2A2A3E] rounded-lg p-2 text-sm text-white resize-none focus:outline-none focus:border-[#00D4FF]" />
      ) : (
        <p className="text-sm text-[#8888AA] line-clamp-3">{item.content}</p>
      )}
    </motion.div>
  );
}
