"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap,
  ArrowLeft,
  Mail,
  Bug,
  MessageSquare,
  ShieldCheck,
  ExternalLink,
  CheckCircle,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const SUPPORT_EMAIL = "support@agenthub.ai";
const SECURITY_EMAIL = "security@agenthub.ai";
const GITHUB_ISSUES = "https://github.com/agenthub-ai/agenthub/issues/new";

type Category = "general" | "bug" | "privacy" | "billing" | "security";

const categories: { id: Category; label: string; icon: typeof Mail; color: string }[] = [
  { id: "general", label: "General question", icon: MessageSquare, color: "#00D4FF" },
  { id: "bug", label: "Bug report", icon: Bug, color: "#F59E0B" },
  { id: "privacy", label: "Privacy / data request", icon: ShieldCheck, color: "#10B981" },
  { id: "billing", label: "Billing", icon: Mail, color: "#6366F1" },
  { id: "security", label: "Security vulnerability", icon: ShieldCheck, color: "#EF4444" },
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
    // Mailto fallback — replace with your actual API route if you add one
    const subject = encodeURIComponent(`[AgentHub] ${selectedCat.label} — ${name}`);
    const body = encodeURIComponent(
      `Category: ${selectedCat.label}\nName: ${name}\nEmail: ${email}\n\n${message}`,
    );
    const mailtoHref = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;

    // Simulate a brief delay then open mailto
    await new Promise((r) => setTimeout(r, 600));
    window.location.href = mailtoHref;
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F5]">
      {/* Header */}
      <header className="border-b border-[#2A2A3E] bg-[#0E0E16]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-[#8888AA] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to home</span>
          </Link>
          <div className="flex-1" />
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-[#00D4FF] to-[#6366F1] flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white text-sm">AgentHub</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">Contact &amp; Support</h1>
          <p className="text-[#8888AA]">
            Have a question, spotted a bug, or need help? We&apos;re here for you.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-10">
          {/* Left — quick links */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-semibold text-[#8888AA] uppercase tracking-wider mb-3">
              Quick links
            </h2>

            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="flex items-center gap-3 p-4 rounded-xl border border-[#2A2A3E] bg-[#0E0E16] hover:border-[#00D4FF]/30 hover:bg-[#00D4FF]/5 transition-all group"
            >
              <Mail className="w-5 h-5 text-[#00D4FF]" />
              <div>
                <p className="text-sm font-medium text-white">Email support</p>
                <p className="text-xs text-[#8888AA] mt-0.5">{SUPPORT_EMAIL}</p>
              </div>
            </a>

            <a
              href={GITHUB_ISSUES}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-xl border border-[#2A2A3E] bg-[#0E0E16] hover:border-[#F59E0B]/30 hover:bg-[#F59E0B]/5 transition-all group"
            >
              <Bug className="w-5 h-5 text-[#F59E0B]" />
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Report a bug</p>
                <p className="text-xs text-[#8888AA] mt-0.5">Open a GitHub issue</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[#555577] group-hover:text-[#F59E0B] transition-colors" />
            </a>

            <a
              href={`mailto:${SECURITY_EMAIL}`}
              className="flex items-center gap-3 p-4 rounded-xl border border-[#2A2A3E] bg-[#0E0E16] hover:border-red-400/30 hover:bg-red-400/5 transition-all group"
            >
              <ShieldCheck className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-sm font-medium text-white">Security report</p>
                <p className="text-xs text-[#8888AA] mt-0.5">{SECURITY_EMAIL}</p>
              </div>
            </a>

            <div className="pt-4 border-t border-[#2A2A3E]">
              <h3 className="text-sm font-semibold text-[#8888AA] uppercase tracking-wider mb-3">
                Policies
              </h3>
              <div className="space-y-2">
                {[
                  { href: "/legal/privacy", label: "Privacy Policy" },
                  { href: "/legal/terms", label: "Terms & Conditions" },
                  { href: "/legal/cookies", label: "Cookie Policy" },
                ].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="block text-sm text-[#8888AA] hover:text-[#00D4FF] transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right — contact form */}
          <div className="lg:col-span-3">
            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 rounded-2xl border border-[#2A2A3E] bg-[#0E0E16] text-center"
              >
                <div className="w-14 h-14 rounded-full bg-[#00D4FF]/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-7 h-7 text-[#00D4FF]" />
                </div>
                <h2 className="text-lg font-semibold text-white mb-2">
                  Your email client should open
                </h2>
                <p className="text-[#8888AA] text-sm">
                  If it didn&apos;t, please email us directly at{" "}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#00D4FF] hover:underline">
                    {SUPPORT_EMAIL}
                  </a>
                  .
                </p>
                <Button
                  onClick={() => setSent(false)}
                  variant="outline"
                  className="mt-6 border-[#2A2A3E] text-white hover:bg-white/5"
                >
                  Send another message
                </Button>
              </motion.div>
            ) : (
              <div className="p-8 rounded-2xl border border-[#2A2A3E] bg-[#0E0E16]">
                <h2 className="text-lg font-semibold text-white mb-6">Send us a message</h2>

                {/* Category selector */}
                <div className="mb-6">
                  <Label className="text-[#8888AA] mb-3 block text-sm">Category</Label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      const active = category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                          style={{
                            borderColor: active ? `${cat.color}50` : "#2A2A3E",
                            background: active ? `${cat.color}15` : "transparent",
                            color: active ? cat.color : "#8888AA",
                          }}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Security warning */}
                {category === "security" && (
                  <div className="mb-4 p-3 rounded-xl border border-red-400/20 bg-red-400/5">
                    <p className="text-xs text-red-400 leading-relaxed">
                      <strong>Responsible disclosure:</strong> Please do not post security
                      vulnerabilities publicly. Email{" "}
                      <a href={`mailto:${SECURITY_EMAIL}`} className="underline">
                        {SECURITY_EMAIL}
                      </a>{" "}
                      directly and we&apos;ll respond within 48 hours.
                    </p>
                  </div>
                )}

                {/* Bug tip */}
                {category === "bug" && (
                  <div className="mb-4 p-3 rounded-xl border border-[#F59E0B]/20 bg-[#F59E0B]/5">
                    <p className="text-xs text-[#F59E0B] leading-relaxed">
                      For faster resolution, you can also{" "}
                      <a
                        href={GITHUB_ISSUES}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        open a GitHub issue
                      </a>{" "}
                      with steps to reproduce, browser info, and screenshots.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-[#8888AA] text-sm">
                        Your name
                      </Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jane Smith"
                        required
                        className="mt-1 bg-white/5 border-[#2A2A3E] focus:border-[#00D4FF] text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact-email" className="text-[#8888AA] text-sm">
                        Email address
                      </Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="mt-1 bg-white/5 border-[#2A2A3E] focus:border-[#00D4FF] text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-[#8888AA] text-sm">
                      Message
                      {category === "bug" && (
                        <span className="text-[#555577] ml-1">
                          (include steps to reproduce, browser, and what you expected)
                        </span>
                      )}
                    </Label>
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={
                        category === "bug"
                          ? "1. Go to...\n2. Click on...\n3. See error..."
                          : "How can we help?"
                      }
                      required
                      rows={6}
                      className="mt-1 w-full rounded-xl bg-white/5 border border-[#2A2A3E] focus:border-[#00D4FF] focus:outline-none text-white text-sm px-3 py-2 resize-none placeholder:text-[#555577] transition-colors"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-linear-to-r from-[#00D4FF] to-[#6366F1] text-white border-0 hover:opacity-90"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Opening email client…
                      </span>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send message
                      </>
                    )}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <div className="max-w-4xl mx-auto px-6 pb-12 mt-8 pt-8 border-t border-[#2A2A3E] flex flex-wrap gap-6 text-sm text-[#8888AA]">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
        <Link href="/legal/terms" className="hover:text-white transition-colors">Terms &amp; Conditions</Link>
        <span>© {new Date().getFullYear()} AgentHub</span>
      </div>
    </div>
  );
}
