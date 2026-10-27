// Ilustrações do pacote da marca (monumentos de Goiânia). Dados puros, importáveis de componentes de servidor;
// quem renderiza é <Illustration> (components/illustration.tsx), que escolhe o arquivo pelo tema.
//
// As originais são opacas, em papel branco; a versão -escuro (scripts/ilustracoes-escuro.mjs) tem o papel
// transparente e a tinta branca, com o Marigold preservado — é a que entra no tema escuro.

export type Illustration = { src: string; dark: string; alt: string; width: number; height: number };

const art = (file: string, alt: string, width: number, height: number): Illustration => ({
  src: `/ilustracoes/${file}.webp`,
  dark: `/ilustracoes/${file}-escuro.webp`,
  alt,
  width,
  height,
});

export const illustrations = {
  chateaubriand: art("chateaubriand-evento", "Ilustração de pessoas reunidas em estandes de inovação ao redor do monumento de Chateaubriand, em Goiânia", 1400, 1079),
  tresRacas: art("monumento-tres-racas", "Ilustração do Monumento às Três Raças, em Goiânia: três figuras erguendo juntas um bloco Marigold", 627, 720),
  coreto: art("coreto-evento", "Ilustração de um evento no coreto do Lago das Rosas, em Goiânia, com pessoas conversando e apresentando", 1400, 1024),
  estacao: art("estacao-evento", "Ilustração de pessoas chegando a um evento em frente à Estação Ferroviária de Goiânia", 1400, 1409),
  relogio: art("relogio-goias", "Ilustração do Relógio da Avenida Goiás, em Goiânia", 654, 720),
  monumento85: art("monumento-85", "Ilustração do Monumento 85, em Goiânia", 634, 720),
  teatro: art("teatro-goiania", "Ilustração do Teatro Goiânia", 720, 696),
  trampolim: art("trampolim-lago-das-rosas", "Ilustração do trampolim do Lago das Rosas, em Goiânia", 466, 720),
} satisfies Record<string, Illustration>;
