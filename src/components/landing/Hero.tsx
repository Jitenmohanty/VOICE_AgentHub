"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mic, Inbox, Code2, Webhook } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-linear-to-b from-[#0A0A0F] via-[#0A0A1A] to-[#0A0A0F]" />
      
      {/* Animated orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#00D4FF]/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-[#6366F1]/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
      <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-[#FFB800]/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "0.8s" }} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
            <Mic className="w-4 h-4 text-[#00D4FF]" />
            <span className="text-sm text-[#8888AA]">Voice AI for small businesses · Hotels · Clinics · Restaurants · Law · Personal portfolios</span>
          </div>

          <h1 className="font-(family-name:--font-heading) text-5xl md:text-7xl font-bold leading-tight mb-6">
            <span className="text-white">Never Miss a Customer.</span>
            <br />
            <span className="bg-linear-to-r from-[#00D4FF] to-[#6366F1] bg-clip-text text-transparent">
              Your AI Takes the Call.
            </span>
            <br />
            <span className="text-white">You Get the Lead.</span>
          </h1>

          <p className="text-xl text-[#8888AA] max-w-2xl mx-auto mb-10">
            Drop a single iframe into your existing website. Visitors talk to an AI that knows your menu,
            rooms, doctors, or services — and every captured lead lands in your inbox in under 30 seconds.
          </p>

          <div className="flex items-center justify-center gap-4 mb-12">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-linear-to-r from-[#00D4FF] to-[#6366F1] text-white border-0 text-lg px-8 py-6 hover:opacity-90"
              >
                Start Free — 30 min/mo
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <a href="#pricing">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-[#2A2A3E] text-[#8888AA] hover:text-white hover:border-[#00D4FF]/50"
              >
                See Pricing
              </Button>
            </a>
          </div>

          {/* Quick proof points — what's actually shipped */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#8888AA]"
          >
            <span className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#00D4FF]" />
              Embed on your existing site
            </span>
            <span className="hidden sm:inline text-[#2A2A3E]">•</span>
            <span className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-[#10B981]" />
              Leads delivered by email
            </span>
            <span className="hidden sm:inline text-[#2A2A3E]">•</span>
            <span className="flex items-center gap-2">
              <Webhook className="w-4 h-4 text-[#6366F1]" />
              Slack / HubSpot / Zapier ready
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
