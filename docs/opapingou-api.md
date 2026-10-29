# Opa Pingou — guia da API REST para agentes de IA

> Você é um agente de IA integrando um sistema à API REST do Opa Pingou: cobranças Pix com roteamento automático para a conta bancária com cota grátis, consulta de cobranças e webhooks assinados. Este arquivo é a referência completa e é gerado da mesma fonte da documentação pública, então as rotas, campos e eventos abaixo são exatamente os que a API atende hoje.

Versão da API: `v1`. Referência interativa: https://opapingou.com.br/docs. Este arquivo: https://opapingou.com.br/llms-full.txt (índice em https://opapingou.com.br/llms.txt). Copie-o para o projeto (por exemplo, `docs/opapingou-api.md`) e consulte-o antes de escrever código contra a API.

## Regras para o agente

- Use só as rotas, campos, enums e eventos deste arquivo. Se uma operação não está na seção Rotas, ela não existe na API REST: não a invente. Também não invente campos: a API rejeita campos desconhecidos com `400` `VALIDATION_FAILED`.
- Dinheiro é sempre inteiro em centavos (`amountCents: 35000` = R$ 350,00). Nunca use ponto flutuante para valores.
- Datas vêm em ISO 8601 (UTC). Envie e receba JSON (`Content-Type: application/json`).
- A chave de API vem de variável de ambiente (`OPAPINGOU_API_KEY`); nunca a escreva no código. Veja "Segredos".
- Toda criação de cobrança leva `Idempotency-Key`. Todo webhook recebido tem a assinatura verificada antes de qualquer efeito.
- Programe contra o `code` dos erros, nunca contra o texto da mensagem.
- Na dúvida sobre algo que não está aqui, pergunte ao desenvolvedor em vez de supor.

## Ambientes e URL base

- Produção: `https://api.opapingou.com.br` — site e chaves em https://opapingou.com.br.
- Staging: `https://api-stg.opapingou.com.br` — site e chaves em https://stg.opapingou.com.br. Contas, chaves e endpoints de staging são separados dos de produção.

Todas as rotas ficam sob `/v1` (por exemplo, `https://api.opapingou.com.br/v1/health`). Deixe a URL base configurável por variável de ambiente (`OPAPINGOU_API_URL`).

**Atenção: staging não é sandbox.** As contas bancárias conectadas em staging são contas reais, nos bancos reais; um Pix pago em uma cobrança de staging movimenta dinheiro de verdade. Para testar sem dinheiro, use uma chave `opk_test_…`, que só enxerga contas em modo de teste (`testMode`). Com chave `opk_live_…`, em staging ou em produção, use valores pequenos e combine os testes com o dono da conta.

## Rotas

Estas são todas as rotas da API REST `v1`. Nenhuma outra existe.

- Perfil:
  - `GET /v1/me` — Consultar perfil (profile:read)
- Cobranças:
  - `POST /v1/charges` — Criar cobrança (charges:write)
  - `GET /v1/charges/{id}` — Consultar cobrança (charges:read)
- Pagamentos:
  - `GET /v1/payments/{id}` — Consultar pagamento (payments:read)
  - `POST /v1/payments/{id}/refund` — Estornar pagamento (payments:write)
- Webhooks:
  - `GET /v1/webhook-endpoints` — Listar endpoints de webhook (webhooks:read)
  - `POST /v1/webhook-endpoints` — Criar endpoint de webhook (webhooks:write)
  - `GET /v1/webhook-endpoints/{id}` — Consultar endpoint de webhook (webhooks:read)
  - `PATCH /v1/webhook-endpoints/{id}` — Atualizar endpoint de webhook (webhooks:write)
  - `DELETE /v1/webhook-endpoints/{id}` — Remover endpoint de webhook (webhooks:write)
  - `POST /v1/webhook-endpoints/{id}/rotate-secret` — Trocar segredo do endpoint (webhooks:write)
  - `POST /v1/webhook-endpoints/{id}/test` — Enviar evento de teste (webhooks:write)
  - `GET /v1/webhook-deliveries` — Listar entregas de webhook (webhooks:read)
  - `POST /v1/webhook-deliveries/{id}/redeliver` — Reenviar entrega (webhooks:write)
- Sistema:
  - `GET /v1/health` — Verificar disponibilidade (pública)

## Autenticação

Cada cliente usa as próprias chaves de API. Envie a chave em todas as requisições, no cabeçalho `Authorization: Bearer <chave>`; a única rota pública é `GET /v1/health`.

A chave tem o formato `opk_live_<43 caracteres>` (produção) ou `opk_test_<43 caracteres>` (teste). Ela é mostrada uma única vez, ao ser criada: guarde-a em um cofre ou variável de ambiente, nunca no código.

Você cria, lista, edita e revoga chaves no site (`https://app.opapingou.com.br/chaves`) e no aplicativo (Configurações › Integrações › Chaves de API); a equipe do Opa Pingou também consegue fazer isso pelo painel interno.

Uma chave carrega escopos e, opcionalmente, uma lista de contas bancárias. Cada rota exige um escopo (tabela abaixo). Com a lista de contas definida, a chave só enxerga essas contas.

Uma chave de teste só enxerga contas em modo de teste (`testMode`) e só recebe webhooks dessas contas. Para operar contas reais, use uma chave `live`.

- Chave ausente, inválida ou revogada: `401` com o código `API_KEY_INVALID`.
- Chave expirada: `401` com o código `API_KEY_EXPIRED`.
- Escopo insuficiente: `403` com o código `INSUFFICIENT_SCOPE`; o problema traz `required`, a lista de escopos que a rota exige.

### Escopos

- `profile:read` — Ler o perfil e a empresa da conta. Rotas: `GET /v1/me`.
- `bank_accounts:read` — Ler as contas bancárias conectadas. Rotas: nenhuma rota REST hoje — não use.
- `bank_accounts:write` — Alterar as contas bancárias conectadas. Rotas: nenhuma rota REST hoje — não use.
- `charges:read` — Ler cobranças e prever o roteamento. Rotas: `GET /v1/charges/{id}`.
- `charges:write` — Criar, cancelar e simular cobranças. Rotas: `POST /v1/charges`.
- `payments:read` — Ler os pagamentos recebidos. Rotas: `GET /v1/payments/{id}`.
- `payments:write` — Estornar pagamentos. Rotas: `POST /v1/payments/{id}/refund`.
- `dashboard:read` — Ler os totais do painel. Rotas: nenhuma rota REST hoje — não use.
- `webhooks:read` — Ler endpoints e entregas de webhook. Rotas: `GET /v1/webhook-endpoints`, `GET /v1/webhook-endpoints/{id}`, `GET /v1/webhook-deliveries`.
- `webhooks:write` — Gerenciar endpoints e reenviar entregas de webhook. Rotas: `POST /v1/webhook-endpoints`, `PATCH /v1/webhook-endpoints/{id}`, `DELETE /v1/webhook-endpoints/{id}`, `POST /v1/webhook-endpoints/{id}/rotate-secret`, `POST /v1/webhook-endpoints/{id}/test`, `POST /v1/webhook-deliveries/{id}/redeliver`.

```bash
curl "https://api.opapingou.com.br/v1/me" \
  -H "Authorization: Bearer $OPAPINGOU_API_KEY"
```

Escopo insuficiente · 403:

```json
{
  "type": "https://opapingou.com.br/docs#erro-INSUFFICIENT_SCOPE",
  "title": "A chave de API não tem permissão para esta operação.",
  "status": 403,
  "code": "INSUFFICIENT_SCOPE",
  "required": [
    "charges:write"
  ],
  "requestId": "req_01J9Z3K8X2"
}
```

## Idempotência

Ao criar uma cobrança (`POST /v1/charges`), envie o cabeçalho `Idempotency-Key` com um valor único por cobrança — o número do pedido ou um UUID. Se a requisição for repetida com a mesma chave — por um timeout ou uma nova tentativa —, nenhuma segunda cobrança é criada.

O cabeçalho é obrigatório nessa rota: sem ele, a resposta é `400` `IDEMPOTENCY_KEY_REQUIRED`. A chave tem de 1 a 255 caracteres ASCII visíveis, sem espaços; fora disso, `400` `VALIDATION_FAILED`.

A chave é lembrada por 24 horas e vale por chave de API: duas chaves de API não compartilham valores. A repetição com o mesmo corpo responde `201` com a mesma cobrança, no estado atual (paga, expirada…), e o cabeçalho `Idempotent-Replayed: true`. A ordem dos campos do JSON não importa.

A mesma chave com um corpo diferente responde `409` `IDEMPOTENCY_KEY_REUSED`. Enquanto a primeira requisição ainda está em andamento, uma repetição responde `409` `IDEMPOTENCY_IN_PROGRESS` com `Retry-After`: espere e repita.

Se a criação falha (corpo inválido, nenhuma conta disponível, banco fora do ar), nenhuma cobrança é criada e a chave não fica presa: repita com a mesma chave. Hoje só `POST /v1/charges` usa o cabeçalho.

```bash
curl -X POST "https://api.opapingou.com.br/v1/charges" \
  -H "Authorization: Bearer $OPAPINGOU_API_KEY" \
  -H "Idempotency-Key: <valor-unico-por-cobranca>" \
  -H "Content-Type: application/json" \
  -d '{
  "amountCents": 35000,
  "description": "Pedido 1042",
  "validity": "ONE_HOUR"
}'
```

## Webhooks

