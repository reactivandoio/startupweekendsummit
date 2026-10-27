# `TypeError: Cannot read properties of undefined (reading 'src')` ao importar um objeto de um módulo "use client"

**Sintoma:** `pnpm build` passa, mas a página dá 500 em produção com `TypeError: Cannot read properties of undefined (reading 'src')` dentro de um `.map` (ou `reading 'alt'`), apontando pra um chunk `ssr/[root-of-the-server]`.
**Causa:** um componente de servidor importou um export que não é componente (um objeto `illustrations`) de um arquivo com `"use client"`. Do lado do servidor, tudo que sai de um módulo cliente vira referência de cliente: funções viram componentes "proxy" e dados viram `undefined` — sem erro de tipo, porque o TypeScript enxerga o módulo normal.
**Correção:** dados e tipos ficam num módulo sem `"use client"` (`src/content/illustrations.ts`); o módulo cliente (`src/components/illustration.tsx`) só exporta o componente e importa os dados de lá. Confirma com `curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/` → 200.
Evidência: corrigido · Card: STA-14
