import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";

interface Props {
  /** H1 — e.g. "Privacy Policy" */
  title: string;
  /** Optional sub-line under the title (effective date, etc.) */
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Shared shell for /legal/{privacy, terms, cookies}. Encapsulates the sticky
 * header, the aurora-tinted backdrop, the typography rhythm, and the footer
 * link bar so all three pages stay visually identical.
 */
export function LegalShell({ title, subtitle, children }: Props) {
  return (
    <div className="relative min-h-screen text-white">
      <AuroraBackground density="subtle" />

      <header className="relative z-10 border-b border-white/[0.06] bg-[var(--ah-bg-deep)]/70 backdrop-blur-xl sticky top-0">
        <div className="max-w-4xl mx-auto px-2 py-4 md:px-6 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-white/55 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to home</span>
          </Link>
          <div className="flex-1" />
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-2xl ah-gradient-bg flex items-center justify-center shadow-[0_8px_24px_-8px_rgba(124,58,237,0.5)]">
              <Sparkles className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-white text-sm tracking-tight">Voxie</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-2 py-12 md:px-6 md:py-16">
        <div className="mb-12">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/40 mb-2">Legal</p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.02em] text-white mb-3">{title}</h1>
          {subtitle && <p className="text-white/55 text-sm">{subtitle}</p>}
        </div>

        <div className="space-y-10 text-white/75 leading-relaxed">{children}</div>
      </main>

      <div className="relative z-10 max-w-4xl mx-auto px-2 pb-10 mt-8 pt-8 md:px-6 md:pb-12 border-t border-white/[0.06] flex flex-wrap gap-6 text-sm text-white/45">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy</Link>
        <Link href="/legal/terms" className="hover:text-white transition-colors">Terms</Link>
        <Link href="/legal/cookies" className="hover:text-white transition-colors">Cookies</Link>
        <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
        <span>© {new Date().getFullYear()} Voxie</span>
      </div>
    </div>
  );
}
