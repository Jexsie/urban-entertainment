import QRCode from "qrcode";
import { cookies } from "next/headers";
import { readCheck, startCheck } from "@/lib/age-check";
import { CHECK_COOKIE, issuePass, PASS_COOKIE, secureCookies } from "@/lib/age-pass";

/** Starts an age check. The browser gets a QR code and an opaque cookie, never EUDIPLO's session ID. */
export async function POST() {
  try {
    const check = await startCheck();
    (await cookies()).set(CHECK_COOKIE, check.checkId, {
      httpOnly: true,
      sameSite: "lax",
      secure: secureCookies,
      path: "/",
      maxAge: 15 * 60,
    });
    const qr = await QRCode.toDataURL(check.crossDeviceUri, { width: 320, margin: 2, errorCorrectionLevel: "M" });
    return Response.json({ qr, sameDeviceUri: check.sameDeviceUri, expiresAt: check.expiresAt });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "The age check is unavailable right now." }, { status: 502 });
  }
}

/** Reports the state of this browser's check and hands out the age pass on success. */
export async function GET() {
  const cookieStore = await cookies();
  const checkId = cookieStore.get(CHECK_COOKIE)?.value;
  if (!checkId) return Response.json({ state: "none" });

  try {
    const check = await readCheck(checkId);
    if (!check) return Response.json({ state: "none" });
    if (check.state === "verified") {
      const pass = issuePass(checkId);
      cookieStore.set(PASS_COOKIE, pass.value, pass.options);
      cookieStore.delete(CHECK_COOKIE);
    }
    return Response.json({ state: check.state, message: check.message });
  } catch (error) {
    console.error(error);
    return Response.json({ state: "pending" });
  }
}