O Opa Pingou avisa o seu sistema por webhooks de saída: você cadastra um endpoint (`/v1/webhook-endpoints`) e passa a receber uma requisição `POST` a cada evento em que ele esteja inscrito. Dá para cadastrar pela API, pelo site, pelo aplicativo ou pelo painel interno.

Regras do endpoint: só `https`, com host público (sem endereço IP e sem usuário e senha na URL), até 10 endpoints ativos por conta. Cada endpoint tem a sua lista de eventos e, opcionalmente, uma lista de contas bancárias; sem contas, recebe os eventos de todas as contas do modo da chave. Ao cadastrar, a URL é conferida pelo formato: recusamos URLs inválidas, com endereço IP ou com cara de rede privada (como `localhost` ou nomes terminados em `.local` e `.internal`). Um host cujo DNS resolve para endereço privado só é detectado na hora de enviar: a entrega falha com `ssrf_blocked`, um erro permanente, sem nova tentativa.

Uma chave de teste só cria e só enxerga endpoints de teste, que recebem apenas eventos de contas de teste. Uma chave restrita a algumas contas só cria endpoints dessas contas e só gerencia endpoints cujas contas estejam dentro das dela; endpoints mais amplos aparecem na lista, mas as entregas são filtradas.

O corpo é JSON: `id`, `type`, `occurredAt`, `testMode` e `data`, que traz `type` (`payment`, `charge`, `bank_account`, `recurrence`, `recurring_charge` ou `ping`) e `object`, o recurso igual ao da API. Os cabeçalhos são `Content-Type: application/json`, `User-Agent: OpaPingou-Webhooks/1.0`, `Opa-Event-Id` (o mesmo `id`), `Opa-Event-Type` e `Opa-Signature`.

A assinatura vem em `Opa-Signature: t=<unix segundos>,v1=<hex>`, onde `v1` é o HMAC-SHA256, com o segredo do endpoint, de `<t>.<corpo bruto>`. Calcule sobre o corpo exatamente como chegou, antes de interpretar o JSON, compare em tempo constante e rejeite a requisição se `|agora − t|` passar de 300 segundos. O segredo (`whsec_…`) aparece uma única vez, ao criar o endpoint e ao trocá-lo em `POST /v1/webhook-endpoints/{id}/rotate-secret`; a troca vale na hora, sem período de convivência.

Responda com `2xx` em até 10 segundos e processe o evento de forma assíncrona. O mesmo evento pode chegar mais de uma vez: deduplique pelo `id`.

Falha (status fora de `2xx`, timeout de 10 segundos ou erro de rede; um `3xx` também é falha, pois não seguimos redirecionamentos) gera novas tentativas: até 8 no total, com intervalos de 1 min, 5 min, 30 min, 2 h, 6 h, 12 h e 24 h, cerca de 45 horas ao todo.

Se um endpoint esgotar as tentativas sem nenhuma entrega bem-sucedida desde a criação do evento, ele é desativado automaticamente (`status: DISABLED`, `disabledReason: "auto"`) e o dono da conta recebe um e-mail. Um erro permanente (`ssrf_blocked` ou `url_invalid`) não espera as tentativas: o endpoint é desativado na hora, com o mesmo e-mail (a menos que tenha havido uma entrega bem-sucedida depois da criação do evento). Reative-o com `PATCH` e `status: ACTIVE` (ou no aplicativo, no site ou no painel) e reenvie o que ficou para trás pela lista de entregas, com `POST /v1/webhook-deliveries/{id}/redeliver`, ou reconcilie pela API.

`POST /v1/webhook-endpoints/{id}/test` envia o evento `ping`, que é sempre entregue, qualquer que seja o filtro de eventos e de contas, e não pode ser inscrito na lista de eventos: é o evento de teste e chega assinado como os demais. As entregas ficam em `GET /v1/webhook-deliveries`.

Erros desta área: `WEBHOOK_URL_INVALID`, `INVALID_WEBHOOK_EVENT` e `WEBHOOK_ENDPOINT_LIMIT` (ao cadastrar ou editar), `WEBHOOK_ENDPOINT_DISABLED` e `WEBHOOK_DELIVERY_IN_PROGRESS` (ao reenviar). O status HTTP de cada um está na tabela da seção Erros.

### Eventos

- Pagamentos:
  - `payment.confirmed` — Pagamento confirmado
  - `payment.refund_requested` — Estorno solicitado
  - `payment.refund_failed` — Estorno não concluído
  - `payment.refunded` — Pagamento estornado
  - `payment.charged_back` — Pagamento contestado
- Cobranças:
  - `charge.paid` — Cobrança paga
  - `charge.expired` — Cobrança expirada
  - `charge.canceled` — Cobrança cancelada
- Contas bancárias:
  - `bank_account.error` — Conta bancária com erro
  - `bank_account.disconnected` — Conta bancária desconectada
- Recorrências (Pix Automático):
  - `recurrence.approved` — Recorrência aprovada
  - `recurrence.rejected` — Recorrência recusada
  - `recurrence.expired` — Recorrência expirada
  - `recurrence.canceled` — Recorrência cancelada
- Cobranças recorrentes:
  - `recurring_charge.issued` — Cobrança recorrente emitida
  - `recurring_charge.paid` — Cobrança recorrente paga
  - `recurring_charge.failed` — Cobrança recorrente com falha
  - `recurring_charge.expired` — Cobrança recorrente expirada
  - `recurring_charge.canceled` — Cobrança recorrente cancelada
- Teste: `ping` — enviado por `POST /v1/webhook-endpoints/{id}/test`; não pode ser inscrito.

### String assinada

```
signed_payload = "<t>" + "." + "<corpo bruto da requisição>"
v1 = hex(HMAC_SHA256(segredo_whsec, signed_payload))
```

Corpo do evento · payment.confirmed:

```json
{
  "id": "e6f7a8b9-0c1d-4e2f-83a4-b5c6d7e8f9a0",
  "type": "payment.confirmed",
  "occurredAt": "2026-10-03T14:32:00.000Z",
  "testMode": false,
  "data": {
    "type": "payment",
    "object": {
      "id": "4d5e6f70-8a9b-4c1d-9e2f-3a4b5c6d7e8f",
      "status": "CONFIRMED",
      "amountCents": 35000
    }
  }
}
```

Cabeçalhos da entrega:

```http
POST /webhooks/opapingou HTTP/1.1
Content-Type: application/json
User-Agent: OpaPingou-Webhooks/1.0
Opa-Event-Id: e6f7a8b9-0c1d-4e2f-83a4-b5c6d7e8f9a0
Opa-Event-Type: payment.confirmed
Opa-Signature: t=1791037920,v1=5b0c…e41f
```

Verificar a assinatura · Node.js:

```js
import crypto from 'node:crypto';

const TOLERANCE_SECONDS = 300;

// rawBody: o corpo exatamente como chegou (string ou Buffer), antes do JSON.parse.
export function verifyOpaSignature(rawBody, header, secret) {
  if (!header) return false;
  const parts = {};
  for (const pair of header.split(',')) {
    const i = pair.indexOf('=');
    if (i > 0) parts[pair.slice(0, i).trim()] = pair.slice(i + 1).trim();
  }
  const t = Number(parts.t);
  if (!Number.isFinite(t) || !parts.v1) return false;
  if (Math.abs(Date.now() / 1000 - t) > TOLERANCE_SECONDS) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${t}.${rawBody}`)
    .digest('hex');

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(parts.v1.toLowerCase(), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
```

```bash
curl -X POST "https://api.opapingou.com.br/v1/webhook-endpoints" \
  -H "Authorization: Bearer $OPAPINGOU_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "url": "https://lojadaana.com.br/webhooks/opapingou",
  "events": [
    "payment.confirmed",
    "charge.expired"
  ]
}'
```

## Erros

Todo erro volta como `application/problem+json` (RFC 9457), com os membros `type` (`https://opapingou.com.br/docs#erro-<CODE>`), `title`, `status`, `code`, `detail` (opcional) e `requestId`.

O `code` é o identificador estável do erro — por exemplo `NO_ROUTABLE_ACCOUNT` ou `CHARGE_NOT_PENDING`. O `title` é a mensagem em português; `detail` só aparece quando há uma mensagem mais específica. Programe contra o `code`, não contra o texto.

Erros de validação (`VALIDATION_FAILED`, `400`) trazem também `errors`, uma lista de `{ field, message }` com um item por campo inválido.

Uma rota que não existe responde `404` com `NOT_FOUND`; um método errado em um caminho conhecido também responde `404`. Toda resposta, de sucesso ou de erro, traz o cabeçalho `X-Request-Id`, o mesmo valor de `requestId`: informe-o ao falar com o suporte.

Erros do provedor de pagamentos (o banco ou a plataforma da conta) nunca voltam como `502` ou `504`. Quando o provedor recusa o pedido, a resposta é `422` `PROVIDER_REJECTED`, com `provider`, `providerStatus` (o status HTTP que o provedor respondeu), `providerCode` e, quando ele informa, `providerDetail`: corrija os dados antes de repetir. Quando o provedor está fora do ar ou falha do lado dele, a resposta é `503` `PROVIDER_UNAVAILABLE`, com `Retry-After`: espere esses segundos e repita com a mesma `Idempotency-Key`.

### Códigos de erro

Status HTTP · `code` · mensagem (`title`). É o catálogo inteiro da plataforma: nem todo código ocorre nas rotas REST.

