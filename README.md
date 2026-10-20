# Startup Weekend Summit — voluntários

Landing page com formulário de inscrição de voluntários. Next.js 16 (App Router) + Tailwind 4, tudo rodando em Docker.

Produção: https://startupweekendsummit.com.br

## Rodar em desenvolvimento (Docker, hot reload)

```bash
docker compose --profile dev up --build     # ou: pnpm docker:dev
```

Abra http://localhost:3001. O código é montado como volume, então edições recarregam na hora.
Sobe junto um Postgres (`db-dev`, em `127.0.0.1:5435`, usuário/senha/db `sws`). Copie `.env.example` para `.env`
antes: sem `SMTP_HOST`, os links de acesso do painel são apenas logados no console do container.

Comandos dentro do container (lint, adicionar dependência etc.):

```bash
docker compose --profile dev exec dev pnpm lint
docker compose --profile dev exec dev pnpm add <pacote>
```

## Produção

```bash
bash deploy/blue-green.sh   # ou: pnpm docker:prod
```

Blue/green: sobe a cor inativa (`startupweekendsummit-app-blue` ou `-green`, imagem standalone do Next) na rede
docker `proxy`, sem publicar portas, espera o healthcheck, troca o vhost do nginx e só então para a cor antiga —
não há janela de 502. `bash deploy/blue-green.sh --rollback` volta pra cor anterior (fica parada, não é removida).
`startupweekendsummit-db` (Postgres 16) fica só na rede interna, com os dados no volume nomeado `pgdata`.
O nginx em `/mnt/hd2tb/proxy` faz o roteamento por domínio e o Cloudflare Tunnel cuida do TLS.
Configuração em `.env` (ver `.env.example`): senha do banco, SMTP, `APP_URL` e o e-mail do primeiro admin.

`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` (gere uma vez com `openssl rand -base64 32`) é obrigatória em produção: o
Next embute no build uma chave que criptografa as closures das Server Actions e, sem defini-la, gera uma nova a
cada build — as duas cores ficariam com chaves diferentes e quem carregou a página na cor antiga receberia
"Failed to find Server Action" ao enviar um formulário. O deploy falha na hora do build se ela faltar, antes de
qualquer troca de nginx, então a cor no ar continua servindo.

## Painel (/admin)

Login sem senha: a pessoa informa o e-mail em `/admin/login` e, se estiver na lista de usuários, recebe um link
por e-mail (válido por 15 min, uso único) que abre uma sessão de 30 dias. O primeiro usuário vem de
`ADMIN_SEED_EMAIL` no `.env`; os demais são adicionados em `/admin/usuarios` e recebem na hora um convite por
e-mail com link de entrada — o botão "Reenviar convite" manda outro, e diz na tela se o envio falhou.

- `/admin` — inscrições de voluntários, com exportação em `/admin/inscricoes.csv`
- `/admin/participantes` — inscrições pagas/pendentes do evento, com exportação em `/admin/participantes.csv` e o botão
  "Conferir Pix pendentes" (consulta no Opa Pingou as cobranças cujo webhook não chegou)
- `/admin/ingressos` — chave do Opa Pingou, webhook e lotes de ingresso
- `/admin/convites` — cria os links de inscrição (e envia por e-mail, se informado)
- `/admin/usuarios` — quem pode entrar

O schema do banco é criado automaticamente na primeira conexão (`src/lib/db.ts`).

## Inscrição no evento (por convite + Opa Pingou)

O formulário só existe atrás de um convite: `/inscricao/<código>`, gerado em `/admin/convites` com o número de vagas
que ele libera. O participante informa nome completo, e-mail, WhatsApp, CPF e data de nascimento e paga por Pix.

**Lotes** (`/admin/ingressos`): cada lote tem nome, valor e quantidade (vazia = sem limite). O primeiro lote ativo
com vaga, na ordem da lista, é o que está à venda; quando esgota, o próximo entra sozinho. Sem nenhum lote
cadastrado vale o valor único de `TICKET_PRICE_CENTS` no `.env`, como antes.

**Opa Pingou** (Pix): a chave de API é configurada no painel, em `/admin/ingressos` (não no `.env`); o painel valida a
chave na API antes de salvar. Depois, "Cadastrar webhook" cria o endpoint `https://<APP_URL>/api/opapingou/webhook`
(eventos `charge.paid`, `charge.expired`, `charge.canceled`) e guarda o segredo de assinatura; "Enviar teste" dispara
um `ping`. A chave precisa dos escopos `charges:write`, `charges:read`, `webhooks:read` e `webhooks:write`. Use
`opk_test_…` para testar sem dinheiro — staging não é sandbox. `OPAPINGOU_API_URL` (opcional) aponta para staging;
o padrão é produção. Referência completa da API em `docs/opapingou-api.md`.

Fluxo: o formulário cria a inscrição pendente e uma cobrança Pix de 1 hora (`Idempotency-Key` = id da inscrição) e
leva para `/inscricao/pix/<id>`, com QR Code e copia e cola. A página se atualiza a cada 5 s; o webhook (assinatura
`Opa-Signature` verificada, eventos deduplicados por id) marca a inscrição como paga e envia o e-mail com o ingresso
(número de 8 caracteres, o mesmo do painel). "Já paguei" e o fim do prazo consultam a cobrança direto na API. O Pix
aberto segura a vaga do convite e do lote por 1 hora.

**Stripe** (legado): sem chave do Opa Pingou no painel, o formulário usa o Checkout do Stripe como antes
(`STRIPE_SECRET_KEY`, webhook `/api/stripe/webhook` com os quatro eventos `checkout.session.*` e
`STRIPE_WEBHOOK_SECRET`). Inscrições antigas do Stripe continuam sendo confirmadas pelo webhook dele.

## Testes

```bash
pnpm test    # node:test (type stripping do Node 24): assinatura do webhook e utilitários do Opa Pingou
pnpm lint
pnpm build
```

## Deploy

Push na `main` dispara `.github/workflows/deploy.yml` no runner self-hosted `jarvis` (este servidor):
atualiza o código em `/mnt/hd2tb/projetos/startupweekendsummit` e roda `bash deploy/blue-green.sh` (build da cor inativa, healthcheck, troca do nginx, aposenta a antiga).

## Onde editar

- `src/content/site.ts` — nome, data, local, áreas de voluntariado, benefícios e etapas.
- `src/app/page.tsx` — seções da landing.
- `src/components/volunteer-form.tsx` — formulário (client component, `useActionState`).
- `src/app/actions.ts` — validação server-side da inscrição.
- `src/lib/volunteers.ts` — inscrições de voluntários no Postgres.
- `src/app/inscricao/` — página do convite, ação que gera o Pix (ou abre o Checkout), página do Pix e de retorno;
  `src/lib/invites.ts`, `src/lib/registrations.ts`, `src/lib/tickets.ts` (lotes e o que está à venda),
  `src/lib/opapingou.ts` (cliente REST), `src/lib/opapingou-core.ts` (assinatura, testado),
  `src/lib/ticket-payments.ts` (aplica o estado da cobrança) e `src/lib/stripe.ts` — convites, inscrições, pagamentos.
- `src/lib/settings.ts` — configurações editadas no painel (chave e webhook do Opa Pingou).
- `src/lib/auth.ts` — magic link, sessões e usuários do painel; `src/lib/mail.ts` — envio de e-mail (SMTP).
