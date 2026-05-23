"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Bot,
  History,
  Inbox,
  TrendingUp,
  Settings,
  CreditCard,
  Users,
  LogOut,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

const navItems = [
  { href: "/business/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/business/agents", icon: Bot, label: "Agents" },
  { href: "/business/leads", icon: Inbox, label: "Leads" },
  { href: "/business/sessions", icon: History, label: "Sessions" },
  { href: "/business/analytics", icon: TrendingUp, label: "Analytics" },
  { href: "/business/team", icon: Users, label: "Team" },
  { href: "/business/billing", icon: CreditCard, label: "Billing" },
  { href: "/business/settings", icon: Settings, label: "Settings" },
];

function Brand({ size = "md", onClick }: { size?: "sm" | "md"; onClick?: () => void }) {
  const dim = size === "sm" ? 28 : 32;
  const iconDim = size === "sm" ? 14 : 16;
  return (
    <Link
      href="/business/dashboard"
      onClick={onClick}
      className="flex items-center gap-2.5 group"
    >
      <div
        className="rounded-full flex items-center justify-center transition-transform group-hover:scale-105"
        style={{ width: dim, height: dim, background: "var(--ah-cta)" }}
      >
        <Sparkles style={{ width: iconDim, height: iconDim, color: "#FFFCF6" }} strokeWidth={2.5} />
      </div>
      <span
        className={`font-serif tracking-tight ${size === "sm" ? "text-xl" : "text-2xl"}`}
        style={{ color: "var(--ah-ink)" }}
      >
        Voxie
      </span>
    </Link>
  );
}

function NavLinks({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/business/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavClick}
            className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-base transition-all"
            style={{
              background: isActive ? "var(--ah-bg-inset)" : "transparent",
              color: isActive ? "var(--ah-ink)" : "var(--ah-ink-soft)",
            }}
          >
            {isActive && (
              <span
                className="absolute inset-y-2 left-0 w-0.5 rounded-full"
                style={{ background: "var(--ah-cta)" }}
              />
            )}
            <item.icon
              className="w-[18px] h-[18px]"
              style={{ color: isActive ? "var(--ah-cta)" : "var(--ah-ink-soft)" }}
              strokeWidth={1.75}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────── */}
      <motion.aside
        initial={{ x: -16, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="hidden md:flex flex-col w-64 h-screen sticky top-0 p-5 overflow-y-auto"
        style={{
          background: "var(--ah-bg-raised)",
          borderRight: "1px solid var(--ah-border)",
        }}
      >
        <div className="mb-8 px-1">
          <Brand />
        </div>

        <NavLinks />

        <div className="flex items-center justify-between gap-2 px-2 mt-2">
          <span
            className="text-[11px] uppercase tracking-[0.18em]"
            style={{ color: "var(--ah-ink-muted)" }}
          >
            Appearance
          </span>
          <ThemeToggle />
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-base transition-all"
          style={{ color: "var(--ah-ink-soft)" }}
        >
          <LogOut className="w-[18px] h-[18px]" strokeWidth={1.75} />
          Sign out
        </button>
      </motion.aside>

      {/* ── Mobile top bar ──────────────────────────────────── */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center px-4 gap-3"
        style={{
          background: "rgba(247, 243, 236, 0.92)",
          backdropFilter: "blur(12px) saturate(140%)",
          borderBottom: "1px solid var(--ah-border)",
        }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl transition-all"
          style={{ color: "var(--ah-ink-soft)" }}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Brand size="sm" />
      </div>

      {/* ── Mobile drawer ────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-50 backdrop-blur-md"
              style={{ background: "rgba(26, 26, 26, 0.40)" }}
              onClick={() => setMobileOpen(false)}
            />

            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="md:hidden fixed top-0 left-0 z-50 h-full w-72 p-5 flex flex-col overflow-y-auto"
              style={{
                background: "var(--ah-bg-raised)",
                borderRight: "1px solid var(--ah-border)",
              }}
            >
              <div className="flex items-center justify-between mb-8">
                <Brand size="sm" onClick={() => setMobileOpen(false)} />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-xl transition-all"
                  style={{ color: "var(--ah-ink-soft)" }}
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <NavLinks onNavClick={() => setMobileOpen(false)} />

              <div className="flex items-center justify-between gap-2 px-2 mt-2">
                <span
                  className="text-[11px] uppercase tracking-[0.18em]"
                  style={{ color: "var(--ah-ink-muted)" }}
                >
                  Appearance
                </span>
                <ThemeToggle />
              </div>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-base transition-all"
                style={{ color: "var(--ah-ink-soft)" }}
              >
                <LogOut className="w-[18px] h-[18px]" strokeWidth={1.75} />
                Sign out
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