- 400 `INVALID_EMAIL` — Digite um e-mail válido.
- 400 `INVALID_CODE` — O código precisa ter 6 dígitos.
- 400 `INVALID_NAME` — Digite seu nome (entre 2 e 80 caracteres).
- 400 `INVALID_CPF` — Digite um CPF válido.
- 400 `INVALID_CNPJ` — Digite um CNPJ válido.
- 400 `INVALID_PHONE` — Digite um telefone válido com DDD.
- 400 `INVALID_DATE` — Digite uma data válida (DD/MM/AAAA).
- 400 `INVALID_AMOUNT` — Digite um valor entre R$ 0,01 e R$ 25.000,00.
- 400 `INVALID_REVIEW_DAYS` — O modo revisão dura 1, 3 ou 7 dias.
- 400 `INVALID_ROLE_NAME` — Nome de role inválido: use letras maiúsculas, números e _ (2 a 32 caracteres).
- 400 `INVALID_PERMISSION` — Permissão fora do catálogo para este recurso.
- 400 `PIX_KEY_REQUIRED` — Informe a chave Pix da conta para conectar este banco.
- 400 `INVALID_PAYER_NAME` — Digite o nome do pagador (entre 2 e 140 caracteres).
- 400 `INVALID_PAYER_DOCUMENT` — Digite um CPF ou CNPJ válido para o pagador.
- 400 `INVALID_RECURRENCE_TEXT` — Descrição e contrato são obrigatórios e têm até 35 caracteres.
- 400 `INVALID_RECURRENCE_VALUE` — Confira o valor: fixo exige valor; variável aceita só um valor mínimo.
- 400 `INVALID_RECURRENCE_DATES` — O primeiro pagamento precisa ser daqui a pelo menos 2 dias, e a data final não pode ser anterior a ele.
- 400 `INVALID_PERIODICITY` — Escolha uma periodicidade: semanal, mensal, trimestral, semestral ou anual.
- 400 `INVALID_RECIPIENT_BANK_DATA` — Confira agência (até 4 dígitos), conta e tipo de conta.
- 400 `RECIPIENT_BANK_DATA_REQUIRED` — Informe agência, conta e tipo de conta desta conta bancária para usar o Pix Automático.
- 400 `INVALID_SCOPE` — Escopo de chave inválido.
- 400 `VALIDATION_FAILED` — Dados inválidos.
- 400 `WEBHOOK_URL_INVALID` — URL de webhook inválida: use https e um endereço público.
- 400 `INVALID_WEBHOOK_EVENT` — Evento de webhook inválido.
- 400 `IDEMPOTENCY_KEY_REQUIRED` — Envie o cabeçalho Idempotency-Key com um valor único por cobrança.
- 401 `CODE_EXPIRED` — Esse código expirou. Peça um novo.
- 401 `CODE_INVALID` — Código incorreto. Confira o e-mail e tente de novo.
- 401 `UNAUTHENTICATED` — Sua sessão expirou. Entre novamente.
- 401 `REALTIME_TICKET_INVALID` — Sessão de tempo real inválida
- 401 `API_KEY_INVALID` — Chave de API inválida ou revogada.
- 401 `API_KEY_EXPIRED` — Chave de API expirada.
- 403 `FORBIDDEN` — Você não tem permissão para fazer isso.
- 403 `ONBOARDING_REQUIRED` — Complete seu cadastro para continuar.
- 403 `SIMULATION_DISABLED` — Simulação de pagamento desativada.
- 403 `STAFF_INACTIVE` — Este acesso da equipe está desativado. Fale com um administrador.
- 403 `ROLE_PROTECTED` — Roles do sistema não podem ser alteradas nem removidas.
- 403 `INSUFFICIENT_SCOPE` — A chave de API não tem permissão para esta operação.
- 404 `PROVIDER_CHARGE_NOT_FOUND` — O banco não encontrou essa cobrança.
- 404 `PAYMENT_NOT_FOUND` — Pagamento não encontrado.
- 404 `PROVIDER_EVENT_NOT_FOUND` — Evento do provedor não encontrado.
- 404 `MCP_IDENTITY_NOT_FOUND` — Este membro não tem acesso MCP.
- 404 `NOT_FOUND` — Registro não encontrado.
- 409 `EMAIL_IN_USE` — Já existe um cliente com este e-mail.
- 409 `CPF_IN_USE` — Esse CPF já tem cadastro.
- 409 `CNPJ_IN_USE` — Esse CNPJ já tem cadastro.
- 409 `CHARGE_NOT_PENDING` — Essa cobrança não está mais aguardando pagamento.
- 409 `CHARGE_STATUS_UNSUPPORTED` — Esse banco não permite consultar a cobrança. Aguarde o webhook ou reconcilie o período da conta.
- 409 `SETUP_ALREADY_DONE` — O primeiro administrador já foi criado. Entre pelo login.
- 409 `STAFF_EXISTS` — Este e-mail já faz parte da equipe.
- 409 `ROLE_IN_USE` — Esta role ainda tem membros. Mova-os para outra role antes de remover.
- 409 `PAYMENT_AMOUNT_MISMATCH` — O valor pago não confere com o valor da cobrança.
- 409 `REFUND_UNSUPPORTED` — Esse banco não permite estorno pelo Opa Pingou.
- 409 `PAYMENT_NOT_REFUNDABLE` — Esse pagamento não pode ser estornado.
- 409 `REFUND_INSUFFICIENT_FUNDS` — Saldo insuficiente no provedor para o estorno.
- 409 `BANK_ACCOUNT_DUPLICATE` — Essa chave Pix já está conectada em outra conta deste banco.
- 409 `BANK_ACCOUNT_PIX_KEY_CHANGE` — Para usar outra chave Pix, conecte uma nova conta.
- 409 `BANK_ACCOUNT_DISCONNECTED` — Essa conta está desconectada. Reconecte para usar.
- 409 `MCP_IDENTITY_EXISTS` — Este membro já tem um acesso MCP.
- 409 `PAYER_DOCUMENT_IN_USE` — Você já cadastrou um pagador com esse CPF ou CNPJ.
- 409 `PAYER_IN_USE` — Esse pagador tem recorrências e não pode ser removido.
- 409 `RECURRENCE_NOT_APPROVED` — O pagador ainda não autorizou essa recorrência.
- 409 `RECURRENCE_NOT_CANCELABLE` — Essa recorrência já foi encerrada.
- 409 `RECURRING_CHARGE_OUTSIDE_WINDOW` — A cobrança do ciclo só pode ser enviada entre 10 e 2 dias antes do vencimento.
- 409 `RECURRING_CHARGE_EXISTS` — A cobrança desse ciclo já foi enviada.
- 409 `RECURRING_CHARGE_FIXED` — Recorrências de valor fixo são cobradas automaticamente.
- 409 `API_KEY_LIMIT` — Limite de chaves de API ativas atingido.
- 409 `WEBHOOK_ENDPOINT_LIMIT` — Limite de endpoints de webhook ativos atingido.
- 409 `WEBHOOK_ENDPOINT_DISABLED` — Endpoint de webhook desativado.
- 409 `WEBHOOK_DELIVERY_IN_PROGRESS` — Já existe uma entrega em andamento para este evento.
- 409 `IDEMPOTENCY_KEY_REUSED` — Esta Idempotency-Key já foi usada com outro corpo de requisição.
- 409 `IDEMPOTENCY_IN_PROGRESS` — Uma requisição com esta Idempotency-Key ainda está em andamento.
- 422 `NO_ROUTABLE_ACCOUNT` — Conecte um banco para gerar cobranças.
- 422 `BANK_CREDENTIALS_INVALID` — Não conseguimos validar as credenciais. Confira as chaves.
- 422 `PROVIDER_REJECTED` — O provedor de pagamentos recusou o pedido. Confira os dados enviados antes de tentar de novo.
- 422 `PAYMENT_LINK_UNAVAILABLE` — Conecte uma conta Mercado Pago ou Abacate Pay para gerar links de pagamento.
- 422 `CARD_FEE_PASSTHROUGH_UNSUPPORTED` — Repassar a tarifa do cartão ao comprador só vale para link de pagamento no Abacate Pay.
- 422 `RECURRENCE_UNSUPPORTED` — Essa conta não oferece Pix Automático.
- 422 `RECURRENCE_SCOPES_MISSING` — O banco recusou o acesso ao Pix Automático. Confira se a credencial tem os escopos de Pix Automático habilitados.
- 422 `DEVICE_WITHOUT_PUSH_TOKEN` — Esse dispositivo não registrou um token de push.
- 429 `CODE_COOLDOWN` — Aguarde um instante antes de pedir outro código.
- 429 `CODE_LOCKED` — Muitas tentativas. Peça um novo código.
- 429 `RATE_LIMITED` — Muitas requisições. Tente de novo em instantes.
- 500 `NETWORK` — Sem conexão. Verifique sua internet e tente de novo.
- 500 `UNKNOWN` — Algo deu errado. Tente de novo.
- 503 `PROVIDER_ERROR` — O provedor de pagamentos respondeu com erro. Tente de novo.
- 503 `PROVIDER_UNAVAILABLE` — Não conseguimos falar com o provedor de pagamentos. Tente de novo em instantes.
- 503 `WEBHOOK_REGISTRATION_FAILED` — A conta foi conectada, mas não conseguimos registrar o webhook no provedor.

Recusa do provedor · 422 · application/problem+json:

```json
{
  "type": "https://opapingou.com.br/docs#erro-PROVIDER_REJECTED",
  "title": "O provedor de pagamentos recusou o pedido. Confira os dados enviados antes de tentar de novo.",
  "status": 422,
  "code": "PROVIDER_REJECTED",
  "provider": "ABACATE",
  "providerStatus": 400,
  "providerCode": "Invalid description",
  "requestId": "req_01J9Z3K8X2"
}
```

