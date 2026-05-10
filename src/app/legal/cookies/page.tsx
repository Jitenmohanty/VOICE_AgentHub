import Link from "next/link";
import { LegalShell } from "@/components/legal/LegalShell";

export const metadata = {
  title: "Cookie Policy – AgentHub",
  description:
    "Learn how AgentHub uses cookies and similar technologies on our platform.",
};

const EFFECTIVE_DATE = "April 5, 2025";
const CONTACT_EMAIL = "legal@agenthub.ai";

type CookieRow = {
  name: string;
  purpose: string;
  duration: string;
  type: string;
};

const authCookies: CookieRow[] = [
  {
    name: "next-auth.session-token",
    purpose:
      "Stores your authenticated session after signing in. Required for dashboard access.",
    duration: "30 days",
    type: "Essential",
  },
  {
    name: "next-auth.csrf-token",
    purpose:
      "Cross-Site Request Forgery protection token used during login and sign-out flows.",
    duration: "Session",
    type: "Essential",
  },
  {
    name: "next-auth.callback-url",
    purpose:
      "Remembers the page you were trying to visit before being redirected to login.",
    duration: "Session",
    type: "Essential",
  },
  {
    name: "__Secure-next-auth.session-token",
    purpose:
      "Secure variant of the session token used when the site is served over HTTPS.",
    duration: "30 days",
    type: "Essential",
  },
];

const functionalCookies: CookieRow[] = [
  {
    name: "agenthub-theme",
    purpose:
      "Saves your UI theme preference (dark mode default) so it persists across visits.",
    duration: "1 year",
    type: "Functional",
  },
];

