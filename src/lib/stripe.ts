import "server-only";
import Stripe from "stripe";
import { site } from "@/content/site";

// Cliente Stripe por processo. Sem STRIPE_SECRET_KEY as inscrições ficam desligadas (ver ticketConfig).
const globalForStripe = globalThis as unknown as { __stripe?: Stripe };

export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY não configurada");
  if (!globalForStripe.__stripe) globalForStripe.__stripe = new Stripe(key);
  return globalForStripe.__stripe;
}

// Ingresso único: valor em centavos vem do .env (TICKET_PRICE_CENTS) pra mudar sem deploy.
export function ticketConfig() {
  const priceCents = Number(process.env.TICKET_PRICE_CENTS ?? 0);
  const enabled = Boolean(process.env.STRIPE_SECRET_KEY) && Number.isInteger(priceCents) && priceCents >= 50;
  return { enabled, priceCents, name: `Ingresso — ${site.name}` };
}

export const appUrl = () => (process.env.APP_URL ?? "http://localhost:3001").replace(/\/$/, "");
