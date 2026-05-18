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
import { cn } from "@/lib/utils";
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
      <div className="relative">
        <div
          className="rounded-2xl ah-gradient-bg flex items-center justify-center shadow-[0_8px_24px_-8px_rgba(124,58,237,0.6)]"
          style={{ width: dim, height: dim }}
        >
          <Sparkles style={{ width: iconDim, height: iconDim }} className="text-white" strokeWidth={2.5} />
        </div>
        <div className="absolute inset-0 rounded-2xl ah-gradient-bg blur-md opacity-40 group-hover:opacity-70 transition-opacity -z-10" />
      </div>
      <span className={`font-semibold tracking-tight text-white ${size === "sm" ? "text-base" : "text-lg"}`}>
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
            className={cn(
              "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
              isActive
                ? "bg-white/[0.06] text-white"
                : "text-white/55 hover:text-white hover:bg-white/[0.04]",
            )}
          >
            {isActive && (
              <span className="absolute inset-y-2 left-0 w-0.5 rounded-full ah-gradient-bg" />
            )}
            <item.icon className={`w-[18px] h-[18px] ${isActive ? "text-violet-300" : ""}`} strokeWidth={1.75} />
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
        className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-white/[0.06] p-5 overflow-y-auto bg-[var(--ah-bg-raised)]/60 backdrop-blur-2xl"
      >
        <div className="mb-8 px-1">
          <Brand />
        </div>

        <NavLinks />

        <div className="flex items-center justify-between gap-2 px-2 mt-2">
          <span className="text-[11px] uppercase tracking-[0.18em] text-white/35">Appearance</span>
          <ThemeToggle />
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/55 hover:text-rose-300 hover:bg-rose-500/5 transition-all"
        >
          <LogOut className="w-[18px] h-[18px]" strokeWidth={1.75} />
          Sign out
        </button>
      </motion.aside>

      {/* ── Mobile top bar ──────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-[var(--ah-bg-deep)]/85 backdrop-blur-xl border-b border-white/[0.06] flex items-center px-4 gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl text-white/55 hover:text-white hover:bg-white/[0.06] transition-all"
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
              className="md:hidden fixed inset-0 z-50 bg-[var(--ah-bg-deep)]/80 backdrop-blur-md"
              onClick={() => setMobileOpen(false)}
            />

            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="md:hidden fixed top-0 left-0 z-50 h-full w-72 bg-[var(--ah-bg-raised)] border-r border-white/[0.08] p-5 flex flex-col overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <Brand size="sm" onClick={() => setMobileOpen(false)} />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-xl text-white/55 hover:text-white hover:bg-white/[0.06] transition-all"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <NavLinks onNavClick={() => setMobileOpen(false)} />

              <div className="flex items-center justify-between gap-2 px-2 mt-2">
                <span className="text-[11px] uppercase tracking-[0.18em] text-white/35">Appearance</span>
                <ThemeToggle />
              </div>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/55 hover:text-rose-300 hover:bg-rose-500/5 transition-all"
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
