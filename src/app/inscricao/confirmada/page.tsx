import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/button";
import { Eyebrow } from "@/components/eyebrow";
import { EventMeta, PageHero, illustrations } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { site } from "@/content/site";
import { formatBRL } from "@/lib/cpf";
import { sendPaymentReceived, ticketNumber } from "@/lib/mail";
import { firstName } from "@/lib/names";
import { formPath, situation } from "@/lib/registration-state";
import { getRegistration, getRegistrationBySession, markPaid, type Registration } from "@/lib/registrations";
import { stripe } from "@/lib/stripe";

export const metadata: Metadata = { title: "Inscrição confirmada", robots: { index: false, follow: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Outcome = "paid" | "review" | "rejected" | "processing" | "open" | "unknown";
type Resolved = { outcome: Outcome; firstName: string; back: string; amount: string; ticket: string };

const empty: Resolved = { outcome: "unknown", firstName: "", back: "", amount: "", ticket: "" };

const base = (r: Registration) => ({ firstName: firstName(r.name), back: formPath(r), amount: r.provider === "courtesy" ? "Cortesia" : formatBRL(r.amountCents), ticket: ticketNumber(r.id) });

// Paga: confirmada, ou (cadastro aberto) em análise/reprovada
function paidOutcome(r: Registration): Outcome {
  const s = situation({ ...r, status: "paid" });
  return s === "awaiting_approval" ? "review" : s === "rejected" ? "rejected" : "paid";
}

// Volta do Checkout. Confirma pelo Stripe (não confia só no webhook) e marca como paga se já estiver.
async function resolveStripe(sessionId: string): Promise<Resolved> {
  try {
    const registration = await getRegistrationBySession(sessionId);
    if (!registration) return empty;
    if (registration.status === "paid") return { outcome: paidOutcome(registration), ...base(registration) };

    const session = await stripe().checkout.sessions.retrieve(sessionId);
    if (session.payment_status === "paid") {
      const pi = typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null);
      const paid = await markPaid(registration.id, pi, session.amount_total);
      if (paid) sendPaymentReceived(paid).catch((err) => console.error("[mail]", err));
      return { outcome: paidOutcome(registration), ...base(registration) };
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
  return { outcome: paidOutcome(registration), ...base(registration) };
}

// title vai no hero (com o primeiro nome); box é o complemento na caixa de status — nunca o mesmo texto
const copy: Record<Outcome, { tag: string; title: string; box: string; text: string }> = {
  paid: {
    tag: "OK",
    title: "Inscrição confirmada.",
    box: "Seu ingresso está no e-mail.",
    text: "Enviamos o comprovante e o ingresso para o endereço cadastrado. Em breve mandamos a programação e as orientações por e-mail.",
  },
  review: {
    tag: "Em análise",
    title: "Pagamento recebido.",
    box: "Sua inscrição está em análise.",
    text: "As inscrições por esta página passam pela aprovação da organização. Assim que a sua for analisada, você recebe um e-mail: com o ingresso, se aprovada; se não for, o valor pago é devolvido integralmente.",
  },
  rejected: {
    tag: "Não aprovada",
    title: "Sua inscrição não foi aprovada.",
    box: "O valor pago será devolvido.",
    text: "A organização analisou sua inscrição e, desta vez, ela não foi aprovada. O reembolso integral é feito pelo mesmo meio de pagamento.",
  },
  processing: {
    tag: "Aguardando",
    title: "Pagamento em processamento.",
    box: "A confirmação chega por e-mail.",
    text: "Recebemos seus dados. Assim que o pagamento for compensado (Pix ou boleto podem levar alguns minutos), você recebe o ingresso por e-mail.",
  },
  open: {
    tag: "Pendente",
    title: "O pagamento não foi concluído.",
    box: "Tente de novo pelo seu convite.",
    text: "Volte ao convite, confira os dados e refaça o pagamento. Se preferir outro meio, fale com a organização.",
  },
  unknown: {
    tag: "Não encontrada",
    title: "Não encontramos essa inscrição.",
    box: "Confira o seu e-mail.",
    text: "Se você acabou de pagar, aguarde alguns instantes: a confirmação chega por e-mail. Em caso de dúvida, fale com a organização.",
  },
};

export default async function ConfirmadaPage({ searchParams }: PageProps<"/inscricao/confirmada">) {
  const { s, r } = await searchParams;
  const { outcome, firstName, back, amount, ticket } =
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
            <h3 className="font-display text-heading-sm">{outcome === "paid" && amount === "Cortesia" ? "Seu ingresso de cortesia está no e-mail." : c.box}</h3>
            <p className="text-body-md">{c.text}</p>
            {outcome === "open" && back && (
              <ButtonLink href={back} variant="primary" size="md" className="mt-2 self-start">
                {back === "/inscricao/aberta" ? "Voltar à inscrição" : "Voltar ao convite"}
              </ButtonLink>
            )}
            <p className="text-body">
              Dúvidas:{" "}
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
