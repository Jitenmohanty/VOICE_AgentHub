"use client";

import { useParams } from "next/navigation";
import { PublicAgentExperience } from "@/components/agent/PublicAgentExperience";

/**
 * Iframe-optimized agent page. Mounted on third-party websites via:
 *   <iframe src="https://agenthub.app/embed/{slug}" width="380" height="640"
 *           allow="microphone" />
 *
 * The frame-ancestors CSP for /embed/* is set in next.config.ts so this page
 * (and only this page) is embeddable cross-origin.
 */
export default function EmbedAgentPage() {
  const params = useParams<{ slug: string }>();
  return <PublicAgentExperience slug={params.slug} mode="embed" />;
}
