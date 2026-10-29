import Image from "next/image";
import type { CSSProperties } from "react";
import { connection } from "next/server";
import { Eyebrow } from "@/components/eyebrow";
import { OrganizerBio } from "@/components/organizer-bio";
import { SocialIcon } from "@/components/social-icon";
import { gridColumns, initials, socialName } from "@/lib/organizers-core";
import { listActiveOrganizersCached, organizerAlt, type Organizer } from "@/lib/organizers";
import { uploadUrl } from "@/lib/uploads";

/* Card: foto quadrada (o recorte feito no painel) com borda de tinta, sombra sólida e o "_" Grass → Marigold na base.
   No celular a foto fica à esquerda do nome (card baixo, a lista não vira uma parede de fotos); do sm pra cima o
   card é vertical e ocupa a altura toda da linha, com as redes alinhadas na base (mt-auto), pra 10 cards lado a lado
   terem o mesmo ritmo: foto, nome, papel, bio em até 4 linhas ("Ver mais" abre o resto), redes. */
function OrganizerCard({ organizer: o }: { organizer: Organizer }) {
  return (
    <article className="grid w-full grid-cols-[104px_1fr] content-start gap-x-4 gap-y-3 sm:flex sm:h-full sm:flex-col sm:gap-4">
      <div className="relative aspect-square border-2 border-ink bg-ash shadow-hard-sm">
        {o.photo ? (
          <Image
            src={uploadUrl(o.photo)}
            alt={organizerAlt(o)}
            fill
            unoptimized
            sizes="(min-width: 1280px) 240px, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 104px"
            className="object-cover object-center"
          />
        ) : (
          <span aria-hidden="true" className="flex h-full items-center justify-center bg-marigold-wash font-display text-heading-sm text-ink sm:text-[clamp(40px,4vw,64px)]">
            {initials(o.name)}
          </span>
        )}
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1.5 bg-linear-to-r from-grass to-marigold" />
      </div>
      <div className="flex min-w-0 flex-col gap-1 self-center sm:self-auto">
        <h3 className="font-display text-[20px] leading-tight text-balance">{o.name}</h3>
        {o.role && <p className="text-body font-semibold text-grass-deep">{o.role}</p>}
      </div>
      {o.bio && (
        <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
          <OrganizerBio name={o.name} role={o.role} bio={o.bio} />
        </div>
      )}
      {o.socials.length > 0 && (
        <ul className="col-span-2 flex flex-wrap gap-2 sm:col-span-1 sm:mt-auto sm:pt-1">
          {o.socials.map((s) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${socialName(s.kind)} de ${o.name} (abre em nova aba)`}
                className="flex size-11 items-center justify-center border-2 border-ink bg-paper text-ink transition-colors duration-150 hover:bg-ink hover:text-paper"
              >
                <SocialIcon kind={s.kind} />
              </a>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

/* Organizadores ativos cadastrados no painel (/admin/organizadores), na ordem de lá.
   Lê o banco a cada requisição; sem nenhum ativo (ou com o banco fora), não renderiza nada.
   A grade (.organizers-grid em globals.css) é flex com a última linha centralizada; o número de colunas em cada
   largura vem de gridColumns, pra 1 a ~12 pessoas fecharem em linhas equilibradas (6 = 3+3, 7 = 4+3, 10 = 5+5). */
export async function OrganizersSection() {
  await connection();
  let organizers: Organizer[];
  try {
    organizers = await listActiveOrganizersCached();
  } catch (err) {
    console.error("[OrganizersSection]", err);
    return null;
  }
  if (organizers.length === 0) return null;

  const n = organizers.length;
  const columns = {
    "--cols-sm": gridColumns(n, { min: 2, max: 2 }),
    "--cols-md": gridColumns(n, { min: 2, max: 3 }),
    "--cols-lg": gridColumns(n, { min: 3, max: 4 }),
    "--cols-xl": gridColumns(n, { min: 3, max: 5 }),
  } as CSSProperties;

  return (
    <section id="organizadores" className="mx-auto flex w-full max-w-page scroll-mt-8 flex-col gap-15 px-4 sm:px-6">
      <div className="grid gap-6 md:grid-cols-2 md:items-end">
        <div className="flex flex-col gap-6">
          <Eyebrow>Organização</Eyebrow>
          <h2 className="font-display text-heading">Quem organiza o Summit</h2>
        </div>
        <p className="max-w-[44ch] text-body-md md:justify-self-end">
          Lideranças das comunidades de startups de Goiás que trazem o encontro nacional para Goiânia.
        </p>
      </div>
      <ul className="organizers-grid" style={columns}>
        {organizers.map((o) => (
          <li key={o.id}>
            <OrganizerCard organizer={o} />
          </li>
        ))}
      </ul>
    </section>
  );
}
