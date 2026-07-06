import type { CrmLead, CrmPushOutcome } from "@/lib/crm/index";

/**
 * Zoho CRM adapter (Item 9 — the dominant SMB CRM in the Indian ICP).
 *
 * Auth model: Zoho "Self Client" OAuth — the owner creates a self client in
 * the Zoho API console, generates a grant with scope
 * `ZohoCRM.modules.leads.CREATE`, and pastes { clientId, clientSecret,
 * refreshToken } into Voxie settings. We exchange the long-lived refresh
 * token for a short-lived access token on every push (one extra HTTP call;
 * simple and stateless — no token cache to invalidate).
 *
 * Region matters: an account on zoho.in must use accounts.zoho.in +
 * www.zohoapis.in. `region` in crmConfig selects both.
 */

export interface ZohoSecret {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export interface ZohoConfig {
  region?: "in" | "com" | "eu";
  fieldMapping?: Record<string, string>;
}

const REGION_HOSTS: Record<string, { accounts: string; api: string }> = {
  in: { accounts: "https://accounts.zoho.in", api: "https://www.zohoapis.in" },
  com: { accounts: "https://accounts.zoho.com", api: "https://www.zohoapis.com" },
  eu: { accounts: "https://accounts.zoho.eu", api: "https://www.zohoapis.eu" },
};

async function getAccessToken(secret: ZohoSecret, accountsHost: string): Promise<string> {
  const params = new URLSearchParams({
    refresh_token: secret.refreshToken,
    client_id: secret.clientId,
    client_secret: secret.clientSecret,
    grant_type: "refresh_token",
  });
  const res = await fetch(`${accountsHost}/oauth/v2/token?${params.toString()}`, {
    method: "POST",
    signal: AbortSignal.timeout(10_000),
  });
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; error?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(`Zoho token refresh failed: ${data.error || `HTTP ${res.status}`}`);
  }
  return data.access_token;
}

/** Default Voxie-lead → Zoho-Leads-module field mapping. Owner mapping overrides per key. */
function buildRecord(lead: CrmLead, mapping?: Record<string, string>): Record<string, string> {
  const defaults: Record<string, string | null> = {
    // Last_Name is mandatory in Zoho's Leads module.
    Last_Name: lead.name || lead.phone || "Voxie caller",
    Phone: lead.phone,
    Email: lead.email,
    Description: [lead.intent, lead.notes].filter(Boolean).join("\n\n"),
    Lead_Source: "Voxie Voice Agent",
    Company: lead.company || "Unknown",
  };
  const record: Record<string, string> = {};
  for (const [key, value] of Object.entries(defaults)) {
    if (value) record[mapping?.[key] ?? key] = value;
  }
  return record;
}

export async function pushLeadToZoho(
  secret: ZohoSecret,
  config: ZohoConfig,
  lead: CrmLead,
): Promise<CrmPushOutcome> {
  const hosts = REGION_HOSTS[config.region ?? "in"] ?? REGION_HOSTS.in!;
  try {
    const accessToken = await getAccessToken(secret, hosts.accounts);
    const res = await fetch(`${hosts.api}/crm/v2/Leads`, {
      method: "POST",
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: [buildRecord(lead, config.fieldMapping)] }),
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await res.json().catch(() => ({}))) as {
      data?: { status?: string; message?: string; details?: { id?: string } }[];
    };
    const row = data.data?.[0];
    if (!res.ok || row?.status !== "success") {
      return { attempted: true, ok: false, error: row?.message || `Zoho HTTP ${res.status}` };
    }
    return { attempted: true, ok: true, recordId: row.details?.id };
  } catch (err) {
    return { attempted: true, ok: false, error: err instanceof Error ? err.message : "Zoho push failed" };
  }
}
