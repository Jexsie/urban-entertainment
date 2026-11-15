import "server-only";

/**
 * Minimal EUDIPLO client for Urban Entertainment's age gate. It uses the
 * least-privilege gateway client (only `presentation:request`, limited to the
 * age-over-18 configuration). Server only: neither the secret nor EUDIPLO's
 * session IDs ever reach the browser.
 */

// Read at request time, so the app builds without secrets.
const baseUrl = () => required("EUDIPLO_URL").replace(/\/+$/, "");
const presentationConfigId = () => process.env.PRESENTATION_CONFIG_ID ?? "age-over-18";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

let cachedToken: { value: string; expiresAt: number } | undefined;

async function token(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;
  const res = await fetch(`${baseUrl()}/api/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: required("EUDIPLO_CLIENT_ID"),
      client_secret: required("EUDIPLO_CLIENT_SECRET"),
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`EUDIPLO token request failed (${res.status})`);
  const body = (await res.json()) as { access_token: string; expires_in?: number };
  cachedToken = { value: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 300) * 1000 };
  return cachedToken.value;
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`${init.method ?? "GET"} ${path} failed (${res.status}): ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export type PresentationRequest = { uri: string; crossDeviceUri: string; session: string };

/**
 * Creates an age-over-18 request. `reference` is our own check ID (never
 * personal data). `redirectUri` is only used for the same-device flow.
 */
export function createAgeRequest(reference: string, redirectUri?: string) {
  return api<PresentationRequest>("/api/verifier/offer", {
    method: "POST",
    body: JSON.stringify({
      response_type: "uri",
      requestId: presentationConfigId(),
      reference,
      ...(redirectUri ? { redirectUri } : {}),
    }),
  });
}

export type PresentationSession = {
  id: string;
  status: "active" | "fetched" | "completed" | "failed" | "expired";
  expiresAt?: string;
  responseCode?: string;
  credentials?: { id: string; values: Record<string, unknown>[] }[];
  outcome?: { result?: string; error?: string; message?: string };
  failureCode?: string;
};

export function getSession(sessionId: string) {
  return api<PresentationSession>(`/api/session/${encodeURIComponent(sessionId)}`);
}
