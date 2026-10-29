import { moveLotAction, removeLotAction, removeOpaKey, toggleCardPayment, toggleOpenRegistration } from "@/app/admin/actions";
import { buttonClass } from "@/components/button";
import { CopyButton } from "@/components/copy-button";
import { Eyebrow } from "@/components/eyebrow";
import { CardAccountForm, LotForm, OpaDuplicateWebhookDelete, OpaKeyForm, OpaWebhookButtons } from "@/components/opapingou-forms";
import { formatBRL } from "@/lib/cpf";
import { brasiliaInputValue, describePeriod, lotStateLabel, type LotState } from "@/lib/lots-core";
import { listWebhookEndpoints, opaApiUrl, opaWebhookUrl, type OpaWebhookEndpoint } from "@/lib/opapingou";
import { duplicateWebhooks, isOpaTestKey, maskOpaKey } from "@/lib/opapingou-core";
import { cardPaymentEnabled, getSetting, openRegistrationEnabled, secretsStatus, type SecretsStatus } from "@/lib/settings";
import { appUrl } from "@/lib/stripe";
import { currentOffer, listLots } from "@/lib/tickets";

const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
const btn = buttonClass("secondary", "sm");

const centsToInput = (c: number) => (c / 100).toFixed(2).replace(".", ",");

// Selo do estado do lote: à venda em verde, agendado em amarelo, encerrado/esgotado/inativo neutro
const stateClass: Record<LotState, string> = {
  on_sale: "border-grass bg-grass-wash text-grass-deep",
  scheduled: "border-ink bg-marigold-wash text-ink",
  ended: "border-ash text-ink/70",
  sold_out: "border-ash text-ink/70",
  inactive: "border-ash text-ink/70",
};

