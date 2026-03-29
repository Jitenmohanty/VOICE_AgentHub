"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 glass"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[#00D4FF] to-[#6366F1] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-(family-name:--font-heading) font-bold text-xl text-white">
            AgentHub
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-[#8888AA] hover:text-white">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button className="bg-linear-to-r from-[#00D4FF] to-[#6366F1] text-white border-0 hover:opacity-90">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
