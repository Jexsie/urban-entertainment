"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Started = { qr: string; sameDeviceUri?: string; expiresAt: string };
type State =
  | "idle"
  | "starting"
  | "pending"
  | "verified"
  | "failed"
  | "expired";

export default function AgeGate() {
  const router = useRouter();
  const [state, setState] = useState<State>("idle");
  const [started, setStarted] = useState<Started>();
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    if (state !== "pending") return;
    let stopped = false;
    const poll = async () => {
      if (stopped) return;
      try {
        const res = await fetch("/api/age-check", { cache: "no-store" });
        const body = (await res.json()) as {
          state: State | "none";
          message?: string;
        };
        if (body.state === "verified") {
          setState("verified");
          router.push("/tickets");
          return;
        }
        if (body.state === "failed" || body.state === "expired") {
          setState(body.state);
          setMessage(body.message);
          return;
        }
      } catch {
        // Try again on the next tick.
      }
      setTimeout(poll, 2000);
    };
    void poll();
    return () => {
      stopped = true;
    };
  }, [state, router]);

  async function start() {
    setState("starting");
    setMessage(undefined);
    try {
      const res = await fetch("/api/age-check", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setStarted(body as Started);
      setState("pending");
    } catch (error) {
      setState("failed");
      setMessage(
        error instanceof Error && error.message
          ? error.message
          : "The age check is unavailable right now.",
      );
    }
  }

  if (state === "idle" || state === "starting") {
    return (
      <div className="gate">
        <p>
          Tickets are only sold to guests aged 18 or over. Prove it with your
          EUDI wallet.
        </p>
        <button className="cta" onClick={start} disabled={state === "starting"}>
          {state === "starting" ? "Preparing…" : "Verify you’re 18+"}
        </button>
      </div>
    );
  }

  if (state === "pending" && started) {
    return (
      <div className="gate" aria-live="polite">
        <p>Scan with your wallet and share your age:</p>
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL from the server */}
        <img className="qr" src={started.qr} alt="QR code for the age check" />
        {started.sameDeviceUri && (
          <a className="cta secondary" href={started.sameDeviceUri}>
            Wallet on this phone? Open it
          </a>
        )}
        <p className="muted">
          Waiting for your wallet… expires at{" "}
          {new Date(started.expiresAt).toLocaleTimeString()}
        </p>
      </div>
    );
  }

  if (state === "verified") {
    return <p className="ok">✓ 18+ confirmed. Taking you to the tickets…</p>;
  }

  return (
    <div className="gate" role="alert">
      <p className="bad">✕ {message ?? "We couldn't verify your age."}</p>
      <button className="cta" onClick={start}>
        Try again
      </button>
    </div>
  );
}
