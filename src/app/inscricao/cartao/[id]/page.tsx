import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AutoRefresh } from "@/components/auto-refresh";
import { ButtonAnchor, ButtonLink } from "@/components/button";
import { Eyebrow } from "@/components/eyebrow";
import { EventMeta, PageHero } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { SwitchPayment } from "@/components/switch-payment";
import { illustrations } from "@/content/illustrations";
import { site } from "@/content/site";
import { formatBRL } from "@/lib/cpf";
import { firstName } from "@/lib/names";
import { formPath } from "@/lib/registration-state";
import { getRegistration, type Registration } from "@/lib/registrations";
import { syncCharge } from "@/lib/ticket-payments";

export const metadata: Metadata = { title: "Pagamento com cartão", robots: { index: false, follow: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fmtTime = new Intl.DateTimeFormat("pt-BR", { timeStyle: "short", timeZone: "America/Sao_Paulo" });

// Inscrição paga no link de pagamento do Opa Pingou; pendente é conferida na API no "Já paguei" ou depois do prazo
async function load(id: string, check: boolean): Promise<Registration | null> {
  const reg = UUID.test(id) ? await getRegistration(id) : null;
  if (!reg || reg.provider !== "opapingou") return null;
  if (!reg.opaPaymentLink) redirect(`/inscricao/pix/${reg.id}`);
  if (reg.status !== "pending") return reg;
  const expired = reg.opaExpiresAt ? new Date(reg.opaExpiresAt).getTime() < Date.now() : false;
  if (!check && !expired) return reg;
  return { ...reg, status: await syncCharge(reg) };
}

// Cartão de crédito: o checkout do Abacate Pay abre em outra aba (o link não tem URL de retorno). Esta página fica
// "aguardando pagamento": consulta o site a cada 5 s (o webhook charge.paid atualiza a inscrição), pausa com a aba
// em segundo plano e retoma ao voltar; confirmado, vai sozinha para a tela de inscrição paga ou em análise.
export default async function CartaoPage({ params, searchParams }: PageProps<"/inscricao/cartao/[id]">) {
  const { id } = await params;
  const { conferir } = await searchParams;
  const reg = await load(id, conferir === "1");
  if (reg?.status === "paid") redirect(`/inscricao/confirmada?r=${reg.id}`);

  // Depois do prazo a vaga não está mais reservada: o link some daqui, mesmo que o Abacate ainda aceite o pagamento
  const state = !reg ? "missing" : reg.status === "pending" && reg.opaPaymentLink ? "pending" : reg.status === "canceled" ? "canceled" : "expired";
  const first = reg ? firstName(reg.name) : "";
  const open = reg?.source === "open";
  // Inscrição que passa por aprovação (todas as novas; approval null só nas de convite de antes dessa regra)
  const review = reg?.approval !== null;
  const retry = open ? "Faça uma nova inscrição pela página de inscrição." : "Sua vaga continua reservada pelo convite: volte a ele e pague de novo.";
  const heroTitle = {
    missing: "Pagamento não encontrado.",
    pending: `${first}, falta só o pagamento.`,
    expired: `${first}, o prazo do pagamento terminou.`,
    canceled: `${first}, o pagamento foi cancelado.`,
  }[state];
  const sideText = {
    missing: "Confira se o link chegou completo ou volte ao seu convite para gerar o pagamento de novo.",
    pending: review
      ? "Pague no cartão de crédito, à vista, na página de pagamento. Esta página atualiza sozinha; o ingresso chega por e-mail depois da aprovação da organização."
      : "Pague no cartão de crédito, à vista, na página de pagamento. Esta página confirma sozinha e você recebe o ingresso por e-mail.",
    expired: `O pagamento fica aberto por 1 hora. ${retry}`,
    canceled: `A cobrança foi cancelada. ${retry}`,
  }[state];

  return (
    <>
      <PageHero eyebrow="Pagamento" title={heroTitle} illustration={illustrations.estacao}>
        <EventMeta />
      </PageHero>

      <main className="flex flex-col gap-30 bg-paper py-30">
        <section className="mx-auto grid w-full max-w-page gap-15 px-4 sm:px-6 md:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col gap-6">
            <Eyebrow>Valor</Eyebrow>
            {reg && reg.discountCents > 0 && (
              <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-body-md">
                <s className="text-ink/60">{formatBRL(reg.listPriceCents)}</s>
                <span className="border-2 border-grass bg-grass-wash px-2 py-0.5 text-body font-semibold text-grass-deep">− {formatBRL(reg.discountCents)} do convite</span>
              </p>
            )}
            <h2 className="font-display text-heading">{reg ? formatBRL(reg.amountCents) : "—"}</h2>
            {reg?.lotName && <p className="text-body-md">{reg.lotName}</p>}
            <p className="max-w-[40ch] text-body-md">{sideText}</p>
          </div>

          <div className="flex flex-col gap-6">
            {!reg ? (
              <Notice title="Confira o link do pagamento." text="Ele deve ser o endereço completo que apareceu depois do formulário. Se não encontrar, abra o seu convite e gere o pagamento de novo." />
            ) : state !== "pending" ? (
              <Notice
                title={open ? "Faça uma nova inscrição." : "Pague de novo pelo seu convite."}
                text={`Este link de pagamento não vale mais. Volte ${open ? "à inscrição" : "ao convite"}, confira seus dados e escolha Pix ou cartão: o novo pagamento também fica aberto por 1 hora.`}
                href={formPath(reg)}
                cta={open ? "Voltar à inscrição" : "Voltar ao convite"}
              />
            ) : (
              <div className="flex flex-col gap-6 border-2 border-ink bg-paper p-6 shadow-hard">
                <AutoRefresh seconds={5} until={reg.opaExpiresAt ?? undefined} maxMinutes={20} resume />
                <p className="flex items-center gap-3 text-body font-semibold" role="status">
                  <span className="inline-block h-3 w-3 animate-pulse bg-marigold" aria-hidden="true" />
                  Aguardando o pagamento
                </p>
                <p className="text-body-md">
                  O pagamento abre numa nova aba. Depois de pagar, volte para esta: ela muda sozinha assim que o cartão for aprovado.
                </p>
                <ButtonAnchor href={reg.opaPaymentLink ?? "#"} target="_blank" rel="noopener noreferrer" variant="primary" size="md" className="self-start">
                  Pagar com cartão ↗
                </ButtonAnchor>
                <p className="text-body">
                  Fechou a aba ou o cartão foi recusado? Clique de novo em <strong>Pagar com cartão</strong> para reabrir o pagamento e tentar outra vez.
                </p>
                <div className="border-2 border-ink bg-marigold-wash p-4 text-body">
                  A confirmação também chega por e-mail{review ? ", e o ingresso vem depois da aprovação da organização" : ", com o ingresso"}. Pode fechar esta página depois de pagar.
                </div>
                {reg.opaExpiresAt && (
                  <p className="text-body">
                    O pagamento fica aberto até {fmtTime.format(new Date(reg.opaExpiresAt))} (horário de Brasília). Depois disso, a vaga deixa de ficar reservada.
                  </p>
                )}
                <ButtonLink href={`/inscricao/cartao/${reg.id}?conferir=1`} prefetch={false} variant="secondary" size="md" className="self-start">
                  Já paguei
                </ButtonLink>
                <SwitchPayment
                  id={reg.id}
                  to="pix"
                  title="Prefere pagar com Pix?"
                  text="Geramos um Pix para a mesma inscrição, com a vaga ainda reservada. Se já pagou no cartão, não pague o Pix."
                />
              </div>
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

function Notice({ title, text, href, cta }: { title: string; text: string; href?: string; cta?: string }) {
  return (
    <div className="flex flex-col gap-4 border-2 border-ink bg-marigold-wash p-6 shadow-hard" role="status">
      <h3 className="font-display text-heading-sm">{title}</h3>
      <p className="text-body-md">{text}</p>
      {href && cta && (
        <ButtonLink href={href} variant="primary" size="md" className="mt-2 self-start">
          {cta}
        </ButtonLink>
      )}
    </div>
  );
}
