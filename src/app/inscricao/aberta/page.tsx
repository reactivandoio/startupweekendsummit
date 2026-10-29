import type { Metadata } from "next";
import { Eyebrow } from "@/components/eyebrow";
import { EventMeta, PageHero } from "@/components/page-hero";
import { illustrations } from "@/content/illustrations";
import { RegistrationForm } from "@/components/registration-form";
import { SiteFooter } from "@/components/site-footer";
import { site } from "@/content/site";
import { pageQuote } from "@/lib/checkout";
import { formatBRL } from "@/lib/cpf";
import { NO_DISCOUNT } from "@/lib/discounts";
import { cardPaymentEnabled, openRegistrationEnabled } from "@/lib/settings";
import { currentOffer, minChargeCents } from "@/lib/tickets";

// Inscrição aberta, sem convite: o link é enviado pela organização. Não indexa, fica fora do sitemap
// e /inscricao está no Disallow do robots.txt; nenhuma página do site aponta pra cá.
// ?cupom=CODIGO: link de divulgação de uma track, com o cupom já aplicado (e a origem "link de cupom").
export const metadata: Metadata = { title: "Inscrição", robots: { index: false, follow: false } };

const included = ["Três dias de programação", "Welcome dinner de sexta", "Alimentação durante o evento", "Kit do participante"];

const steps = [
  "Preencha seus dados e faça o pagamento (se tiver cupom, aplique antes).",
  "A organização analisa sua inscrição.",
  "Aprovada, o ingresso chega no seu e-mail. Se não for aprovada, devolvemos o valor pago.",
];

export default async function InscricaoAbertaPage({ searchParams }: PageProps<"/inscricao/aberta">) {
  const { cancelado, cupom } = await searchParams;
  const [enabled, ticket, cardOn] = await Promise.all([openRegistrationEnabled(), currentOffer(), cardPaymentEnabled()]);
  const card = ticket.enabled && ticket.provider === "opapingou" && cardOn;
  const soldOut = !ticket.enabled && ticket.reason === "sold_out";
  const priced = ticket.enabled ? await pageQuote({ ...ticket, minChargeCents: minChargeCents(ticket.provider) }, NO_DISCOUNT, cupom) : null;
  const quote = priced?.quote;

  return (
    <>
      <PageHero
        eyebrow="Inscrição"
        title="Chega mais. Garanta sua inscrição no Summit."
        lead="Preencha seus dados e faça o pagamento. A inscrição é individual, vale para os três dias e passa pela aprovação da organização."
        illustration={illustrations.estacao}
      >
        <EventMeta />
      </PageHero>

      <main className="flex flex-col gap-30 bg-paper py-30">
        <section className="mx-auto grid w-full max-w-page gap-15 px-4 sm:px-6 md:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col gap-6">
            <Eyebrow>Ingresso</Eyebrow>
            {quote && quote.discountCents > 0 && (
              <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-body-md">
                <s className="text-ink/60" aria-label={`Preço original ${formatBRL(quote.listCents)}`}>
                  {formatBRL(quote.listCents)}
                </s>
                <span className="border-2 border-grass bg-grass-wash px-2 py-0.5 text-body font-semibold text-grass-deep">{quote.note}</span>
              </p>
            )}
            <h2 className="font-display text-heading">
              {quote ? (quote.courtesy ? "Gratuita" : formatBRL(quote.finalCents)) : soldOut ? "Esgotado" : "Em breve"}
            </h2>
            {ticket.enabled && ticket.lotName && <p className="text-body-md font-semibold">{ticket.lotName}</p>}
            <p className="max-w-[40ch] text-body-md">
              {quote?.courtesy
                ? "Inscrição gratuita com o seu cupom: sem pagamento. O ingresso chega por e-mail depois da aprovação."
                : ticket.enabled && ticket.provider === "opapingou"
                ? `Valor por participante. Pagamento via Pix${card ? " ou cartão de crédito" : ""}; o ingresso chega por e-mail depois da aprovação.`
                : "Valor único por participante. Pagamento pelo Stripe; o ingresso chega por e-mail depois da aprovação."}
            </p>
            <ol className="border-t border-ink">
              {steps.map((item, i) => (
                <li key={item} className="flex items-baseline gap-4 border-b border-ash py-4 text-body-md">
                  <span aria-hidden="true" className="font-mono text-caption font-semibold text-grass-deep">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
            <ul className="border-t border-ink">
              {included.map((item) => (
                <li key={item} className="flex items-baseline gap-4 border-b border-ash py-4 text-body-md">
                  <span aria-hidden="true" className="text-grass">
                    ▲
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-body">
              Dúvidas:{" "}
              <a href={`mailto:${site.contactEmail}`} className="underline underline-offset-4">
                {site.contactEmail}
              </a>
            </p>
          </div>

          <div className="flex flex-col gap-6">
            {!enabled || !ticket.enabled ? (
              <div className="flex flex-col gap-4 border-2 border-ink bg-marigold-wash p-6 shadow-hard" role="status">
                <h3 className="font-display text-heading-sm">
                  {!enabled ? "As inscrições por esta página estão fechadas." : soldOut ?"Os ingressos deste lote acabaram." : "As inscrições ainda não abriram."}
                </h3>
                <p className="text-body-md">
                  {!enabled
                    ? "Se você recebeu este link da organização, fale com ela para saber quando reabre."
                    : soldOut
                      ? "Guarde este link: ele volta a funcionar se um novo lote for aberto."
                      : "Guarde este link: ele funciona assim que o pagamento for liberado."}
                </p>
              </div>
            ) : (
              <>
                {cancelado === "1" && (
                  <p className="border-2 border-ink bg-marigold-wash p-4 text-body" role="status">
                    — O pagamento não foi concluído. Preencha os dados de novo para tentar outra vez.
                  </p>
                )}
                {priced && (
                  <RegistrationForm
                    code={null}
                    quote={priced.quote}
                    linkCoupon={priced.linkCoupon}
                    linkCouponError={priced.linkCouponError}
                    method={ticket.provider === "opapingou" ? "pix" : "checkout"}
                    card={card}
                  />
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