Erro de validação · 400 · application/problem+json:

```json
{
  "type": "https://opapingou.com.br/docs#erro-VALIDATION_FAILED",
  "title": "Dados inválidos.",
  "status": 400,
  "code": "VALIDATION_FAILED",
  "requestId": "req_01J9Z3K8X2",
  "errors": [
    {
      "field": "amountCents",
      "message": "Informe um valor maior que zero."
    }
  ]
}
```

## Limites

Cada chave pode fazer até 300 requisições por minuto. A criação de cobranças (`POST /v1/charges`) tem um limite próprio, de 60 por minuto, e cada endereço IP pode fazer até 1200 requisições por minuto.

Ao passar do limite, a API responde `429` com o código `RATE_LIMITED`. Espere o número de segundos de `Retry-After` antes de tentar de novo.

- `Retry-After`: segundos até a próxima tentativa.
- `X-RateLimit-Limit`: o limite da janela atual.
- `X-RateLimit-Remaining`: requisições que ainda cabem na janela.
- `X-RateLimit-Reset`: segundos até a janela ser renovada.

Limite excedido · 429:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/problem+json
Retry-After: 12
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 12
```

## Paginação

Listas paginadas aceitam `page` (a partir de 1; padrão 1) e `pageSize` (padrão 20; máximo 100) na query string.

A resposta traz os itens em `items` e repete `page` e `pageSize` ao lado de `total`, o número de itens do filtro.

```bash
curl "https://api.opapingou.com.br/v1/webhook-deliveries?page=2&pageSize=50" \
  -H "Authorization: Bearer $OPAPINGOU_API_KEY"
```

Envelope da resposta:

```json
{
  "items": [ … ],
  "total": 132,
  "page": 2,
  "pageSize": 50
}
```

## Referência das rotas

### Consultar perfil — `GET /v1/me`

Devolve o cliente dono da chave e a empresa dele.

- Acesso: chave com o escopo `profile:read`.
- Sucesso: `200` com `User`.

Exemplo:

```bash
curl "https://api.opapingou.com.br/v1/me" \
  -H "Authorization: Bearer $OPAPINGOU_API_KEY"
```

Resposta (`200`):

```json
{
  "id": "1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f",
  "email": "ana@lojadaana.com.br",
  "name": "Ana Souza",
  "emailVerifiedAt": null,
  "cpf": "12345678909",
  "phone": "62999990000",
  "birthDate": "1990-05-17T00:00:00.000Z",
  "onboardingCompletedAt": null,
  "role": {
    "id": "6f7a8b9c-0d1e-4f2a-b3c4-d5e6f7a8b9c0",
    "name": "USER",
    "permissions": []
  },
  "createdAt": "2026-09-30T14:32:00.000Z",
  "company": {
    "id": "2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e",
    "legalName": "Loja da Ana Ltda.",
    "cnpj": "12345678000190",
    "createdAt": "2026-09-30T14:32:00.000Z"
  }
}
```

### Criar cobrança — `POST /v1/charges`

Cria uma cobrança. O roteamento escolhe a conta com cota grátis disponível, a menos que `bankAccountId` seja informado.

- Acesso: chave com o escopo `charges:write`.
- Sucesso: `201` com `Charge`.
- Cabeçalho `Idempotency-Key`: Obrigatório. Valor único por cobrança, de 1 a 255 caracteres ASCII visíveis. Repetir a requisição com a mesma chave devolve a mesma cobrança, sem criar outra.

Corpo (JSON):

- `amountCents` — `integer`, obrigatório. Valor em centavos.
- `description` — `string`, opcional. Até 140 caracteres. Em conta Abacate Pay, vai ao provedor sem acentos, com travessões trocados por hífen e cortada em 100 caracteres; a cobrança guarda o texto original.
- `validity` — `ChargeValidity` (`FIFTEEN_MIN` | `ONE_HOUR` | `ONE_DAY` | `SEVEN_DAYS`), obrigatório. Por quanto tempo a cobrança pode ser paga.
- `kind` — `ChargeKind` (`PIX_QR` | `PAYMENT_LINK`), opcional. Padrão: `PIX_QR`. `PAYMENT_LINK` exige uma conta Mercado Pago ou Abacate Pay conectada. No Abacate Pay o link aceita Pix e cartão (à vista) e não expira no provedor: a cobrança expira só no Opa Pingou, e um pagamento feito depois disso ainda a marca como paga.
- `bankAccountId` — `id`, opcional. Cobra nesta conta: no `PIX_QR` pula o roteamento; no `PAYMENT_LINK` escolhe a conta do link (sem ela, a padrão entre Mercado Pago e Abacate Pay, senão a primeira).
- `passCardFeeToPayer` — `boolean`, opcional. Só `PAYMENT_LINK` numa conta Abacate Pay: quem paga no cartão paga também a tarifa do cartão, por cima do valor (o Pix não muda). Padrão `false`. Em qualquer outro caso, `true` responde `422` `CARD_FEE_PASSTHROUGH_UNSUPPORTED`. O pagamento registra sempre o valor da cobrança.

Observações:

- Validação estrita: um campo fora da lista abaixo responde `400` `VALIDATION_FAILED`, com `errors` apontando o campo desconhecido.
- Responde `201` com a cobrança. Repetir com a mesma `Idempotency-Key` e o mesmo corpo responde `201` com a mesma cobrança, no estado atual, e o cabeçalho `Idempotent-Replayed: true`.
- Sem o cabeçalho: `400` `IDEMPOTENCY_KEY_REQUIRED`. Mesma chave com outro corpo: `409` `IDEMPOTENCY_KEY_REUSED`. Enquanto a primeira requisição ainda roda: `409` `IDEMPOTENCY_IN_PROGRESS`, com `Retry-After`.
- Com `bankAccountId` de uma conta fora da chave (outra empresa, outro modo ou fora da lista de contas da chave): `404` `NOT_FOUND`. Uma chave de teste só cobra em contas de teste.
- Limite de 60 requisições por minuto por chave nesta rota, além do limite geral da chave.
- O provedor da conta recusou a cobrança: `422` `PROVIDER_REJECTED`, com `providerCode` e `providerDetail` dizendo o motivo. Provedor fora do ar: `503` `PROVIDER_UNAVAILABLE`, com `Retry-After`; repita com a mesma `Idempotency-Key`.
- Quando a cobrança é paga, expira ou é cancelada, os endpoints inscritos recebem `charge.paid`, `charge.expired` ou `charge.canceled`.

Exemplo:

```bash
curl -X POST "https://api.opapingou.com.br/v1/charges" \
  -H "Authorization: Bearer $OPAPINGOU_API_KEY" \
  -H "Idempotency-Key: <valor-unico-por-cobranca>" \
  -H "Content-Type: application/json" \
  -d '{
  "amountCents": 35000,
  "description": "Pedido 1042",
  "validity": "ONE_HOUR"
}'
```

Resposta (`201`):

```json
{
  "id": "9a8b7c6d-5e4f-4321-a0b1-c2d3e4f5a6b7",
  "bankAccountId": "b3f1c2d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
  "bank": {
    "id": "inter",
    "provider": "INTER",
    "name": "Banco Inter",
    "mark": "in",
    "color": "#ff7a00",
    "method": "2 chaves de API + certificado",
    "fields": [
      {
        "key": "clientId",
        "label": "Client ID",
        "placeholder": "a1b2c3d4-…",
        "secret": false
      }
    ],
    "help": "No Internet Banking Inter (conta PJ), crie uma integração com as permissões abaixo…",
    "cert": true,
    "oauth": false,
    "pixKey": true,
    "steps": [
      "Entre no Internet Banking do Inter Empresas pelo computador."
    ],
    "permissions": [
      {
        "scope": "cob.write",
        "label": "Emitir cobrança Pix",
        "reason": "Gerar o QR Code de cada cobrança que você cria no app.",
        "required": true,
        "withoutIt": null
      }
    ]
  },
  "bankAccount": {
    "id": "b3f1c2d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
    "provider": "INTER",
    "label": "Conta da loja",
    "displayName": "Conta da loja",
    "testMode": false
  },
  "amountCents": 35000,
  "description": "Pedido 1042",
  "validity": "ONE_HOUR",
  "expiresAt": "2026-09-30T15:32:00.000Z",
  "status": "PENDING",
  "kind": "PIX_QR",
  "txid": "7f3c2a9e4b1d48c6a5f0b2e9d4c7f1a8",
  "brCode": "00020126580014br.gov.bcb.pix…6304A1B2",
  "paymentLink": null,
  "passCardFeeToPayer": false,
  "providerRef": "7f3c2a9e4b1d48c6a5f0b2e9d4c7f1a8",
  "paymentId": null,
  "feeCents": 0,
  "feeAvoidedCents": 119,
  "routingReason": "62 Pix grátis sobrando",
  "paidAt": null,
  "createdAt": "2026-09-30T14:32:00.000Z"
}
```

### Consultar cobrança — `GET /v1/charges/{id}`

Devolve uma cobrança do cliente.

- Acesso: chave com o escopo `charges:read`.
- Sucesso: `200` com `Charge`.
- Parâmetros de caminho: `id` (identificador do recurso).

Exemplo:

```bash
curl "https://api.opapingou.com.br/v1/charges/{id}" \
  -H "Authorization: Bearer $OPAPINGOU_API_KEY"
