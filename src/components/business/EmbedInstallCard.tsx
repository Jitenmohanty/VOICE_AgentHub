"use client";

import { useEffect, useState } from "react";
import { Copy, Check, ExternalLink, Code2 } from "lucide-react";
import { toast } from "sonner";
import { GlassPanel } from "@/components/ui/glass-panel";

interface Props {
  slug: string;
  accentColor?: string;
}

/**
 * "Install on your website" card. Generates a copy-paste iframe snippet
 * pointing at /embed/{slug}. The host site needs the `allow="microphone"`
 * attribute or the browser will block getUserMedia in the embedded context.
 */
export function EmbedInstallCard({ slug }: Props) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const embedUrl = origin ? `${origin}/embed/${slug}` : `/embed/${slug}`;
  const snippet = origin
    ? `<iframe
  src="${embedUrl}"
  width="380"
  height="640"
  allow="microphone"
  style="border:0;border-radius:16px;max-width:100%;"
></iframe>`
    : "Loading snippet...";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      toast.success("Snippet copied — paste into your site's HTML");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select the snippet manually");
    }
  };

  return (
    <GlassPanel elevation="raised" radius="lg" className="p-7 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl ah-gradient-bg flex items-center justify-center shadow-[0_8px_24px_-8px_rgba(124,58,237,0.5)]">
          <Code2 className="w-4 h-4 text-white" strokeWidth={2} />
        </div>
        <h2 className="font-semibold text-white text-lg tracking-tight">Install on your website</h2>
      </div>
      <p className="text-xs text-white/50 leading-relaxed">
        Paste this snippet into your website&apos;s HTML to embed the voice agent.
        The <code className="ah-gradient-text font-mono">allow=&quot;microphone&quot;</code> attribute is required so callers can speak.
      </p>

      <div className="relative">
        <pre className="bg-black/50 border border-white/10 rounded-2xl p-5 text-xs text-white/85 font-mono overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
          {snippet}
        </pre>
        <button
          onClick={handleCopy}
          disabled={!origin}
          className="absolute top-2.5 right-2.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-xs text-white flex items-center gap-1.5 transition-all disabled:opacity-50"
        >
          {copied ? (
            <><Check className="w-3.5 h-3.5 text-emerald-300" /> Copied</>
          ) : (
            <><Copy className="w-3.5 h-3.5" /> Copy</>
          )}
        </button>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-white/45">Default size: 380×640. Resize freely — the widget adapts.</span>
        <a
          href={embedUrl}
          target="_blank"
          rel="noreferrer"
          className="ah-gradient-text font-medium hover:opacity-80 inline-flex items-center gap-1"
        >
          Preview <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </GlassPanel>
  );
}
