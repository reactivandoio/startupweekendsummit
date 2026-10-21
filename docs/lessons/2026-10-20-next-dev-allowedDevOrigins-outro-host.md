# Página carrega mas componentes client não reagem (clique/teclado) ao acessar o `next dev` por IP da rede

**Sintoma:** acessando `http://192.168.x.x:3100` (navegador em outra máquina, ex.: claude-in-chrome num Mac diferente), o HTML renderiza, mas o Select/Form não responde e os elementos não têm fibra React. No log do `next dev`: `⚠ Blocked cross-origin request to Next.js dev resource /_next/hmr from "192.168.x.x"`.
**Causa:** o Next 16 bloqueia, por padrão, recursos de dev (`/_next/*`) para origens fora de `localhost`; a hidratação não completa e nada "client" funciona. Pelo `curl`/`localhost` tudo parece normal.
**Correção:** `allowedDevOrigins` no `next.config.ts`. Aqui ele lê `DEV_ORIGINS` (lista separada por vírgula): `DEV_ORIGINS=192.168.68.101 pnpm dev -p 3100`. Reinicie o dev server. Para testes automatizados, prefira um navegador na própria máquina (Playwright/Chromium headless em `localhost`), que não passa por isso.
Evidência: corrigido · Card: STA-2
