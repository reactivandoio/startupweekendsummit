import type { Metadata } from "next";
import { ButtonLink } from "@/components/button";
import { Eyebrow } from "@/components/eyebrow";
import { site } from "@/content/site";

// O layout do painel tem título simples (sem template), então o daqui não herda o sufixo do site
export const metadata: Metadata = {
  title: { absolute: `Página não encontrada | Painel | ${site.shortName}` },
  robots: { index: false, follow: false },
};

/* 404 dentro da moldura do painel: rotas inexistentes em /admin (via [...rota]) e notFound() das páginas de detalhe */
export default function AdminNotFound() {
  return (
    <div className="flex max-w-[60ch] flex-col gap-10">
      <div className="flex flex-col gap-4">
        <Eyebrow>Erro 404</Eyebrow>
        <h1 className="font-display text-heading">
          Nada por aqui<span className="text-marigold">_</span>
        </h1>
        <p className="text-body-md">
          Essa página do painel não existe, ou o registro que você abriu foi removido. Escolha uma seção no menu ou volte
          para o início do painel.
        </p>
      </div>
      <div className="border-t border-ink pt-6 dark:border-paper">
        <ButtonLink href="/admin" variant="primary" size="md">
          Voltar ao painel
        </ButtonLink>
      </div>
    </div>
  );
}
