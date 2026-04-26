import { Resend } from "resend";
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
