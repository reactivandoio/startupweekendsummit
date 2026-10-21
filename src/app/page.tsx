import Image from "next/image";
import Link from "next/link";
import { ButtonAnchor, ButtonLink, buttonClass } from "@/components/button";
import { Eyebrow } from "@/components/eyebrow";
import { Mural } from "@/components/mural";
import { EventMeta, PageHero, illustrations } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { SponsorsSection } from "@/components/sponsors-section";
import { pastHosts, photos, schedule, showVolunteerCta, site, stats } from "@/content/site";

// Dados estruturados pra Google (rich result de evento) — https://schema.org/Event
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Event",
      "@id": `${site.url}/#event`,
      name: site.name,
      description: site.seoDescription,
      url: site.url,
      image: `${site.url}/opengraph-image.png`,
      startDate: site.startDate,
      endDate: site.endDate,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      inLanguage: "pt-BR",
      location: {
        "@type": "Place",
        name: site.venue,
        address: { "@type": "PostalAddress", addressLocality: site.cityName, addressRegion: site.state, addressCountry: "BR" },
      },
      organizer: { "@type": "Organization", name: site.organizer, url: site.organizerUrl },
      sameAs: [site.instagram],
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: site.url,
      name: site.shortName,
      inLanguage: "pt-BR",
      sameAs: [site.instagram],
      about: { "@id": `${site.url}/#event` },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* Hero: papel branco, evento no Chateaubriand e o CTA Marigold com sombra sólida (conceito visual da edição) */}
      <PageHero
        size="display"
        eyebrow={`Goiânia · ${site.dateShort}`}
        title={
          <>
            Bora pro futuro. <span className="block text-grass">Ele passa por Goiânia.</span>
          </>
        }
        lead="O maior encontro de líderes de comunidades de startups do Brasil chega pela primeira vez a Goiânia."
        illustration={illustrations.chateaubriand}
      >
        <EventMeta />
        <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/patrocinio" variant="primary" size="lg">
            Quero patrocinar
          </ButtonLink>
          {showVolunteerCta && (
            <ButtonLink href="/voluntarios" variant="secondary" size="lg">
              Quero ser voluntário
            </ButtonLink>
          )}
        </div>
      </PageHero>

      <Mural />

      {/* Faixa marigold: participação por convite + WhatsApp */}
      <section className="bg-marigold-wash text-ink">
        <div className="mx-auto grid max-w-page gap-12 px-4 py-15 sm:px-6 md:grid-cols-2 md:items-end">
          <div className="flex flex-col gap-4">
            <span aria-hidden="true" className="block h-2 w-10 bg-grass" />
            <h2 className="font-display text-heading">Participação por convite.</h2>
            <p className="max-w-[44ch] text-body-md">
              As vagas para participantes do Summit são limitadas e as inscrições acontecem por convite da
              organização. Para dúvidas, fale com a gente no WhatsApp.
            </p>
          </div>
          <div className="flex flex-col gap-4 md:items-end md:text-right">
            <p className="text-body-md font-semibold">Dúvidas sobre o evento</p>
            <ButtonAnchor href={site.whatsappUrl} target="_blank" rel="noreferrer" variant="secondary" size="md">
              WhatsApp {site.whatsapp}
            </ButtonAnchor>
            {showVolunteerCta && (
              <p className="text-body">
                Quer ajudar a fazer acontecer?{" "}
                <Link href="/voluntarios" className="underline underline-offset-4">
                  Seja voluntário
                </Link>
                .
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Faixa grass: tagline + números */}
      <section id="o-evento" className="bg-grass text-ink">
        <div className="mx-auto flex max-w-page flex-col gap-12 px-4 py-15 sm:px-6">
          <div className="flex flex-col gap-6">
            <Eyebrow>O evento</Eyebrow>
            <p className="max-w-[20ch] font-display text-heading-lg">{site.tagline}.</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-8 border-t border-ink pt-6 lg:grid-cols-4">
            {stats.map((st) => (
              <div key={st.label} className="flex flex-col gap-2">
                <dd className="font-display text-heading">{st.value}</dd>
                <dt className="text-body">{st.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <main className="flex flex-col gap-30 bg-paper py-30">
        {/* Sobre */}
        <section id="sobre" className="mx-auto grid w-full max-w-page scroll-mt-8 gap-12 px-4 sm:px-6 md:grid-cols-2">
          <div className="flex flex-col gap-6">
            <Eyebrow>Sobre</Eyebrow>
            <h2 className="font-display text-heading">O que é o Summit?</h2>
          </div>
          <div className="flex flex-col gap-4 text-body-md md:pt-10">
            <p>
              O Summit não é um Startup Weekend. É o encontro nacional das lideranças que organizam Startup Weekends e
              outros programas de comunidade pelo país — três dias para discutir inovação e empreendedorismo seguindo
              os conceitos do livro <em>Startup Weekend</em>, que deu origem ao movimento.
            </p>
            <p>
              Keynotes, workshops, painéis e fun experiences reúnem participantes de todas as regiões do Brasil e
              convidados internacionais. Em 2026 o Summit é retomado e chega a Goiânia pela primeira vez.
            </p>
            <p>
              A escolha de Goiânia passa pelo esforço de lideranças de diversas regiões do estado — Goiás, Anápolis,
              Rio Verde e Goiânia. Das quase 300 startups mapeadas em Goiás, 196 estão na capital, que se destaca
              nacionalmente como polo de pesquisa e desenvolvimento em inteligência artificial.
            </p>
            <p className="text-body text-graphite">Edições anteriores: {pastHosts.join(", ")}.</p>
          </div>
        </section>

        {/* After movie da última edição */}
        <section id="after-movie" className="mx-auto flex w-full max-w-page flex-col gap-15 px-4 sm:px-6">
          <div className="grid gap-6 md:grid-cols-2 md:items-end">
            <div className="flex flex-col gap-6">
              <Eyebrow>After movie</Eyebrow>
              <h2 className="font-display text-heading">Como foi em Uberlândia, 2025</h2>
            </div>
            <p className="max-w-[44ch] text-body-md md:justify-self-end">
              86 lideranças e executivos do ecossistema de startups, 17 estados, 30 patrocinadores, mais de 22 horas
              de atividades.
            </p>
          </div>
          <div className="aspect-video w-full bg-obsidian">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${site.afterMovieId}`}
              title="After movie — Techstars Startup Weekend Summit Brasil 2025"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          <ul className="grid gap-6 sm:grid-cols-3">
            {photos.map((ph, i) => (
              <li key={ph.src} className="relative aspect-[3/2] bg-ash">
                <Image
                  src={ph.src}
                  alt={ph.alt}
                  fill
                  sizes="(min-width: 1200px) 384px, (min-width: 640px) 33vw, 100vw"
                  className="object-cover"
                  loading={i === 0 ? "eager" : "lazy"}
                />
              </li>
            ))}
          </ul>
        </section>

        {/* Programação */}
        <section id="programacao" className="mx-auto flex w-full max-w-page scroll-mt-8 flex-col gap-15 px-4 sm:px-6">
          <div className="flex flex-col gap-6">
            <Eyebrow>Programação</Eyebrow>
            <h2 className="font-display text-heading">Três dias em Goiânia</h2>
            <p className="max-w-[52ch] text-body-md">
              Resumo da programação prevista. Horários e locais serão divulgados aos participantes convidados.
            </p>
          </div>
          <ol className="grid gap-x-6 gap-y-12 md:grid-cols-3">
            {schedule.map((d) => (
              <li key={d.day} className="flex flex-col gap-6 border-t-4 border-grass pt-4">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-subheading">{d.day}</h3>
                  <span className="text-body font-semibold text-grass-deep">{d.date}</span>
                </div>
                <ul className="flex flex-col">
                  {d.items.map((it) => (
                    <li key={it} className="border-b border-ash py-3 text-body">
                      {it}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>

        <SponsorsSection />

        {/* Chamadas: patrocínio (e voluntariado, quando aberto). Card com sombra sólida, botão dentro. */}
        <section id="chamadas" className={`mx-auto grid w-full max-w-page gap-8 px-4 sm:px-6 ${showVolunteerCta ? "md:grid-cols-2" : ""}`}>
          <div className="flex flex-col gap-6 border-2 border-ink bg-marigold-wash p-6 shadow-hard md:p-8">
            <Eyebrow>Patrocínio</Eyebrow>
            <h2 className="max-w-[22ch] font-display text-heading-sm">Seja visto como apoiador do ecossistema empreendedor.</h2>
            <p className="max-w-[44ch] text-body-md">Cotas Master, Gold, Silver, Bronze e Startup, com contrapartidas em marca, mídia e evento.</p>
            <Link href="/patrocinio" className={buttonClass("primary", "md", "self-stretch sm:self-start")}>
              Ver cotas de patrocínio
            </Link>
          </div>
          {showVolunteerCta && (
            <div className="flex flex-col gap-6 border-2 border-ink bg-grass-wash p-6 shadow-hard md:p-8">
              <Eyebrow>Voluntariado</Eyebrow>
              <h2 className="max-w-[22ch] font-display text-heading-sm">Faça parte da equipe que faz o Summit acontecer.</h2>
              <p className="max-w-[44ch] text-body-md">Recepção, logística, comunicação, fotografia, experiências. Inscrições abertas.</p>
              <Link href="/voluntarios" className={buttonClass("secondary", "md", "self-stretch sm:self-start")}>
                Quero ser voluntário
              </Link>
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
