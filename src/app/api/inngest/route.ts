import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { postCallAnalysis } from "@/inngest/functions/post-call-analysis";

/**
 * Inngest serve handler — registers all background functions with the Inngest platform.
 * In dev: Inngest Dev Server (npx inngest-cli@latest dev) connects here on port 8288.
 * In production: Inngest cloud connects via INNGEST_SIGNING_KEY.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [postCallAnalysis],
});
