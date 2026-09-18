// Conteúdo editável da landing page. Fonte: deck institucional "Techstars Startup Weekend Summit 2026 - Goiânia".

export const site = {
  url: "https://startupweekendsummit.com.br",
  name: "Techstars Startup Weekend Summit Brasil 2026",
  shortName: "TSW Summit Brasil 2026",
  tagline: "O maior encontro de líderes de comunidades de startups do Brasil",
  description:
    "O Summit da Techstars reúne, por três dias, as lideranças voluntárias que disseminam empreendedorismo e influenciam o ecossistema de startups no Brasil inteiro. Em 2026 o evento nacional é retomado e chega a Goiânia pela primeira vez — e nada disso acontece sem uma equipe de voluntários incrível.",
  date: "4 a 6 de dezembro de 2026",
  startDate: "2026-12-04",
  endDate: "2026-12-06",
  dateShort: "4–6 dez 2026",
  city: "Goiânia, GO",
  cityName: "Goiânia",
  state: "GO",
  venue: "Local a confirmar",
  contactEmail: "contato@8020digital.com.br",
  whatsapp: "+55 62 98221-4275",
  whatsappUrl: "https://wa.me/5562982214275",
  instagram: "https://www.instagram.com/techstarsstartupweekendsummit/",
  organizer: "Techstars",
  // Google Analytics 4 (stream do projeto Firebase "startupweekendsummit")
  gaId: "G-T2LRML1JEF",
  organizerUrl: "https://www.techstars.com",
  // Descrição curta pra buscadores (~155 caracteres)
  seoDescription:
    "Techstars Startup Weekend Summit Brasil 2026, em Goiânia, de 4 a 6 de dezembro: o encontro nacional de líderes de comunidades de startups chega a Goiás pela primeira vez.",
  seoDescriptionVolunteers:
    "Seja voluntário no Techstars Startup Weekend Summit Brasil 2026, em Goiânia, de 4 a 6 de dezembro. Recepção, logística, comunicação, fotografia e mais. Inscrições abertas.",
  seoDescriptionSponsors:
    "Patrocine o Techstars Startup Weekend Summit Brasil 2026, em Goiânia. Cotas Master, Gold, Silver, Bronze e Startup com branding, mídia, ativações no evento e cortesias.",
  keywords: [
    "Startup Weekend Summit",
    "Techstars Startup Weekend Summit Brasil 2026",
    "TSW Summit Brasil",
    "Startup Weekend Goiânia",
    "Techstars Goiânia",
    "voluntário evento Goiânia",
    "voluntariado startup",
    "comunidade de startups Goiás",
    "evento de empreendedorismo Goiânia 2026",
  ],
  // After movie da edição 2025 (Uberlândia)
  afterMovieId: "07oPYrozJM4",
};

// Números da última edição (Uberlândia, 2025) e projeção para 2026
export const stats = [
  { value: "3", label: "dias de evento" },
  { value: "80–100", label: "lideranças participantes" },
  { value: "40", label: "cidades representadas" },
  { value: "16", label: "estados do Brasil" },
];

// Fotos da edição 2025 em Uberlândia (public/fotos), proporção 3:2
export const photos = [
  { src: "/fotos/uberlandia-1.jpg", alt: "Participantes do Summit 2025 reunidos em frente ao banner do evento, no Brain" },
  { src: "/fotos/uberlandia-2.jpg", alt: "Participantes comemorando de braços erguidos na arquibancada do Parque UNA" },
  { src: "/fotos/uberlandia-3.jpg", alt: "Foto de grupo ao ar livre no quiosque do Parque do Sabiá" },
];

// Cidades que já sediaram o Summit no Brasil
export const pastHosts = ["Rio de Janeiro", "Belo Horizonte", "São Paulo", "Florianópolis", "Uberlândia"];

export const volunteerAreas = [
  { value: "recepcao", label: "Recepção e credenciamento" },
  { value: "logistica", label: "Logística e infraestrutura" },
  { value: "comunicacao", label: "Comunicação e redes sociais" },
  { value: "fotografia", label: "Fotografia e vídeo" },
  { value: "convidados", label: "Apoio a palestrantes e convidados" },
  { value: "experiencias", label: "Fun e learning experiences" },
  { value: "tecnologia", label: "Tecnologia e suporte técnico" },
  { value: "qualquer", label: "Onde precisar de mim" },
] as const;

export const availabilityOptions = [
  { value: "pre-evento", label: "Semanas antes do evento" },
  { value: "sexta", label: "Sexta, 4/12 (kickoff e welcome dinner)" },
  { value: "sabado", label: "Sábado, 5/12 (dia inteiro)" },
  { value: "domingo", label: "Domingo, 6/12 (encerramento)" },
] as const;

export const benefits = [
  {
    title: "Networking nacional",
    text: "Conviva por três dias com líderes de comunidades, fundadores e executivos de 16 estados do Brasil.",
  },
  {
    title: "Bastidores de um evento Techstars",
    text: "Aprenda como se organiza o encontro nacional de uma rede presente em mais de 150 países.",
  },
  {
    title: "Certificado e kit",
    text: "Certificado de participação, camiseta oficial e alimentação durante o evento.",
  },
  {
    title: "Comunidade",
    text: "Entre para a rede de voluntários da Techstars em Goiás e seja chamado primeiro para as próximas edições.",
  },
];

