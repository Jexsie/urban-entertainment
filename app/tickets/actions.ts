"use server";

import { randomInt } from "node:crypto";
import { redirect } from "next/navigation";
import { currentPass } from "@/lib/age-pass";
import { event } from "@/lib/event";

/** Demo purchase. Checks the age pass again on the server before "selling". */
export async function buyTickets(formData: FormData) {
  if (!(await currentPass())) redirect("/?age=required");

  const quantity = Number(formData.get("quantity"));
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > event.maxPerOrder) {
    redirect("/tickets?error=quantity");
  }
  const order = `UE-${randomInt(100000, 999999)}`;
  redirect(`/tickets/confirmed?order=${order}&quantity=${quantity}`);
}