```

Resposta (`200`):

```json
{
  "id": "9a8b7c6d-5e4f-4321-a0b1-c2d3e4f5a6b7",
  "bankAccountId": "b3f1c2d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
  "bank": {
    "id": "inter",
    "provider": "INTER",
    "name": "Banco Inter",
    "mark": "in",
    "color": "#ff7a00",
    "method": "2 chaves de API + certificado",
    "fields": [
      {
        "key": "clientId",
        "label": "Client ID",
        "placeholder": "a1b2c3d4-…",
        "secret": false
      }
    ],
    "help": "No Internet Banking Inter (conta PJ), crie uma integração com as permissões abaixo…",
    "cert": true,
    "oauth": false,
    "pixKey": true,
    "steps": [
      "Entre no Internet Banking do Inter Empresas pelo computador."
    ],
    "permissions": [
      {
        "scope": "cob.write",
        "label": "Emitir cobrança Pix",
        "reason": "Gerar o QR Code de cada cobrança que você cria no app.",
        "required": true,
        "withoutIt": null
      }
    ]
  },
  "bankAccount": {
    "id": "b3f1c2d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
    "provider": "INTER",
    "label": "Conta da loja",
    "displayName": "Conta da loja",
    "testMode": false
  },
  "amountCents": 35000,
  "description": "Pedido 1042",
  "validity": "ONE_HOUR",
  "expiresAt": "2026-09-30T15:32:00.000Z",
  "status": "PENDING",
  "kind": "PIX_QR",
  "txid": "7f3c2a9e4b1d48c6a5f0b2e9d4c7f1a8",
  "brCode": "00020126580014br.gov.bcb.pix…6304A1B2",
  "paymentLink": null,
  "passCardFeeToPayer": false,
  "providerRef": "7f3c2a9e4b1d48c6a5f0b2e9d4c7f1a8",
  "paymentId": null,
  "feeCents": 0,
  "feeAvoidedCents": 119,
  "routingReason": "62 Pix grátis sobrando",
  "paidAt": null,
  "createdAt": "2026-09-30T14:32:00.000Z"
}
```

### Consultar pagamento — `GET /v1/payments/{id}`

Devolve um pagamento do cliente. O `id` vem de `paymentId` na cobrança ou do evento `payment.confirmed`.

- Acesso: chave com o escopo `payments:read`.
- Sucesso: `200` com `Payment`.
- Parâmetros de caminho: `id` (identificador do recurso).

Observações:

- Um pagamento numa conta fora da chave (outro modo ou fora da lista de contas da chave) responde `404` `PAYMENT_NOT_FOUND`.

Exemplo:

```bash
curl "https://api.opapingou.com.br/v1/payments/{id}" \
  -H "Authorization: Bearer $OPAPINGOU_API_KEY"
```

Resposta (`200`):

```json
{
  "id": "4d5e6f70-8a9b-4c1d-9e2f-3a4b5c6d7e8f",
  "amountCents": 35000,
  "netCents": 33715,
  "providerFeeCents": 1285,
  "origin": "PAYMENT_LINK",
  "method": "CREDIT_CARD",
  "status": "CONFIRMED",
  "provider": "ABACATE",
  "bankAccount": {
    "id": "b3f1c2d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
    "provider": "INTER",
    "label": "Conta da loja",
    "displayName": "Conta da loja",
    "testMode": false
  },
  "charge": {
    "id": "9a8b7c6d-5e4f-4321-a0b1-c2d3e4f5a6b7",
    "kind": "PAYMENT_LINK",
    "description": "Inscrição 42"
  },
  "payerName": "Carlos Comprador",
  "payerMessage": null,
  "paidAt": "2026-10-22T14:32:00.000Z",
  "refundedAt": null,
  "refundRequestedAt": null,
  "refundReason": null,
  "refundNextAttemptAt": null,
  "refundFailedAt": null
}
```

### Estornar pagamento — `POST /v1/payments/{id}/refund`

Pede ao provedor o estorno total do pagamento. Hoje só para pagamentos em contas Abacate Pay (Pix e cartão).

- Acesso: chave com o escopo `payments:write`.
- Sucesso: `202` com `Payment`.
- Parâmetros de caminho: `id` (identificador do recurso).

Corpo (JSON):

- `reason` — `string`, opcional. Motivo do estorno, até 500 caracteres. Vai para o histórico do provedor.

Observações:

- Responde `202` com o pagamento: o pedido foi aceito pelo provedor e `refundRequestedAt` fica preenchido. O evento `payment.refund_requested` sai na hora; `payment.refunded` sai quando o provedor confirma — no Abacate Pay, em geral na mesma chamada, e o `status` já volta `REFUNDED`.
- O estorno é sempre total e sai do saldo da loja no provedor. A tarifa do provedor não é devolvida.
- Repetir o pedido num pagamento ainda `CONFIRMED` chama o provedor de novo (idempotente) e responde `202` outra vez. Num pagamento já `REFUNDED` ou `CHARGED_BACK`: `409` `PAYMENT_NOT_REFUNDABLE`.
- Sem saldo na loja do provedor, o estorno entra numa fila: a resposta continua `202`, com `refundNextAttemptAt` preenchido, e o Opa Pingou tenta de novo sozinho (15 min, 1 h, 6 h e depois uma vez por dia). Se em 30 dias não houver saldo, a fila desiste: `refundFailedAt` é preenchido e sai `payment.refund_failed`. Repetir o pedido tira da fila e tenta na hora.
- `409` `REFUND_UNSUPPORTED` quando o banco da conta não permite estorno pelo Opa Pingou; `503` `PROVIDER_UNAVAILABLE` quando o provedor está ocupado com esse pagamento (repita em instantes).
- O corpo pode ser omitido. Validação estrita: um campo fora da lista responde `400` `VALIDATION_FAILED`.

Exemplo:

```bash
curl -X POST "https://api.opapingou.com.br/v1/payments/{id}/refund" \
  -H "Authorization: Bearer $OPAPINGOU_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "reason": "Inscrição reprovada"
}'
```

Resposta (`202`):

```json
{
  "id": "4d5e6f70-8a9b-4c1d-9e2f-3a4b5c6d7e8f",
  "amountCents": 35000,
  "netCents": 33715,
  "providerFeeCents": 1285,
  "origin": "PAYMENT_LINK",
  "method": "CREDIT_CARD",
  "status": "CONFIRMED",
  "provider": "ABACATE",
  "bankAccount": {
    "id": "b3f1c2d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
    "provider": "INTER",
    "label": "Conta da loja",
    "displayName": "Conta da loja",
    "testMode": false
  },
  "charge": {
    "id": "9a8b7c6d-5e4f-4321-a0b1-c2d3e4f5a6b7",
    "kind": "PAYMENT_LINK",
    "description": "Inscrição 42"
  },
  "payerName": "Carlos Comprador",
  "payerMessage": null,
  "paidAt": "2026-10-22T14:32:00.000Z",
  "refundedAt": null,
  "refundRequestedAt": null,
  "refundReason": null,
  "refundNextAttemptAt": null,
  "refundFailedAt": null
}
```

### Listar endpoints de webhook — `GET /v1/webhook-endpoints`

Endpoints de webhook da conta, no modo da chave. A lista vem inteira, sem paginação.

- Acesso: chave com o escopo `webhooks:read`.
- Sucesso: `200` com uma lista de `WebhookEndpoint`.

Exemplo:

```bash
curl "https://api.opapingou.com.br/v1/webhook-endpoints" \
  -H "Authorization: Bearer $OPAPINGOU_API_KEY"
```

Resposta (`200`):

```json
[
  {
    "id": "c4d5e6f7-8a9b-4c0d-a1e2-f3a4b5c6d7e8",
    "url": "https://lojadaana.com.br/webhooks/opapingou",
    "description": "Sistema de pedidos",
    "events": [
      "payment.confirmed",
      "charge.paid"
    ],
    "bankAccountIds": [],
    "testMode": false,
    "status": "ACTIVE",
    "disabledAt": null,
    "disabledReason": null,
    "lastDeliveredAt": "2026-10-03T14:32:01.000Z",
    "createdAt": "2026-09-30T14:32:00.000Z",
    "updatedAt": "2026-09-30T14:32:00.000Z"
  }
]
```

### Criar endpoint de webhook — `POST /v1/webhook-endpoints`

Cadastra um endpoint e devolve o segredo de assinatura, uma única vez. Responde `201`. O modo (teste ou produção) vem da chave: não há campo `testMode`. Falhas: `WEBHOOK_URL_INVALID`, `INVALID_WEBHOOK_EVENT` e `WEBHOOK_ENDPOINT_LIMIT` (até 10 endpoints ativos por conta).

- Acesso: chave com o escopo `webhooks:write`.
- Sucesso: `201` com `WebhookEndpointCreated`.

Corpo (JSON):

- `url` — `string`, obrigatório. URL `https` pública (sem IP, sem usuário e senha). Endereços privados são recusados.
- `description` — `string`, opcional. Nota livre para você.
- `events` — `string[]`, obrigatório. Ao menos um evento da seção Webhooks. `ping` não pode ser inscrito na lista de eventos: é o evento de teste (`POST …/test`) e chega assinado como os demais.
- `bankAccountIds` — `id[]`, opcional. Limita aos eventos destas contas. Vazio ou ausente: todas as contas do modo da chave.

Exemplo:

```bash
curl -X POST "https://api.opapingou.com.br/v1/webhook-endpoints" \
  -H "Authorization: Bearer $OPAPINGOU_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "url": "https://lojadaana.com.br/webhooks/opapingou",
  "events": [
    "payment.confirmed",
    "charge.expired"
  ]
}'
```

Resposta (`201`):

```json
{
  "id": "c4d5e6f7-8a9b-4c0d-a1e2-f3a4b5c6d7e8",
  "url": "https://lojadaana.com.br/webhooks/opapingou",
  "description": "Sistema de pedidos",
  "events": [
    "payment.confirmed",
    "charge.paid"
  ],
  "bankAccountIds": [],
  "testMode": false,
  "status": "ACTIVE",
  "disabledAt": null,
  "disabledReason": null,
  "lastDeliveredAt": "2026-10-03T14:32:01.000Z",
  "createdAt": "2026-09-30T14:32:00.000Z",
  "updatedAt": "2026-09-30T14:32:00.000Z",
  "secret": "whsec_Zx3kQ8mT1vN7pR5sB2cD9fG4hJ6wY0aL"
}
```

### Consultar endpoint de webhook — `GET /v1/webhook-endpoints/{id}`

Devolve um endpoint de webhook. O segredo não é devolvido.

- Acesso: chave com o escopo `webhooks:read`.
- Sucesso: `200` com `WebhookEndpoint`.
- Parâmetros de caminho: `id` (identificador do recurso).

Exemplo:

```bash
curl "https://api.opapingou.com.br/v1/webhook-endpoints/{id}" \
  -H "Authorization: Bearer $OPAPINGOU_API_KEY"
