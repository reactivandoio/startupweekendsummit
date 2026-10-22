import { moveLotAction, removeLotAction, removeOpaKey, toggleOpenRegistration, updateLotAction } from "@/app/admin/actions";
import { buttonClass } from "@/components/button";
import { CopyButton } from "@/components/copy-button";
import { Eyebrow } from "@/components/eyebrow";
import { LotForm, OpaKeyForm, OpaWebhookButtons } from "@/components/opapingou-forms";
import { formatBRL } from "@/lib/cpf";
import { getWebhookEndpoint, opaApiUrl, type OpaWebhookEndpoint } from "@/lib/opapingou";
import { isOpaTestKey, maskOpaKey } from "@/lib/opapingou-core";
import { getSetting, openRegistrationEnabled } from "@/lib/settings";
import { appUrl } from "@/lib/stripe";
import { currentOffer, listLots } from "@/lib/tickets";

const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
const btn = buttonClass("secondary", "sm");

const centsToInput = (c: number) => (c / 100).toFixed(2).replace(".", ",");

export default async function IngressosPage() {
  const [apiKey, webhookId, lots, offer, openEnabled] = await Promise.all([
    getSetting("opapingou_api_key"),
    getSetting("opapingou_webhook_id"),
    listLots(),
    currentOffer(),
    openRegistrationEnabled(),
  ]);
  const openUrl = `${appUrl()}/inscricao/aberta`;

  // Estado do endpoint direto do Opa Pingou (desativado depois de falhas, última entrega)
  let endpoint: OpaWebhookEndpoint | null = null;
  let endpointError = false;
  if (apiKey && webhookId) {
    try {
      endpoint = await getWebhookEndpoint(webhookId);
    } catch (err) {
      console.error("[admin/ingressos] webhook", err);
      endpointError = true;
    }
  }

  return (
    <div className="flex flex-col gap-15">
      <div className="flex flex-col gap-4">
        <Eyebrow>Ingressos</Eyebrow>
        <h1 className="font-display text-heading">
          {offer.enabled ? `À venda: ${offer.lotName ?? "ingresso único"} · ${formatBRL(offer.priceCents)}` : offer.reason === "sold_out" ? "Esgotado" : "Vendas fechadas"}
        </h1>
        <p className="max-w-[60ch] text-body-md">
          {offer.enabled
            ? `Pagamento por ${offer.provider === "opapingou" ? "Pix, via Opa Pingou" : "Stripe (sem chave do Opa Pingou)"}.`
            : "Configure o Opa Pingou e crie pelo menos um lote ativo para abrir as vendas nos convites."}
        </p>
      </div>

      <section className="grid gap-10 lg:grid-cols-[minmax(280px,420px)_1fr]">
        <div className="flex flex-col gap-6">
          <Eyebrow>Inscrição aberta</Eyebrow>
          <p className="max-w-[40ch] text-body-md">
            Página de inscrição sem convite, para enviar a quem você quiser. Paga pelo mesmo lote à venda e entra como &quot;aguardando aprovação&quot; em
            Participantes; o ingresso só sai quando você aprova. Não aparece no site nem nos buscadores.
          </p>
        </div>

        <dl className="self-start border-t border-ink dark:border-paper">
          <Row label="Situação">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-semibold">{openEnabled ? "Aberta" : "Fechada"}</span>
              <form action={toggleOpenRegistration}>
                <input type="hidden" name="enabled" value={openEnabled ? "0" : "1"} />
                <button type="submit" className={btn}>
                  {openEnabled ? "Fechar" : "Abrir"}
                </button>
              </form>
            </div>
          </Row>
          <Row label="Link">
            <div className="flex flex-col gap-3">
              <code className="break-all font-mono text-caption">{openUrl}</code>
              <CopyButton text={openUrl} label="Copiar link" className="self-start" />
            </div>
          </Row>
        </dl>
      </section>

      <section className="grid gap-10 lg:grid-cols-[minmax(280px,420px)_1fr]">
        <div className="flex flex-col gap-6">
          <Eyebrow>Opa Pingou</Eyebrow>
          <p className="max-w-[40ch] text-body-md">
            Cobranças Pix com confirmação por webhook. Crie a chave em app.opapingou.com.br/chaves; use uma opk_test_… para testar sem dinheiro.
          </p>
          <OpaKeyForm configured={Boolean(apiKey)} />
        </div>

        <dl className="self-start border-t border-ink dark:border-paper">
          <Row label="API">{opaApiUrl()}</Row>
          <Row label="Chave">
            {apiKey ? (
              <div className="flex flex-wrap items-center gap-3">
                <code className="font-mono">{maskOpaKey(apiKey)}</code>
                <span className="font-semibold">{isOpaTestKey(apiKey) ? "Teste" : "Produção"}</span>
                <form action={removeOpaKey}>
                  <button type="submit" className={btn}>
                    Remover
                  </button>
                </form>
              </div>
            ) : (
              "Não configurada"
            )}
          </Row>
          <Row label="Webhook">
            <div className="flex flex-col gap-3">
              <code className="break-all font-mono text-caption">{appUrl()}/api/opapingou/webhook</code>
              <p>
                {!webhookId
                  ? "Não cadastrado"
                  : endpointError
                    ? "Cadastrado (não foi possível consultar o estado agora)"
                    : endpoint
                      ? `${endpoint.status === "ACTIVE" ? "Ativo" : "Desativado"} · ${endpoint.events.join(", ")}${
                          endpoint.lastDeliveredAt ? ` · última entrega ${fmt.format(new Date(endpoint.lastDeliveredAt))}` : ""
                        }`
                      : "Cadastrado"}
              </p>
              {apiKey && <OpaWebhookButtons registered={Boolean(webhookId)} />}
            </div>
          </Row>
        </dl>
      </section>

      <section className="grid gap-10 lg:grid-cols-[minmax(280px,420px)_1fr]">
        <div className="flex flex-col gap-6">
          <Eyebrow>Lotes</Eyebrow>
          <p className="max-w-[40ch] text-body-md">
            O primeiro lote ativo com vaga é o que está à venda; quando esgota, o próximo entra sozinho. Pix aberto segura a vaga por 1 hora.
            {lots.length === 0 && " Sem lotes, vale o valor único do .env (TICKET_PRICE_CENTS)."}
          </p>
          <LotForm />
        </div>

        {lots.length === 0 ? (
          <p className="self-start border-t border-ink pt-6 text-body-md dark:border-paper">Nenhum lote ainda.</p>
        ) : (
          <ul className="self-start border-t border-ink dark:border-paper">
            {lots.map((l, i) => (
              <li key={l.id} className="flex flex-col gap-4 border-b border-ash py-6 dark:border-graphite">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-body-md font-semibold">
                    {l.name} {offer.enabled && offer.lotId === l.id && <span className="font-mono text-caption">· À VENDA</span>}
                  </p>
                  <p className="text-caption">
                    {l.sold} {l.quantity === null ? "vendidos (sem limite)" : `de ${l.quantity} vendidos`} · {l.active ? "ativo" : "inativo"}
                  </p>
                </div>
                <form action={updateLotAction} className="grid items-end gap-3 sm:grid-cols-[1.4fr_1fr_1fr_auto_auto]">
                  <input type="hidden" name="id" value={l.id} />
                  <label className="flex flex-col gap-1 text-caption">
                    Nome
                    <input name="name" defaultValue={l.name} className="field" required />
                  </label>
                  <label className="flex flex-col gap-1 text-caption">
                    Valor (R$)
                    <input name="price" defaultValue={centsToInput(l.priceCents)} inputMode="decimal" className="field" required />
                  </label>
                  <label className="flex flex-col gap-1 text-caption">
                    Quantidade
                    <input name="quantity" type="number" min={0} defaultValue={l.quantity ?? ""} placeholder="Sem limite" className="field" />
                  </label>
                  <label className="flex items-center gap-2 pb-3 text-caption">
                    <input type="checkbox" name="active" defaultChecked={l.active} className="h-4 w-4 accent-ink" />
                    Ativo
                  </label>
                  <button type="submit" className={btn}>
                    Salvar
                  </button>
                </form>
                <div className="flex flex-wrap gap-2">
                  {i > 0 && (
                    <form action={moveLotAction}>
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button type="submit" className={btn} title="Vender antes">
                        ↑ Subir
                      </button>
                    </form>
                  )}
                  {i < lots.length - 1 && (
                    <form action={moveLotAction}>
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button type="submit" className={btn} title="Vender depois">
                        ↓ Descer
                      </button>
                    </form>
                  )}
                  {l.sold === 0 && (
                    <form action={removeLotAction}>
                      <input type="hidden" name="id" value={l.id} />
                      <button type="submit" className={btn}>
                        Remover
                      </button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 border-b border-ash py-4 text-body dark:border-graphite sm:grid-cols-[120px_1fr]">
      <dt className="font-semibold">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}
