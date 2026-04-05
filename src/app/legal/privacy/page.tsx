import Link from "next/link";
import { Zap, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy – AgentHub",
  description:
    "Learn how AgentHub collects, uses, and protects your personal data.",
};

const EFFECTIVE_DATE = "April 5, 2025";
const CONTACT_EMAIL = "privacy@agenthub.ai";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F0F5]">
      {/* Header */}
      <header className="border-b border-[#2A2A3E] bg-[#0E0E16]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-[#8888AA] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to home</span>
          </Link>
          <div className="flex-1" />
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-[#00D4FF] to-[#6366F1] flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white text-sm">AgentHub</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">Privacy Policy</h1>
          <p className="text-[#8888AA] text-sm">Effective date: {EFFECTIVE_DATE}</p>
        </div>

        <div className="space-y-10 text-[#C0C0D8] leading-relaxed">

          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Who We Are</h2>
            <p>
              AgentHub (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates a multi-tenant voice AI SaaS
              platform that lets business owners create and deploy AI voice agents
              for their customers. This Privacy Policy explains what personal data
              we collect, how we use it, and your rights in relation to it.
            </p>
            <p className="mt-3">
              For privacy enquiries, contact us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#00D4FF] hover:underline">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Who This Policy Applies To</h2>
            <p>This policy applies to two categories of people:</p>
            <ul className="mt-3 ml-5 list-disc space-y-2">
              <li>
                <strong className="text-white">Business Users</strong> — individuals who create an AgentHub
                account to build and manage AI voice agents. They provide personal
                data during registration and use the dashboard.
              </li>
              <li>
                <strong className="text-white">Callers (anonymous end users)</strong> — people who interact
                with an agent via a public shareable link. No account is required.
                Any personal data they share is provided voluntarily during the
                voice call.
              </li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Data We Collect</h2>

            <h3 className="text-base font-semibold text-[#E0E0F0] mt-5 mb-2">3a. Business Users</h3>
            <div className="overflow-x-auto rounded-xl border border-[#2A2A3E]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2A2A3E] bg-[#0E0E16]">
                    <th className="text-left px-4 py-3 text-[#8888AA] font-medium">Data</th>
                    <th className="text-left px-4 py-3 text-[#8888AA] font-medium">Purpose</th>
                    <th className="text-left px-4 py-3 text-[#8888AA] font-medium">Legal Basis</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Name, email address", "Account creation & authentication", "Contract"],
                    ["Hashed password", "Credential-based login", "Contract"],
                    ["OAuth identity (Google/GitHub)", "Social sign-in", "Contract"],
                    ["Business name, industry", "Configure your AI agent", "Contract"],
                    ["Knowledge base content", "Train your agent with business info", "Contract"],
                    ["Session cookies", "Maintain your login state", "Legitimate interest"],
                    ["IP address", "Rate limiting & abuse prevention", "Legitimate interest"],
                  ].map(([data, purpose, basis], i, arr) => (
                    <tr key={i} className={i < arr.length - 1 ? "border-b border-[#2A2A3E]" : ""}>
                      <td className="px-4 py-3 text-white align-top">{data}</td>
                      <td className="px-4 py-3 text-[#C0C0D8] align-top">{purpose}</td>
                      <td className="px-4 py-3 align-top">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-[#6366F1]/15 text-[#6366F1]">
                          {basis}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="text-base font-semibold text-[#E0E0F0] mt-8 mb-2">3b. Callers (Anonymous End Users)</h3>
            <div className="overflow-x-auto rounded-xl border border-[#2A2A3E]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2A2A3E] bg-[#0E0E16]">
                    <th className="text-left px-4 py-3 text-[#8888AA] font-medium">Data</th>
                    <th className="text-left px-4 py-3 text-[#8888AA] font-medium">Purpose</th>
                    <th className="text-left px-4 py-3 text-[#8888AA] font-medium">Legal Basis</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Voice audio (real-time only)", "Streamed to Gemini Live API; not stored on our servers", "Legitimate interest"],
                    ["Conversation transcript", "Stored per session for the business owner's records", "Legitimate interest"],
                    ["Name, phone, email (if provided voluntarily)", "Caller context passed to the agent", "Consent (voluntary)"],
                    ["Session duration, rating, feedback", "Quality analysis & dashboard metrics", "Legitimate interest"],
                    ["IP address", "Rate limiting & abuse prevention", "Legitimate interest"],
                  ].map(([data, purpose, basis], i, arr) => (
                    <tr key={i} className={i < arr.length - 1 ? "border-b border-[#2A2A3E]" : ""}>
                      <td className="px-4 py-3 text-white align-top">{data}</td>
                      <td className="px-4 py-3 text-[#C0C0D8] align-top">{purpose}</td>
                      <td className="px-4 py-3 align-top">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-[#00D4FF]/10 text-[#00D4FF]">
                          {basis}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. AI Processing</h2>
            <p>
              AgentHub uses third-party AI services to power its features. When
              data is sent to these services it is subject to their respective
              privacy policies:
            </p>
            <ul className="mt-3 ml-5 list-disc space-y-2">
              <li>
                <strong className="text-white">Google Gemini Live API</strong> — processes real-time voice
                audio and generates responses. Audio is streamed and not retained
                by us after the call ends.
              </li>
              <li>
                <strong className="text-white">Google text-embedding-004</strong> — converts knowledge base
                text into vector embeddings for semantic search. Content is
                transmitted at embedding time only.
              </li>
              <li>
                <strong className="text-white">Anthropic Claude API</strong> — analyses session transcripts
                post-call to generate summaries, sentiment scores, and action
                items. Only the transcript text is transmitted.
              </li>
            </ul>
            <p className="mt-3">
              We do not sell data to AI providers or permit them to train their
              models on your data beyond what is specified in their API usage
              policies.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Sharing</h2>
            <p>We share personal data only with:</p>
            <ul className="mt-3 ml-5 list-disc space-y-2">
              <li>
                <strong className="text-white">Infrastructure providers</strong> — Neon (database hosting),
                Upstash (Redis rate limiting), Vercel (hosting). These act as
                data processors under our instruction.
              </li>
              <li>
                <strong className="text-white">AI service providers</strong> — Google and Anthropic, for
                the specific purposes described in Section 4.
              </li>
              <li>
                <strong className="text-white">Authentication providers</strong> — Google and GitHub, only
                during the OAuth sign-in flow.
              </li>
              <li>
                <strong className="text-white">Resend</strong> — for sending transactional emails (welcome
                emails, password resets). Only the recipient email and name are
                shared.
              </li>
              <li>
                <strong className="text-white">LangSmith (optional)</strong> — AI observability tracing.
                If enabled, prompt/response pairs may be logged for debugging.
              </li>
            </ul>
            <p className="mt-3">
              We do not sell, rent, or trade personal data to any third party for
              marketing purposes.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Data Retention</h2>
            <ul className="mt-2 ml-5 list-disc space-y-2">
              <li>
                <strong className="text-white">Business User accounts</strong> — retained until the account
                is deleted. Deletion removes your profile, business data,
                knowledge base, and session records within 30 days.
              </li>
              <li>
                <strong className="text-white">Session transcripts &amp; analysis</strong> — retained as
                long as your account is active. You can delete individual sessions
                from the dashboard.
              </li>
              <li>
                <strong className="text-white">Password reset tokens</strong> — expire after 1 hour and
                are deleted on use.
              </li>
              <li>
                <strong className="text-white">Caller data (anonymous)</strong> — retained as part of the
                session record. Business Users control and can delete this data
                from their dashboard.
              </li>
            </ul>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Your Rights (GDPR &amp; CCPA)</h2>
            <p>Depending on your location, you may have the following rights:</p>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              {[
                ["Access", "Request a copy of your personal data"],
                ["Correction", "Correct inaccurate data we hold about you"],
                ["Deletion", "Request erasure of your personal data"],
                ["Portability", "Receive your data in a machine-readable format"],
                ["Restriction", "Restrict how we process your data"],
                ["Objection", "Object to processing based on legitimate interest"],
                ["Opt-out (CCPA)", "California residents may opt out of data sales (we do not sell data)"],
                ["Withdraw consent", "Where processing is consent-based, withdraw at any time"],
              ].map(([right, desc]) => (
                <div key={right} className="p-3 rounded-xl border border-[#2A2A3E] bg-[#0E0E16]">
                  <p className="text-sm font-semibold text-white mb-1">{right}</p>
                  <p className="text-xs text-[#8888AA]">{desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-4">
              To exercise any of these rights, email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#00D4FF] hover:underline">
                {CONTACT_EMAIL}
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Cookies</h2>
            <p>
              We use cookies for authentication and functional preferences. We do
              not use tracking or advertising cookies. See our{" "}
              <Link href="/legal/cookies" className="text-[#00D4FF] hover:underline">
                Cookie Policy
              </Link>{" "}
              for full details.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Security</h2>
            <p>
              We implement industry-standard security measures including:
            </p>
            <ul className="mt-2 ml-5 list-disc space-y-1">
              <li>Passwords hashed with bcrypt (cost factor 12)</li>
              <li>All data transmitted over TLS/HTTPS</li>
              <li>JWT-based session tokens, never stored in plaintext</li>
              <li>Rate limiting on authentication endpoints to prevent brute force</li>
              <li>Database hosted on Neon with encryption at rest</li>
            </ul>
            <p className="mt-3">
              No method of transmission or storage is 100% secure. If you
              discover a security vulnerability, please report it responsibly via{" "}
              <Link href="/contact" className="text-[#00D4FF] hover:underline">
                our contact page
              </Link>
              .
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Children&apos;s Privacy</h2>
            <p>
              AgentHub is not directed at children under 16. We do not knowingly
              collect personal data from children. If you believe a child has
              provided us with personal data, please contact us and we will
              delete it promptly.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. International Transfers</h2>
            <p>
              Your data may be processed in countries outside your own, including
              the United States, where our infrastructure and AI providers
              operate. We rely on standard contractual clauses and other
              safeguards to ensure adequate protection for such transfers.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. We will notify
              Business Users of material changes by email or a prominent notice
              on the dashboard. The effective date at the top of this page will
              always reflect the latest revision.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">13. Contact</h2>
            <div className="p-4 rounded-xl border border-[#2A2A3E] bg-[#0E0E16]">
              <p className="text-white font-medium">AgentHub — Privacy Team</p>
              <p className="mt-1">
                Email:{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#00D4FF] hover:underline">
                  {CONTACT_EMAIL}
                </a>
              </p>
              <p className="mt-1 text-sm text-[#8888AA]">
                Or use our{" "}
                <Link href="/contact" className="text-[#00D4FF] hover:underline">
                  contact form
                </Link>{" "}
                for privacy requests and data deletion enquiries.
              </p>
            </div>
          </section>
        </div>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-[#2A2A3E] flex flex-wrap gap-6 text-sm text-[#8888AA]">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <Link href="/legal/terms" className="hover:text-white transition-colors">Terms &amp; Conditions</Link>
          <Link href="/legal/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          <span>© {new Date().getFullYear()} AgentHub</span>
        </div>
      </main>
    </div>
  );
}
