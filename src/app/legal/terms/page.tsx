import Link from "next/link";
import { Zap, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms & Conditions – AgentHub",
  description:
    "Read AgentHub's Terms and Conditions before using our voice AI platform.",
};

const EFFECTIVE_DATE = "April 5, 2025";
const CONTACT_EMAIL = "legal@agenthub.ai";

export default function TermsPage() {
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

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">
            Terms &amp; Conditions
          </h1>
          <p className="text-[#8888AA] text-sm">
            Effective date: {EFFECTIVE_DATE}
          </p>
        </div>

        <div className="space-y-10 text-[#C0C0D8] leading-relaxed">

          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using AgentHub (&quot;Service&quot;, &quot;Platform&quot;,
              &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you agree to be bound by these Terms &amp;
              Conditions (&quot;Terms&quot;). If you are using the Service on behalf of a
              business or organisation, you represent that you have authority to
              bind that entity to these Terms.
            </p>
            <p className="mt-3">
              If you do not agree with any part of these Terms, you must not use
              the Service.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              2. Description of Service
            </h2>
            <p>
              AgentHub is a multi-tenant voice AI SaaS platform that enables
              business owners (&quot;Business Users&quot;) to create and deploy
              industry-specific AI voice agents. These agents are accessible to
              end users (&quot;Callers&quot;) via shareable public links — no account or
              login is required for Callers.
            </p>
            <p className="mt-3">The platform currently supports the following agent types:</p>
            <ul className="mt-2 ml-5 list-disc space-y-1">
              <li>Hotel concierge &amp; reservations</li>
              <li>Medical clinic reception &amp; appointment booking</li>
              <li>Restaurant information &amp; ordering</li>
              <li>Legal consultation intake</li>
              <li>Job interview simulation &amp; practice</li>
            </ul>
            <p className="mt-3">
              Voice interactions are powered by the Google Gemini Live API.
              Post-call analysis (summaries, sentiment, action items) is
              performed by Anthropic's Claude AI.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              3. Accounts and Registration
            </h2>
            <p>
              Business Users must create an account to access the dashboard and
              configure AI agents. You may register using Google OAuth, GitHub
              OAuth, or email and password credentials.
            </p>
            <p className="mt-3">You are responsible for:</p>
            <ul className="mt-2 ml-5 list-disc space-y-1">
              <li>Maintaining the confidentiality of your account credentials.</li>
              <li>All activity that occurs under your account.</li>
              <li>
                Ensuring that the information you provide during registration is
                accurate and up to date.
              </li>
            </ul>
            <p className="mt-3">
              Callers who interact with agents via public links do not create
              accounts and are treated as anonymous users. No personally
              identifiable information is required from Callers beyond what they
              voluntarily disclose during the voice interaction.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              4. Acceptable Use
            </h2>
            <p>You agree not to use AgentHub to:</p>
            <ul className="mt-2 ml-5 list-disc space-y-1">
              <li>
                Provide false, misleading, or fraudulent information to Callers.
              </li>
              <li>
                Harass, intimidate, or harm any individual through an AI agent.
              </li>
              <li>
                Deploy agents that impersonate licensed medical, legal, or
                financial professionals in a way that constitutes regulated
                advice without the appropriate disclaimers.
              </li>
              <li>
                Attempt to reverse-engineer, scrape, or otherwise extract AI
                model weights, system prompts, or proprietary platform logic.
              </li>
              <li>
                Circumvent rate limits, authentication mechanisms, or other
                security controls.
              </li>
              <li>
                Collect personal data from Callers beyond what is required for
                the legitimate business purpose of the agent.
              </li>
              <li>
                Use the platform for any unlawful purpose or in violation of
                applicable laws and regulations.
              </li>
            </ul>
            <p className="mt-3">
              We reserve the right to suspend or terminate accounts that violate
              these guidelines without notice.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              5. Voice Data and AI Processing
            </h2>
            <p>
              When a Caller interacts with an agent, the voice session is
              processed in real time via the Google Gemini Live API. Audio is
              transmitted as 16kHz PCM16 mono audio and is not permanently stored
              on our servers. However, <strong className="text-white">conversation transcripts</strong> are
              stored in our database as part of the session record.
            </p>
            <p className="mt-3">
              Post-call analysis (summary, sentiment score, topics, action items,
              and escalation flags) is generated by Anthropic's Claude AI and
              stored against the session record. This data is accessible to the
              Business User who owns the agent.
            </p>
            <p className="mt-3">
              Business Users are responsible for ensuring that their use of
              AgentHub and the collection of Caller data complies with applicable
              privacy laws in their jurisdiction (e.g. GDPR, CCPA, PDPA).
              Business Users must inform Callers if conversations are being
              recorded or analysed, and obtain any necessary consents.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              6. Knowledge Base and Business Data
            </h2>
            <p>
              Business Users may upload knowledge base articles, menu items,
              doctor rosters, legal fee structures, interview questions, and other
              business data to configure their agents. This content:
            </p>
            <ul className="mt-2 ml-5 list-disc space-y-1">
              <li>Remains the intellectual property of the Business User.</li>
              <li>
                Is processed by our vector embedding system (Google
                text-embedding-004, 768 dimensions) to enable semantic search
                during calls.
              </li>
              <li>
                Is stored securely in our PostgreSQL database hosted on Neon.
              </li>
            </ul>
            <p className="mt-3">
              We do not use your business data to train AI models or share it
              with third parties except as required to deliver the Service (e.g.
              passing relevant context to Gemini during a live call).
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              7. Intellectual Property
            </h2>
            <p>
              The AgentHub platform, including its source code, design, logos,
              and underlying AI infrastructure, is the intellectual property of
              AgentHub and its licensors. Nothing in these Terms transfers any
              ownership rights to you.
            </p>
            <p className="mt-3">
              You retain ownership of all content you upload to the platform
              (knowledge base items, business data, agent configurations). By
              uploading content, you grant AgentHub a limited, non-exclusive,
              royalty-free licence to use that content solely for the purpose of
              providing the Service.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              8. Third-Party Services
            </h2>
            <p>
              AgentHub integrates with the following third-party services. Your
              use of the platform is also subject to their respective terms and
              policies:
            </p>
            <ul className="mt-2 ml-5 list-disc space-y-1">
              <li>
                <strong className="text-white">Google Gemini API</strong> — real-time voice AI and embeddings
              </li>
              <li>
                <strong className="text-white">Anthropic Claude API</strong> — post-call text analysis
              </li>
              <li>
                <strong className="text-white">Neon (PostgreSQL)</strong> — serverless database hosting
              </li>
              <li>
                <strong className="text-white">Upstash Redis</strong> — rate limiting
              </li>
              <li>
                <strong className="text-white">LangSmith</strong> — AI observability and tracing (optional)
              </li>
              <li>
                <strong className="text-white">GitHub / Google OAuth</strong> — authentication providers
              </li>
            </ul>
            <p className="mt-3">
              We are not responsible for the availability, accuracy, or conduct
              of these third-party services.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              9. Rate Limits and Fair Use
            </h2>
            <p>
              To ensure service quality for all users, AgentHub enforces rate
              limits on API calls, session creation, and other platform
              operations. Exceeding these limits may result in temporary
              throttling or suspension of access.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              10. Disclaimers
            </h2>
            <p>
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without
              warranties of any kind, whether express or implied. We do not
              warrant that:
            </p>
            <ul className="mt-2 ml-5 list-disc space-y-1">
              <li>The Service will be uninterrupted or error-free.</li>
              <li>AI-generated responses will be accurate or complete.</li>
              <li>
                The Service is suitable for regulated industries (medical, legal,
                financial) without appropriate human oversight.
              </li>
            </ul>
            <p className="mt-3">
              AI voice agents are not a substitute for qualified professional
              advice. Business Users deploying agents in medical, legal, or
              financial contexts must include appropriate disclaimers to Callers.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              11. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law, AgentHub and its
              officers, employees, and affiliates shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages
              arising out of or related to your use of the Service, including but
              not limited to loss of data, loss of revenue, or harm arising from
              reliance on AI-generated content.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              12. Termination
            </h2>
            <p>
              You may delete your account at any time from the Settings page.
              Upon termination, your agent configurations, knowledge base, and
              session data will be deleted from our systems within 30 days,
              except where retention is required by law.
            </p>
            <p className="mt-3">
              We may suspend or terminate your access at any time for violation
              of these Terms or for any other reason at our sole discretion.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              13. Changes to These Terms
            </h2>
            <p>
              We may update these Terms from time to time. We will notify
              Business Users of material changes by email or by posting a notice
              on the dashboard. Continued use of the Service after changes take
              effect constitutes your acceptance of the revised Terms.
            </p>
          </section>

          {/* 14 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              14. Governing Law
            </h2>
            <p>
              These Terms are governed by and construed in accordance with
              applicable law. Any disputes shall be resolved through binding
              arbitration or in the courts of competent jurisdiction, as
              applicable.
            </p>
          </section>

          {/* 15 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              15. Contact Us
            </h2>
            <p>
              If you have questions about these Terms, please contact us at:
            </p>
            <div className="mt-3 p-4 rounded-xl border border-[#2A2A3E] bg-[#0E0E16]">
              <p className="text-white font-medium">AgentHub</p>
              <p className="mt-1">
                Email:{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-[#00D4FF] hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-[#2A2A3E] flex flex-wrap gap-6 text-sm text-[#8888AA]">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/legal/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          <span>© {new Date().getFullYear()} AgentHub</span>
        </div>
      </main>
    </div>
  );
}
