import "server-only";
import { sql } from "@/lib/db";

// Coluna removed_by_name (nome ou e-mail de quem removeu) pra um select com a tabela apelidada de `alias`
export const removedByName = (alias: string) =>
  sql`(select coalesce(nullif(rb.name, ''), rb.email) from users rb where rb.id = ${sql(alias)}.removed_by) as removed_by_name`;
