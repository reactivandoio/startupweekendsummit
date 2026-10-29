import Image from "next/image";
import { connection } from "next/server";
import { Eyebrow } from "@/components/eyebrow";
import { SocialIcon } from "@/components/social-icon";
import { initials, socialName } from "@/lib/organizers-core";
import { listActiveOrganizersCached, organizerAlt, type Organizer } from "@/lib/organizers";
import { uploadUrl } from "@/lib/uploads";

/* Card: foto quadrada (recorte ao centro) com borda de tinta, sombra sólida e o "_" Grass → Marigold na base.
   No celular a foto fica à esquerda do nome (card baixo, a lista não vira uma parede de fotos);
   do sm pra cima o card é vertical, em grade. */
function OrganizerCard({ organizer: o }: { organizer: Organizer }) {
  return (
    <article className="grid h-full grid-cols-[112px_1fr] content-start gap-x-4 gap-y-4 sm:grid-cols-1 sm:gap-y-5">
      <div className="relative aspect-square border-2 border-ink bg-ash shadow-hard-sm">
        {o.photo ? (
          <Image
            src={uploadUrl(o.photo)}
            alt={organizerAlt(o)}
            fill
            unoptimized
            sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 112px"
            className="object-cover object-center"
          />
        ) : (
          <span aria-hidden="true" className="flex h-full items-center justify-center bg-marigold-wash font-display text-heading-sm text-ink sm:text-display">
            {initials(o.name)}
          </span>
        )}
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1.5 bg-linear-to-r from-grass to-marigold" />
      </div>
      <div className="flex min-w-0 flex-col gap-2 self-center sm:self-auto">
        <h3 className="font-display text-subheading text-balance">{o.name}</h3>
        {o.role && <p className="text-body font-semibold text-grass-deep">{o.role}</p>}
      </div>
      {o.bio && <p className="col-span-2 whitespace-pre-line text-body leading-normal text-graphite sm:col-span-1">{o.bio}</p>}
      {o.socials.length > 0 && (
        <ul className="col-span-2 flex flex-wrap gap-2 sm:col-span-1">
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
   Lê o banco a cada requisição; sem nenhum ativo (ou com o banco fora), não renderiza nada. */
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
      <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {organizers.map((o) => (
          <li key={o.id}>
            <OrganizerCard organizer={o} />
          </li>
        ))}
      </ul>
    </section>
  );
}
