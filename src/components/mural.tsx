import { connection } from "next/server";
import { Illustration } from "@/components/illustration";
import { SponsorMarquee } from "@/components/sponsor-marquee";
import { illustrations } from "@/content/illustrations";
import { listSponsorsCached, sponsorAlt, type Sponsor } from "@/lib/sponsors";
import { uploadUrl } from "@/lib/uploads";

/* Mural full-bleed: monumentos de Goiânia (ilustrações do pacote da marca) em fila,
   apoiados na faixa de degradê Grass → Marigold. Os monumentos são decoração; a faixa carrega os
   patrocinadores do painel em scroll infinito (mesma ordem da seção de patrocinadores) e, sem nenhum
   cadastrado, fica a linha fina de sempre. No celular ficam só os três primeiros monumentos. */
const monuments = [illustrations.relogio, illustrations.tresRacas, illustrations.trampolim, illustrations.monumento85, illustrations.teatro];

export async function Mural() {
  await connection();
  let sponsors: Sponsor[] = [];
  try {
    sponsors = await listSponsorsCached();
  } catch (err) {
    console.error("[Mural]", err);
  }
  const logos = sponsors.map((s) => ({ id: s.id, src: uploadUrl(s.logo), alt: sponsorAlt(s), url: s.url }));

  return (
    <div className="w-full overflow-hidden bg-paper">
      <div aria-hidden="true" className="mx-auto flex max-w-page items-end justify-between gap-4 px-4 sm:px-6">
        {monuments.map((m, i) => (
          <Illustration
            key={m.src}
            of={m}
            alt=""
            sizes="(min-width: 768px) 240px, 140px"
            className={`h-[150px] w-auto min-w-0 object-contain object-bottom md:h-[230px] ${i > 2 ? "hidden md:block" : ""}`}
          />
        ))}
      </div>
      {logos.length > 0 ? <SponsorMarquee logos={logos} /> : <div aria-hidden="true" className="h-4 bg-linear-to-r from-grass to-marigold" />}
    </div>
  );
}
