import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/eyebrow";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/content/site";
import { formatBRL } from "@/lib/cpf";
import { sendRegistrationConfirmed } from "@/lib/mail";
import { getRegistrationBySession, markPaid } from "@/lib/registrations";
import { stripe } from "@/lib/stripe";

export const metadata: Metadata = { title: "Inscrição confirmada", robots: { index: false, follow: false } };

type Outcome = "paid" | "processing" | "open" | "unknown";

// Volta do Checkout. Confirma pelo Stripe (não confia só no webhook) e marca como paga se já estiver.
async function resolve(sessionId: string): Promise<{ outcome: Outcome; firstName: string; code: string; amount: string }> {
  const empty = { outcome: "unknown" as Outcome, firstName: "", code: "", amount: "" };
  if (!sessionId) return empty;
  try {
    const registration = await getRegistrationBySession(sessionId);
    if (!registration) return empty;
    const base = { firstName: registration.name.split(" ")[0], code: registration.inviteCode, amount: formatBRL(registration.amountCents) };
    if (registration.status === "paid") return { outcome: "paid", ...base };

    const session = await stripe().checkout.sessions.retrieve(sessionId);
    if (session.payment_status === "paid") {
      const pi = typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null);
      const paid = await markPaid(registration.id, pi, session.amount_total);
      if (paid) sendRegistrationConfirmed(paid.email, paid.name, formatBRL(paid.amountCents)).catch((err) => console.error("[mail]", err));
      return { outcome: "paid", ...base };
    }
    return { outcome: session.status === "complete" ? "processing" : "open", ...base };
  } catch (err) {
    console.error("[inscricao/confirmada]", err);
    return empty;
  }
}

const copy: Record<Outcome, { tag: string; title: string; text: string }> = {
  paid: {
    tag: "OK",
    title: "Inscrição confirmada.",
    text: "Enviamos o comprovante para o seu e-mail. Em breve mandamos a programação e as orientações pelo WhatsApp cadastrado.",
  },
  processing: {
    tag: "AGUARDANDO",
    title: "Pagamento em processamento.",
    text: "Recebemos seus dados. Assim que o pagamento for compensado (Pix ou boleto podem levar alguns minutos), você recebe a confirmação por e-mail.",
  },
  open: {
    tag: "PENDENTE",
    title: "O pagamento não foi concluído.",
    text: "Você pode voltar ao seu convite e tentar de novo. Se preferir outro meio de pagamento, fale com a organização.",
  },
  unknown: {
    tag: "?",
    title: "Não encontramos essa inscrição.",
    text: "Se você acabou de pagar, aguarde alguns instantes e confira seu e-mail. Em caso de dúvida, fale com a organização.",
  },
};

export default async function ConfirmadaPage({ searchParams }: PageProps<"/inscricao/confirmada">) {
  const { s } = await searchParams;
  const { outcome, firstName, code, amount } = await resolve(typeof s === "string" ? s : "");
  const c = copy[outcome];

  return (
    <>
      <section className="bg-obsidian text-paper">
        <SiteHeader />
        <div className="mx-auto flex max-w-page flex-col gap-12 px-4 pb-20 pt-16 sm:px-6 md:pb-30 md:pt-30">
          <div className="flex flex-col gap-6">
            <Eyebrow light>Inscrição</Eyebrow>
            <h1 className="font-display text-display">{firstName ? `${firstName}, ${c.title.charAt(0).toLowerCase()}${c.title.slice(1)}` : c.title}</h1>
          </div>
          <div className="flex flex-col gap-2 text-body-md">
            <p className="font-semibold">{site.date}</p>
            <p>
              {site.venue} · {site.city} · 3 dias
            </p>
          </div>
        </div>
      </section>

      <main className="flex flex-col gap-30 bg-paper py-30">
        <section className="mx-auto grid w-full max-w-page gap-15 px-4 sm:px-6 md:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col gap-6">
            <Eyebrow>Status</Eyebrow>
            <h2 className="font-display text-heading">{outcome === "paid" ? amount : c.tag}</h2>
          </div>
          <div className="flex flex-col gap-4 border border-ink p-6" role="status">
            <p className="font-mono text-body tracking-[0.03em]">{c.tag}</p>
            <h3 className="font-display text-heading-sm">{c.title}</h3>
            <p className="text-body-md">{c.text}</p>
            {outcome === "open" && code && (
              <Link href={`/inscricao/${code}`} className="mt-2 self-start border border-ink px-6 py-3 text-body transition-colors hover:bg-ink hover:text-paper">
                Voltar ao convite
              </Link>
            )}
            <p className="text-body">
              <a href={site.whatsappUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                WhatsApp {site.whatsapp}
              </a>{" "}
              ·{" "}
              <a href={`mailto:${site.contactEmail}`} className="underline underline-offset-4">
                {site.contactEmail}
              </a>
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
