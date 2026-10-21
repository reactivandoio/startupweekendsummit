# `tsc --noEmit` falha com "Cannot find name 'PageProps'" (e `LayoutProps`, `RouteContext`)

**Sintoma:** rodando `npx tsc --noEmit` num checkout limpo (worktree nova, container descartável), aparecem `error TS2304: Cannot find name 'PageProps'` em todas as páginas com params, além de `LayoutProps` e `RouteContext`. O `pnpm build` passa.
**Causa:** esses tipos são globais gerados pelo Next em `.next/types` (`next typegen`, também executado por `next dev`/`next build`). Sem `.next/`, o `tsc` não os encontra; não é erro do código.
**Correção:** rode `npx next typegen && npx tsc --noEmit`, ou confie no `pnpm build`, que gera os tipos e faz o typecheck. Confirmado: depois do `typegen`, o `tsc` passa sem erros.
Evidência: confirmado · Card: termos-imagem-patrocinadores
