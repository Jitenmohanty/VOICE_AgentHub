"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Trash2, BookOpen, Edit2, X, Check, Globe, HelpCircle, Download, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  embeddingStatus?: "pending" | "ready" | "failed" | string;
  embeddingError?: string | null;
}

interface KnowledgeGap {
  id: string;
  query: string;
  hits: number;
  lastAskedAt: string;
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

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("faq");

  // Import-from-website (Item 1)
  const [showImport, setShowImport] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);

  // Knowledge gaps (Item 2) — questions callers asked with no answer found
  const [gaps, setGaps] = useState<KnowledgeGap[]>([]);
  const [resolvingGapId, setResolvingGapId] = useState<string | null>(null);

  // OKF export (read-only) + import
  const [exporting, setExporting] = useState(false);
  const [importingOkf, setImportingOkf] = useState(false);
  const okfInputRef = useRef<HTMLInputElement>(null);

  const fetchItems = useCallback(() => {
    fetch(base)
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [base]);

  const fetchGaps = useCallback(() => {
    fetch(`${base}/gaps`)
      .then((r) => r.json())
      .then((d) => setGaps(d.gaps || []))
      .catch(() => {});
  }, [base]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { fetchGaps(); }, [fetchGaps]);

  const handleImport = async () => {
    if (!importUrl.trim()) {
      toast.error("Enter your website URL");
      return;
    }
    setImporting(true);
    try {
      const res = await fetch(`${base}/ingest-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Import failed");
      toast.success("Import started — items will appear below as pages are read");
      setShowImport(false);
      setImportUrl("");
      // The ingest runs in the background; refresh the list a few times so
      // the owner sees items stream in without reloading.
      [6000, 15000, 30000, 60000].forEach((ms) => setTimeout(fetchItems, ms));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const handleExportOkf = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const res = await fetch(`${base}/export/okf`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Export failed");
      if (!data.count) {
        toast.error("Nothing to export yet — add a knowledge item first");
        return;
      }
      // Client-side download of the bundle JSON (no server-side file storage).
      const blob = new Blob([JSON.stringify(data.files, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename || "okf-bundle.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${data.count} item${data.count !== 1 ? "s" : ""} as OKF`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleImportOkf = async (file: File) => {
    if (importingOkf) return;
    setImportingOkf(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      // Accept either the raw { path: contents } map or a { files: {...} } wrapper.
      const files =
        parsed && typeof parsed === "object" && parsed.files && typeof parsed.files === "object"
          ? parsed.files
          : parsed;
      const res = await fetch(`${base}/import/okf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Import failed");
      toast.success(
        `Imported: ${data.created} new, ${data.updated} updated, ${data.skipped} unchanged` +
          (data.dataUpserted ? `, ${data.dataUpserted} data set${data.dataUpserted !== 1 ? "s" : ""}` : ""),
      );
      // Embeddings run async — refresh a few times so status flips pending → ready.
      [1500, 6000, 15000].forEach((ms) => setTimeout(fetchItems, ms));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid OKF bundle file");
    } finally {
      setImportingOkf(false);
      if (okfInputRef.current) okfInputRef.current.value = "";
    }
  };

  const handleGapAction = async (gapId: string, status: "dismissed" | "resolved") => {
    setGaps((prev) => prev.filter((g) => g.id !== gapId));
    await fetch(`${base}/gaps`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gapId, status }),
    }).catch(() => {});
  };

  const handleAnswerGap = (gap: KnowledgeGap) => {
    // Prefill the add form with the caller's question; when the owner saves,
    // the gap is marked resolved.
    setNewTitle(gap.query.charAt(0).toUpperCase() + gap.query.slice(1));
    setNewContent("");
    setNewCategory("faq");
    setResolvingGapId(gap.id);
    setShowAdd(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
      // If this answer came from a caller-asked gap, mark the gap resolved.
      if (resolvingGapId) {
        void handleGapAction(resolvingGapId, "resolved");
        setResolvingGapId(null);
      }
      setNewTitle(""); setNewContent(""); setShowAdd(false);
      fetchItems();
      // Embedding runs asynchronously — refresh so the badge flips to ready.
      [2000, 6000, 15000].forEach((ms) => setTimeout(fetchItems, ms));
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
      // Content edits re-embed asynchronously — refresh so the badge flips.
      [2000, 6000, 15000].forEach((ms) => setTimeout(fetchItems, ms));
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleReembed = async (id: string) => {
    // Optimistically flip to "pending" so the badge updates immediately.
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, embeddingStatus: "pending", embeddingError: null } : i)),
    );
    try {
      const res = await fetch(`${base}/${id}/reembed`, { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success("Re-indexing started");
      [2000, 6000, 15000].forEach((ms) => setTimeout(fetchItems, ms));
    } catch {
      toast.error("Couldn't start re-indexing");
      fetchItems();
    }
  };

  // Agent-level indexing summary for the header indicator.
  const indexing = items.filter((i) => i.embeddingStatus === "pending").length;
  const failed = items.filter((i) => i.embeddingStatus === "failed").length;

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
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/40 mb-2">Agent Memory</p>
            <h1 className="font-serif text-3xl md:text-4xl tracking-[-0.02em] text-white">Knowledge base</h1>
            <p className="text-base text-white/55 mt-2">Add FAQs, policies, and info your agent should know.</p>
            {(indexing > 0 || failed > 0) && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                {indexing > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-300/20 text-amber-300">
                    <span className="ah-spinner !w-3 !h-3" />
                    {indexing} item{indexing !== 1 ? "s" : ""} indexing — not yet searchable by the agent
                  </span>
                )}
                {failed > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-300/20 text-rose-300">
                    {failed} failed to index — retry below
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <input
              ref={okfInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImportOkf(f);
              }}
            />
            <GradientButton onClick={() => okfInputRef.current?.click()} disabled={importingOkf} variant="outline" size="default">
              {importingOkf ? <span className="ah-spinner" /> : <Upload className="w-4 h-4" />} Import OKF
            </GradientButton>
            <GradientButton onClick={handleExportOkf} disabled={exporting} variant="outline" size="default">
              {exporting ? <span className="ah-spinner" /> : <Download className="w-4 h-4" />} Export OKF
            </GradientButton>
            <GradientButton onClick={() => setShowImport(!showImport)} variant="outline" size="default">
              <Globe className="w-4 h-4" /> Import from website
            </GradientButton>
            <GradientButton onClick={() => setShowAdd(!showAdd)} size="default">
              <Plus className="w-4 h-4" /> Add item
            </GradientButton>
          </div>
        </div>
      </motion.div>

      {showImport && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-6"
        >
          <GlassPanel elevation="raised" radius="lg" className="p-6 md:p-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white tracking-tight">Import from your website</h3>
              <button
                onClick={() => setShowImport(false)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-white/55">
              Paste your website URL — we&apos;ll read up to 8 pages (about, FAQ, services, pricing…),
              split them into knowledge items with AI, and index them for your agent. Items appear
              below within a minute or two.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Input
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleImport()}
                placeholder="https://your-business.com"
                className="flex-1 min-w-[220px]"
              />
              <GradientButton onClick={handleImport} disabled={importing} size="default">
                {importing ? <span className="ah-spinner" /> : <Globe className="w-4 h-4" />}
                {importing ? "Starting…" : "Import"}
              </GradientButton>
            </div>
          </GlassPanel>
        </motion.div>
      )}

      {gaps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <GlassPanel elevation="subtle" radius="lg" className="p-5 md:p-6">
            <h3 className="font-semibold text-white tracking-tight flex items-center gap-2 mb-1">
              <HelpCircle className="w-4 h-4 text-amber-300" />
              Callers asked — your agent had no answer
            </h3>
            <p className="text-sm text-white/45 mb-4">
              These questions came up on real calls but nothing in your knowledge base matched.
              Add an answer and your agent handles it next time.
            </p>
            <div className="space-y-2">
              {gaps.map((gap) => (
                <div
                  key={gap.id}
                  className="flex items-center justify-between gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white/85 truncate">&ldquo;{gap.query}&rdquo;</p>
                    <p className="text-xs text-white/40 mt-0.5">
                      asked {gap.hits} time{gap.hits !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleAnswerGap(gap)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-300/20 text-emerald-300 transition-colors"
                    >
                      Add answer
                    </button>
                    <button
                      onClick={() => handleGapAction(gap.id, "dismissed")}
                      className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
                      aria-label="Dismiss"
                      title="Dismiss — not relevant"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </motion.div>
      )}

      {showAdd && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-6"
        >
          <GlassPanel elevation="raised" radius="lg" className="p-6 md:p-7 space-y-4">
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
                <Label>Title</Label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Check-in Policy"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Category</Label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="mt-1.5 w-full h-10 bg-white/[0.04] border border-white/10 rounded-xl px-3 text-sm text-white outline-none transition-[border-color,box-shadow,background-color] duration-200 hover:bg-white/[0.06] hover:border-white/14 focus-visible:border-violet-300/55 focus-visible:bg-white/[0.06] focus-visible:shadow-[0_0_0_3px_rgba(124,58,237,0.18)]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-[var(--ah-bg-raised)]">{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Enter the information your agent should know…"
                rows={4}
                className="mt-1.5"
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
              onRetry={() => handleReembed(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmbeddingBadge({
  status,
  error,
  onRetry,
}: {
  status?: string;
  error?: string | null;
  onRetry: () => void;
}) {
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-300/20 text-amber-300 shrink-0">
        <span className="ah-spinner !w-2.5 !h-2.5" /> Indexing
      </span>
    );
  }
  if (status === "failed") {
    return (
      <button
        onClick={onRetry}
        title={error || "Embedding failed — click to retry"}
        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-300/20 text-rose-300 hover:bg-rose-500/20 transition-colors shrink-0"
      >
        Failed · Retry
      </button>
    );
  }
  // ready (or legacy null) — a quiet confirmation.
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-300/20 text-emerald-300 shrink-0">
      <Check className="w-3 h-3" /> Indexed
    </span>
  );
}

function KnowledgeItemCard({
  item, index, isEditing, onEdit, onCancelEdit, onSave, onDelete, onRetry,
}: {
  item: KnowledgeItem;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (data: Partial<KnowledgeItem>) => void;
  onDelete: () => void;
  onRetry: () => void;
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
                className="h-9"
              />
            ) : (
              <h4 className="font-medium text-white tracking-tight truncate">{item.title}</h4>
            )}
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-white/55 shrink-0">
              {item.category}
            </span>
            {!isEditing && (
              <EmbeddingBadge status={item.embeddingStatus} error={item.embeddingError} onRetry={onRetry} />
            )}
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
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="px-2.5 py-2.5"
          />
        ) : (
          <p className="text-sm text-white/55 line-clamp-3">{item.content}</p>
        )}
      </GlassPanel>
    </motion.div>
  );
}
