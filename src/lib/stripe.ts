import "server-only";
import Stripe from "stripe";

// Cliente Stripe por processo. Só é usado sem a chave do Opa Pingou no painel (ver currentOffer em tickets.ts).
const globalForStripe = globalThis as unknown as { __stripe?: Stripe };

export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY não configurada");
  if (!globalForStripe.__stripe) globalForStripe.__stripe = new Stripe(key);
  return globalForStripe.__stripe;
}

export const appUrl = () => (process.env.APP_URL ?? "http://localhost:3001").replace(/\/$/, "");
