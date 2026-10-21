import type { Metadata } from "next";
import { Eyebrow } from "@/components/eyebrow";
import { RegistrationForm } from "@/components/registration-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/content/site";
import { formatBRL } from "@/lib/cpf";
import { describeDiscount } from "@/lib/discounts";
import { getInviteByCode, inviteAvailable } from "@/lib/invites";
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
      <section className="bg-obsidian text-paper">
        <SiteHeader />
        <div className="mx-auto flex max-w-page flex-col gap-12 px-4 pb-20 pt-16 sm:px-6 md:pb-30 md:pt-30">
          <div className="flex flex-col gap-6">
            <Eyebrow light>Inscrição por convite</Eyebrow>
            <h1 className="font-display text-display">
              {invite?.name ? `${invite.name.split(" ")[0]}, sua vaga no Summit está reservada.` : "Sua vaga no Summit está reservada."}
            </h1>
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
            <Eyebrow>Ingresso</Eyebrow>
            {price && price.discountCents > 0 && (
              <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-body-md">
                <s className="text-ink/60" aria-label={`Preço original ${formatBRL(price.listCents)}`}>
                  {formatBRL(price.listCents)}
                </s>
                <span className="font-mono text-body tracking-[0.03em]">
                  {invite && invite.discount.kind !== "courtesy" ? `− ${formatBRL(price.discountCents)} · ${describeDiscount(invite.discount)}` : "CORTESIA"}
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
              {included.map((item, i) => (
                <li key={item} className="flex items-baseline gap-6 border-b border-ash py-4">
                  <span className="font-mono text-body tracking-[0.03em]">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-body-md">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-body">
              Dúvidas:{" "}
              <a href={site.whatsappUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                WhatsApp {site.whatsapp}
              </a>{" "}
              ou{" "}
              <a href={`mailto:${site.contactEmail}`} className="underline underline-offset-4">
                {site.contactEmail}
              </a>
            </p>
          </div>

          <div className="flex flex-col gap-6">
            {!invite || !available ? (
              <div className="flex flex-col gap-4 border border-ink p-6" role="status">
                <p className="font-mono text-body tracking-[0.03em]">{invite ? "ESGOTADO" : "404"}</p>
                <h3 className="font-display text-heading-sm">
                  {invite ? "Este convite já foi utilizado." : "Convite não encontrado."}
                </h3>
                <p className="text-body-md">
                  {invite
                    ? "Se você acredita que isso é um engano, fale com a organização pelo WhatsApp."
                    : "Confira se o link chegou completo ou peça um novo à organização."}
                </p>
              </div>
            ) : !ticket.enabled ? (
              <div className="flex flex-col gap-4 border border-ink p-6" role="status">
                <p className="font-mono text-body tracking-[0.03em]">{ticket.reason === "sold_out" ? "ESGOTADO" : "EM BREVE"}</p>
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
                  <p className="border border-ink p-4 text-body" role="status">
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