export default function CookiePolicyPage() {
  return (
    <LegalShell title="Cookie Policy" subtitle={`Effective date: ${EFFECTIVE_DATE}`}>
      <>

          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              1. What Are Cookies?
            </h2>
            <p>
              Cookies are small text files placed on your device by a website
              when you visit it. They allow the site to remember information
              about your visit — such as whether you are logged in — making your
              next visit easier and the site more useful to you.
            </p>
            <p className="mt-3">
              AgentHub uses cookies exclusively for the purposes described in
              this policy. We do not use cookies to track your activity across
              third-party websites or to serve targeted advertising.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              2. Who This Policy Applies To
            </h2>
            <p>
              This policy applies to two types of users:
            </p>
            <ul className="mt-3 ml-5 list-disc space-y-2">
              <li>
                <strong className="text-white">Business Users</strong> — people
                who create an account to build and manage AI voice agents on
                the AgentHub dashboard. Cookies are set when you log in.
              </li>
              <li>
                <strong className="text-white">Callers (anonymous users)</strong>{" "}
                — end users who interact with a deployed agent via a public
                shareable link. Callers do not need to log in. No
                authentication cookies are set for Callers. The voice session
                runs entirely in-browser without identifying cookies.
              </li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              3. Cookies We Use
            </h2>

            {/* 3a */}
            <h3 className="text-base font-semibold text-white mt-5 mb-3">
              3a. Essential Authentication Cookies
            </h3>
            <p>
              These cookies are strictly necessary for Business Users to access
              the dashboard. They are set by{" "}
              <strong className="text-white">NextAuth.js</strong>, our
              authentication library, after a successful login. Without them,
              the authenticated features of AgentHub cannot function.
            </p>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-white/[0.06]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.03]">
                    <th className="text-left px-4 py-3 text-white/55 font-medium text-xs uppercase tracking-wider">Cookie Name</th>
                    <th className="text-left px-4 py-3 text-white/55 font-medium text-xs uppercase tracking-wider">Purpose</th>
                    <th className="text-left px-4 py-3 text-white/55 font-medium text-xs uppercase tracking-wider">Duration</th>
                    <th className="text-left px-4 py-3 text-white/55 font-medium text-xs uppercase tracking-wider">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {authCookies.map((row, i) => (
                    <tr
                      key={row.name}
                      className={
                        i < authCookies.length - 1
                          ? "border-b border-white/[0.05]"
                          : ""
                      }
                    >
                      <td className="px-4 py-3 font-mono text-xs ah-gradient-text align-top whitespace-nowrap">
                        {row.name}
                      </td>
                      <td className="px-4 py-3 text-white/75 align-top">
                        {row.purpose}
                      </td>
                      <td className="px-4 py-3 text-white/55 align-top whitespace-nowrap">
                        {row.duration}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-violet-500/15 text-violet-300 border border-violet-300/20">
                          {row.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 3b */}
            <h3 className="text-base font-semibold text-white mt-8 mb-3">
              3b. Functional Cookies
            </h3>
            <p>
              These cookies remember your preferences to improve your experience.
              They are not essential but help the platform work better for you.
            </p>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-white/[0.06]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.03]">
                    <th className="text-left px-4 py-3 text-white/55 font-medium text-xs uppercase tracking-wider">Cookie Name</th>
                    <th className="text-left px-4 py-3 text-white/55 font-medium text-xs uppercase tracking-wider">Purpose</th>
                    <th className="text-left px-4 py-3 text-white/55 font-medium text-xs uppercase tracking-wider">Duration</th>
                    <th className="text-left px-4 py-3 text-white/55 font-medium text-xs uppercase tracking-wider">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {functionalCookies.map((row) => (
                    <tr key={row.name}>
                      <td className="px-4 py-3 font-mono text-xs ah-gradient-text align-top whitespace-nowrap">
                        {row.name}
                      </td>
                      <td className="px-4 py-3 text-white/75 align-top">
                        {row.purpose}
                      </td>
                      <td className="px-4 py-3 text-white/55 align-top whitespace-nowrap">
                        {row.duration}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-cyan-500/15 text-cyan-300 border border-cyan-300/20">
                          {row.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 3c */}
            <h3 className="text-base font-semibold text-white mt-8 mb-3">
              3c. Analytics and Advertising Cookies
            </h3>
            <p>
              AgentHub does <strong className="text-white">not</strong> use any
              analytics cookies (e.g. Google Analytics), advertising cookies, or
              cross-site tracking technologies. We do not sell your data.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              4. Third-Party OAuth Cookies
            </h2>
            <p>
              If you choose to sign in with{" "}
              <strong className="text-white">Google</strong> or{" "}
              <strong className="text-white">GitHub</strong>, you will be
              redirected to their authentication pages. Those providers may set
              their own cookies on their domains during the OAuth flow. We do not
              control these cookies; please refer to their privacy policies:
            </p>
            <ul className="mt-3 ml-5 list-disc space-y-1">
              <li>
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ah-gradient-text font-medium hover:opacity-80"
                >
                  Google Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ah-gradient-text font-medium hover:opacity-80"
                >
                  GitHub Privacy Statement
                </a>
              </li>
            </ul>
            <p className="mt-3">
              Once the OAuth flow completes and you are redirected back to
              AgentHub, only our own session cookies (listed above) are active.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              5. Voice Sessions and Local Storage
            </h2>
            <p>
              When an anonymous Caller interacts with a voice agent via a public
              link, the session state (connection status, transcript, audio
              playback) is managed in-memory using{" "}
              <strong className="text-white">React state and Zustand</strong>.
              No cookies are set for Callers. We do not use{" "}
              <code className="text-xs bg-black/40 px-1.5 py-0.5 rounded ah-gradient-text font-mono">
                localStorage
              </code>{" "}
              or{" "}
              <code className="text-xs bg-black/40 px-1.5 py-0.5 rounded ah-gradient-text font-mono">
                sessionStorage
              </code>{" "}
              to persist Caller data between sessions.
            </p>
            <p className="mt-3">
              At the end of a call, the transcript and session metadata are
              saved to our server-side database for the Business User's records.
              This server-side storage is not cookie-based.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              6. How to Manage and Delete Cookies
            </h2>
            <p>
              You can control and delete cookies through your browser settings.
              The links below explain how to do this in popular browsers:
            </p>
            <ul className="mt-3 ml-5 list-disc space-y-1">
              <li>
                <a
                  href="https://support.google.com/chrome/answer/95647"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ah-gradient-text font-medium hover:opacity-80"
                >
                  Google Chrome
                </a>
              </li>
              <li>
                <a
                  href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ah-gradient-text font-medium hover:opacity-80"
                >
                  Mozilla Firefox
                </a>
              </li>
              <li>
                <a
                  href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ah-gradient-text font-medium hover:opacity-80"
                >
                  Apple Safari
                </a>
              </li>
              <li>
                <a
                  href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ah-gradient-text font-medium hover:opacity-80"
                >
                  Microsoft Edge
                </a>
              </li>
            </ul>
            <p className="mt-3">
              Please note that blocking or deleting essential authentication
              cookies will prevent you from logging into the AgentHub dashboard.
              It will not affect Callers using public agent links.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              7. Changes to This Policy
            </h2>
            <p>
              We may update this Cookie Policy from time to time to reflect
              changes in technology, regulation, or our platform features. We
              will update the effective date at the top of this page and, where
              appropriate, notify Business Users via email or the dashboard.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              8. Contact Us
            </h2>
            <p>
              If you have questions about our use of cookies or this policy,
              please contact us:
            </p>
            <div className="mt-3 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.03]">
              <p className="text-white font-medium">AgentHub</p>
              <p className="mt-1">
                Email:{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="ah-gradient-text font-medium hover:opacity-80"
                >
                  {CONTACT_EMAIL}
                </a>
              </p>
            </div>
          </section>
      </>
    </LegalShell>
  );
}
