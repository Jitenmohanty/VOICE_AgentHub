"use client";

import { use } from "react";
import { VoiceInterface } from "@/components/agent/VoiceInterface";

export default function AgentPage({ params }: { params: Promise<{ agentType: string }> }) {
  const { agentType } = use(params);
  return <VoiceInterface agentType={agentType} />;
}
