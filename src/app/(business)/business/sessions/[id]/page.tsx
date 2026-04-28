"use client";

import { useParams, useRouter } from "next/navigation";
import { SessionDetailModal } from "@/components/dashboard/SessionDetailModal";

/**
 * Deep-link landing for a single session — used by the lead-delivery email's
 * "View full transcript" button. Reuses the existing modal; on close, routes
 * back to the cross-agent session list.
 */
export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  return (
    <div className="min-h-dvh bg-[#0A0A0F]">
      <SessionDetailModal
        sessionId={params.id}
        onClose={() => router.push("/business/sessions")}
      />
    </div>
  );
}
