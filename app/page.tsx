import Link from "next/link";
import { currentPass } from "@/lib/age-pass";
import { event } from "@/lib/event";
import AgeGate from "./age-gate";

const notices: Record<string, string> = {
  required: "Please verify your age first.",
  failed: "We couldn't verify your age.",
};

export default async function Home({ searchParams }: PageProps<"/">) {
  const pass = await currentPass();
  const age = (await searchParams).age;
  const notice = typeof age === "string" ? notices[age] : undefined;

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Urban Entertainment presents</p>
        <h1>{event.name}</h1>
        <p className="tagline">{event.tagline}</p>
        <dl className="facts">
          <div>
            <dt>Date</dt>
            <dd>{event.date}</dd>
          </div>
          <div>
            <dt>Doors</dt>
            <dd>{event.doors}</dd>
          </div>
          <div>
            <dt>Venue</dt>
            <dd>{event.venue}</dd>
          </div>
          <div>
            <dt>Line-up</dt>
            <dd>{event.lineup.join(" · ")}</dd>
          </div>
        </dl>
      </section>

      <section className="tickets">
        <h2>Tickets · €{event.priceEur}</h2>
        {notice && !pass && (
          <p className="bad" role="alert">
            {notice}
          </p>
        )}
        {pass ? (
          <div className="gate">
            <p className="ok">✓ Age verified (18+)</p>
            <Link className="cta" href="/tickets">
              Get tickets
            </Link>
          </div>
        ) : (
          <AgeGate />
        )}
      </section>
    </main>
  );
}
