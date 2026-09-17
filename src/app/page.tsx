import { VolunteerForm } from "@/components/volunteer-form";
import { benefits, site, steps, volunteerAreas } from "@/content/site";

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <a href="#" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm text-white">SW</span>
            <span className="hidden sm:inline">{site.name}</span>
          </a>
          <nav className="flex items-center gap-4 text-sm font-medium text-muted">
            <a href="#sobre" className="hidden hover:text-ink sm:inline">
              O evento
            </a>
            <a href="#areas" className="hidden hover:text-ink sm:inline">
              Áreas
            </a>
            <a
              href="#inscricao"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              Quero ser voluntário
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-ink text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(22,163,74,0.35),transparent_55%)]" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-[1.2fr_1fr] md:items-center md:py-28">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-soft">
                <span className="h-2 w-2 rounded-full bg-brand" />
                Inscrições abertas para voluntários
              </p>
              <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl">
                Faça parte da equipe que faz o {site.name} acontecer
              </h1>
              <p className="mt-6 max-w-xl text-lg text-white/75">{site.tagline}. {site.description}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#inscricao"
                  className="rounded-lg bg-brand px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark"
                >
                  Inscrever-se agora
                </a>
                <a
                  href="#sobre"
                  className="rounded-lg border border-white/20 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-white/10"
                >
                  Saiba mais
                </a>
              </div>
            </div>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:grid-cols-1">
              {[
                { k: "Quando", v: site.date },
                { k: "Onde", v: `${site.venue} · ${site.city}` },
                { k: "Duração", v: "54 horas de imersão" },
              ].map((i) => (
                <div key={i.k} className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-white/50">{i.k}</dt>
                  <dd className="mt-1 text-lg font-semibold">{i.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Sobre */}
        <section id="sobre" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
          <div className="grid gap-10 md:grid-cols-2 md:items-start">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">O que é o Startup Weekend?</h2>
              <p className="mt-4 text-lg text-muted">
                Um evento de 54 horas em que participantes apresentam ideias na sexta, formam times, validam com
                mentores no sábado e fazem o pitch final para uma banca no domingo. Sem enrolação: é mão na massa
                do começo ao fim.
              </p>
              <p className="mt-4 text-lg text-muted">
                Os voluntários são a engrenagem invisível: recebem participantes, cuidam da logística, registram os
                momentos e garantem que tudo funcione. Em troca, vivem o evento por dentro.
              </p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {benefits.map((b) => (
                <li key={b.title} className="rounded-xl border border-line bg-white p-5">
                  <h3 className="font-bold">{b.title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{b.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Áreas */}
        <section id="areas" className="scroll-mt-20 border-y border-line bg-white">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Onde você pode ajudar</h2>
            <p className="mt-3 max-w-2xl text-lg text-muted">
              Escolha a área que combina com você. Se não souber, marque &ldquo;onde precisar&rdquo; e a gente
              encontra o melhor lugar.
            </p>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {volunteerAreas.map((a, i) => (
                <li key={a.value} className="flex items-center gap-4 rounded-xl border border-line bg-surface p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft font-mono text-sm font-bold text-brand">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-semibold">{a.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Como funciona */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Como funciona</h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="relative rounded-xl border border-line bg-white p-6">
                <span className="text-4xl font-black text-brand/20">{i + 1}</span>
                <h3 className="mt-2 font-bold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Formulário */}
        <section id="inscricao" className="scroll-mt-20 border-t border-line bg-white">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-[1fr_1.4fr]">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Inscreva-se como voluntário</h2>
              <p className="mt-4 text-lg text-muted">
                Preencha o formulário e a organização entra em contato pelo WhatsApp com os próximos passos.
              </p>
              <ul className="mt-8 space-y-3 text-sm text-muted">
                <li className="flex gap-3">
                  <span className="text-brand">●</span> Vagas limitadas por área
                </li>
                <li className="flex gap-3">
                  <span className="text-brand">●</span> Maiores de 18 anos
                </li>
                <li className="flex gap-3">
                  <span className="text-brand">●</span> Dúvidas:{" "}
                  <a href={`mailto:${site.contactEmail}`} className="font-medium text-brand hover:underline">
                    {site.contactEmail}
                  </a>
                </li>
              </ul>
            </div>
            <div className="relative rounded-2xl border border-line bg-surface p-6 sm:p-8">
              <VolunteerForm />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:px-6">
          <p>
            © {new Date().getFullYear()} {site.name}. {site.city}.
          </p>
          <div className="flex gap-5">
            <a href={site.instagram} target="_blank" rel="noreferrer" className="hover:text-ink">
              Instagram
            </a>
            <a href={`mailto:${site.contactEmail}`} className="hover:text-ink">
              Contato
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
