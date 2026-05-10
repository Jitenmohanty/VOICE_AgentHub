import Link from "next/link";
import { LegalShell } from "@/components/legal/LegalShell";

export const metadata = {
  title: "Privacy Policy – AgentHub",
  description:
    "Learn how AgentHub collects, uses, and protects your personal data.",
};

const EFFECTIVE_DATE = "April 5, 2025";
const CONTACT_EMAIL = "privacy@agenthub.ai";

const sectionH = "text-xl font-semibold tracking-tight text-white mb-3";
const subH = "text-base font-semibold text-white mt-6 mb-2";
const tableWrap = "overflow-x-auto rounded-2xl border border-white/[0.06]";
const tableHead = "text-left px-4 py-3 text-white/55 font-medium text-xs uppercase tracking-wider";

export default function PrivacyPolicyPage() {
  return (
    <LegalShell title="Privacy Policy" subtitle={`Effective date: ${EFFECTIVE_DATE}`}>
      <section>
        <h2 className={sectionH}>1. Who We Are</h2>
        <p>
          AgentHub (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates a multi-tenant voice AI SaaS platform that lets
          business owners create and deploy AI voice agents for their customers. This Privacy Policy
          explains what personal data we collect, how we use it, and your rights in relation to it.
        </p>
        <p className="mt-3">
          For privacy enquiries, contact us at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="ah-gradient-text font-medium hover:opacity-80">
            {CONTACT_EMAIL}
          </a>.
        </p>
      </section>

      <section>
        <h2 className={sectionH}>2. Who This Policy Applies To</h2>
        <p>This policy applies to two categories of people:</p>
        <ul className="mt-3 ml-5 list-disc space-y-2">
          <li><strong className="text-white">Business Users</strong> — individuals who create an AgentHub account to build and manage AI voice agents.</li>
          <li><strong className="text-white">Callers (anonymous end users)</strong> — people who interact with an agent via a public shareable link. No account is required.</li>
        </ul>
      </section>

      <section>
        <h2 className={sectionH}>3. Data We Collect</h2>

        <h3 className={subH}>3a. Business Users</h3>
        <div className={tableWrap}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.03]">
                <th className={tableHead}>Data</th>
                <th className={tableHead}>Purpose</th>
                <th className={tableHead}>Legal Basis</th>
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
                <tr key={i} className={i < arr.length - 1 ? "border-b border-white/[0.05]" : ""}>
                  <td className="px-4 py-3 text-white align-top">{data}</td>
                  <td className="px-4 py-3 text-white/65 align-top">{purpose}</td>
                  <td className="px-4 py-3 align-top">
                    <span className="px-2.5 py-0.5 rounded-full text-xs bg-violet-500/15 text-violet-300 border border-violet-300/20">
                      {basis}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className={subH}>3b. Callers (Anonymous End Users)</h3>
        <div className={tableWrap}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.03]">
                <th className={tableHead}>Data</th>
                <th className={tableHead}>Purpose</th>
                <th className={tableHead}>Legal Basis</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Voice audio (real-time only)", "Streamed to Gemini Live API; not stored on our servers", "Legitimate interest"],
                ["Conversation transcript", "Stored per session for the business owner's records", "Legitimate interest"],
                ["Name, phone, email (if voluntarily provided)", "Caller context passed to the agent", "Consent (voluntary)"],
                ["Session duration, rating, feedback", "Quality analysis & dashboard metrics", "Legitimate interest"],
                ["IP address", "Rate limiting & abuse prevention", "Legitimate interest"],
              ].map(([data, purpose, basis], i, arr) => (
                <tr key={i} className={i < arr.length - 1 ? "border-b border-white/[0.05]" : ""}>
                  <td className="px-4 py-3 text-white align-top">{data}</td>
                  <td className="px-4 py-3 text-white/65 align-top">{purpose}</td>
                  <td className="px-4 py-3 align-top">
                    <span className="px-2.5 py-0.5 rounded-full text-xs bg-cyan-500/15 text-cyan-300 border border-cyan-300/20">
                      {basis}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className={sectionH}>4. AI Processing</h2>
        <p>
          AgentHub uses third-party AI services to power its features. When data is sent to these services it is
          subject to their respective privacy policies:
        </p>
        <ul className="mt-3 ml-5 list-disc space-y-2">
          <li><strong className="text-white">Google Gemini Live API</strong> — processes real-time voice audio. Audio is streamed and not retained by us after the call ends.</li>
          <li><strong className="text-white">Google text-embedding-004</strong> — converts knowledge base text into vector embeddings for semantic search.</li>
          <li><strong className="text-white">Anthropic Claude API</strong> — analyses session transcripts post-call to generate summaries, sentiment, and action items.</li>
        </ul>
        <p className="mt-3">
          We do not sell data to AI providers or permit them to train their models on your data beyond what is
          specified in their API usage policies.
        </p>
      </section>

      <section>
        <h2 className={sectionH}>5. Data Sharing</h2>
        <p>We share personal data only with:</p>
        <ul className="mt-3 ml-5 list-disc space-y-2">
          <li><strong className="text-white">Infrastructure providers</strong> — Neon (database), Upstash (rate limiting), Vercel (hosting).</li>
          <li><strong className="text-white">AI service providers</strong> — Google and Anthropic, for the purposes described in Section 4.</li>
          <li><strong className="text-white">Authentication providers</strong> — Google and GitHub, only during the OAuth sign-in flow.</li>
          <li><strong className="text-white">Resend</strong> — for transactional emails (welcome, password reset). Recipient email and name only.</li>
          <li><strong className="text-white">LangSmith (optional)</strong> — AI observability tracing.</li>
        </ul>
        <p className="mt-3">We do not sell, rent, or trade personal data to any third party for marketing purposes.</p>
      </section>

      <section>
        <h2 className={sectionH}>6. Data Retention</h2>
        <ul className="mt-2 ml-5 list-disc space-y-2">
          <li><strong className="text-white">Business User accounts</strong> — retained until the account is deleted. Deletion removes profile, business data, knowledge base, and sessions within 30 days.</li>
          <li><strong className="text-white">Session transcripts &amp; analysis</strong> — retained as long as your account is active.</li>
          <li><strong className="text-white">Password reset tokens</strong> — expire after 1 hour and are deleted on use.</li>
          <li><strong className="text-white">Caller data (anonymous)</strong> — retained as part of the session record, controlled by the business owner.</li>
        </ul>
      </section>

      <section>
        <h2 className={sectionH}>7. Your Rights (GDPR &amp; CCPA)</h2>
        <p>Depending on your location, you may have the following rights:</p>
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          {[
            ["Access", "Request a copy of your personal data"],
            ["Correction", "Correct inaccurate data we hold about you"],
            ["Deletion", "Request erasure of your personal data"],
            ["Portability", "Receive your data in a machine-readable format"],
            ["Restriction", "Restrict how we process your data"],
            ["Objection", "Object to processing based on legitimate interest"],
            ["Opt-out (CCPA)", "California residents may opt out of data sales (we do not sell)"],
            ["Withdraw consent", "Where processing is consent-based, withdraw at any time"],
          ].map(([right, desc]) => (
            <div key={right} className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.03]">
              <p className="text-sm font-semibold text-white mb-1">{right}</p>
              <p className="text-xs text-white/55">{desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-4">
          To exercise any of these rights, email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="ah-gradient-text font-medium hover:opacity-80">{CONTACT_EMAIL}</a>.
          We will respond within 30 days.
        </p>
      </section>

      <section>
        <h2 className={sectionH}>8. Cookies</h2>
        <p>
          We use cookies for authentication and functional preferences. We do not use tracking or advertising cookies.
          See our{" "}
          <Link href="/legal/cookies" className="ah-gradient-text font-medium hover:opacity-80">Cookie Policy</Link>{" "}
          for full details.
        </p>
      </section>

      <section>
        <h2 className={sectionH}>9. Security</h2>
        <p>We implement industry-standard security measures including:</p>
        <ul className="mt-2 ml-5 list-disc space-y-1">
          <li>Passwords hashed with bcrypt (cost factor 12)</li>
          <li>All data transmitted over TLS/HTTPS</li>
          <li>JWT-based session tokens, never stored in plaintext</li>
          <li>Rate limiting on authentication endpoints</li>
          <li>Database hosted on Neon with encryption at rest</li>
        </ul>
        <p className="mt-3">
          No method of transmission or storage is 100% secure. If you discover a security vulnerability, please report it via{" "}
          <Link href="/contact" className="ah-gradient-text font-medium hover:opacity-80">our contact page</Link>.
        </p>
      </section>

      <section>
        <h2 className={sectionH}>10. Children&apos;s Privacy</h2>
        <p>
          AgentHub is not directed at children under 16. We do not knowingly collect personal data from children.
          If you believe a child has provided us with personal data, please contact us and we will delete it promptly.
        </p>
      </section>

      <section>
        <h2 className={sectionH}>11. International Transfers</h2>
        <p>
          Your data may be processed in countries outside your own, including the United States. We rely on standard
          contractual clauses and other safeguards to ensure adequate protection for such transfers.
        </p>
      </section>

      <section>
        <h2 className={sectionH}>12. Changes to This Policy</h2>
        <p>
          We may update this policy from time to time. We will notify Business Users of material changes by email or a
          prominent dashboard notice. The effective date at the top of this page will always reflect the latest revision.
        </p>
      </section>

      <section>
        <h2 className={sectionH}>13. Contact</h2>
        <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.03]">
          <p className="text-white font-medium">AgentHub — Privacy Team</p>
          <p className="mt-1.5">
            Email:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="ah-gradient-text font-medium hover:opacity-80">{CONTACT_EMAIL}</a>
          </p>
          <p className="mt-1 text-sm text-white/55">
            Or use our{" "}
            <Link href="/contact" className="ah-gradient-text font-medium hover:opacity-80">contact form</Link>{" "}
            for privacy requests.
          </p>
        </div>
      </section>
    </LegalShell>
  );
}
