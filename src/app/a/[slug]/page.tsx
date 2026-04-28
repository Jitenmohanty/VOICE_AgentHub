"use client";

import { useParams } from "next/navigation";
import { PublicAgentExperience } from "@/components/agent/PublicAgentExperience";

export default function PublicAgentPage() {
  const params = useParams<{ slug: string }>();
  return <PublicAgentExperience slug={params.slug} mode="standalone" />;
}
