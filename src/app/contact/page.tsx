"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowLeft,
  Mail,
  Bug,
  MessageSquare,
  ShieldCheck,
  ExternalLink,
  CheckCircle,
  Send,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GradientButton } from "@/components/ui/gradient-button";
import { AuroraBackground } from "@/components/ui/aurora-background";

const SUPPORT_EMAIL = "support@agenthub.ai";
const SECURITY_EMAIL = "security@agenthub.ai";
const GITHUB_ISSUES = "https://github.com/agenthub-ai/agenthub/issues/new";

type Category = "general" | "bug" | "privacy" | "billing" | "security";

const categories: { id: Category; label: string; icon: typeof Mail }[] = [
  { id: "general", label: "General question", icon: MessageSquare },
  { id: "bug", label: "Bug report", icon: Bug },
  { id: "privacy", label: "Privacy / data", icon: ShieldCheck },
  { id: "billing", label: "Billing", icon: Mail },
  { id: "security", label: "Security", icon: ShieldCheck },
];

export default function ContactPage() {
  const [category, setCategory] = useState<Category>("general");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const selectedCat = categories.find((c) => c.id === category)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    const subject = encodeURIComponent(`[Voxie] ${selectedCat.label} — ${name}`);
    const body = encodeURIComponent(
      `Category: ${selectedCat.label}\nName: ${name}\nEmail: ${email}\n\n${message}`,
    );
    const mailtoHref = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;

    await new Promise((r) => setTimeout(r, 600));
    window.location.href = mailtoHref;
    setSent(true);
    setLoading(false);
  };

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
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/40 mb-2">Support</p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.02em] text-white mb-3">Contact &amp; support</h1>
          <p className="text-white/60">Have a question, spotted a bug, or need help? We&apos;re here for you.</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Quick links */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-[10px] font-medium text-white/40 uppercase tracking-[0.2em] mb-3">Quick links</h2>

            <a href={`mailto:${SUPPORT_EMAIL}`}>
              <GlassPanel elevation="subtle" interactive radius="md" className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-300/20 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-violet-300" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Email support</p>
                  <p className="text-xs text-white/55 mt-0.5">{SUPPORT_EMAIL}</p>
                </div>
              </GlassPanel>
            </a>

            <a href={GITHUB_ISSUES} target="_blank" rel="noopener noreferrer">
              <GlassPanel elevation="subtle" interactive radius="md" className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-300/20 flex items-center justify-center shrink-0">
                  <Bug className="w-4 h-4 text-cyan-300" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Report a bug</p>
                  <p className="text-xs text-white/55 mt-0.5">Open a GitHub issue</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-white/40" />
              </GlassPanel>
            </a>

            <a href={`mailto:${SECURITY_EMAIL}`}>
              <GlassPanel elevation="subtle" interactive radius="md" className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-300/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-rose-300" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Security report</p>
                  <p className="text-xs text-white/55 mt-0.5">{SECURITY_EMAIL}</p>
                </div>
              </GlassPanel>
            </a>

            <div className="pt-4 mt-2 border-t border-white/[0.06]">
              <h3 className="text-[10px] font-medium text-white/40 uppercase tracking-[0.2em] mb-3">Policies</h3>
              <div className="space-y-2 text-sm">
                {[
                  { href: "/legal/privacy", label: "Privacy Policy" },
                  { href: "/legal/terms", label: "Terms & Conditions" },
                  { href: "/legal/cookies", label: "Cookie Policy" },
                ].map((l) => (
                  <Link key={l.href} href={l.href} className="block text-white/55 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            {sent ? (
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
                <GlassPanel elevation="raised" radius="lg" className="p-6 md:p-8 text-center">
                  <div className="w-14 h-14 rounded-2xl ah-gradient-bg flex items-center justify-center mx-auto mb-4 shadow-[0_8px_24px_-8px_rgba(124,58,237,0.5)]">
                    <CheckCircle className="w-7 h-7 text-white" strokeWidth={2} />
                  </div>
                  <h2 className="text-lg font-semibold text-white mb-2 tracking-tight">Your email client should open</h2>
                  <p className="text-white/55 text-sm">
                    If it didn&apos;t, please email us directly at{" "}
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="ah-gradient-text font-medium hover:opacity-80">
                      {SUPPORT_EMAIL}
                    </a>
                    .
                  </p>
                  <GradientButton onClick={() => setSent(false)} variant="outline" className="mt-6">
                    Send another message
                  </GradientButton>
                </GlassPanel>
              </motion.div>
            ) : (
              <GlassPanel elevation="raised" radius="lg" className="p-6 md:p-8">
                <h2 className="text-lg font-semibold text-white tracking-tight mb-6">Send us a message</h2>

                <div className="mb-6">
                  <Label className="mb-2.5">Category</Label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      const active = category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                            active
                              ? "bg-gradient-to-br from-violet-500/15 to-cyan-500/10 border-violet-300/40 text-white"
                              : "bg-white/[0.03] border-white/10 text-white/55 hover:bg-white/[0.06] hover:text-white/85"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {category === "security" && (
                  <div className="mb-4 p-3.5 rounded-2xl border border-rose-300/20 bg-rose-500/[0.06]">
                    <p className="text-xs text-rose-200 leading-relaxed">
                      <strong>Responsible disclosure:</strong> Please don&apos;t post security
                      vulnerabilities publicly. Email{" "}
                      <a href={`mailto:${SECURITY_EMAIL}`} className="underline">{SECURITY_EMAIL}</a>{" "}
                      directly and we&apos;ll respond within 48 hours.
                    </p>
                  </div>
                )}

                {category === "bug" && (
                  <div className="mb-4 p-3.5 rounded-2xl border border-amber-300/20 bg-amber-500/[0.06]">
                    <p className="text-xs text-amber-200 leading-relaxed">
                      For faster resolution, you can also{" "}
                      <a href={GITHUB_ISSUES} target="_blank" rel="noopener noreferrer" className="underline">open a GitHub issue</a>{" "}
                      with steps to reproduce.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Your name</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" required className="mt-1.5" />
                    </div>
                    <div>
                      <Label htmlFor="contact-email">Email address</Label>
                      <Input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="mt-1.5" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message">
                      Message
                      {category === "bug" && (
                        <span className="text-white/40 ml-1 font-normal">(include repro steps & browser)</span>
                      )}
                    </Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={category === "bug" ? "1. Go to…\n2. Click on…\n3. See error…" : "How can we help?"}
                      required
                      rows={6}
                      className="mt-1.5"
                    />
                  </div>

                  <GradientButton type="submit" disabled={loading} className="w-full">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="ah-spinner" />
                        Opening email client…
                      </span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send message
                      </>
                    )}
                  </GradientButton>
                </form>
              </GlassPanel>
            )}
          </div>
        </div>
      </main>

      <div className="relative z-10 max-w-4xl mx-auto px-2 pb-10 mt-8 pt-8 md:px-6 md:pb-12 border-t border-white/[0.06] flex flex-wrap gap-6 text-sm text-white/45">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy</Link>
        <Link href="/legal/terms" className="hover:text-white transition-colors">Terms</Link>
        <span>© {new Date().getFullYear()} Voxie</span>
      </div>
    </div>
  );
}
