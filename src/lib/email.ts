import { Resend } from "resend";
import { traceable } from "langsmith/traceable";
import { getAppUrl } from "@/lib/url";

const resend = new Resend(process.env.RESEND_API_KEY);

// Use Resend's shared domain in dev, your verified domain in production
const FROM =
  process.env.NODE_ENV === "development"
    ? "AgentHub <onboarding@resend.dev>"
    : "AgentHub <noreply@agenthub.ai>";
const BASE_URL = getAppUrl();

// ── Shared HTML shell ─────────────────────────────────────────────────────────

function emailShell(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AgentHub</title>
</head>
<body style="margin:0;padding:0;background:#0A0A0F;font-family:'Helvetica Neue',Arial,sans-serif;color:#F0F0F5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0F;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#0E0E16;border-radius:16px;border:1px solid #2A2A3E;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #2A2A3E;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:36px;height:36px;background:linear-gradient(135deg,#00D4FF,#6366F1);border-radius:10px;text-align:center;vertical-align:middle;">
                    <span style="font-size:18px;line-height:36px;">⚡</span>
                  </td>
                  <td style="padding-left:10px;font-size:18px;font-weight:700;color:#FFFFFF;letter-spacing:-0.3px;">
                    AgentHub
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #2A2A3E;text-align:center;">
              <p style="margin:0;font-size:12px;color:#555577;">
                © ${new Date().getFullYear()} AgentHub · Powered by Google Gemini &amp; Claude AI
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#555577;">
                If you didn't request this email, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Button helper ─────────────────────────────────────────────────────────────

function primaryButton(href: string, label: string): string {
  return `
    <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
      <tr>
        <td style="background:linear-gradient(135deg,#00D4FF,#6366F1);border-radius:10px;">
          <a href="${href}"
             style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;letter-spacing:-0.2px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`;
}

// ── Welcome email ─────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(opts: {
  to: string;
  name: string;
  businessName: string;
  industry: string;
}) {
  const dashboardUrl = `${BASE_URL}/business/dashboard`;
  const industryLabel =
    opts.industry.charAt(0).toUpperCase() + opts.industry.slice(1);

  const body = emailShell(`
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#FFFFFF;letter-spacing:-0.5px;">
      Welcome to AgentHub, ${opts.name || "there"}! 👋
    </h1>
    <p style="margin:0 0 20px;font-size:15px;color:#8888AA;line-height:1.6;">
      Your account and <strong style="color:#F0F0F5;">${opts.businessName}</strong> workspace are ready.
      Your AI voice agent for the <strong style="color:#00D4FF;">${industryLabel}</strong> industry has been set up
      and is waiting for you to customise it.
    </p>

    <table cellpadding="0" cellspacing="0" width="100%" style="background:#13131F;border-radius:12px;border:1px solid #2A2A3E;margin:24px 0;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#8888AA;text-transform:uppercase;letter-spacing:0.5px;">
            What&apos;s next
          </p>
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding:6px 0;font-size:14px;color:#C0C0D8;">
                <span style="color:#00D4FF;margin-right:10px;">→</span>
                Customise your agent's greeting and personality
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:14px;color:#C0C0D8;">
                <span style="color:#00D4FF;margin-right:10px;">→</span>
                Add knowledge base articles so your agent knows your business
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:14px;color:#C0C0D8;">
                <span style="color:#00D4FF;margin-right:10px;">→</span>
                Share your public agent link with customers
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:14px;color:#C0C0D8;">
                <span style="color:#00D4FF;margin-right:10px;">→</span>
                Review AI-generated call summaries after each session
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${primaryButton(dashboardUrl, "Open my dashboard →")}

    <p style="margin:24px 0 0;font-size:13px;color:#555577;line-height:1.6;">
      Need help? Reply to this email or visit our documentation.
    </p>
  `);

  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Welcome to AgentHub — your ${industryLabel} AI agent is ready`,
    html: body,
  });
}

// ── Email verification ────────────────────────────────────────────────────────

export async function sendVerificationEmail(opts: {
  to: string;
  name: string;
  token: string;
}) {
  const verifyUrl = `${BASE_URL}/verify-email?token=${opts.token}`;

  const body = emailShell(`
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#FFFFFF;letter-spacing:-0.5px;">
      Verify your email
    </h1>
    <p style="margin:0 0 20px;font-size:15px;color:#8888AA;line-height:1.6;">
      Hi ${opts.name || "there"}, thanks for signing up to AgentHub. Click the button below
      to confirm this is your email address and activate your account.
    </p>

    ${primaryButton(verifyUrl, "Verify my email")}

    <p style="margin:0 0 8px;font-size:13px;color:#8888AA;line-height:1.6;">
      This link expires in <strong style="color:#F0F0F5;">24 hours</strong>.
      If you didn't create an account, you can safely ignore this email.
    </p>

    <table cellpadding="0" cellspacing="0" width="100%" style="background:#13131F;border-radius:10px;border:1px solid #2A2A3E;margin:24px 0;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 6px;font-size:12px;color:#555577;text-transform:uppercase;letter-spacing:0.5px;">
            Or copy this link into your browser
          </p>
          <p style="margin:0;font-size:12px;color:#00D4FF;word-break:break-all;font-family:monospace;">
            ${verifyUrl}
          </p>
        </td>
      </tr>
    </table>
  `);

  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: "Verify your email — AgentHub",
    html: body,
  });
}

// ── Plan quota threshold email ────────────────────────────────────────────────

export interface QuotaWarningEmailOpts {
  to: string;
  ownerName: string;
  businessName: string;
  planId: string;
  threshold: 80 | 95 | 100;
  usedMinutes: number;
  monthlyMinutes: number;
}

export async function sendQuotaWarningEmail(opts: QuotaWarningEmailOpts) {
  const billingUrl = `${BASE_URL}/business/billing`;
  const isMaxed = opts.threshold === 100;

  const headline = isMaxed
    ? `${opts.businessName} has hit its monthly call quota`
    : `${opts.businessName} is at ${opts.threshold}% of its monthly call quota`;

  const body = emailShell(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:-0.4px;">
      ${headline}
    </h1>
    <p style="margin:0 0 20px;font-size:14px;color:#8888AA;line-height:1.6;">
      Hi ${opts.ownerName || "there"} — heads up on your AgentHub usage.
    </p>

    <table cellpadding="0" cellspacing="0" width="100%" style="background:#13131F;border-radius:12px;border:1px solid #2A2A3E;margin:0 0 20px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0;font-size:13px;color:#8888AA;text-transform:uppercase;letter-spacing:0.5px;">${opts.planId} plan</p>
          <p style="margin:6px 0 0;font-size:24px;font-weight:700;color:${isMaxed ? "#EF4444" : "#F59E0B"};">
            ${opts.usedMinutes} / ${opts.monthlyMinutes} min
          </p>
          <p style="margin:6px 0 0;font-size:13px;color:#C0C0D8;">
            ${
              isMaxed
                ? "New caller sessions are being rejected with a 429 until you upgrade or the period rolls over."
                : `${opts.monthlyMinutes - opts.usedMinutes} min remaining in this billing period.`
            }
          </p>
        </td>
      </tr>
    </table>

    ${primaryButton(billingUrl, isMaxed ? "Upgrade now →" : "View plans →")}

    <p style="margin:24px 0 0;font-size:12px;color:#555577;line-height:1.6;">
      You'll only get one email per threshold (80% / 95% / 100%) per billing period.
    </p>
  `);

  const subject = isMaxed
    ? `Quota reached — ${opts.businessName} calls are being declined`
    : `${opts.threshold}% of monthly quota — ${opts.businessName}`;

  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject,
    html: body,
  });
}

