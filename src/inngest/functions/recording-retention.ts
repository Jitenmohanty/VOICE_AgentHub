import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db";
import { r2DeleteObject, isR2Configured } from "@/lib/storage/r2";

/**
 * Recording retention (Item 12 follow-up): daily cron deletes call
 * recordings older than RETENTION_DAYS from R2 and clears the session's
 * recordingKey (the transcript + analysis stay — only the audio expires).
 *
 * DB-driven rather than bucket-listing: sessions with a recordingKey ARE the
 * inventory, so no R2 List permission is needed. recordingConsent stays as
 * the audit trail after the audio is gone.
 */

const RETENTION_DAYS = 30;
const BATCH = 100;

export const recordingRetention = inngest.createFunction(
  {
    id: "recording-retention",
    name: "Recording Retention Cleanup",
    retries: 2,
    triggers: [{ cron: "TZ=Asia/Kolkata 0 4 * * *" }], // 04:00 IST daily
  },
  async ({ step }: { step: import("inngest").GetStepTools<typeof inngest> }) => {
    if (!isR2Configured()) {
      return { skipped: true, reason: "R2 not configured" };
    }

    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

    const expired = await step.run("list-expired", async () => {
      return prisma.agentSession.findMany({
        where: { recordingKey: { not: null }, createdAt: { lt: cutoff } },
        select: { id: true, recordingKey: true },
        take: BATCH,
      });
    });

    let deleted = 0;
    for (const session of expired) {
      await step.run(`delete-${session.id}`, async () => {
        await r2DeleteObject(session.recordingKey!);
        await prisma.agentSession.update({
          where: { id: session.id },
          data: { recordingKey: null },
        });
        deleted++;
      });
    }

    return { retentionDays: RETENTION_DAYS, checked: expired.length, deleted };
  },
);
