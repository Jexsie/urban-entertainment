import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readCheck } from "@/lib/age-check";
import { CHECK_COOKIE, issuePass, PASS_COOKIE } from "@/lib/age-pass";

/**
 * Same-device return: the wallet sends the phone's browser here after the
 * presentation, with `response_code` on success or `error` otherwise.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const checkId = url.searchParams.get("check");
  const responseCode = url.searchParams.get("response_code");
  const cookieStore = await cookies();

  // The check must have been started by this browser.
  if (!checkId || cookieStore.get(CHECK_COOKIE)?.value !== checkId || url.searchParams.has("error") || !responseCode) {
    redirect("/?age=failed");
  }

  const check = await readCheck(checkId, responseCode).catch(() => undefined);
  if (check?.state !== "verified") redirect("/?age=failed");

  const pass = issuePass(checkId);
  cookieStore.set(PASS_COOKIE, pass.value, pass.options);
  cookieStore.delete(CHECK_COOKIE);
  redirect("/tickets");
}
