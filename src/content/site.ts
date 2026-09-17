// Conteúdo editável da landing page. Ajuste datas, local e textos aqui.

export const site = {
  name: "Startup Weekend Summit",
  tagline: "54 horas para transformar ideias em startups",
  description:
    "O Startup Weekend Summit reúne empreendedores, desenvolvedores, designers e curiosos em um fim de semana intenso de criação, validação e pitch. E nada disso acontece sem uma equipe de voluntários incrível.",
  date: "Data a confirmar",
  city: "Goiânia, GO",
  venue: "Local a confirmar",
  contactEmail: "contato@startupweekendsummit.com.br",
  instagram: "https://instagram.com/startupweekend",
};

export const volunteerAreas = [
  { value: "recepcao", label: "Recepção e credenciamento" },
  { value: "logistica", label: "Logística e infraestrutura" },
  { value: "comunicacao", label: "Comunicação e redes sociais" },
  { value: "fotografia", label: "Fotografia e vídeo" },
  { value: "mentoria", label: "Apoio a mentores e jurados" },
  { value: "tecnologia", label: "Tecnologia e suporte técnico" },
  { value: "qualquer", label: "Onde precisar de mim" },
] as const;

export const availabilityOptions = [
  { value: "pre-evento", label: "Semanas antes do evento" },
  { value: "sexta", label: "Sexta-feira (abertura)" },
  { value: "sabado", label: "Sábado (dia inteiro)" },
  { value: "domingo", label: "Domingo (pitches e encerramento)" },
] as const;

export const benefits = [
  {
    title: "Networking de verdade",
    text: "Conviva de perto com mentores, investidores e fundadores durante todo o fim de semana.",
  },
  {
    title: "Bastidores de um evento global",
    text: "Aprenda como se organiza um Startup Weekend, metodologia usada em mais de 150 países.",
  },
  {
    title: "Certificado e kit",
    text: "Certificado de participação, camiseta oficial e alimentação durante o evento.",
  },
  {
    title: "Comunidade",
    text: "Entre para a rede de voluntários e seja chamado primeiro para as próximas edições.",
  },
];

export const steps = [
  { title: "Inscreva-se", text: "Preencha o formulário abaixo. Leva menos de 2 minutos." },
  { title: "Bate-papo", text: "A organização entra em contato pelo WhatsApp para alinhar expectativas." },
  { title: "Onboarding", text: "Encontro online com toda a equipe para explicar funções e cronograma." },
  { title: "Evento", text: "Chegou o fim de semana. Você faz parte da história." },
];
