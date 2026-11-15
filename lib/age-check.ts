import "server-only";
import { randomUUID } from "node:crypto";
import { createAgeRequest, getSession, type PresentationSession } from "./eudiplo";

/**
 * Age checks in progress. Kept in memory: fine for a single-process demo.
 * Only the outcome is kept, never the disclosed claims.
 */

export type CheckState = "pending" | "verified" | "failed" | "expired";

type Check = {
  sessionId: string;
  expiresAt: number;
  state: CheckState;
  message?: string;
};

const store: Map<string, Check> = ((globalThis as { __ageChecks?: Map<string, Check> }).__ageChecks ??=
  new Map());

const DEFAULT_LIFETIME_MS = 180_000;
const appUrl = (process.env.APP_URL ?? "http://localhost:3001").replace(/\/+$/, "");

export async function startCheck() {
  const checkId = randomUUID();
  // The wallet on the phone must be able to reach the redirect, so the
  // same-device redirect is only set when the site has a public HTTPS URL.
  const redirectUri = appUrl.startsWith("https://")
    ? `${appUrl}/age/return?check=${checkId}`
    : undefined;
  const request = await createAgeRequest(checkId, redirectUri);

  let expiresAt = Date.now() + DEFAULT_LIFETIME_MS;
  try {
    const session = await getSession(request.session);
    if (session.expiresAt) expiresAt = Date.parse(session.expiresAt);
  } catch {
    // Keep the default lifetime.
  }

  prune();
  store.set(checkId, { sessionId: request.session, expiresAt, state: "pending" });
  return {
    checkId,
    crossDeviceUri: request.crossDeviceUri,
    sameDeviceUri: redirectUri ? request.uri : undefined,
    expiresAt: new Date(expiresAt).toISOString(),
  };
}

/** Reads the current state of a check, asking EUDIPLO while it is pending. */
export async function readCheck(checkId: string, responseCode?: string) {
  const check = store.get(checkId);
  if (!check) return undefined;
  if (check.state !== "pending") return check;

  const session = await getSession(check.sessionId);
  const result = evaluate(session, check.expiresAt);

  // Same-device return: the response code proves this browser received the
  // wallet's redirect for this session (OID4VP §13.3).
  if (responseCode !== undefined && result.state === "verified" && session.responseCode !== responseCode) {
    return { ...check, state: "failed" as const, message: "This verification belongs to another browser." };
  }

  Object.assign(check, result);
  return check;
}

const messages: Record<string, string> = {
  claim_value_mismatch: "Your ID doesn't show that you're 18 or older.",
  access_denied: "You declined the request in your wallet.",
  trust_chain_not_trusted: "This ID isn't accepted here.",
  no_trust_chain_to_root: "This ID isn't accepted here.",
  certificate_expired: "This ID has expired.",
};

function evaluate(session: PresentationSession, expiresAt: number): Pick<Check, "state" | "message"> {
  if (session.status === "completed") {
    const over18 = session.credentials?.some((c) =>
      c.values.some((v) => (v.age_equal_or_over as Record<string, unknown> | undefined)?.["18"] === true),
    );
    return over18
      ? { state: "verified" }
      : { state: "failed", message: messages.claim_value_mismatch };
  }
  if (session.status === "failed") {
    const code = session.outcome?.error ?? session.failureCode ?? "";
    return { state: "failed", message: messages[code] ?? "We couldn't verify your age." };
  }
  if (session.status === "expired" || Date.now() > expiresAt + 5_000) {
    return { state: "expired", message: "The request expired. Please try again." };
  }
  return { state: "pending" };
}

function prune() {
  const cutoff = Date.now() - 60 * 60_000;
  for (const [id, check] of store) if (check.expiresAt < cutoff) store.delete(id);
}
