import Image from "next/image";

/* Mural full-bleed: monumentos de Goiânia (ilustrações do pacote da marca) em fila,
   apoiados na faixa de degradê Grass → Marigold. Divisor decorativo — não carrega informação.
   No celular ficam só os três primeiros, pra não espremer os desenhos. */
const monuments = [
  { src: "/ilustracoes/relogio-goias.webp", width: 654, height: 720 },
  { src: "/ilustracoes/monumento-tres-racas.webp", width: 627, height: 720 },
  { src: "/ilustracoes/trampolim-lago-das-rosas.webp", width: 466, height: 720 },
  { src: "/ilustracoes/monumento-85.webp", width: 634, height: 720 },
  { src: "/ilustracoes/teatro-goiania.webp", width: 720, height: 696 },
];

export function Mural() {
  return (
    <div className="w-full overflow-hidden bg-paper" aria-hidden="true">
      <div className="mx-auto flex max-w-page items-end justify-between gap-4 px-4 sm:px-6">
        {monuments.map((m, i) => (
          <Image
            key={m.src}
            src={m.src}
            alt=""
            width={m.width}
            height={m.height}
            sizes="(min-width: 768px) 240px, 140px"
            className={`h-[150px] w-auto min-w-0 object-contain object-bottom md:h-[230px] ${i > 2 ? "hidden md:block" : ""}`}
          />
        ))}
      </div>
      <div className="h-4 bg-linear-to-r from-grass to-marigold" />
    </div>
  );
}
