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
docker compose --profile prod up -d --build   # ou: pnpm docker:prod
```

Sobe `startupweekendsummit-app` (imagem standalone do Next) na rede docker `proxy`, sem publicar portas, e
`startupweekendsummit-db` (Postgres 16) só na rede interna, com os dados no volume nomeado `pgdata`.
O nginx em `/mnt/hd2tb/proxy` faz o roteamento por domínio e o Cloudflare Tunnel cuida do TLS.
Configuração em `.env` (ver `.env.example`): senha do banco, SMTP, `APP_URL` e o e-mail do primeiro admin.

## Painel (/admin)

Login sem senha: a pessoa informa o e-mail em `/admin/login` e, se estiver na lista de usuários, recebe um link
por e-mail (válido por 15 min, uso único) que abre uma sessão de 30 dias. O primeiro usuário vem de
`ADMIN_SEED_EMAIL` no `.env`; os demais são adicionados em `/admin/usuarios`.

- `/admin` — inscrições de voluntários, com exportação em `/admin/inscricoes.csv`
- `/admin/participantes` — inscrições pagas/pendentes do evento, com exportação em `/admin/participantes.csv`
- `/admin/convites` — cria os links de inscrição (e envia por e-mail, se informado)
- `/admin/usuarios` — quem pode entrar

O schema do banco é criado automaticamente na primeira conexão (`src/lib/db.ts`).

## Inscrição no evento (por convite + Stripe)

Ingresso de valor único (`TICKET_PRICE_CENTS`, em centavos). O formulário só existe atrás de um convite:
`/inscricao/<código>`, gerado em `/admin/convites` com o número de vagas que ele libera. O participante informa
nome completo, e-mail, WhatsApp, CPF e data de nascimento, vai para o Checkout do Stripe e volta em
`/inscricao/confirmada`. A confirmação definitiva vem pelo webhook (`/api/stripe/webhook`), que marca a inscrição
como paga e envia o e-mail de comprovante; a página de retorno também consulta o Stripe, então cartão confirma na
hora e Pix/boleto ficam "aguardando" até o `async_payment_succeeded`. Um checkout aberto segura a vaga do convite
por 1 hora (mesmo prazo de expiração da sessão no Stripe).

No painel do Stripe: pegue a chave secreta (`STRIPE_SECRET_KEY`), crie o endpoint de webhook apontando para
`https://startupweekendsummit.com.br/api/stripe/webhook` com os quatro eventos `checkout.session.*` listados no
`.env.example` e copie o signing secret (`STRIPE_WEBHOOK_SECRET`). Os meios de pagamento (cartão, Pix, boleto)
são os habilitados na conta.

## Deploy

Push na `main` dispara `.github/workflows/deploy.yml` no runner self-hosted `jarvis` (este servidor):
atualiza o código em `/mnt/hd2tb/projetos/startupweekendsummit`, roda `docker compose --profile prod up -d --build` e faz health check.

## Onde editar

- `src/content/site.ts` — nome, data, local, áreas de voluntariado, benefícios e etapas.
- `src/app/page.tsx` — seções da landing.
- `src/components/volunteer-form.tsx` — formulário (client component, `useActionState`).
- `src/app/actions.ts` — validação server-side da inscrição.
- `src/lib/volunteers.ts` — inscrições de voluntários no Postgres.
- `src/app/inscricao/` — página do convite, ação que abre o Checkout e página de retorno; `src/lib/invites.ts`,
  `src/lib/registrations.ts` e `src/lib/stripe.ts` — convites, inscrições pagas e cliente Stripe.
- `src/lib/auth.ts` — magic link, sessões e usuários do painel; `src/lib/mail.ts` — envio de e-mail (SMTP).
