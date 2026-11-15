import Link from "next/link";
import { redirect } from "next/navigation";
import { currentPass } from "@/lib/age-pass";
import { event } from "@/lib/event";
import { buyTickets } from "./actions";

/** Checkout. Rendered on the server only for browsers with a valid age pass. */
export default async function Tickets({ searchParams }: PageProps<"/tickets">) {
  if (!(await currentPass())) redirect("/?age=required");
  const { error } = await searchParams;

  return (
    <main className="page narrow">
      <Link href="/" className="muted">
        ← {event.name}
      </Link>
      <h1>Checkout</h1>
      <p className="ok">✓ Age verified (18+). We did not receive your name or birth date.</p>
      <form action={buyTickets} className="checkout">
        <label>
          Tickets (max {event.maxPerOrder})
          <select name="quantity" defaultValue="1">
            {Array.from({ length: event.maxPerOrder }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} × €{event.priceEur} = €{n * event.priceEur}
              </option>
            ))}
          </select>
        </label>
        {error && <p className="bad">Please choose between 1 and {event.maxPerOrder} tickets.</p>}
        <button type="submit" className="cta">
          Buy tickets
        </button>
        <p className="muted">Demo shop: no payment is taken.</p>
      </form>
    </main>
  );
}