export default async function IngressosPage() {
  // secretsStatus antes: migra o que estiver em texto puro (passada a janela do deploy)
  const secrets = await secretsStatus();
  const [apiKey, webhookId, lots, offer, openEnabled, cardEnabled, cardAccount] = await Promise.all([
    getSetting("opapingou_api_key"),
    getSetting("opapingou_webhook_id"),
    listLots(),
    currentOffer(),
    openRegistrationEnabled(),
    cardPaymentEnabled(),
    getSetting("opapingou_card_account"),
  ]);
  const openUrl = `${appUrl()}/inscricao/aberta`;

  // Endpoints da conta direto do Opa Pingou: estado do salvo (desativado depois de falhas, última entrega) e
  // outros cadastros para a mesma URL, que recebem 400 de assinatura e acabam desativados pelo Opa Pingou
  const webhookUrl = opaWebhookUrl();
  let endpoint: OpaWebhookEndpoint | null = null;
  let duplicates: OpaWebhookEndpoint[] = [];
  let endpointError = false;
  if (apiKey) {
    try {
      const endpoints = await listWebhookEndpoints();
      endpoint = endpoints.find((e) => e.id === webhookId) ?? null;
      duplicates = duplicateWebhooks(endpoints, webhookUrl, webhookId);
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
            ? `Pagamento por ${offer.provider === "opapingou" ? `Pix${cardEnabled ? " e cartão de crédito" : ""}, via Opa Pingou` : "Stripe (sem chave do Opa Pingou)"}.`
            : "Configure o Opa Pingou e tenha pelo menos um lote ativo, dentro do período de vendas e com vaga, para abrir as inscrições."}
        </p>
      </div>

      <SecretsAlert status={secrets} />

      <section className="grid gap-10 lg:grid-cols-[minmax(280px,420px)_1fr]">
        <div className="flex flex-col gap-6">
          <Eyebrow>Inscrição aberta</Eyebrow>
          <p className="max-w-[40ch] text-body-md">
            Página de inscrição sem convite, para enviar a quem você quiser. Paga pelo mesmo lote à venda e, como toda inscrição (inclusive por
            convite), entra como &quot;aguardando aprovação&quot; em Participantes; o ingresso só sai quando você aprova. Não aparece no site nem nos
            buscadores. Para divulgar uma track, use o link de cada cupom em Cupons.
          </p>
        </div>

        <dl className="self-start border-t border-ink">
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

        <dl className="self-start border-t border-ink">
          <Row label="API">{opaApiUrl()}</Row>
          <Row label="Criptografia">{secretsLabel(secrets)}</Row>
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
              <code className="break-all font-mono text-caption">{webhookUrl}</code>
              <p>
                {!webhookId
                  ? "Não cadastrado"
                  : endpointError
                    ? "Cadastrado (não foi possível consultar o estado agora)"
                    : endpoint
                      ? `${endpoint.status === "ACTIVE" ? "Ativo" : "Desativado"} · ${endpoint.events.join(", ")}${
                          endpoint.lastDeliveredAt ? ` · última entrega ${fmt.format(new Date(endpoint.lastDeliveredAt))}` : ""
                        }`
                      : "Cadastrado, mas não existe mais no Opa Pingou: clique em Trocar segredo para cadastrar de novo"}
              </p>
              {apiKey && <OpaWebhookButtons registered={Boolean(webhookId)} />}
            </div>
          </Row>
          <Row label="Cartão">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-semibold">{cardEnabled ? "Oferecido no checkout" : "Desligado"}</span>
                <form action={toggleCardPayment}>
                  <input type="hidden" name="enabled" value={cardEnabled ? "0" : "1"} />
                  <button type="submit" className={btn}>
                    {cardEnabled ? "Desligar" : "Ligar"}
                  </button>
                </form>
              </div>
              <p className="text-caption">
                Link de pagamento do Opa Pingou na conta Abacate Pay: cartão à vista, mesmo valor do Pix (a tarifa não é repassada). O link não expira no
                Abacate: pagamento depois de 1 hora sem vaga entra em &quot;aguardando aprovação&quot; em Participantes, com aviso por e-mail. Estornos são
                feitos à mão no painel do Opa Pingou.
              </p>
              <CardAccountForm accountId={cardAccount} />
            </div>
          </Row>
          {duplicates.length > 0 && (
            <Row label="Duplicados">
              <div className="flex flex-col gap-4">
                <p className="font-semibold" role="alert">
                  {duplicates.length === 1 ? "Há outro webhook" : `Há ${duplicates.length} outros webhooks`} no Opa Pingou para esta URL, fora o salvo aqui.
                  O segredo {duplicates.length === 1 ? "dele" : "deles"} não está no site: as entregas recebem 400 e o Opa Pingou desativa o
                  cadastro depois de ~45h, avisando por e-mail. Exclua, a não ser que outro sistema use o mesmo endereço.
                </p>
                <ul className="flex flex-col gap-4">
                  {duplicates.map((d) => (
                    <li key={d.id} className="flex flex-col gap-2 border-l-2 border-ink pl-4">
                      <code className="break-all font-mono text-caption">{d.id}</code>
                      <p className="text-caption">
                        {d.status === "ACTIVE" ? "Ativo" : "Desativado"} · {d.events.join(", ")}
                        {d.lastDeliveredAt ? ` · última entrega ${fmt.format(new Date(d.lastDeliveredAt))}` : " · nunca entregou"}
                      </p>
                      <OpaDuplicateWebhookDelete id={d.id} />
                    </li>
                  ))}
                </ul>
              </div>
            </Row>
          )}
        </dl>
      </section>

      <section className="grid gap-10 lg:grid-cols-[minmax(280px,420px)_1fr]">
        <div className="flex flex-col gap-6">
          <Eyebrow>Lotes</Eyebrow>
          <p className="max-w-[40ch] text-body-md">
            Fica à venda o primeiro lote ativo, dentro do período de vendas e com vaga; ao passar a data de fim ou esgotar, o próximo entra sozinho.
            Início, fim e quantidade são opcionais (datas no horário de Brasília). Pagamento aberto (Pix ou cartão) segura a vaga por 1 hora.
            {lots.length === 0 && " Sem lotes, vale o valor único do .env (TICKET_PRICE_CENTS)."}
          </p>
          <LotForm />
        </div>

        {lots.length === 0 ? (
          <p className="self-start border-t border-ink pt-6 text-body-md">Nenhum lote ainda.</p>
        ) : (
          <ul className="self-start border-t border-ink">
            {lots.map((l, i) => (
              <li key={l.id} className="flex flex-col gap-4 border-b border-ash py-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="flex flex-wrap items-center gap-2 text-body-md font-semibold">
                    {l.name}
                    <span className={`border-2 px-2 py-0.5 font-mono text-caption uppercase ${stateClass[l.state]}`}>{lotStateLabel[l.state]}</span>
                    {offer.enabled && offer.lotId === l.id && <span className="font-mono text-caption">· vendendo agora</span>}
                  </p>
                  <p className="text-caption">
                    {formatBRL(l.priceCents)} · {l.sold} {l.quantity === null ? "vendidos (sem limite)" : `de ${l.quantity} vendidos`}
                    {(l.startsAt || l.endsAt) && ` · ${describePeriod(l.startsAt, l.endsAt)}`}
                  </p>
                </div>
                <details className="group">
                  <summary className="cursor-pointer text-caption font-semibold underline underline-offset-4">Editar</summary>
                  <div className="pt-4">
                    <LotForm
                      lot={{
                        id: l.id,
                        name: l.name,
                        price: centsToInput(l.priceCents),
                        quantity: l.quantity,
                        startsAt: brasiliaInputValue(l.startsAt),
                        endsAt: brasiliaInputValue(l.endsAt),
                        active: l.active,
                      }}
                    />
                  </div>
                </details>
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

const SECRET_NAMES: Record<string, string> = { opapingou_api_key: "a chave da API", opapingou_webhook_secret: "o segredo do webhook" };
const names = (keys: string[]) => keys.map((k) => SECRET_NAMES[k] ?? k).join(" e ");

function secretsLabel(s: SecretsStatus) {
  if (s.unreadable.length) return `Não abre ${names(s.unreadable)}`;
  if (s.key === "ok")
    return s.plaintext.length ? `Cifra ${names(s.plaintext)} em até 10 min depois do deploy` : "Segredos cifrados no banco (AES-256-GCM)";
  return s.key === "invalid" ? "SETTINGS_ENCRYPTION_KEY inválida: segredos em texto puro" : "Sem SETTINGS_ENCRYPTION_KEY: segredos em texto puro";
}

// Falta da variável não fecha as vendas (os segredos seguem em texto puro, como antes), mas tem que aparecer aqui.
function SecretsAlert({ status }: { status: SecretsStatus }) {
  if (status.unreadable.length)
    return (
      <p className="max-w-[70ch] border-2 border-ink bg-marigold-wash p-4 text-body" role="alert">
        <strong>Não consigo abrir {names(status.unreadable)} do Opa Pingou.</strong> Eles foram cifrados com uma SETTINGS_ENCRYPTION_KEY que não
        está mais no servidor (ou mudou). Volte a chave original ao .env e faça o deploy, ou salve a chave da API e troque o segredo do webhook de
        novo aqui.
      </p>
    );
  if (status.key === "ok") return null;
  return (
    <p className="max-w-[70ch] border-2 border-ink bg-marigold-wash p-4 text-body" role="alert">
      <strong>
        {status.key === "invalid" ? "SETTINGS_ENCRYPTION_KEY inválida" : "SETTINGS_ENCRYPTION_KEY não configurada"}: os segredos do Opa Pingou estão
        em texto puro no banco.
      </strong>{" "}
      As vendas seguem normais. Gere a chave com <code className="font-mono">openssl rand -base64 32</code>, coloque no .env do servidor e faça o
      deploy: na primeira leitura os valores atuais são cifrados (ver README).
    </p>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 border-b border-ash py-4 text-body sm:grid-cols-[120px_1fr]">
      <dt className="font-semibold">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}
