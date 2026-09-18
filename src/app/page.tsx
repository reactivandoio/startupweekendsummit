import { EventIllustration } from "@/components/event-illustration";
import { VolunteerForm } from "@/components/volunteer-form";
import { benefits, site, steps, volunteerAreas } from "@/content/site";

const wordmark = "summit";

export default function Home() {
  return (
    <>
      {/* Nav: wordmark à esquerda, links à direita, hairline embaixo */}
      <header className="sticky top-0 z-20 border-b border-chalk bg-obsidian">
        <div className="mx-auto flex max-w-page items-center justify-between px-4 py-1.5 sm:px-6">
          <a href="#" className="px-3 py-1.5 text-caption">
            {wordmark}
          </a>
          <nav className="flex items-center gap-23 text-caption uppercase">
            <a href="#sobre" className="hidden py-1.5 hover:underline hover:underline-offset-4 sm:inline">
              O evento
            </a>
            <a href="#areas" className="hidden py-1.5 hover:underline hover:underline-offset-4 sm:inline">
              Áreas
            </a>
            <a href="#inscricao" className="border border-chalk p-3 transition-colors hover:border-graphite">
              Inscrever-se
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero: duas colunas, display 80px à esquerda, ilustração à direita */}
        <section className="mx-auto grid max-w-page gap-10 px-4 py-20 sm:px-6 md:grid-cols-[1.3fr_1fr] md:items-center md:py-40">
          <div className="flex flex-col items-start gap-10">
            <p className="text-caption">
              Voluntariado · {site.date} · {site.city}
            </p>
            <h1 className="max-w-[12ch] text-display">Faça parte da equipe que faz o Startup Weekend acontecer.</h1>
            <a href="#inscricao" className="bg-paper p-3 text-caption uppercase text-obsidian transition-colors hover:bg-chalk">
              Quero ser voluntário
            </a>
          </div>
          <EventIllustration className="w-full max-w-[260px] md:max-w-[400px] md:justify-self-end" />
        </section>

        {/* Sobre */}
        <section id="sobre" className="scroll-mt-16 border-t border-chalk">
          <div className="mx-auto grid max-w-page gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 md:py-40">
            <div className="flex flex-col gap-10">
              <h2 className="text-heading">O que é o Startup Weekend?</h2>
              <div className="flex max-w-[52ch] flex-col gap-6 text-body">
                <p>
                  Um evento de 54 horas em que participantes apresentam ideias na sexta, formam times, validam com
                  mentores no sábado e fazem o pitch final para uma banca no domingo. Sem enrolação: é mão na massa do
                  começo ao fim.
                </p>
                <p>
                  Os voluntários são a engrenagem invisível: recebem participantes, cuidam da logística, registram os
                  momentos e garantem que tudo funcione. Em troca, vivem o evento por dentro.
                </p>
              </div>
            </div>
            <ul className="flex flex-col border-t border-chalk">
              {benefits.map((b) => (
                <li key={b.title} className="grid gap-3 border-b border-chalk py-6 md:grid-cols-[1fr_1.4fr]">
                  <h3 className="text-subheading">{b.title}</h3>
                  <p className="text-body">{b.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Áreas */}
        <section id="areas" className="scroll-mt-16 border-t border-chalk">
          <div className="mx-auto flex max-w-page flex-col gap-10 px-4 py-20 sm:px-6 md:py-40">
            <div className="flex flex-col gap-3">
              <h2 className="text-heading">Onde você pode ajudar</h2>
              <p className="max-w-[52ch] text-body">
                Escolha a área que combina com você. Se não souber, marque &ldquo;onde precisar&rdquo; e a gente
                encontra o melhor lugar.
              </p>
            </div>
            <ol className="border-t border-chalk">
              {volunteerAreas.map((a, i) => (
                <li key={a.value} className="flex items-baseline gap-6 border-b border-chalk py-3">
                  <span className="font-mono text-caption tracking-normal">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-heading">{a.label}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Como funciona */}
        <section className="border-t border-chalk">
          <div className="mx-auto flex max-w-page flex-col gap-10 px-4 py-20 sm:px-6 md:py-40">
            <h2 className="text-heading">Como funciona</h2>
            <ol className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => (
                <li key={s.title} className="flex flex-col gap-3 border-t border-chalk pt-3">
                  <span className="font-mono text-caption tracking-normal">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="text-subheading">{s.title}</h3>
                  <p className="text-caption">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Inscrição */}
        <section id="inscricao" className="scroll-mt-16 border-t border-chalk">
          <div className="mx-auto grid max-w-page gap-10 px-4 py-20 sm:px-6 md:grid-cols-[1fr_1.4fr] md:py-40">
            <div className="flex flex-col gap-10">
              <div className="flex flex-col gap-3">
                <h2 className="text-heading">Inscreva-se como voluntário</h2>
                <p className="max-w-[40ch] text-body">
                  Preencha o formulário e a organização entra em contato pelo WhatsApp com os próximos passos.
                </p>
              </div>
              <ul className="flex flex-col border-t border-chalk text-caption">
                <li className="border-b border-chalk py-3">Vagas limitadas por área</li>
                <li className="border-b border-chalk py-3">Maiores de 18 anos</li>
                <li className="border-b border-chalk py-3">
                  Dúvidas:{" "}
                  <a href={`mailto:${site.contactEmail}`} className="underline underline-offset-4">
                    {site.contactEmail}
                  </a>
                </li>
              </ul>
            </div>
            <VolunteerForm />
          </div>
        </section>
      </main>

      {/* Footer: linha de meta + wordmark gigante sangrando pela borda inferior */}
      <footer className="border-t border-chalk">
        <div className="mx-auto flex max-w-page flex-col justify-between gap-3 px-4 py-6 text-caption sm:flex-row sm:px-6">
          <p>
            © {new Date().getFullYear()} {site.name}. {site.city}.
          </p>
          <div className="flex gap-23 uppercase">
            <a href={site.instagram} target="_blank" rel="noreferrer" className="hover:underline hover:underline-offset-4">
              Instagram
            </a>
            <a href={`mailto:${site.contactEmail}`} className="hover:underline hover:underline-offset-4">
              Contato
            </a>
          </div>
        </div>
        <div className="mt-40 h-[0.6em] overflow-hidden text-[clamp(96px,18vw,260px)] leading-[0.95] tracking-[-0.03em]">
          <p className="mx-auto max-w-page whitespace-nowrap px-4 sm:px-6" aria-hidden="true">
            startup weekend {wordmark}
          </p>
        </div>
      </footer>
    </>
  );
}