```

Resposta (`200`):

```json
{
  "id": "c4d5e6f7-8a9b-4c0d-a1e2-f3a4b5c6d7e8",
  "url": "https://lojadaana.com.br/webhooks/opapingou",
  "description": "Sistema de pedidos",
  "events": [
    "payment.confirmed",
    "charge.paid"
  ],
  "bankAccountIds": [],
  "testMode": false,
  "status": "ACTIVE",
  "disabledAt": null,
  "disabledReason": null,
  "lastDeliveredAt": "2026-10-03T14:32:01.000Z",
  "createdAt": "2026-09-30T14:32:00.000Z",
  "updatedAt": "2026-09-30T14:32:00.000Z"
}
```

### Atualizar endpoint de webhook — `PATCH /v1/webhook-endpoints/{id}`

Altera URL, descrição, eventos, contas ou status. Enviar `status: ACTIVE` reativa um endpoint desativado.

- Acesso: chave com o escopo `webhooks:write`.
- Sucesso: `200` com `WebhookEndpoint`.
- Parâmetros de caminho: `id` (identificador do recurso).

Corpo (JSON):

- `url` — `string`, opcional. Nova URL `https` pública.
- `description` — `string`, opcional
- `events` — `string[]`, opcional. Substitui a lista de eventos (ao menos um).
- `bankAccountIds` — `id[]`, opcional. Substitui a lista de contas; vazia = todas.
- `status` — `WebhookEndpointStatus` (`ACTIVE` | `DISABLED`), opcional. `ACTIVE` reativa um endpoint desativado; `DISABLED` pausa as entregas.

Exemplo:

```bash
curl -X PATCH "https://api.opapingou.com.br/v1/webhook-endpoints/{id}" \
  -H "Authorization: Bearer $OPAPINGOU_API_KEY"
```

Resposta (`200`):

```json
{
  "id": "c4d5e6f7-8a9b-4c0d-a1e2-f3a4b5c6d7e8",
  "url": "https://lojadaana.com.br/webhooks/opapingou",
  "description": "Sistema de pedidos",
  "events": [
    "payment.confirmed",
    "charge.paid"
  ],
  "bankAccountIds": [],
  "testMode": false,
  "status": "ACTIVE",
  "disabledAt": null,
  "disabledReason": null,
  "lastDeliveredAt": "2026-10-03T14:32:01.000Z",
  "createdAt": "2026-09-30T14:32:00.000Z",
  "updatedAt": "2026-09-30T14:32:00.000Z"
}
```

### Remover endpoint de webhook — `DELETE /v1/webhook-endpoints/{id}`

Remove o endpoint e o seu histórico de entregas. Responde `204`, sem corpo.

- Acesso: chave com o escopo `webhooks:write`.
- Sucesso: `204`, sem corpo.
- Parâmetros de caminho: `id` (identificador do recurso).

Exemplo:

```bash
curl -X DELETE "https://api.opapingou.com.br/v1/webhook-endpoints/{id}" \
  -H "Authorization: Bearer $OPAPINGOU_API_KEY"
```

### Trocar segredo do endpoint — `POST /v1/webhook-endpoints/{id}/rotate-secret`

Gera um novo segredo e o devolve uma única vez. O segredo antigo deixa de valer na hora, sem período de convivência: atualize o seu servidor antes de trocar.

- Acesso: chave com o escopo `webhooks:write`.
- Sucesso: `200` com `WebhookEndpointCreated`.
- Parâmetros de caminho: `id` (identificador do recurso).

Exemplo:

```bash
curl -X POST "https://api.opapingou.com.br/v1/webhook-endpoints/{id}/rotate-secret" \
  -H "Authorization: Bearer $OPAPINGOU_API_KEY"
```

Resposta (`200`):

```json
{
  "id": "c4d5e6f7-8a9b-4c0d-a1e2-f3a4b5c6d7e8",
  "url": "https://lojadaana.com.br/webhooks/opapingou",
  "description": "Sistema de pedidos",
  "events": [
    "payment.confirmed",
    "charge.paid"
  ],
  "bankAccountIds": [],
  "testMode": false,
  "status": "ACTIVE",
  "disabledAt": null,
  "disabledReason": null,
  "lastDeliveredAt": "2026-10-03T14:32:01.000Z",
  "createdAt": "2026-09-30T14:32:00.000Z",
  "updatedAt": "2026-09-30T14:32:00.000Z",
  "secret": "whsec_Zx3kQ8mT1vN7pR5sB2cD9fG4hJ6wY0aL"
}
```

### Enviar evento de teste — `POST /v1/webhook-endpoints/{id}/test`

Envia um evento `ping` ao endpoint, ignorando filtros de evento e de conta. Responde `202` com a entrega criada.

- Acesso: chave com o escopo `webhooks:write`.
- Sucesso: `202` com `WebhookDelivery`.
- Parâmetros de caminho: `id` (identificador do recurso).

Exemplo:

```bash
curl -X POST "https://api.opapingou.com.br/v1/webhook-endpoints/{id}/test" \
  -H "Authorization: Bearer $OPAPINGOU_API_KEY"
```

Resposta (`202`):

```json
{
  "id": "d5e6f7a8-9b0c-4d1e-b2f3-a4b5c6d7e8f9",
  "endpointId": "c4d5e6f7-8a9b-4c0d-a1e2-f3a4b5c6d7e8",
  "status": "SUCCEEDED",
  "attempts": 1,
  "nextAttemptAt": null,
  "lastAttemptAt": "2026-10-03T14:32:01.000Z",
  "lastStatusCode": 200,
  "lastError": null,
  "lastResponseBody": "ok",
  "deliveredAt": "2026-10-03T14:32:01.000Z",
  "createdAt": "2026-10-03T14:32:00.000Z",
  "event": {
    "id": "e6f7a8b9-0c1d-4e2f-83a4-b5c6d7e8f9a0",
    "type": "payment.confirmed",
    "occurredAt": "2026-10-03T14:32:00.000Z",
    "payload": {
      "id": "e6f7a8b9-0c1d-4e2f-83a4-b5c6d7e8f9a0",
      "type": "payment.confirmed",
      "occurredAt": "2026-10-03T14:32:00.000Z",
      "testMode": false,
      "data": {
        "type": "payment",
        "object": {
          "id": "4d5e6f70-8a9b-4c1d-9e2f-3a4b5c6d7e8f",
          "status": "CONFIRMED"
        }
      }
    }
  }
}
```

### Listar entregas de webhook — `GET /v1/webhook-deliveries`

Histórico paginado das entregas, da mais recente para a mais antiga. Uma chave restrita a algumas contas só vê as entregas dessas contas.

- Acesso: chave com o escopo `webhooks:read`.
- Sucesso: `200` com `WebhookDeliveryPage`.

Query string:

- `endpointId` — `id`, opcional. Só as entregas deste endpoint.
- `status` — `WebhookDeliveryStatus` (`PENDING` | `DELIVERING` | `SUCCEEDED` | `FAILED`), opcional. Filtra pelo status da entrega.
- `page` — `integer`, opcional. Padrão: `1`.
- `pageSize` — `integer`, opcional. Padrão: `20`; máximo `100`.

Exemplo:

```bash
curl "https://api.opapingou.com.br/v1/webhook-deliveries" \
  -H "Authorization: Bearer $OPAPINGOU_API_KEY"
