import { traceable } from "langsmith/traceable";
import { decryptSecret } from "@/lib/crypto";
import { pushLeadToZoho, type ZohoConfig, type ZohoSecret } from "@/lib/crm/zoho";

/**
 * CRM push dispatcher (Item 9). Providers register here; `pushLeadToCrm`
 * decrypts the per-business credentials and routes to the right adapter.
 * Everything is best-effort from the caller's perspective — a CRM outage
 * must never block the lead email/webhook.
 */

export const SUPPORTED_CRM_PROVIDERS = ["zoho"] as const;
export type CrmProvider = (typeof SUPPORTED_CRM_PROVIDERS)[number];

export interface CrmLead {
  name: string | null;
  phone: string | null;
  email: string | null;
  intent: string;
  notes?: string | null;
  company?: string | null; // the caller's company if known; Zoho requires one
}

export interface CrmPushOutcome {
  attempted: boolean;
  ok?: boolean;
  recordId?: string;
  error?: string;
}

export function isSupportedCrmProvider(p: string | null | undefined): p is CrmProvider {
  return !!p && (SUPPORTED_CRM_PROVIDERS as readonly string[]).includes(p);
}

export const pushLeadToCrm = traceable(
  async function pushLeadToCrm(opts: {
    provider: string;
    secretEncrypted: string;
    config: unknown;
    lead: CrmLead;
  }): Promise<CrmPushOutcome> {
    if (!isSupportedCrmProvider(opts.provider)) {
      return { attempted: false, error: `Unsupported CRM provider: ${opts.provider}` };
    }
    let secretJson: string;
    try {
      secretJson = decryptSecret(opts.secretEncrypted);
    } catch (err) {
      return {
        attempted: true,
        ok: false,
        error: `Credential decryption failed: ${err instanceof Error ? err.message : "unknown"}`,
      };
    }

    if (opts.provider === "zoho") {
      const secret = JSON.parse(secretJson) as ZohoSecret;
      const config = (opts.config ?? {}) as ZohoConfig;
      return pushLeadToZoho(secret, config, opts.lead);
    }
    return { attempted: false, error: "No adapter" };
  },
  { name: "pushLeadToCrm", run_type: "tool" },
);
