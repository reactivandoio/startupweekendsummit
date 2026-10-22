import type { Metadata } from "next";
import { Eyebrow } from "@/components/eyebrow";
import { EventMeta, PageHero, illustrations } from "@/components/page-hero";
import { RegistrationForm } from "@/components/registration-form";
import { SiteFooter } from "@/components/site-footer";
import { site } from "@/content/site";
import { formatBRL } from "@/lib/cpf";
import { describeDiscount } from "@/lib/discounts";
import { getInviteByCode, inviteAvailable } from "@/lib/invites";
import { firstName } from "@/lib/names";
import { currentOffer, offerPrice } from "@/lib/tickets";

// Página de convite: não indexa e não entra no sitemap
export const metadata: Metadata = { title: "Inscrição", robots: { index: false, follow: false } };

const included = ["Três dias de programação", "Welcome dinner de sexta", "Alimentação durante o evento", "Kit do participante"];

export default async function InscricaoPage({ params, searchParams }: PageProps<"/inscricao/[code]">) {
  const { code } = await params;
  const { cancelado } = await searchParams;
  const invite = await getInviteByCode(code);
  const ticket = await currentOffer();
  const available = invite ? inviteAvailable(invite) : false;
  // Preço deste convite: lote à venda − desconto (cortesia quando zera)
  const price = ticket.enabled && invite ? offerPrice(ticket, invite.discount) : null;

  return (
    <>
      {/* Hero em papel: chegada ao evento na Estação Ferroviária */}
      <PageHero
        eyebrow="Inscrição por convite"
        title={invite?.name ? `Chega mais, ${firstName(invite.name)}. Sua vaga no Summit está reservada.` : "Chega mais. Sua vaga no Summit está reservada."}
        lead={
          price?.courtesy
            ? "Confirme seus dados: seu ingresso é cortesia. A inscrição é individual e vale para os três dias."
            : "Confirme seus dados e faça o pagamento. A inscrição é individual e vale para os três dias."
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
                  {invite && invite.discount.kind !== "courtesy" ? `− ${formatBRL(price.discountCents)} · ${describeDiscount(invite.discount)}` : "Cortesia"}
                </span>
              </p>
            )}
            <h2 className="font-display text-heading">
              {price ? (price.courtesy ? "Cortesia" : formatBRL(price.finalCents)) : ticket.enabled ? formatBRL(ticket.priceCents) : ticket.reason === "sold_out" ? "Esgotado" : "Em breve"}
            </h2>
            {ticket.enabled && ticket.lotName && <p className="text-body-md font-semibold">{ticket.lotName}</p>}
            <p className="max-w-[40ch] text-body-md">
              {price?.courtesy
                ? "Ingresso cortesia da organização: sem pagamento. Preencha seus dados e a inscrição é confirmada na hora, com o ingresso por e-mail."
                : price && price.discountCents > 0
                  ? `Valor com o desconto do seu convite. ${ticket.enabled && ticket.provider === "opapingou" ? "Pagamento via Pix, com confirmação na hora e ingresso por e-mail." : "Pagamento pelo Stripe, com confirmação por e-mail."}`
                  : ticket.enabled && ticket.provider === "opapingou"
                ? "Valor por participante. Pagamento via Pix, com confirmação na hora e ingresso por e-mail."
                : "Valor único por participante. Pagamento pelo Stripe, com confirmação por e-mail."}
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
                    ? `Se você acredita que isso é um engano, fale com a organização pelo e-mail ${site.contactEmail}.`
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
                <RegistrationForm
                  code={invite.code}
                  priceLabel={price ? formatBRL(price.finalCents) : formatBRL(ticket.priceCents)}
                  method={price?.courtesy ? "courtesy" : ticket.provider === "opapingou" ? "pix" : "checkout"}
                />
              </>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