export const steps = [
  { title: "Inscreva-se", text: "Preencha o formulário abaixo. Leva menos de 2 minutos." },
  { title: "Bate-papo", text: "A organização entra em contato pelo WhatsApp para alinhar expectativas." },
  { title: "Onboarding", text: "Encontro online com toda a equipe para explicar funções e cronograma." },
  { title: "Summit", text: "4 a 6 de dezembro. Você faz parte da história do evento em Goiânia." },
];

// Contatos comerciais (deck institucional, slide "Contato comercial")
export const commercialContacts = [
  { name: "Jackeline Mendes", role: "Comercial", email: "jackeline.m.ferreira@gmail.com", phone: "(62) 99402-5205", wa: "5562994025205" },
  { name: "Roldão Barros Jr.", role: "Líder da organização", email: "ola@roldaobarros.com", phone: "(62) 98221-4275", wa: "5562982214275" },
  { name: "Pedro Silva", role: "Marketing", email: "contato@8020digital.com.br", phone: "(62) 99396-2325", wa: "5562993962325" },
];

// Cotas de patrocínio e contrapartidas (deck institucional). Ordem das colunas = ordem de `tiers`.
export const sponsorship = {
  tiers: [
    { id: "master", name: "Master", price: "R$ 45.000" },
    { id: "gold", name: "Gold", price: "R$ 30.000" },
    { id: "silver", name: "Silver", price: "R$ 15.000" },
    { id: "bronze", name: "Bronze", price: "R$ 7.000" },
    { id: "startup", name: "Startup", price: "R$ 2.000", note: "ou menor" },
  ],
  // cada item: [rótulo, [master, gold, silver, bronze, startup]] — true = incluso, string = valor
  categories: [
    {
      name: "Branding",
      items: [
        ["Logo no site oficial do evento", [true, true, true, true, true]],
        ["Logo na tela digital de patrocinadores durante o evento", [true, true, true, true, true]],
        ["Mencionado como patrocinador na abertura do evento", [true, true, true, true, true]],
        ["Direito de uso promocional da marca, imagens e vídeo", [true, true, true, true, false]],
        ["Logo no encerramento do vídeo do evento", [true, true, true, false, false]],
        ["Logo nos brindes promocionais (quando aplicável)", [true, true, false, false, false]],
        ["Logo nas camisetas comemorativas", [true, true, false, false, false]],
        ["Logo na abertura do vídeo do evento", [true, false, false, false, false]],
        ["Techstars Brasil Summit: Presented by \"Sua Empresa\"", [true, false, false, false, false]],
      ],
    },
    {
      name: "Material impresso",
      items: [
        ["Logo na programação e agenda", [true, true, true, true, true]],
        ["Logo nos pôsteres e banners", [true, true, true, true, false]],
        ["Logo no backdrop", [true, true, true, false, false]],
        ["Backdrop exclusivo / espaço instagramável", [true, false, false, false, false]],
      ],
    },
    {
      name: "Mídia",
      items: [
        ["Mencionado no e-mail marketing brasileiro (10k+ assinantes)", [true, true, true, true, true]],
        ["Post coletivo com patrocinadores nas redes sociais", [true, true, true, true, true]],
        ["Mailing dos participantes e relatório de atividade e impacto do evento", [true, true, true, false, false]],
        ["Menção no post pós-evento no blog da Techstars (internacional)", [true, true, false, false, false]],
        ["Logo em toda comunicação via e-mail aos participantes", [true, true, false, false, false]],
        ["Campanha nas mídias sociais", [true, true, false, false, false]],
        ["Mensagem do patrocinador de 5 minutos durante a abertura do evento", [true, false, false, false, false]],
        ["Menção no press release e na cobertura de mídia", [true, false, false, false, false]],
      ],
    },
    {
      name: "Evento",
      items: [
        ["Possibilidade de entregar material promocional (folhetos, brindes)", [true, true, true, true, true]],
        ["Patrocínio de uma fun experience ou learning experience", [true, true, true, true, false]],
        ["Painel com influenciadores (opcional)", [true, true, false, false, false]],
        ["Possibilidade de montar estande / espaço promocional", [true, true, false, false, false]],
        ["Jantar especial patrocinado por \"Sua Empresa\" (valor à parte)", [true, false, false, false, false]],
      ],
    },
    {
      name: "Ingressos para o evento",
      items: [
        ["Cortesias para o evento", ["8", "4", "2", "1", "1"]],
        ["Corporate Innovation Day", ["3", "2", "2", "1", false]],
      ],
    },
  ] as { name: string; items: [string, (boolean | string)[]][] }[],
};

// Programação resumida do deck institucional
export const schedule = [
  {
    day: "Dia 1",
    date: "Sexta, 4/12",
    items: ["Summit Kickoff", "Showcase da cidade", "Ask Me Anything com convidado", "Learning experiences", "Welcome dinner"],
  },
  {
    day: "Dia 2",
    date: "Sábado, 5/12",
    items: ["Fun experiences", "Keynote", "Workshop especial com a cidade", "Painel de facilitadores", "Community celebration"],
  },
  {
    day: "Dia 3",
    date: "Domingo, 6/12",
    items: ["Fun experiences", "Keynote", "Almoço & encontro", "Aprendizados", "Encerramento"],
  },
];
