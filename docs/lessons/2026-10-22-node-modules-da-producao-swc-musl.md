# `pnpm build` no host falha com "Attempted to load @next/swc-linux-x64-musl ... invalid ELF header"

**Sintoma:** numa worktree nova, para pular o `pnpm install`, o `node_modules` foi linkado (`ln -s`) para o do checkout de produção (`/mnt/hd2tb/projetos/startupweekendsummit/node_modules`). `pnpm lint` e `pnpm test` passam, mas `pnpm build` termina em `> Build error occurred` logo depois de `⚠ Attempted to load @next/swc-linux-x64-musl, but an error occurred: /lib/x86_64-linux-gnu/libc.so: invalid ELF header`.
**Causa:** o `node_modules` de produção foi instalado dentro da imagem `node:22-alpine` (musl), então o binário nativo do SWC é o musl, que não carrega no Node glibc do host (nvm). Lint e testes não usam o SWC, por isso só o build quebra.
**Correção:** não reaproveite o `node_modules` de produção; rode `pnpm install --frozen-lockfile` na própria worktree (o store do pnpm torna isso rápido) e depois `pnpm build`. Confirmado: após o install local, `✓ Compiled successfully`.
Evidência: confirmado · Card: hints-whatsapp
