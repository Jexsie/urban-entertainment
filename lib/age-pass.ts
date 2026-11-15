import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * The age pass: a short-lived token signed by this site, stored in an
 * HttpOnly cookie after a successful check. The ticket page and the purchase
 * check it on the server, so the checkout cannot be reached by URL alone.
 */

export const PASS_COOKIE = "ue_age_pass";
export const CHECK_COOKIE = "ue_age_check";
const PASS_LIFETIME_SECONDS = 30 * 60;

export const secureCookies = (process.env.APP_URL ?? "").startsWith("https://");

type Pass = { over18: true; check: string; exp: number };

function sign(data: string) {
  // Read at request time, so the app builds without secrets.
  const secret = process.env.APP_SECRET;
  if (!secret || secret.length < 32) throw new Error("APP_SECRET must be set (at least 32 characters)");
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export function issuePass(checkId: string) {
  const payload: Pass = { over18: true, check: checkId, exp: Math.floor(Date.now() / 1000) + PASS_LIFETIME_SECONDS };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return {
    value: `${data}.${sign(data)}`,
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: secureCookies,
      path: "/",
      maxAge: PASS_LIFETIME_SECONDS,
    },
  };
}

export function verifyPass(token: string | undefined): Pass | undefined {
  if (!token) return undefined;
  const [data, signature] = token.split(".");
  if (!data || !signature) return undefined;
  const expected = Buffer.from(sign(data));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return undefined;
  try {
    const pass = JSON.parse(Buffer.from(data, "base64url").toString()) as Pass;
    return pass.over18 === true && pass.exp > Date.now() / 1000 ? pass : undefined;
  } catch {
    return undefined;
  }
}

/** For Server Components and Server Functions. */
export async function currentPass() {
  return verifyPass((await cookies()).get(PASS_COOKIE)?.value);
}