```

Resposta (`200`):

```json
{
  "items": [
    {
      "id": "d5e6f7a8-9b0c-4d1e-b2f3-a4b5c6d7e8f9",
      "endpointId": "c4d5e6f7-8a9b-4c0d-a1e2-f3a4b5c6d7e8",
      "status": "SUCCEEDED",
      "attempts": 1,
      "nextAttemptAt": null,
      "lastAttemptAt": "2026-10-03T14:32:01.000Z",
      "lastStatusCode": 200,
      "lastError": null,
      "lastResponseBody": "ok",
      "deliveredAt": "2026-10-03T14:32:01.000Z",
      "createdAt": "2026-10-03T14:32:00.000Z",
      "event": {
        "id": "e6f7a8b9-0c1d-4e2f-83a4-b5c6d7e8f9a0",
        "type": "payment.confirmed",
        "occurredAt": "2026-10-03T14:32:00.000Z",
        "payload": {
          "id": "e6f7a8b9-0c1d-4e2f-83a4-b5c6d7e8f9a0",
          "type": "payment.confirmed",
          "occurredAt": "2026-10-03T14:32:00.000Z",
          "testMode": false,
          "data": {
            "type": "payment",
            "object": {
              "id": "4d5e6f70-8a9b-4c1d-9e2f-3a4b5c6d7e8f",
              "status": "CONFIRMED"
            }
          }
        }
      }
    }
  ],
  "total": 132,
  "page": 1,
  "pageSize": 20
}
```

### Reenviar entrega — `POST /v1/webhook-deliveries/{id}/redeliver`

Envia de novo uma entrega, com o mesmo `id` de evento. Responde `202`. Falha com `409` `WEBHOOK_DELIVERY_IN_PROGRESS` enquanto a última tentativa está pendente e com `409` `WEBHOOK_ENDPOINT_DISABLED` se o endpoint está desativado.

- Acesso: chave com o escopo `webhooks:write`.
- Sucesso: `202` com `WebhookDelivery`.
- Parâmetros de caminho: `id` (identificador do recurso).

Exemplo:

```bash
curl -X POST "https://api.opapingou.com.br/v1/webhook-deliveries/{id}/redeliver" \
  -H "Authorization: Bearer $OPAPINGOU_API_KEY"
```

Resposta (`202`):

```json
{
  "id": "d5e6f7a8-9b0c-4d1e-b2f3-a4b5c6d7e8f9",
  "endpointId": "c4d5e6f7-8a9b-4c0d-a1e2-f3a4b5c6d7e8",
  "status": "SUCCEEDED",
  "attempts": 1,
  "nextAttemptAt": null,
  "lastAttemptAt": "2026-10-03T14:32:01.000Z",
  "lastStatusCode": 200,
  "lastError": null,
  "lastResponseBody": "ok",
  "deliveredAt": "2026-10-03T14:32:01.000Z",
  "createdAt": "2026-10-03T14:32:00.000Z",
  "event": {
    "id": "e6f7a8b9-0c1d-4e2f-83a4-b5c6d7e8f9a0",
    "type": "payment.confirmed",
    "occurredAt": "2026-10-03T14:32:00.000Z",
    "payload": {
      "id": "e6f7a8b9-0c1d-4e2f-83a4-b5c6d7e8f9a0",
      "type": "payment.confirmed",
      "occurredAt": "2026-10-03T14:32:00.000Z",
      "testMode": false,
      "data": {
        "type": "payment",
        "object": {
          "id": "4d5e6f70-8a9b-4c1d-9e2f-3a4b5c6d7e8f",
          "status": "CONFIRMED"
        }
      }
    }
  }
}
```

### Verificar disponibilidade — `GET /v1/health`

Diz se a API está no ar. Não exige chave.

- Acesso: pública, sem chave.
- Sucesso: `200` com `Health`.

Exemplo:

```bash
curl "https://api.opapingou.com.br/v1/health"
```

Resposta (`200`):

```json
{
  "ok": true
}
```

## Objetos

Campos devolvidos pela API. Tipos que são nomes de objeto estão nesta seção.

### User

O cliente dono da chave de API.

- `id` — `id`
- `email` — `string`
- `name` — `string`, pode ser `null`
- `emailVerifiedAt` — `date-time`, pode ser `null`
- `cpf` — `string`, pode ser `null`. Só dígitos (11).
- `phone` — `string`, pode ser `null`. Só dígitos (DDD + número).
- `birthDate` — `date-time`, pode ser `null`
- `onboardingCompletedAt` — `date-time`, pode ser `null`
- `role` — `Role`
- `createdAt` — `date-time`
- `company` — `Company`, pode ser `null`. Empresa informada no cadastro; `null` quando não há.

### Role

Papel do cliente e as permissões que ele concede.

- `id` — `id`
- `name` — `string`
- `permissions` — `string[]`

### Company

Empresa do cliente.

- `id` — `id`
- `legalName` — `string`
- `cnpj` — `string`. Só dígitos (14).
- `createdAt` — `date-time`

### BankInfo

Entrada do catálogo de bancos suportados.

- `id` — `id`
- `provider` — `BankProvider` (`INTER` | `C6` | `ABACATE` | `MERCADO_PAGO` | `ASAAS` | `TRANSFEERA` | `BS2`)
- `name` — `string`
- `mark` — `string`. Sigla de duas letras.
- `color` — `string`. Cor da marca (hex).
- `method` — `string`. Como a conta é conectada.
- `fields` — `BankField[]`. Credenciais pedidas ao conectar.
- `help` — `string`. Onde gerar a credencial no banco.
- `cert` — `boolean`. Exige certificado.
- `oauth` — `boolean`. Conecta por OAuth.
- `pixKey` — `boolean`. Pede a chave Pix da conta ao conectar.
- `steps` — `string[]`. Passo a passo para gerar a credencial.
- `permissions` — `BankPermission[]`. Permissões a habilitar no banco, e por quê.

### BankField

Um campo de credencial do banco.

- `key` — `string`
- `label` — `string`
- `placeholder` — `string`
- `secret` — `boolean`. O valor do campo é segredo (nunca devolvido pela API).

### BankPermission

Uma permissão que o cliente habilita no banco.

- `scope` — `string`. O escopo como o banco o escreve.
- `label` — `string`. Como a permissão aparece no portal do banco.
- `reason` — `string`. Para que o Opa Pingou a usa.
- `required` — `boolean`. `false`: a conexão funciona sem ela.
- `withoutIt` — `string`, pode ser `null`. O que se perde sem a permissão (só nas opcionais).

### Charge

Uma cobrança.

- `id` — `id`
- `bankAccountId` — `id`
- `bank` — `BankInfo`. Banco escolhido pelo roteamento.
- `bankAccount` — `ChargeBankAccount`. Conta que emite a cobrança.
- `amountCents` — `integer`. Valor em centavos.
- `description` — `string`, pode ser `null`
- `validity` — `ChargeValidity` (`FIFTEEN_MIN` | `ONE_HOUR` | `ONE_DAY` | `SEVEN_DAYS`)
- `expiresAt` — `date-time`
- `status` — `ChargeStatus` (`PENDING` | `PAID` | `EXPIRED` | `CANCELED`)
- `kind` — `ChargeKind` (`PIX_QR` | `PAYMENT_LINK`)
- `txid` — `string`
- `brCode` — `string`, pode ser `null`. Pix copia e cola; `null` em link de pagamento.
- `paymentLink` — `string`, pode ser `null`. URL do checkout (só `PAYMENT_LINK`).
- `passCardFeeToPayer` — `boolean`. Link do Abacate Pay em que o comprador paga a tarifa do cartão.
- `providerRef` — `string`, pode ser `null`. Identificador da cobrança no provedor.
- `paymentId` — `id`, pode ser `null`. Pagamento que quitou a cobrança, quando houver.
- `feeCents` — `integer`. Tarifa estimada.
- `feeAvoidedCents` — `integer`. Tarifa evitada.
- `routingReason` — `string`
- `paidAt` — `date-time`, pode ser `null`
- `createdAt` — `date-time`

### ChargeBankAccount

A conta em que a cobrança foi roteada.

- `id` — `id`
- `provider` — `BankProvider` (`INTER` | `C6` | `ABACATE` | `MERCADO_PAGO` | `ASAAS` | `TRANSFEERA` | `BS2`)
- `label` — `string`, pode ser `null`. Nome dado pelo cliente à conta.
- `displayName` — `string`. Nome exibido: `label` ou banco + chave Pix mascarada.
- `testMode` — `boolean`. Conta de sandbox do provedor.

### Payment

Dinheiro que entrou: o pagamento de uma cobrança, de um link ou um Pix direto na chave. Nasce do que o provedor informa, nunca do corpo de um webhook.

- `id` — `id`
- `amountCents` — `integer`. Valor bruto que o pagador pagou, em centavos.
- `netCents` — `integer`. `amountCents` menos a tarifa do provedor.
- `providerFeeCents` — `integer`. Tarifa que o provedor reteve; `0` quando ele não informa.
- `origin` — `PaymentOrigin` (`CHARGE` | `PAYMENT_LINK` | `INBOUND` | `RECURRING`)
- `method` — `PaymentMethod` (`PIX` | `CREDIT_CARD` | `DEBIT_CARD` | `BOLETO` | `ACCOUNT_MONEY` | `OTHER`)
- `status` — `PaymentStatus` (`CONFIRMED` | `REFUNDED` | `CHARGED_BACK`). Só anda para frente: `CONFIRMED`, depois `REFUNDED` (estornado) ou `CHARGED_BACK` (contestado).
- `provider` — `BankProvider` (`INTER` | `C6` | `ABACATE` | `MERCADO_PAGO` | `ASAAS` | `TRANSFEERA` | `BS2`)
- `bankAccount` — `ChargeBankAccount`. Conta em que o dinheiro entrou.
- `charge` — `PaymentCharge`, pode ser `null`. Cobrança que o pagamento quitou; `null` para um Pix direto na chave.
- `payerName` — `string`, pode ser `null`
- `payerMessage` — `string`, pode ser `null`. Mensagem do pagador (Pix) ou descrição do provedor.
- `paidAt` — `date-time`. Horário do provedor, não o do webhook.
- `refundedAt` — `date-time`, pode ser `null`
- `refundRequestedAt` — `date-time`, pode ser `null`. Quando o estorno foi pedido (`POST /v1/payments/{id}/refund` ou painel); `null` se nunca foi.
- `refundReason` — `string`, pode ser `null`. Motivo informado no pedido de estorno.
- `refundNextAttemptAt` — `date-time`, pode ser `null`. Estorno na fila porque faltou saldo no provedor: quando o Opa Pingou tenta de novo. `null` fora da fila.
- `refundFailedAt` — `date-time`, pode ser `null`. A fila desistiu do estorno (30 dias sem saldo, ou recusa definitiva do provedor) e `payment.refund_failed` saiu. Um novo pedido limpa.

### PaymentCharge

A cobrança que o pagamento quitou.

- `id` — `id`
- `kind` — `ChargeKind` (`PIX_QR` | `PAYMENT_LINK`)
- `description` — `string`, pode ser `null`

### Health

Estado da API.

- `ok` — `boolean`. Sempre `true` quando a API responde.

### WebhookEndpoint

Endpoint que recebe os webhooks de saída. O segredo de assinatura não faz parte deste objeto: só vem em `WebhookEndpointCreated`.

- `id` — `id`
- `url` — `string`
- `description` — `string`, pode ser `null`
- `events` — `string[]`. Eventos inscritos (lista da seção Webhooks).
- `bankAccountIds` — `id[]`. Contas que geram eventos para o endpoint; lista vazia = todas as contas do modo da chave.
- `testMode` — `boolean`. Endpoint de teste: recebe só eventos de contas de teste. Vem do modo da chave.
- `status` — `WebhookEndpointStatus` (`ACTIVE` | `DISABLED`)
- `disabledAt` — `date-time`, pode ser `null`
- `disabledReason` — `string`, pode ser `null`. `auto` quando o Opa Pingou desativou o endpoint depois de falhas seguidas.
- `lastDeliveredAt` — `date-time`, pode ser `null`
- `createdAt` — `date-time`
- `updatedAt` — `date-time`

### WebhookEndpointCreated

Resposta de criar um endpoint e de trocar o segredo: os mesmos campos de `WebhookEndpoint` mais `secret`, mostrado uma única vez.

- `id` — `id`
- `url` — `string`
- `description` — `string`, pode ser `null`
- `events` — `string[]`. Eventos inscritos (lista da seção Webhooks).
- `bankAccountIds` — `id[]`. Contas que geram eventos para o endpoint; lista vazia = todas as contas do modo da chave.
- `testMode` — `boolean`. Endpoint de teste: recebe só eventos de contas de teste. Vem do modo da chave.
- `status` — `WebhookEndpointStatus` (`ACTIVE` | `DISABLED`)
- `disabledAt` — `date-time`, pode ser `null`
- `disabledReason` — `string`, pode ser `null`. `auto` quando o Opa Pingou desativou o endpoint depois de falhas seguidas.
- `lastDeliveredAt` — `date-time`, pode ser `null`
- `createdAt` — `date-time`
- `updatedAt` — `date-time`
- `secret` — `string`. Segredo de assinatura (`whsec_…`). Aparece só na criação e na troca; guarde-o em um cofre.

### WebhookDelivery

Entrega de um evento a um endpoint, com o resultado da última tentativa.

- `id` — `id`
- `endpointId` — `id`
- `status` — `WebhookDeliveryStatus` (`PENDING` | `DELIVERING` | `SUCCEEDED` | `FAILED`)
- `attempts` — `integer`. Tentativas já feitas (no máximo 8).
- `nextAttemptAt` — `date-time`, pode ser `null`. Quando sai a próxima tentativa; `null` se não há nova tentativa agendada.
- `lastAttemptAt` — `date-time`, pode ser `null`
- `lastStatusCode` — `integer`, pode ser `null`. Status HTTP da última resposta do seu servidor.
- `lastError` — `string`, pode ser `null`. Falha da última tentativa (timeout, erro de rede, `ssrf_blocked`…).
- `lastResponseBody` — `string`, pode ser `null`. Início do corpo que o seu servidor respondeu.
- `deliveredAt` — `date-time`, pode ser `null`
- `createdAt` — `date-time`
- `event` — `WebhookEvent`. O evento entregue.

### WebhookEvent

O evento de uma entrega, com o mesmo corpo que o seu endpoint recebe.

- `id` — `id`. Também enviado em `Opa-Event-Id`.
- `type` — `string`. Um dos eventos da seção Webhooks, ou `ping` no teste.
- `occurredAt` — `date-time`
- `payload` — `objeto JSON`. O corpo enviado ao endpoint, como objeto: `id`, `type`, `occurredAt`, `testMode` e `data` (`{ type, object }`).

### WebhookDeliveryPage

Uma página de entregas.

- `items` — `WebhookDelivery[]`
- `total` — `integer`. Total de itens do filtro.
- `page` — `integer`. Página devolvida.
- `pageSize` — `integer`. Itens por página aplicados.

### Enums

- `BankProvider`: `INTER`, `C6`, `ABACATE`, `MERCADO_PAGO`, `ASAAS`, `TRANSFEERA`, `BS2`
- `ChargeStatus`: `PENDING`, `PAID`, `EXPIRED`, `CANCELED`
- `ChargeValidity`: `FIFTEEN_MIN`, `ONE_HOUR`, `ONE_DAY`, `SEVEN_DAYS`
- `ChargeKind`: `PIX_QR`, `PAYMENT_LINK`
- `PaymentOrigin`: `CHARGE`, `PAYMENT_LINK`, `INBOUND`, `RECURRING`
- `PaymentMethod`: `PIX`, `CREDIT_CARD`, `DEBIT_CARD`, `BOLETO`, `ACCOUNT_MONEY`, `OTHER`
- `PaymentStatus`: `CONFIRMED`, `REFUNDED`, `CHARGED_BACK`
- `WebhookEndpointStatus`: `ACTIVE`, `DISABLED`
- `WebhookDeliveryStatus`: `PENDING`, `DELIVERING`, `SUCCEEDED`, `FAILED`

## Segredos

- A chave de API (`opk_live_…` ou `opk_test_…`) e o segredo de webhook (`whsec_…`) aparecem uma única vez, ao serem criados. Guarde-os em cofre ou variável de ambiente do servidor; nunca no código, no repositório, em arquivo versionado, no front-end, no app móvel ou em logs.
- Chame a API só do seu servidor. Uma chave no navegador ou no app fica exposta a qualquer usuário.
- Não registre em log o cabeçalho `Authorization`, o `Opa-Signature` nem o segredo. Para correlacionar, guarde o `X-Request-Id` / `requestId`.
- Peça ao dono da conta uma chave com só os escopos necessários (e, se possível, só as contas necessárias) e use `opk_test_…` no desenvolvimento.
- Chave vazada: revogue-a no site (`https://app.opapingou.com.br/chaves`) ou no aplicativo e crie outra. Segredo de webhook vazado: troque-o com `POST /v1/webhook-endpoints/{id}/rotate-secret` (o antigo para de valer na hora).
- Este arquivo não contém nenhuma chave real: os exemplos usam `$OPAPINGOU_API_KEY` e valores ilustrativos.

