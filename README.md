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

Deploy contínuo: push na `main` dispara `.github/workflows/deploy.yml` no runner self-hosted do jarvis, que faz o
blue/green acima. Os PRs para a `main` passam pelo `.github/workflows/ci.yml` (lint, typecheck com `next typegen`,
testes e build), num runner do GitHub e sem segredos — nunca no self-hosted, porque o repo é público e PR de fork
rodaria código no servidor.

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
- `/admin/patrocinadores` — patrocinadores do site (ver abaixo)
- `/admin/organizadores` — organizadores do site (ver abaixo)
- `/admin/usuarios` — quem pode entrar
- `/admin/configuracoes` — tema padrão do site (ver abaixo)

O schema do banco é criado automaticamente na primeira conexão (`src/lib/db.ts`).

## Tema claro e escuro

O site e o painel têm os dois temas, com a mesma marca (Grass, Marigold, papel e tinta). O tema padrão é escolhido
em `/admin/configuracoes` (tabela `settings`, chave `site_theme`; começa escuro) e vale pra quem chega pela
primeira vez, independente da preferência do sistema. O botão de tema (topo do site, barra do painel) guarda a
escolha da pessoa no cookie `sws-theme` por um ano, e ela passa na frente do padrão. O layout raiz lê cookie e
padrão no servidor e já manda `data-theme` no `<html>`, então não há flash do tema errado — por isso todas as
páginas são dinâmicas.

Os tokens de cor ficam em `src/app/globals.css`: `paper`, `ink`, `ash`, `graphite` e os tons `*-wash` trocam de
valor no escuro; `obsidian` e `white` são fixos (rodapé, faixas Grass/Marigold, texto sobre Marigold). O logo
negativo entra no escuro via CSS; as ilustrações têm uma versão `-escuro.webp` (papel transparente, tinta branca,
Marigold preservado) gerada por `pnpm ilustracoes` a partir das originais — rode de novo ao receber arte nova. Os
logos de patrocinadores viram brancos no escuro (`.logo-mono`). Og-images e e-mails não mudam com o tema.

## Patrocinadores

Cadastrados em `/admin/patrocinadores`: nome, categoria (as cinco cotas de `/patrocinio` + Apoio e Realização,
em `sponsorCategories` no `src/content/site.ts`), logo, texto alternativo do logo e URL do site. A ordem é por
categoria e, dentro dela, pelas setas ↑ ↓ do painel. No site, a seção aparece na home e em `/patrocinio`
(`src/components/sponsors-section.tsx`), com o logo maior nas cotas mais altas; o logo usa o alt cadastrado (ou o
nome, se vazio) e, com URL, vira link em nova aba. Sem nenhum patrocinador, a seção não aparece.

Os logos (SVG, PNG, WebP ou JPG, até 2 MB; o tipo é conferido pelos bytes) vão para o volume docker `uploads`,
montado em `/uploads` nas duas cores do blue/green (`UPLOADS_DIR`), e são servidos por `/uploads/<arquivo>` com
cache longo — cada envio gera um nome novo. Trocar ou excluir o logo apaga o arquivo antigo. Backup: o volume
`startupweekendsummit_uploads` junto com o dump do Postgres (as tabelas `sponsors` e `organizers` apontam para esses arquivos).

## Organizadores

Cadastrados em `/admin/organizadores`: nome, papel/cargo (opcional), biografia (até 280 caracteres, com contador),
foto (JPG, PNG ou WebP até 2 MB, no mesmo volume de uploads; opcional — sem foto o card mostra as iniciais), texto
alternativo, redes sociais (LinkedIn, Instagram, X, site ou outra; o domínio das redes conhecidas é conferido e
`@usuario` vira o perfil no Instagram e no X) e ativo/inativo. A ordem é a das setas ↑ ↓ do painel. Na home, a seção
Organização (`src/components/organizers-section.tsx`, `#organizadores`, entre o after movie e a programação) mostra
só os ativos, com a foto recortada em quadrado; sem nenhum ativo, ela não aparece. No menu, a seção faz parte do
grupo "O evento" do scroll spy.

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
- `src/lib/settings.ts` — configurações editadas no painel (chave e webhook do Opa Pingou, tema padrão).
- `src/lib/theme.ts` e `src/lib/theme-core.ts` — tema da requisição (cookie ou padrão) e helpers puros (testados);
  `src/components/theme.tsx` — provider e botão de tema; `src/content/illustrations.ts` — ilustrações nos dois temas.
- `src/lib/auth.ts` — magic link, sessões e usuários do painel; `src/lib/mail.ts` — envio de e-mail (SMTP).
- `src/lib/sponsors.ts` e `src/lib/uploads.ts` — patrocinadores no Postgres e arquivos de logo no volume de uploads.
