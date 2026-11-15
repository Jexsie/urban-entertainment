import Link from "next/link";
import { redirect } from "next/navigation";
import { currentPass } from "@/lib/age-pass";
import { event } from "@/lib/event";

export default async function Confirmed({ searchParams }: PageProps<"/tickets/confirmed">) {
  if (!(await currentPass())) redirect("/?age=required");
  const { order, quantity } = await searchParams;

  return (
    <main className="page narrow">
      <h1>You’re in! 🎟️</h1>
      <p>
        Order <strong>{typeof order === "string" ? order : "—"}</strong>: {typeof quantity === "string" ? quantity : 1}{" "}
        ticket(s) for {event.name}, {event.date}.
      </p>
      <p className="muted">Bring your wallet: we check age again at the door.</p>
      <Link href="/" className="cta">
        Back to the event
      </Link>
    </main>
  );
}
