import Image from "next/image";
import { connection } from "next/server";
import { Eyebrow } from "@/components/eyebrow";
import { sponsorCategories } from "@/content/site";
import { listSponsors, sponsorAlt, type Sponsor, type SponsorTier } from "@/lib/sponsors";
import { uploadUrl } from "@/lib/uploads";

// Grade e altura do logo por categoria: cota maior, logo maior
const layout: Record<SponsorTier, { grid: string; tile: string; sizes: string }> = {
  master: { grid: "grid-cols-1 sm:grid-cols-2", tile: "h-40 p-8", sizes: "(min-width: 640px) 50vw, 100vw" },
  gold: { grid: "grid-cols-2 md:grid-cols-3", tile: "h-32 p-6", sizes: "(min-width: 768px) 33vw, 50vw" },
  silver: { grid: "grid-cols-2 md:grid-cols-4", tile: "h-28 p-6", sizes: "(min-width: 768px) 25vw, 50vw" },
  bronze: { grid: "grid-cols-2 md:grid-cols-4", tile: "h-24 p-5", sizes: "(min-width: 768px) 25vw, 50vw" },
  startup: { grid: "grid-cols-3 md:grid-cols-6", tile: "h-20 p-4", sizes: "(min-width: 768px) 16vw, 33vw" },
  apoio: { grid: "grid-cols-3 md:grid-cols-6", tile: "h-20 p-4", sizes: "(min-width: 768px) 16vw, 33vw" },
  realizacao: { grid: "grid-cols-3 md:grid-cols-6", tile: "h-20 p-4", sizes: "(min-width: 768px) 16vw, 33vw" },
};

function Logo({ sponsor, tier }: { sponsor: Sponsor; tier: SponsorTier }) {
  const { tile, sizes } = layout[tier];
  const img = (
    <span className={`relative block ${tile}`}>
      <span className="relative block h-full w-full">
        <Image src={uploadUrl(sponsor.logo)} alt={sponsorAlt(sponsor)} fill unoptimized sizes={sizes} className="object-contain" />
      </span>
    </span>
  );
  if (!sponsor.url) return <div className="border border-ash">{img}</div>;
  return (
    <a href={sponsor.url} target="_blank" rel="noopener noreferrer" className="block border border-ash transition-[border-color,box-shadow] hover:border-ink hover:shadow-hard-sm">
      {img}
    </a>
  );
}

/* Patrocinadores cadastrados no painel (/admin/patrocinadores), agrupados por categoria.
   Lê o banco a cada requisição; sem patrocinadores (ou com o banco fora), não renderiza nada. */
export async function SponsorsSection() {
  await connection();
  let sponsors: Sponsor[];
  try {
    sponsors = await listSponsors();
  } catch (err) {
    console.error("[SponsorsSection]", err);
    return null;
  }
  const groups = sponsorCategories
    .map((c) => ({ ...c, items: sponsors.filter((s) => s.tier === c.id) }))
    .filter((g) => g.items.length > 0);
  if (groups.length === 0) return null;

  return (
    <section id="patrocinadores" className="mx-auto flex w-full max-w-page scroll-mt-8 flex-col gap-15 px-4 sm:px-6">
      <div className="grid gap-6 md:grid-cols-2 md:items-end">
        <div className="flex flex-col gap-6">
          <Eyebrow>Patrocinadores</Eyebrow>
          <h2 className="font-display text-heading">Quem faz o Summit acontecer</h2>
        </div>
        <p className="max-w-[44ch] text-body-md md:justify-self-end">
          Marcas que apoiam o encontro das lideranças de comunidades de startups do Brasil em Goiânia.
        </p>
      </div>
      <div className="flex flex-col gap-12">
        {groups.map((g) => (
          <div key={g.id} className="flex flex-col gap-6 border-t-4 border-grass pt-4">
            <h3 className="text-body-md font-semibold">{g.label}</h3>
            <ul className={`grid gap-6 ${layout[g.id].grid}`}>
              {g.items.map((s) => (
                <li key={s.id}>
                  <Logo sponsor={s} tier={g.id} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
