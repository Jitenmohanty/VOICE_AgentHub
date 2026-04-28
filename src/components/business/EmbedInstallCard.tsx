"use client";

import { useEffect, useState } from "react";
import { Copy, Check, ExternalLink, Code2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  slug: string;
  accentColor?: string;
}

/**
 * "Install on your website" card. Generates a copy-paste iframe snippet
 * pointing at /embed/{slug}. The host site needs the `allow="microphone"`
 * attribute or the browser will block getUserMedia in the embedded context.
 */
export function EmbedInstallCard({ slug, accentColor = "#6366F1" }: Props) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  // window only exists after hydration. Server-rendered output shows a
  // placeholder until the client takes over.
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
      toast.success("Snippet copied — paste it into your website's HTML");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select the snippet manually");
    }
  };

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Code2 className="w-5 h-5" style={{ color: accentColor }} />
        <h2 className="font-semibold text-white text-lg">Install on your website</h2>
      </div>
      <p className="text-xs text-[#666680] -mt-2">
        Paste this snippet into your website&apos;s HTML to embed the voice agent as a widget.
        The <code className="text-[#00D4FF]">allow=&quot;microphone&quot;</code> attribute is required so callers can speak.
      </p>

      <div className="relative">
        <pre className="bg-black/40 border border-[#2A2A3E] rounded-lg p-4 text-xs text-[#C0C0D8] font-mono overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
          {snippet}
        </pre>
        <button
          onClick={handleCopy}
          disabled={!origin}
          className="absolute top-2 right-2 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-[#2A2A3E] text-xs text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          {copied ? (
            <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</>
          ) : (
            <><Copy className="w-3.5 h-3.5" /> Copy</>
          )}
        </button>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-[#666680]">Default size: 380×640. Resize freely — the widget adapts.</span>
        <a
          href={embedUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[#00D4FF] hover:underline flex items-center gap-1"
        >
          Preview <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
