# `Error: read ECONNRESET` nas queries do painel usando PGlite como Postgres local

**Sintoma:** sem Docker/Postgres na máquina, subindo um banco com `@electric-sql/pglite` + `@electric-sql/pglite-socket` na porta 5435, a home funciona mas páginas com mais de uma query simultânea (painel: `requireUser` + listagem) dão 500 com `Error: read ECONNRESET` em `src/lib/auth.ts`.
**Causa:** o `PGLiteSocketServer` aceita uma conexão por vez por padrão; o cliente `postgres` do projeto abre até 5 (`max: 5`) e a segunda conexão é derrubada.
**Correção:** criar o servidor com `maxConnections` (multiplexa sobre a conexão única): `new PGLiteSocketServer({ db, port: 5435, host: "127.0.0.1", maxConnections: 10 })`. Com isso `/admin/*` responde 200. Só para desenvolvimento; a stack real é Postgres no compose.
Evidência: corrigido · Card: STA-2
