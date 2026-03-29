"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { User, Key, Bell } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-(family-name:--font-heading) text-3xl font-bold text-white">
          Settings
        </h1>
        <p className="text-[#8888AA] mt-1">Manage your account</p>
      </motion.div>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-[#00D4FF]" />
            <h2 className="font-semibold text-white">Profile</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[#8888AA]">Name</span>
              <span className="text-white">{session?.user?.name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8888AA]">Email</span>
              <span className="text-white">{session?.user?.email || "—"}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Key className="w-5 h-5 text-[#FFB800]" />
            <h2 className="font-semibold text-white">API Keys</h2>
          </div>
          <p className="text-sm text-[#8888AA]">
            Gemini API key is configured server-side. Contact your administrator to update it.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-[#6366F1]" />
            <h2 className="font-semibold text-white">Preferences</h2>
          </div>
          <p className="text-sm text-[#8888AA]">
            Additional preferences and notification settings will be available soon.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
