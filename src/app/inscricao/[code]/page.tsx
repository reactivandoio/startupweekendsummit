import type { Metadata } from "next";
import { Eyebrow } from "@/components/eyebrow";
import { EventMeta, PageHero } from "@/components/page-hero";
import { RegistrationForm } from "@/components/registration-form";
import { SiteFooter } from "@/components/site-footer";
import { illustrations } from "@/content/illustrations";
import { site } from "@/content/site";
import { pageQuote } from "@/lib/checkout";
import { formatBRL } from "@/lib/cpf";
import { getInviteByCode, inviteAvailable } from "@/lib/invites";
import { firstName } from "@/lib/names";
import { cardPaymentEnabled } from "@/lib/settings";
import { currentOffer, minChargeCents } from "@/lib/tickets";

// Página de convite: não indexa e não entra no sitemap. Aceita ?cupom=CODIGO (o maior desconto vale: convite ou cupom).
export const metadata: Metadata = { title: "Inscrição", robots: { index: false, follow: false } };

const included = ["Três dias de programação", "Welcome dinner de sexta", "Alimentação durante o evento", "Kit do participante"];

export default async function InscricaoPage({ params, searchParams }: PageProps<"/inscricao/[code]">) {
  const { code } = await params;
  const { cancelado, cupom } = await searchParams;
  const invite = await getInviteByCode(code);
  const [ticket, cardOn] = await Promise.all([currentOffer(), cardPaymentEnabled()]);
  const card = ticket.enabled && ticket.provider === "opapingou" && cardOn;
  const payVia = card ? "Pagamento via Pix ou cartão de crédito" : "Pagamento via Pix";
  const available = invite ? inviteAvailable(invite) : false;
  // Preço deste convite: lote à venda − o maior entre o desconto do convite e o do cupom do link (gratuita quando zera)
  const priced = ticket.enabled && invite ? await pageQuote({ ...ticket, minChargeCents: minChargeCents(ticket.provider) }, invite.discount, cupom) : null;
  const price = priced?.quote ?? null;

  return (
    <>
      {/* Hero em papel: chegada ao evento na Estação Ferroviária */}
      <PageHero
        eyebrow="Inscrição por convite"
        title={invite?.name ? `Chega mais, ${firstName(invite.name)}. Sua vaga no Summit está reservada.` : "Chega mais. Sua vaga no Summit está reservada."}
        lead={
          price?.courtesy
            ? "Confirme seus dados: seu ingresso é gratuito. A inscrição é individual, vale para os três dias e passa pela aprovação da organização."
            : "Confirme seus dados e faça o pagamento. A inscrição é individual, vale para os três dias e passa pela aprovação da organização."
        }
        illustration={illustrations.estacao}
      >
        <EventMeta />
      </PageHero>

      <main className="flex flex-col gap-30 bg-paper py-30">
        <section className="mx-auto grid w-full max-w-page gap-15 px-4 sm:px-6 md:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col gap-6">
            <Eyebrow>Ingresso</Eyebrow>
            {price && price.discountCents > 0 && (
              <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-body-md">
                <s className="text-ink/60" aria-label={`Preço original ${formatBRL(price.listCents)}`}>
                  {formatBRL(price.listCents)}
                </s>
                <span className="border-2 border-grass bg-grass-wash px-2 py-0.5 text-body font-semibold text-grass-deep">
                  {price.courtesy ? price.note : `− ${formatBRL(price.discountCents)} · ${price.note}`}
                </span>
              </p>
            )}
            <h2 className="font-display text-heading">
              {price ? (price.courtesy ? "Gratuita" : formatBRL(price.finalCents)) : ticket.enabled ? formatBRL(ticket.priceCents) : ticket.reason === "sold_out" ? "Esgotado" : "Em breve"}
            </h2>
            {ticket.enabled && ticket.lotName && <p className="text-body-md font-semibold">{ticket.lotName}</p>}
            <p className="max-w-[40ch] text-body-md">
              {price?.courtesy
                ? "Ingresso gratuito: sem pagamento. Preencha seus dados; o ingresso chega por e-mail depois da aprovação da organização."
                : price && price.discountCents > 0
                  ? `Valor com desconto. ${ticket.enabled && ticket.provider === "opapingou" ? `${payVia}; o ingresso chega por e-mail depois da aprovação da organização.` : "Pagamento pelo Stripe; o ingresso chega por e-mail depois da aprovação da organização."}`
                  : ticket.enabled && ticket.provider === "opapingou"
                    ? `Valor por participante. ${payVia}; o ingresso chega por e-mail depois da aprovação da organização.`
                    : "Valor único por participante. Pagamento pelo Stripe; o ingresso chega por e-mail depois da aprovação da organização."}
            </p>
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
            {!invite || !available ? (
              <div className="flex flex-col gap-4 border-2 border-ink bg-marigold-wash p-6 shadow-hard" role="status">
                <h3 className="font-display text-heading-sm">
                  {invite ? "Este convite já foi utilizado." : "Convite não encontrado."}
                </h3>
                <p className="text-body-md">
                  {invite
                    ? "Se você acredita que isso é um engano, fale com a organização por e-mail."
                    : "Confira se o link chegou completo ou peça um novo à organização."}
                </p>
              </div>
            ) : !ticket.enabled ? (
              <div className="flex flex-col gap-4 border-2 border-ink bg-marigold-wash p-6 shadow-hard" role="status">
                <h3 className="font-display text-heading-sm">
                  {ticket.reason === "sold_out" ? "Os ingressos deste lote acabaram." : "As inscrições ainda não abriram."}
                </h3>
                <p className="text-body-md">
                  {ticket.reason === "sold_out"
                    ? "Guarde este link: ele volta a funcionar se um novo lote for aberto. Dúvidas, fale com a organização."
                    : "Guarde este link: ele continua válido quando o pagamento for liberado."}
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
                    code={invite.code}
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