## Roteiro de testes

Rode com uma chave `opk_test_…` e a URL base em variável de ambiente. Lembre: staging (`https://api-stg.opapingou.com.br`) usa bancos reais — com chave `opk_live_…`, um Pix pago é dinheiro de verdade.

1. `GET /v1/health` responde `200` com `{ "ok": true }`, sem chave.
2. `GET /v1/me` com a chave responde `200`. Sem chave ou com chave inválida: `401` `API_KEY_INVALID`. Teste também uma rota fora dos escopos da chave: `403` `INSUFFICIENT_SCOPE`.
3. Cadastre um endpoint (`POST /v1/webhook-endpoints`, URL `https` pública; em desenvolvimento, um túnel para a sua máquina) e guarde o `secret`. Dispare `POST /v1/webhook-endpoints/{id}/test`: o seu servidor recebe `ping`, verifica `Opa-Signature` e responde `2xx` em até 10 s. Confira a entrega em `GET /v1/webhook-deliveries`.
4. Verificação de assinatura: rejeite corpo alterado, segredo errado e `t` com mais de 300 s de diferença; aceite o mesmo evento repetido sem efeito duplicado (deduplicação por `Opa-Event-Id`).
5. `POST /v1/charges` com `Idempotency-Key` responde `201`. Repita com a mesma chave e o mesmo corpo: `201`, mesma cobrança, cabeçalho `Idempotent-Replayed: true`. Mesma chave com outro corpo: `409` `IDEMPOTENCY_KEY_REUSED`. Sem o cabeçalho: `400` `IDEMPOTENCY_KEY_REQUIRED`. Campo a mais no corpo: `400` `VALIDATION_FAILED`.
6. `GET /v1/charges/{id}` devolve a cobrança; com a conta de teste, pague-a ou deixe expirar e confira os eventos `charge.paid` / `payment.confirmed` ou `charge.expired`.
7. Erros e limites: trate `application/problem+json` pelo `code`; ao receber `429` `RATE_LIMITED`, espere `Retry-After` antes de repetir.
8. Reenvio: com o seu servidor fora do ar, a entrega falha e é repetida; depois, `POST /v1/webhook-deliveries/{id}/redeliver` envia de novo com o mesmo `id` de evento.
