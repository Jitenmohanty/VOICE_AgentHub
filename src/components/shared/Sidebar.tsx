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
  Settings,
  LogOut,
  Zap,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/business/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/business/agents", icon: Bot, label: "Agents" },
  { href: "/business/sessions", icon: History, label: "Sessions" },
  { href: "/business/settings", icon: Settings, label: "Settings" },
];

function NavLinks({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/business/dashboard" &&
            pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
              isActive
                ? "bg-[#00D4FF]/10 text-[#00D4FF]"
                : "text-[#8888AA] hover:text-white hover:bg-white/5"
            )}
          >
            <item.icon className="w-5 h-5" />
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
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-[#0E0E16] border-r border-[#2A2A3E] p-4 overflow-y-auto"
      >
        <Link
          href="/business/dashboard"
          className="flex items-center gap-2 mb-8 px-2"
        >
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[#00D4FF] to-[#6366F1] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-(family-name:--font-heading) font-bold text-lg text-white">
            AgentHub
          </span>
        </Link>

        <NavLinks />

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#8888AA] hover:text-red-400 hover:bg-red-400/5 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </motion.aside>

      {/* ── Mobile top bar ──────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-[#0E0E16]/95 backdrop-blur-md border-b border-[#2A2A3E] flex items-center px-4 gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-[#8888AA] hover:text-white hover:bg-white/5 transition-all"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/business/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-linear-to-br from-[#00D4FF] to-[#6366F1] flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-(family-name:--font-heading) font-bold text-base text-white">
            AgentHub
          </span>
        </Link>
      </div>

      {/* ── Mobile drawer ────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer panel */}
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="md:hidden fixed top-0 left-0 z-50 h-full w-72 bg-[#0E0E16] border-r border-[#2A2A3E] p-4 flex flex-col overflow-y-auto"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between mb-8">
                <Link
                  href="/business/dashboard"
                  className="flex items-center gap-2 px-2"
                  onClick={() => setMobileOpen(false)}
                >
                  <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[#00D4FF] to-[#6366F1] flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-(family-name:--font-heading) font-bold text-lg text-white">
                    AgentHub
                  </span>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-lg text-[#8888AA] hover:text-white hover:bg-white/5 transition-all"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <NavLinks onNavClick={() => setMobileOpen(false)} />

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#8888AA] hover:text-red-400 hover:bg-red-400/5 transition-all"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