// ── Lead capture email ────────────────────────────────────────────────────────

export interface LeadCaptureEmailOpts {
  to: string;
  ownerName: string;
  businessName: string;
  agentName: string;
  sessionId: string;
  capturedAt: Date;
  durationSeconds: number | null;
  caller: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  lead?: {
    intent: string;
    urgency?: "low" | "medium" | "high";
    notes?: string;
  } | null;
  analysis?: {
    summary?: string | null;
    sentiment?: string | null;
    topics?: string[];
    escalated?: boolean;
  } | null;
}

export const sendLeadCaptureEmail = traceable(
  async function sendLeadCaptureEmail(opts: LeadCaptureEmailOpts) {
  const sessionUrl = `${BASE_URL}/business/sessions/${opts.sessionId}`;
  const urgencyColor =
    opts.lead?.urgency === "high"
      ? "#EF4444"
      : opts.lead?.urgency === "medium"
        ? "#F59E0B"
        : "#10B981";
  const escalatedBanner = opts.analysis?.escalated
    ? `<div style="margin:0 0 16px;padding:12px 16px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:10px;color:#FCA5A5;font-size:13px;font-weight:600;">⚠ Call flagged for escalation</div>`
    : "";

  const fmtRow = (label: string, value: string | null | undefined) =>
    value
      ? `<tr><td style="padding:6px 0;font-size:13px;color:#8888AA;width:90px;">${label}</td><td style="padding:6px 0;font-size:14px;color:#F0F0F5;">${value}</td></tr>`
      : "";

  const callerHasContact = opts.caller.name || opts.caller.phone || opts.caller.email;
  const minutes = opts.durationSeconds ? Math.floor(opts.durationSeconds / 60) : 0;
  const seconds = opts.durationSeconds ? opts.durationSeconds % 60 : 0;
  const durationStr = opts.durationSeconds ? `${minutes}m ${seconds}s` : "—";

  const body = emailShell(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#FFFFFF;letter-spacing:-0.4px;">
      New lead from ${opts.agentName}
    </h1>
    <p style="margin:0 0 20px;font-size:14px;color:#8888AA;line-height:1.6;">
      Hi ${opts.ownerName || "there"} — your AI agent for <strong style="color:#F0F0F5;">${opts.businessName}</strong> just took a call. Here's what to act on:
    </p>

    ${escalatedBanner}

    ${
      opts.lead
        ? `
    <table cellpadding="0" cellspacing="0" width="100%" style="background:#13131F;border-radius:12px;border:1px solid #2A2A3E;margin:0 0 16px;">
      <tr>
        <td style="padding:18px 22px;">
          <p style="margin:0 0 10px;font-size:12px;font-weight:600;color:#8888AA;text-transform:uppercase;letter-spacing:0.5px;">
            What they want
            ${opts.lead.urgency ? `<span style="display:inline-block;margin-left:10px;padding:2px 8px;background:${urgencyColor}20;color:${urgencyColor};border-radius:6px;font-size:10px;font-weight:700;letter-spacing:0.3px;">${opts.lead.urgency.toUpperCase()}</span>` : ""}
          </p>
          <p style="margin:0;font-size:15px;color:#F0F0F5;line-height:1.5;">${opts.lead.intent}</p>
          ${opts.lead.notes ? `<p style="margin:10px 0 0;font-size:13px;color:#C0C0D8;line-height:1.5;">${opts.lead.notes}</p>` : ""}
        </td>
      </tr>
    </table>`
        : ""
    }

    ${
      callerHasContact
        ? `
    <table cellpadding="0" cellspacing="0" width="100%" style="background:#13131F;border-radius:12px;border:1px solid #2A2A3E;margin:0 0 16px;">
      <tr>
        <td style="padding:18px 22px;">
          <p style="margin:0 0 10px;font-size:12px;font-weight:600;color:#8888AA;text-transform:uppercase;letter-spacing:0.5px;">
            Caller
          </p>
          <table cellpadding="0" cellspacing="0">
            ${fmtRow("Name", opts.caller.name)}
            ${fmtRow("Phone", opts.caller.phone)}
            ${fmtRow("Email", opts.caller.email)}
          </table>
        </td>
      </tr>
    </table>`
        : ""
    }

    ${
      opts.analysis?.summary
        ? `
    <table cellpadding="0" cellspacing="0" width="100%" style="background:#13131F;border-radius:12px;border:1px solid #2A2A3E;margin:0 0 16px;">
      <tr>
        <td style="padding:18px 22px;">
          <p style="margin:0 0 10px;font-size:12px;font-weight:600;color:#8888AA;text-transform:uppercase;letter-spacing:0.5px;">
            Call summary${opts.analysis.sentiment ? ` · ${opts.analysis.sentiment}` : ""}
          </p>
          <p style="margin:0;font-size:14px;color:#F0F0F5;line-height:1.6;">${opts.analysis.summary}</p>
          ${
            opts.analysis.topics && opts.analysis.topics.length > 0
              ? `<p style="margin:10px 0 0;font-size:12px;color:#8888AA;">Topics: ${opts.analysis.topics.join(", ")}</p>`
              : ""
          }
        </td>
      </tr>
    </table>`
        : ""
    }

    <p style="margin:0 0 16px;font-size:12px;color:#555577;">
      Call placed ${opts.capturedAt.toUTCString()} · Duration ${durationStr}
    </p>

    ${primaryButton(sessionUrl, "View full transcript →")}

    <p style="margin:24px 0 0;font-size:12px;color:#555577;line-height:1.6;">
      You're receiving this because someone called your AgentHub voice agent. To change where these go, update the notification email in your business settings.
    </p>
  `);

  const subjectIntent = opts.lead?.intent
    ? opts.lead.intent.length > 60
      ? opts.lead.intent.slice(0, 57) + "..."
      : opts.lead.intent
    : "new caller";
  const callerLabel = opts.caller.name || "anonymous caller";

  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `New lead from ${opts.agentName} — ${callerLabel}: ${subjectIntent}`,
    html: body,
  });
  },
  { name: "sendLeadCaptureEmail", run_type: "tool" },
);

// ── Password reset email ──────────────────────────────────────────────────────

export async function sendPasswordResetEmail(opts: {
  to: string;
  name: string;
  token: string;
}) {
  const resetUrl = `${BASE_URL}/reset-password?token=${opts.token}`;

  const body = emailShell(`
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#FFFFFF;letter-spacing:-0.5px;">
      Reset your password
    </h1>
    <p style="margin:0 0 20px;font-size:15px;color:#8888AA;line-height:1.6;">
      Hi ${opts.name || "there"}, we received a request to reset the password for your AgentHub account.
      Click the button below to choose a new password.
    </p>

    ${primaryButton(resetUrl, "Reset my password")}

    <p style="margin:0 0 8px;font-size:13px;color:#8888AA;line-height:1.6;">
      This link expires in <strong style="color:#F0F0F5;">1 hour</strong>.
      If you didn't request a password reset, you can safely ignore this email — your password will not change.
    </p>

    <table cellpadding="0" cellspacing="0" width="100%" style="background:#13131F;border-radius:10px;border:1px solid #2A2A3E;margin:24px 0;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 6px;font-size:12px;color:#555577;text-transform:uppercase;letter-spacing:0.5px;">
            Or copy this link into your browser
          </p>
          <p style="margin:0;font-size:12px;color:#00D4FF;word-break:break-all;font-family:monospace;">
            ${resetUrl}
          </p>
        </td>
      </tr>
    </table>
  `);

  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: "Reset your AgentHub password",
    html: body,
  });
}
