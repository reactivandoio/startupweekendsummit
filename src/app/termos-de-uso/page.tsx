import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal-page";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Termos de Participação",
  description: `Termos de Participação do ${site.name}: condições de inscrição, conduta, uso de imagem, compartilhamento com patrocinadores, uso e privacidade e cancelamento e reembolso. Leia antes de se inscrever.`,
  alternates: { canonical: "/termos-de-uso" },
};

const mail = `[${site.contactEmail}](mailto:${site.contactEmail})`;

/* Estrutura e redação seguem os Termos de Participação do Startup Weekend Anápolis (startupweekendanapolis.com.br/startup-weekend/termos),
   adaptados ao Summit: inscrição por convite com Stripe e Opa Pingou, idade mínima de 18 anos, e as seções próprias de uso de imagem
   (#uso-de-imagem) e de compartilhamento com patrocinadores (#patrocinadores), cujas âncoras os checkboxes da inscrição usam. */
const sections: LegalSection[] = [
  {
    id: "acordo",
    title: "Acordo de Termos de Participação",
    content: `É nosso trabalho proporcionar uma experiência incrível de aprendizagem e networking. Nossa intenção é que você conheça pessoas incríveis, que lideram comunidades de startups no Brasil inteiro, aprenda com elas e também com mentores, parceiros e patrocinadores. O evento pretende ser um fórum colaborativo para compartilhar, aprender, construir e se divertir.

Dessa forma, ao se inscrever como participante, você reconhece que qualquer ideia compartilhada por você ou por outras pessoas ao longo do evento é contribuição para a experiência e para a comunidade em geral. Se você estiver muito preocupado(a), pode reduzir o que apresenta a um esboço breve da sua ideia, sem compartilhar informação importante.

Ao se inscrever, você concorda com estes Termos de Participação. Podemos atualizá-los; a data da última atualização aparece no topo desta página. Estes Termos são regidos pelas leis brasileiras, e fica eleito o foro da comarca de ${site.cityName}, ${site.state}, para qualquer questão decorrente deles.`,
  },
  {
    id: "inscricao",
    title: "Inscrição e Pagamento",
    content: `As vagas são limitadas e a inscrição acontece por convite da organização, pelo link pessoal recebido. Ao se inscrever, você declara que:

• Tem 18 anos ou mais na data da inscrição
• As informações fornecidas (nome, e-mail, WhatsApp, CPF e data de nascimento) são verdadeiras, completas e atualizadas
• O convite é pessoal e não deve ser repassado a terceiros

O pagamento da inscrição é feito online, por cartão (processado pelo Stripe) ou por Pix (processado pelo Opa Pingou). Esses serviços são de terceiros, sujeitos aos próprios termos e à própria disponibilidade; a organização não armazena dados de cartão nem de conta bancária. Toda inscrição, paga ou gratuita (com cupom ou cortesia), por convite ou pela página de inscrição, passa pela aprovação da organização: a inscrição só é confirmada depois de aprovada, e então o ingresso é enviado para o e-mail cadastrado. Se não for aprovada, o valor pago é devolvido integralmente. Cupons de desconto não se somam ao desconto do convite: vale o maior.

A organização pode cancelar inscrições feitas com informações falsas, com convite indevido ou em desacordo com estes Termos.`,
  },
  {
    id: "conduta",
    title: "Conduta e Responsabilidade",
    content: `Como membro da sua comunidade de startups, você concorda em incluir todas e quaisquer pessoas e suas ideias. Você concorda em agir profissionalmente, tratar todos com respeito e tratar as instalações do evento com o devido cuidado.

Você concorda que é responsável em caso de quaisquer acidentes ou danos que causar.

Você também concorda em não responsabilizar o Techstars Startup Weekend Summit, a organização do evento, sua equipe de voluntários ou qualquer um dos patrocinadores e apoiadores do evento por qualquer perda, dano, lesão ou qualquer outro tipo de incidente imprevisível, na máxima extensão permitida pela legislação aplicável.

A organização pode retirar do evento, sem reembolso, quem desrespeitar estas regras de conduta.`,
  },
  {
    id: "uso-de-imagem",
    title: "Permissão de Imagem e Voz",
    content: `O ${site.name} é registrado em fotos, vídeos, áudios e transmissões ao vivo. Ao participar do evento, você concede permissão à organização, a título gratuito, para captar e utilizar sua imagem, voz e nome, isoladamente ou em conjunto com outros participantes, para:

• Divulgar o evento, suas próximas edições e as comunidades envolvidas
• Produzir conteúdo institucional da organização e da comunidade Techstars Startup Weekend, para que possamos continuar a oferecer incríveis Startup Weekends
• Publicar e transmitir esse conteúdo em qualquer mídia ou formato, como site, redes sociais, plataformas de vídeo, imprensa, materiais impressos e apresentações

Esta autorização é concedida sem qualquer remuneração, no Brasil e no exterior, pelo prazo de 5 (cinco) anos contados da data do evento. Conteúdos publicados dentro desse prazo poderão permanecer disponíveis nos canais onde foram veiculados, sem obrigação de remoção.

A organização não utilizará sua imagem de forma vexatória, que atente contra a sua honra ou em associação a produtos ou serviços de terceiros sem a sua autorização específica. Se não quiser ser registrado de perto, procure a equipe da organização no credenciamento; para pedir a retirada de um conteúdo específico, escreva para ${mail} e avaliaremos o pedido.`,
  },
  {
    id: "patrocinadores",
    title: "Compartilhamento de Dados com Patrocinadores",
    content: `O ${site.name} é viabilizado por patrocinadores, que podem ter interesse em se conectar com os participantes. Por isso, os dados de inscrição poderão ser compartilhados com os patrocinadores do evento, **somente se você der o seu consentimento específico para isso**, marcando a opção própria do formulário de inscrição, separada do aceite destes Termos, nos termos do art. 7º, inciso I, da Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018). O consentimento é opcional: recusá-lo não impede a sua inscrição nem a sua participação no evento.

**Quais dados**
• Nome completo, e-mail e telefone (WhatsApp)
• CPF, data de nascimento e dados de pagamento **nunca** são compartilhados com patrocinadores

**Para quê**
• Contato do patrocinador com você sobre produtos, serviços, vagas, programas e oportunidades ligados ao ecossistema de startups
• Convites para ações e ativações do patrocinador durante ou após o evento

**Como exercer seus direitos**
• Você pode revogar o consentimento a qualquer momento, sem custo, pelo e-mail ${mail}; a partir da revogação, seus dados deixam de ser enviados a patrocinadores
• Você pode pedir a lista dos patrocinadores que receberam os seus dados
• Ao receber os dados, cada patrocinador passa a ser responsável pelo tratamento que fizer deles; para corrigir ou excluir seus dados na base de um patrocinador, ou para deixar de receber as comunicações dele, fale diretamente com ele (toda comunicação deve oferecer uma forma de descadastro)

Os patrocinadores se comprometem a usar os dados apenas para as finalidades acima, sem revendê-los. Mais detalhes na seção de compartilhamento da nossa [Política de Privacidade](/politica-de-privacidade#compartilhamento).`,
  },
  {
    id: "privacidade",
    title: "Termos de Uso e Privacidade",
    content: `O tratamento dos seus dados pessoais por este site e pela organização do evento é descrito na nossa [Política de Privacidade](/politica-de-privacidade), que é parte integrante destes Termos.

O Techstars Startup Weekend é um programa da Techstars. Ao se inscrever em um evento Techstars Startup Weekend, você também concorda com os [Termos de Uso](https://www.techstars.com/terms-of-use) e a [Política de Privacidade](https://www.techstars.com/privacy-policy) da Techstars (em inglês). Se você tiver dúvidas sobre eles, entre em contato com [privacy@techstars.com](mailto:privacy@techstars.com).

As marcas, logotipos e nomes exibidos no site e no evento, incluindo os da Techstars e dos patrocinadores, pertencem aos seus respectivos titulares.`,
  },
  {
    id: "reembolso",
    title: "Cancelamento e Reembolso",
    content: `A inscrição é um pagamento único, sem assinatura. Cancelamentos, reembolsos e transferências de inscrição seguem a nossa [Política de Cancelamento e Reembolso](/politica-de-cancelamento-e-reembolso), que é parte integrante destes Termos. Em resumo:

• Até 7 dias depois da compra, você pode desistir e recebe o valor integral de volta (direito de arrependimento, art. 49 do Código de Defesa do Consumidor)
• Depois disso, cancelamento com reembolso de 50% até 19 de novembro de 2026 e transferência da inscrição para outra pessoa até 2 de dezembro de 2026
• Inscrições não aprovadas e eventos cancelados pela organização são reembolsados integralmente

Reembolsos são devolvidos pelo mesmo meio de pagamento usado na inscrição (Pix, pelo Opa Pingou, ou cartão, pelo Stripe). Pedidos: ${mail}.`,
  },
];

export default function TermosDeUsoPage() {
  return (
    <LegalPage
      eyebrow="Documento"
      title="Termos de Participação."
      updated="29 de outubro de 2026"
      intro={{
        label: "Descrição do evento",
        text: `O ${site.name} reúne, por três dias, as lideranças voluntárias que disseminam empreendedorismo e influenciam o ecossistema de startups no Brasil inteiro. De ${site.date}, em ${site.cityName}, você vai conhecer quem organiza as comunidades Startup Weekend pelo país, mentores, parceiros e patrocinadores, trocar aprendizados e construir, junto, os próximos passos do movimento no Brasil.`,
      }}
      sections={sections}
      closing={{
        text: "Ao se inscrever, você aceita todos os termos acima. A participação é por convite da organização; se tiver dúvidas, fale com a gente.",
        cta: { href: `mailto:${site.contactEmail}`, label: site.contactEmail },
      }}
      related={{ href: "/politica-de-privacidade", label: "Política de Privacidade" }}
    />
  );
}
