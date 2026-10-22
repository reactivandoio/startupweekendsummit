import type { Metadata } from "next";
import { ButtonLink } from "@/components/button";
import { PageHero } from "@/components/page-hero";
import { illustrations } from "@/content/illustrations";
import { SiteFooter } from "@/components/site-footer";
import { site } from "@/content/site";

// Responde 404 (rotas inexistentes e notFound()); o Next já injeta noindex, mas o robots do layout raiz é index
export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false, follow: true },
};

/* 404 do site: o trampolim do Lago das Rosas — o salto foi longe demais e caiu fora do mapa */
export default function NotFound() {
  return (
    <>
      <PageHero
        eyebrow="Erro 404 · página não encontrada"
        title={
          <>
            Esse salto caiu fora do mapa<span className="text-marigold">_</span>
          </>
        }
        lead="O endereço não existe ou mudou de lugar. Volte pro começo e bora pro futuro."
        illustration={illustrations.trampolim}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/" variant="primary" size="lg">
            Voltar para o início
          </ButtonLink>
          <ButtonLink href="/patrocinio" variant="secondary" size="lg">
            Conhecer o patrocínio
          </ButtonLink>
        </div>
        <p className="max-w-[42ch] border-l-4 border-marigold pl-4 text-body">
          Chegou aqui por um link nosso? Avise em{" "}
          <a href={`mailto:${site.contactEmail}`} className="font-semibold underline underline-offset-4 wrap-anywhere">
            {site.contactEmail}
          </a>
        </p>
      </PageHero>
      <SiteFooter />
    </>
  );
}
