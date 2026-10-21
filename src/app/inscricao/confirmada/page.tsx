import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/button";
import { Eyebrow } from "@/components/eyebrow";
import { EventMeta, PageHero, illustrations } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { site } from "@/content/site";
import { formatBRL } from "@/lib/cpf";
import { sendRegistrationConfirmed, ticketNumber } from "@/lib/mail";
import { getRegistration, getRegistrationBySession, markPaid, type Registration } from "@/lib/registrations";
import { stripe } from "@/lib/stripe";

export const metadata: Metadata = { title: "Inscrição confirmada", robots: { index: false, follow: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Outcome = "paid" | "processing" | "open" | "unknown";
type Resolved = { outcome: Outcome; firstName: string; code: string; amount: string; ticket: string };

const empty: Resolved = { outcome: "unknown", firstName: "", code: "", amount: "", ticket: "" };

const base = (r: Registration) => ({ firstName: r.name.split(" ")[0], code: r.inviteCode, amount: r.provider === "courtesy" ? "Cortesia" : formatBRL(r.amountCents), ticket: ticketNumber(r.id) });

// Volta do Checkout. Confirma pelo Stripe (não confia só no webhook) e marca como paga se já estiver.
async function resolveStripe(sessionId: string): Promise<Resolved> {
  try {
    const registration = await getRegistrationBySession(sessionId);
    if (!registration) return empty;
    if (registration.status === "paid") return { outcome: "paid", ...base(registration) };

    const session = await stripe().checkout.sessions.retrieve(sessionId);
    if (session.payment_status === "paid") {
      const pi = typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null);
      const paid = await markPaid(registration.id, pi, session.amount_total);
      if (paid) sendRegistrationConfirmed(paid).catch((err) => console.error("[mail]", err));
      return { outcome: "paid", ...base(registration) };
    }
    return { outcome: session.status === "complete" ? "processing" : "open", ...base(registration) };
  } catch (err) {
    console.error("[inscricao/confirmada]", err);
    return empty;
  }
}

// Pix do Opa Pingou: a página do QR manda pra cá quando a cobrança é paga; se ainda não foi, volta pro QR.
// Cortesia chega aqui direto do formulário, já confirmada.
async function resolveOpa(id: string): Promise<Resolved> {
  const registration = await getRegistration(id).catch(() => null);
  if (!registration || (registration.provider !== "opapingou" && registration.provider !== "courtesy")) return empty;
  if (registration.status !== "paid") redirect(`/inscricao/pix/${registration.id}`);
  return { outcome: "paid", ...base(registration) };
}

const copy: Record<Outcome, { tag: string; title: string; text: string }> = {
  paid: {
    tag: "OK",
    title: "Inscrição confirmada.",
    text: "Enviamos o comprovante e o ingresso para o seu e-mail. Em breve mandamos a programação e as orientações pelo WhatsApp cadastrado.",
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
  const { s, r } = await searchParams;
  const { outcome, firstName, code, amount, ticket } =
    typeof r === "string" && UUID.test(r) ? await resolveOpa(r) : typeof s === "string" && s ? await resolveStripe(s) : empty;
  const c = copy[outcome];

  return (
    <>
      <PageHero
        eyebrow="Inscrição"
        title={firstName ? `${firstName}, ${c.title.charAt(0).toLowerCase()}${c.title.slice(1)}` : c.title}
        illustration={illustrations.estacao}
      >
        <EventMeta />
      </PageHero>

      <main className="flex flex-col gap-30 bg-paper py-30">
        <section className="mx-auto grid w-full max-w-page gap-15 px-4 sm:px-6 md:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col gap-6">
            <Eyebrow>Status</Eyebrow>
            <h2 className="font-display text-heading">{outcome === "paid" ? amount : c.tag}</h2>
          </div>
          <div className={`flex flex-col gap-4 border-2 border-ink p-6 shadow-hard ${outcome === "paid" ? "bg-grass-wash" : "bg-marigold-wash"}`} role="status">
            {outcome === "paid" && ticket && <p className="text-body font-semibold">Ingresso nº {ticket}</p>}
            <h3 className="font-display text-heading-sm">{c.title}</h3>
            <p className="text-body-md">{c.text}</p>
            {outcome === "open" && code && (
              <ButtonLink href={`/inscricao/${code}`} variant="primary" size="md" className="mt-2 self-start">
                Voltar ao convite
              </ButtonLink>
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
