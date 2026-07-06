import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db";
import { createInvoiceLink } from "@/lib/payments/razorpay-payment-link";
import { sendOverageInvoiceEmail } from "@/lib/email";
import { isRazorpayConfigured } from "@/lib/razorpay";

/**
 * Monthly overage invoicing (Item 13). Runs on the 1st at 08:30 IST and
 * invoices the PREVIOUS CALENDAR MONTH for every business with
 * overageEnabled whose usage exceeded its plan minutes.
 *
 * Approximation, documented on purpose: usage is measured per calendar
 * month, while paid subscriptions anchor to their own period start. For the
 * free-fallback window they match exactly; for mid-month subscription
 * anchors the drift is at most a few minutes of double/under count at the
 * boundary — acceptable for v1, revisit if a customer disputes.
 *
 * Idempotent via Business.overageBilledThrough (set to the billed month's
 * end even when there was nothing to bill, so retries skip cleanly).
 */
export const overageInvoice = inngest.createFunction(
  {
    id: "overage-invoice",
    name: "Monthly Overage Invoice",
    retries: 3,
    triggers: [{ cron: "TZ=Asia/Kolkata 30 8 1 * *" }],
  },
  async ({ step }: { step: import("inngest").GetStepTools<typeof inngest> }) => {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthLabel = monthStart.toLocaleString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });

    if (!isRazorpayConfigured()) {
      return { skipped: true, reason: "Razorpay not configured — overage invoicing needs it" };
    }

    const businesses = await step.run("list-overage-businesses", async () => {
      return prisma.business.findMany({
        where: {
          overageEnabled: true,
          isActive: true,
          OR: [{ overageBilledThrough: null }, { overageBilledThrough: { lt: monthEnd } }],
        },
        select: {
          id: true,
          name: true,
          notificationEmail: true,
          owner: { select: { email: true, name: true } },
          subscription: { select: { plan: { select: { monthlyMinutes: true, overagePaisePerMinute: true } } } },
        },
      });
    });

    let invoiced = 0;
    for (const biz of businesses) {
      const plan = biz.subscription?.plan;
      // Free fallback / plan without a rate: nothing to invoice, but stamp
      // the month so we don't re-scan this business every retry.
      const rate = plan?.overagePaisePerMinute ?? null;

      await step.run(`invoice-${biz.id}`, async () => {
        if (rate == null || !plan) {
          await prisma.business.update({ where: { id: biz.id }, data: { overageBilledThrough: monthEnd } });
          return;
        }

        const usage = await prisma.agentSession.aggregate({
          where: {
            agent: { businessId: biz.id },
            createdAt: { gte: monthStart, lt: monthEnd },
            duration: { not: null },
          },
          _sum: { duration: true },
        });
        const usedSeconds = usage._sum.duration ?? 0;
        const overageMinutes = Math.ceil(Math.max(0, usedSeconds - plan.monthlyMinutes * 60) / 60);

        if (overageMinutes === 0) {
          await prisma.business.update({ where: { id: biz.id }, data: { overageBilledThrough: monthEnd } });
          return;
        }

        const recipient = biz.notificationEmail || biz.owner?.email;
        if (!recipient) {
          console.error(`[Overage] no recipient email for business ${biz.id} — invoice NOT sent`);
          return; // leave unstamped so a fixed email gets picked up next run
        }

        const amountPaise = overageMinutes * rate;
        const link = await createInvoiceLink({
          amountPaise,
          description: `Voxie overage — ${overageMinutes} extra min in ${monthLabel} (${biz.name})`,
          customerName: biz.owner?.name || biz.name,
          customerEmail: recipient,
          notes: { businessId: biz.id, type: "overage", month: monthStart.toISOString().slice(0, 7) },
        });
        if (!link.ok || !link.shortUrl) {
          throw new Error(`Invoice link failed for ${biz.id}: ${link.error}`); // Inngest retries
        }

        await sendOverageInvoiceEmail({
          to: recipient,
          ownerName: biz.owner?.name || "",
          businessName: biz.name,
          monthLabel,
          overageMinutes,
          ratePaisePerMinute: rate,
          amountPaise,
          paymentUrl: link.shortUrl,
        });

        await prisma.business.update({ where: { id: biz.id }, data: { overageBilledThrough: monthEnd } });
        invoiced++;
      });
    }

    return { month: monthLabel, businessesChecked: businesses.length, invoiced };
  },
);
