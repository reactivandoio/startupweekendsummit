# Startup Weekend Summit — voluntários

Landing page com formulário de inscrição de voluntários. Next.js 16 (App Router) + Tailwind 4, tudo rodando em Docker.

Produção: https://startupweekendsummit.com.br

## Rodar em desenvolvimento (Docker, hot reload)

```bash
docker compose --profile dev up --build     # ou: pnpm docker:dev
```

Abra http://localhost:3001. O código é montado como volume, então edições recarregam na hora.
As inscrições ficam em `./data/volunteers.json` (ignorado pelo git).

Comandos dentro do container (lint, adicionar dependência etc.):

```bash
docker compose --profile dev exec dev pnpm lint
docker compose --profile dev exec dev pnpm add <pacote>
```

## Produção

```bash
docker compose --profile prod up -d --build   # ou: pnpm docker:prod
```

Sobe o container `startupweekendsummit-app` (imagem standalone do Next) na rede docker `proxy`, sem publicar portas.
O nginx em `/mnt/hd2tb/proxy` faz o roteamento por domínio e o Cloudflare Tunnel cuida do TLS.
As inscrições ficam no volume nomeado `data` (`/data/volunteers.json`).

Para exportar as inscrições:

```bash
docker compose --profile prod exec app cat /data/volunteers.json > inscricoes.json
```

## Deploy

Push na `main` dispara `.github/workflows/deploy.yml` no runner self-hosted `jarvis` (este servidor):
atualiza o código em `/mnt/hd2tb/projetos/startupweekendsummit`, roda `docker compose --profile prod up -d --build` e faz health check.

## Onde editar

- `src/content/site.ts` — nome, data, local, áreas de voluntariado, benefícios e etapas.
- `src/app/page.tsx` — seções da landing.
- `src/components/volunteer-form.tsx` — formulário (client component, `useActionState`).
- `src/app/actions.ts` — validação server-side da inscrição.
- `src/lib/volunteers.ts` — persistência (JSON em `DATA_DIR`). Trocar por banco/planilha é só reimplementar `saveVolunteer`.
