import Image from "next/image";
import { Mural } from "@/components/mural";
import { VolunteerForm } from "@/components/volunteer-form";
import { benefits, pastHosts, photos, schedule, site, stats, steps, volunteerAreas } from "@/content/site";

// Fundos sólidos dos cards, no espírito dos retratos de palestrantes em cor chapada
const tileColors = ["bg-mint-wash", "bg-emerald-band", "bg-indigo", "bg-lavender", "bg-orange", "bg-yellow", "bg-maroon"];

// Formas brancas chapadas por cima dos tiles, no mesmo vocabulário do mural
const tileShapes = [
  <circle key="c" cx="55" cy="45" r="28" fill="#fff" />,
  <polygon key="h" points="55,15 82,30 82,60 55,75 28,60 28,30" fill="#fff" />,
  <polygon key="v" points="25,25 55,75 85,25 70,25 55,50 40,25" fill="#fff" />,
  <rect key="r" x="30" y="20" width="45" height="45" fill="#fff" />,
];

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`text-caption font-semibold uppercase tracking-[0.03em] ${light ? "text-paper" : "text-ink"}`}>
      {children}
    </p>
  );
}

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
      offers: {
        "@type": "Offer",
        name: "Inscrição de voluntários",
        url: `${site.url}/#inscricao`,
        price: "0",
        priceCurrency: "BRL",
        availability: "https://schema.org/InStock",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: site.url,
      name: site.shortName,
      inLanguage: "pt-BR",
      about: { "@id": `${site.url}/#event` },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      {/* Hero: canvas preto, nav transparente por cima, botão outlined em largura total */}
      <section className="bg-obsidian text-paper">
        <header className="mx-auto flex max-w-page items-center justify-between px-4 py-5 sm:px-6">
          <a href="#" aria-label={site.name}>
            <Image src="/logo-negativo.png" alt={site.name} width={129} height={60} priority className="h-[60px] w-auto" />
          </a>
          <nav className="flex items-center gap-6 whitespace-nowrap text-body tracking-[0.03em]">
            <a href="#sobre" className="hidden hover:underline hover:underline-offset-4 sm:inline">
              O evento
            </a>
            <a href="#areas" className="hidden hover:underline hover:underline-offset-4 sm:inline">
              Áreas
            </a>
            <a href="#inscricao" className="hover:underline hover:underline-offset-4">
              Inscrição
            </a>
          </nav>
        </header>

        <div className="mx-auto flex max-w-page flex-col gap-12 px-4 pb-20 pt-16 sm:px-6 md:pb-30 md:pt-30">
          <div className="flex flex-col gap-6">
            <Eyebrow light>Voluntariado</Eyebrow>
            <h1 className="font-display text-display">Faça parte da equipe que traz o Summit da Techstars para Goiânia.</h1>
          </div>
          <div className="flex flex-col gap-2 text-body-md">
            <p className="font-semibold">{site.date}</p>
            <p>
              {site.venue} · {site.city} · 3 dias
            </p>
          </div>
          <a
            href="#inscricao"
            className="flex h-16 w-full items-center justify-center border border-paper text-subheading transition-colors hover:bg-paper hover:text-obsidian"
          >
            Quero ser voluntário
          </a>
        </div>
      </section>

      <Mural />

      {/* Faixa mint: aviso de status + CTA secundário */}
      <section className="bg-mint-wash text-ink">
        <div className="mx-auto grid max-w-page gap-12 px-4 py-15 sm:px-6 md:grid-cols-2 md:items-end">
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-heading">Inscrições abertas.</h2>
            <p className="max-w-[44ch] text-body-md">
              Preencha o formulário no fim da página. A organização responde pelo WhatsApp em poucos dias.
            </p>
          </div>
          <div className="flex flex-col gap-4 md:items-end md:text-right">
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2 L23 21 H1 Z" fill="var(--color-ink)" />
            </svg>
            <p className="text-body-md font-semibold">Vagas limitadas por área</p>
            <p className="text-body">Maiores de 18 anos. Alimentação, camiseta e certificado inclusos.</p>
          </div>
        </div>
      </section>

      {/* Faixa esmeralda: tagline do evento */}
      <section className="bg-emerald-band text-ink">
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
        {/* Sobre + benefícios em grid de 4 (padrão dos cards de palestrantes) */}
        <section id="sobre" className="mx-auto flex w-full max-w-page scroll-mt-8 flex-col gap-15 px-4 sm:px-6">
          <div className="grid gap-12 md:grid-cols-[1fr_1fr]">
            <div className="flex flex-col gap-6">
              <Eyebrow>Sobre</Eyebrow>
              <h2 className="font-display text-heading">O que é o Summit?</h2>
            </div>
            <div className="flex flex-col gap-4 text-body-md md:pt-10">
              <p>
                O Techstars Startup Weekend Summit é o encontro nacional das lideranças voluntárias que organizam
                Startup Weekends, Startup Weeks e outros programas de comunidade pelo país — as pessoas que disseminam
                empreendedorismo e influenciam o ecossistema de startups no Brasil inteiro.
              </p>
              <p>
                São três dias de keynotes, workshops, painéis e fun experiences com participantes de todas as regiões e
                convidados internacionais. Em 2026 o Summit é retomado e chega a Goiânia pela primeira vez.
              </p>
              <p>
                Os voluntários são a engrenagem invisível: recebem participantes, cuidam da logística, registram os
                momentos e garantem que tudo funcione. Em troca, vivem o evento por dentro.
              </p>
              <p className="text-caption tracking-[0.03em] uppercase">
                Edições anteriores: {pastHosts.join(" · ")}
              </p>
            </div>
          </div>
          <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b, i) => (
              <li key={b.title} className="flex flex-col gap-6">
                <div className={`relative flex aspect-square items-end p-4 ${tileColors[i % tileColors.length]}`}>
                  <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
                    {tileShapes[i % tileShapes.length]}
                  </svg>
                  <span className="relative font-mono text-body tracking-[0.03em] text-ink">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-body-md font-semibold">{b.title}</h3>
                  <p className="text-body">{b.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* After movie da última edição */}
        <section className="mx-auto flex w-full max-w-page flex-col gap-15 px-4 sm:px-6">
          <div className="grid gap-6 md:grid-cols-2 md:items-end">
            <div className="flex flex-col gap-6">
              <Eyebrow>After movie</Eyebrow>
              <h2 className="font-display text-heading">Como foi em Uberlândia, 2025</h2>
            </div>
            <p className="max-w-[44ch] text-body-md md:justify-self-end">
              86 lideranças e executivos do ecossistema de startups, 17 estados, mais de 22 horas de atividades. É
              disso que você vai fazer parte.
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
        <section className="mx-auto flex w-full max-w-page flex-col gap-15 px-4 sm:px-6">
          <div className="flex flex-col gap-6">
            <Eyebrow>Programação</Eyebrow>
            <h2 className="font-display text-heading">Três dias em Goiânia</h2>
            <p className="max-w-[52ch] text-body-md">
              Resumo da programação prevista. Detalhes de horários e locais chegam no onboarding dos voluntários.
            </p>
          </div>
          <ol className="grid gap-x-6 gap-y-12 md:grid-cols-3">
            {schedule.map((d) => (
              <li key={d.day} className="flex flex-col gap-6 border-t border-ink pt-4">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-subheading">{d.day}</h3>
                  <span className="font-mono text-body tracking-[0.03em]">{d.date}</span>
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

        {/* Áreas */}
        <section id="areas" className="mx-auto flex w-full max-w-page scroll-mt-8 flex-col gap-15 px-4 sm:px-6">
          <div className="flex flex-col gap-6">
            <Eyebrow>Áreas</Eyebrow>
            <h2 className="font-display text-heading">Onde você pode ajudar</h2>
            <p className="max-w-[52ch] text-body-md">
              Escolha a área que combina com você. Se não souber, marque &ldquo;onde precisar&rdquo; e a gente
              encontra o melhor lugar.
            </p>
          </div>
          <ul className="border-t border-ink">
            {volunteerAreas.map((a, i) => (
              <li key={a.value} className="flex items-baseline gap-6 border-b border-ash py-6">
                <span className="font-mono text-body tracking-[0.03em]">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-display text-heading-sm">{a.label}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Como funciona */}
        <section className="mx-auto flex w-full max-w-page flex-col gap-15 px-4 sm:px-6">
          <div className="flex flex-col gap-6">
            <Eyebrow>Processo</Eyebrow>
            <h2 className="font-display text-heading">Como funciona</h2>
          </div>
          <ol className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="flex flex-col gap-4 border-t border-ink pt-4">
                <span className="font-mono text-body tracking-[0.03em]">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="text-body-md font-semibold">{s.title}</h3>
                <p className="text-body">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Inscrição */}
        <section id="inscricao" className="mx-auto grid w-full max-w-page scroll-mt-8 gap-15 px-4 sm:px-6 md:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col gap-6">
            <Eyebrow>Inscreva-se</Eyebrow>
            <h2 className="font-display text-heading">Inscreva-se como voluntário</h2>
            <p className="max-w-[40ch] text-body-md">
              Leva menos de 2 minutos. A organização entra em contato pelo WhatsApp com os próximos passos.
            </p>
            <p className="text-body">
              Dúvidas:{" "}
              <a href={`mailto:${site.contactEmail}`} className="underline underline-offset-4">
                {site.contactEmail}
              </a>
            </p>
          </div>
          <VolunteerForm />
        </section>
      </main>

      {/* Footer: preto, monograma + links */}
      <footer className="bg-obsidian text-paper">
        <div className="mx-auto flex max-w-page flex-col justify-between gap-8 px-4 py-15 sm:flex-row sm:items-end sm:px-6">
          <div className="flex flex-col gap-6">
            <Image src="/logo-negativo.png" alt={site.name} width={172} height={80} className="h-[80px] w-auto self-start" />
            <p className="text-body">
              © {new Date().getFullYear()} Techstars Startup Weekend Summit Brasil · {site.city}. Organização voluntária
              da comunidade Startup Weekend em Goiás.
            </p>
          </div>
          <div className="flex gap-6 text-body tracking-[0.03em]">
            <a href={site.instagram} target="_blank" rel="noreferrer" className="hover:underline hover:underline-offset-4">
              Instagram
            </a>
            <a href={`mailto:${site.contactEmail}`} className="hover:underline hover:underline-offset-4">
              Contato
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
