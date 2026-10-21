import type { Metadata } from "next";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { AutoRefresh } from "@/components/auto-refresh";
import { ButtonLink } from "@/components/button";
import { CopyButton } from "@/components/copy-button";
import { Eyebrow } from "@/components/eyebrow";
import { EventMeta, PageHero, illustrations } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { site } from "@/content/site";
import { formatBRL } from "@/lib/cpf";
import { getRegistration, type Registration } from "@/lib/registrations";
import { syncCharge } from "@/lib/ticket-payments";

export const metadata: Metadata = { title: "Pagamento via Pix", robots: { index: false, follow: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fmtTime = new Intl.DateTimeFormat("pt-BR", { timeStyle: "short", timeZone: "America/Sao_Paulo" });

// Inscrição do Opa Pingou; pendente é conferida na API no "Já paguei" ou depois do prazo do Pix
async function load(id: string, check: boolean): Promise<Registration | null> {
  const reg = UUID.test(id) ? await getRegistration(id) : null;
  if (!reg || reg.provider !== "opapingou") return null;
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

  const qr = reg?.status === "pending" && reg.opaBrCode ? await QRCode.toString(reg.opaBrCode, { type: "svg", margin: 0, errorCorrectionLevel: "M" }) : null;

  return (
    <>
      <PageHero
        eyebrow="Pagamento"
        title={reg ? `${reg.name.split(" ")[0]}, falta só o Pix.` : "Pagamento não encontrado."}
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
            <p className="max-w-[40ch] text-body-md">
              Pague pelo app do seu banco. Assim que o Pix cair, esta página confirma sozinha e você recebe o ingresso por e-mail.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            {!reg ? (
              <Notice tag="404" title="Não encontramos este pagamento." text="Confira se o link está completo ou volte ao seu convite." />
            ) : reg.status !== "pending" || !qr ? (
              <Notice
                tag={reg.status === "canceled" ? "CANCELADO" : "EXPIRADO"}
                title="Este Pix não vale mais."
                text="O prazo de pagamento terminou. Volte ao convite e preencha os dados de novo para gerar outro Pix."
                href={`/inscricao/${reg.inviteCode}`}
                cta="Voltar ao convite"
              />
            ) : (
              <div className="flex flex-col gap-6 border-2 border-ink bg-paper p-6 shadow-hard">
                <AutoRefresh seconds={5} until={reg.opaExpiresAt ?? undefined} />
                <p className="text-body font-semibold">Aguardando o pagamento</p>
                <div
                  className="w-full max-w-[280px] self-center bg-paper p-4 [&>svg]:h-auto [&>svg]:w-full"
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
                  <p className="text-body">Vale até {fmtTime.format(new Date(reg.opaExpiresAt))} (horário de Brasília). Depois disso, gere outro pelo convite.</p>
                )}
                <ButtonLink href={`/inscricao/pix/${reg.id}?conferir=1`} prefetch={false} variant="primary" size="md" className="self-start">
                  Já paguei
                </ButtonLink>
              </div>
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
