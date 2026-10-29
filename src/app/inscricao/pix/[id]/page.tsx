import type { Metadata } from "next";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { AutoRefresh } from "@/components/auto-refresh";
import { ButtonLink } from "@/components/button";
import { CopyButton } from "@/components/copy-button";
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
import { cardPaymentEnabled } from "@/lib/settings";
import { syncCharge } from "@/lib/ticket-payments";

export const metadata: Metadata = { title: "Pagamento via Pix", robots: { index: false, follow: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fmtTime = new Intl.DateTimeFormat("pt-BR", { timeStyle: "short", timeZone: "America/Sao_Paulo" });

// Inscrição do Opa Pingou; pendente é conferida na API no "Já paguei" ou depois do prazo do Pix
async function load(id: string, check: boolean): Promise<Registration | null> {
  const reg = UUID.test(id) ? await getRegistration(id) : null;
  if (!reg || reg.provider !== "opapingou") return null;
  if (reg.opaPaymentLink) redirect(`/inscricao/cartao/${reg.id}`); // cartão: página do link de pagamento
  if (reg.status !== "pending") return reg;
  const expired = reg.opaExpiresAt ? new Date(reg.opaExpiresAt).getTime() < Date.now() : false;
  if (!check && !expired) return reg;
  return { ...reg, status: await syncCharge(reg) };
}

// Pix do Opa Pingou: QR + copia e cola. A confirmação chega pelo webhook; a página se atualiza sozinha e,
// no "Já paguei" (ou depois do prazo), consulta a cobrança direto na API.
export default async function PixPage({ params, searchParams }: PageProps<"/inscricao/pix/[id]">) {
  const { id } = await params;
  const { conferir } = await searchParams;
  const reg = await load(id, conferir === "1");
  if (reg?.status === "paid") redirect(`/inscricao/confirmada?r=${reg.id}`);

  const card = reg?.status === "pending" && (await cardPaymentEnabled());
  const qr = reg?.status === "pending" && reg.opaBrCode ? await QRCode.toString(reg.opaBrCode, { type: "svg", margin: 0, errorCorrectionLevel: "M" }) : null;

  // Estado da página: o hero, a coluna do valor e a caixa contam a mesma história
  const state = !reg ? "missing" : qr ? "pending" : reg.status === "canceled" ? "canceled" : "expired";
  const first = reg ? firstName(reg.name) : "";
  // Cadastro aberto não tem convite: volta pra página aberta, sem vaga reservada, e o ingresso depende da aprovação
  const open = reg?.source === "open";
  const retry = open
    ? "Gere um novo Pix pela página de inscrição e pague em seguida."
    : "Sua vaga continua reservada pelo convite: gere um novo Pix e pague em seguida.";
  const heroTitle = {
    missing: "Pagamento não encontrado.",
    pending: `${first}, falta só o Pix.`,
    expired: `${first}, o prazo do Pix terminou.`,
    canceled: `${first}, o pagamento foi cancelado.`,
  }[state];
  const sideText = {
    missing: "Confira se o link chegou completo ou volte ao seu convite para gerar o pagamento de novo.",
    pending: open
      ? "Pague pelo app do seu banco. Assim que o Pix cair, esta página atualiza sozinha; o ingresso chega por e-mail depois da aprovação da organização."
      : "Pague pelo app do seu banco. Assim que o Pix cair, esta página confirma sozinha e você recebe o ingresso por e-mail.",
    expired: `Cada Pix vale por 1 hora. ${retry}`,
    canceled: `A cobrança foi cancelada. ${retry}`,
  }[state];

  return (
    <>
      <PageHero
        eyebrow="Pagamento"
        title={heroTitle}
        illustration={illustrations.estacao}
      >
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
              <Notice title="Confira o link do pagamento." text="Ele deve ser o endereço completo que apareceu depois do formulário. Se não encontrar, abra o seu convite e gere o Pix de novo." />
            ) : reg.status !== "pending" || !qr ? (
              <Notice
                title={open ? "Gere um novo Pix pela página de inscrição." : "Gere um novo Pix pelo seu convite."}
                text={
                  reg.status === "canceled"
                    ? `Volte ${open ? "à inscrição" : "ao convite"}, confira seus dados e gere outro Pix. O novo também vale por 1 hora.`
                    : `Este QR Code e o copia e cola não valem mais. Volte ${open ? "à inscrição" : "ao convite"}, confira seus dados e gere outro Pix, válido por mais 1 hora.`
                }
                href={formPath(reg)}
                cta="Gerar novo Pix"
              />
            ) : (
              <div className="flex flex-col gap-6 border-2 border-ink bg-paper p-6 shadow-hard">
                <AutoRefresh seconds={5} until={reg.opaExpiresAt ?? undefined} />
                <p className="text-body font-semibold">Aguardando o pagamento</p>
                {/* QR sempre preto sobre branco, em qualquer tema: é o que o app do banco lê */}
                <div
                  className="w-full max-w-[280px] self-center bg-white p-4 [&>svg]:h-auto [&>svg]:w-full"
                  role="img"
                  aria-label="QR Code do Pix"
                  dangerouslySetInnerHTML={{ __html: qr }}
                />
                <div className="flex flex-col gap-2">
                  <p className="text-body font-semibold">Pix copia e cola</p>
                  <p className="break-all border border-ash p-3 font-mono text-caption">{reg.opaBrCode}</p>
                  <CopyButton text={reg.opaBrCode ?? ""} label="Copiar código Pix" className="self-start" />
                </div>
                {reg.opaExpiresAt && (
                  <p className="text-body">
                    Vale até {fmtTime.format(new Date(reg.opaExpiresAt))} (horário de Brasília). Depois disso, gere outro {open ? "pela página de inscrição" : "pelo convite"}.
                  </p>
                )}
                <ButtonLink href={`/inscricao/pix/${reg.id}?conferir=1`} prefetch={false} variant="primary" size="md" className="self-start">
                  Já paguei
                </ButtonLink>
                {card && (
                  <SwitchPayment
                    id={reg.id}
                    to="card"
                    title="Prefere pagar com cartão de crédito?"
                    text="À vista, mesmo valor, na mesma inscrição e com a vaga ainda reservada. Se já pagou o Pix, não pague no cartão."
                  />
                )}
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

function Notice({ title, text, href, cta }: { tag?: string; title: string; text: string; href?: string; cta?: string }) {
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
