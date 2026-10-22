import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal-page";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: `Termos de Uso do site do ${site.name}. Leia os termos e condições que regem o uso do site, das inscrições e do painel da organização.`,
  alternates: { canonical: "/termos-de-uso" },
};

/* Texto herdado dos Termos de Uso do Hub Community (8020 Digital), com as adaptações listadas na revisão STA-2:
   nome do serviço, descrição do que o site faz, forma de acesso ao painel e referências a cookies/analytics.
   As seções 6 (uso de imagem) e 7 (patrocinadores) são próprias do evento e não vêm do Hub Community. */
const sections: LegalSection[] = [
  {
    id: "aceitacao",
    title: "1. Aceitação dos Termos",
    content: `Ao acessar ou utilizar o site do ${site.name} ("Plataforma"), você concorda em cumprir e ficar vinculado a estes Termos de Uso do Serviço ("Termos"). Se você não concordar com qualquer parte destes Termos, não deverá utilizar a Plataforma.

A utilização continuada da Plataforma após a publicação de alterações nestes Termos constitui sua aceitação dessas alterações.`,
  },
  {
    id: "descricao",
    title: "2. Descrição do Serviço",
    content: `A Plataforma é o site oficial do ${site.name}, o encontro nacional das lideranças de comunidades de startups, realizado em ${site.city}. Por meio dela, a organização divulga o evento e recebe inscrições, candidaturas de voluntariado e contato de patrocinadores.

Nossos serviços incluem, mas não se limitam a:
• Divulgação de informações sobre o evento, programação e patrocinadores
• Inscrição de participantes por convite, com pagamento online por cartão (Stripe) ou Pix (Opa Pingou)
• Cadastro de voluntários para a organização do evento
• Divulgação das cotas de patrocínio e contato com o time comercial
• Painel de acesso restrito para a equipe da organização`,
  },
  {
    id: "conta",
    title: "3. Conta e Cadastro",
    content: `O painel da organização é restrito à equipe do evento. O acesso é feito por link de uso único enviado para o e-mail cadastrado, sem senha.

Ao utilizar o painel ou enviar seus dados em um formulário da Plataforma, você declara que:
• As informações fornecidas são verdadeiras, completas e atualizadas
• Você é responsável por manter a confidencialidade dos links de acesso recebidos por e-mail
• Você é responsável por todas as atividades realizadas com o seu acesso
• Você notificará imediatamente a organização sobre qualquer uso não autorizado do seu acesso

Reservamo-nos o direito de suspender ou encerrar acessos que violem estes Termos ou que apresentem atividade suspeita.`,
  },
  {
    id: "regras",
    title: "4. Regras de Uso da Plataforma",
    content: `Ao utilizar a Plataforma, você concorda em não:
• Utilizar a Plataforma para fins ilegais ou não autorizados
• Publicar conteúdo ofensivo, difamatório, discriminatório ou que viole direitos de terceiros
• Realizar spam, phishing ou qualquer forma de comunicação indesejada
• Tentar acessar áreas restritas da Plataforma sem autorização
• Interferir no funcionamento normal da Plataforma ou de seus servidores
• Coletar dados de outros usuários sem consentimento
• Criar contas falsas ou utilizar identidades fictícias com intuito fraudulento
• Utilizar bots, scrapers ou ferramentas automatizadas sem autorização prévia

O descumprimento dessas regras pode resultar na suspensão ou exclusão do seu acesso, sem aviso prévio.`,
  },
  {
    id: "conteudo",
    title: "5. Conteúdo do Usuário",
    content: `Ao enviar conteúdo à Plataforma (incluindo, mas não se limitando a dados de inscrição, candidatura de voluntariado, informações e logotipos de patrocinadores), você:

• Declara ser o titular dos direitos sobre o conteúdo ou possuir autorização para enviá-lo
• Concede à organização uma licença não exclusiva, global e gratuita para usar, reproduzir, modificar e exibir o conteúdo no âmbito dos serviços da Plataforma
• Reconhece que o conteúdo enviado como patrocinador poderá ser visível para outros usuários da Plataforma

A organização não se responsabiliza pelo conteúdo enviado por usuários, mas reserva-se o direito de remover conteúdo que viole estes Termos ou as leis aplicáveis.`,
  },
  {
    id: "uso-de-imagem",
    title: "6. Uso de Imagem e Voz do Participante",
    content: `O ${site.name} é registrado em fotos, vídeos, áudios e transmissões ao vivo. Ao participar do evento, você autoriza a organização, a título gratuito, a captar e utilizar sua imagem, voz e nome, isoladamente ou em conjunto com outros participantes, para:

• Divulgar o evento, suas próximas edições e as comunidades envolvidas
• Produzir conteúdo institucional da organização e da comunidade Techstars Startup Weekend
• Publicar e transmitir esse conteúdo em qualquer mídia ou formato, como site, redes sociais, plataformas de vídeo, imprensa, materiais impressos e apresentações

Esta autorização é concedida sem qualquer remuneração, no Brasil e no exterior, pelo prazo de 5 (cinco) anos contados da data do evento. Conteúdos publicados dentro desse prazo poderão permanecer disponíveis nos canais onde foram veiculados, sem obrigação de remoção.

A organização não utilizará sua imagem de forma vexatória, que atente contra a sua honra ou em associação a produtos ou serviços de terceiros sem a sua autorização específica. Se não quiser ser registrado de perto, procure a equipe da organização no credenciamento; para pedir a retirada de um conteúdo específico, escreva para [${site.contactEmail}](mailto:${site.contactEmail}) e avaliaremos o pedido.`,
  },
  {
    id: "patrocinadores",
    title: "7. Compartilhamento de Dados com Patrocinadores",
    content: `O ${site.name} é viabilizado por patrocinadores, que podem ter interesse em se conectar com os participantes. Por isso, os dados de inscrição poderão ser compartilhados com os patrocinadores do evento, **somente se você der o seu consentimento específico para isso**, marcando a opção própria do formulário de inscrição, separada do aceite destes Termos, nos termos do art. 7º, inciso I, da Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018). O consentimento é opcional: recusá-lo não impede a sua inscrição nem a sua participação no evento.

**Quais dados**
• Nome completo, e-mail e telefone (WhatsApp)
• CPF, data de nascimento e dados de pagamento **nunca** são compartilhados com patrocinadores

**Para quê**
• Contato do patrocinador com você sobre produtos, serviços, vagas, programas e oportunidades ligados ao ecossistema de startups
• Convites para ações e ativações do patrocinador durante ou após o evento

**Como exercer seus direitos**
• Você pode revogar o consentimento a qualquer momento, sem custo, pelo e-mail [${site.contactEmail}](mailto:${site.contactEmail}); a partir da revogação, seus dados deixam de ser enviados a patrocinadores
• Você pode pedir a lista dos patrocinadores que receberam os seus dados
• Ao receber os dados, cada patrocinador passa a ser responsável pelo tratamento que fizer deles; para corrigir ou excluir seus dados na base de um patrocinador, ou para deixar de receber as comunicações dele, fale diretamente com ele (toda comunicação deve oferecer uma forma de descadastro)

Os patrocinadores se comprometem a usar os dados apenas para as finalidades acima, sem revendê-los. Mais detalhes na seção de compartilhamento da nossa [Política de Privacidade](/politica-de-privacidade#compartilhamento).`,
  },
  {
    id: "propriedade",
    title: "8. Propriedade Intelectual",
    content: `Todo o conteúdo original da Plataforma, incluindo mas não se limitando a design, código-fonte, logotipos, textos e gráficos, é de propriedade da organização do ${site.name} e está protegido por leis de propriedade intelectual.

Marcas registradas, logotipos e nomes comerciais exibidos na Plataforma, incluindo os de patrocinadores e da Techstars, são de propriedade de seus respectivos titulares.`,
  },
  {
    id: "privacidade",
    title: "9. Privacidade e Dados",
    content: `A coleta, uso e proteção de seus dados pessoais são regidos pela nossa [Política de Privacidade](/politica-de-privacidade), que é parte integrante destes Termos. Ao utilizar a Plataforma, você também concorda com os termos da nossa Política de Privacidade.

Utilizamos o Google Analytics para rastreamento de uso. Para mais informações, consulte a seção de cookies da nossa Política de Privacidade.`,
  },
  {
    id: "limitacao",
    title: "10. Limitação de Responsabilidade",
    content: `A Plataforma é fornecida "como está" e "conforme disponível". A organização não garante que:
• A Plataforma estará disponível de forma ininterrupta ou livre de erros
• Os resultados obtidos pelo uso da Plataforma serão precisos ou confiáveis
• Quaisquer defeitos na Plataforma serão corrigidos

Os pagamentos são processados por terceiros (Stripe e Opa Pingou), sujeitos aos próprios termos e à própria disponibilidade desses serviços.

Na máxima extensão permitida pela legislação aplicável, a organização não será responsável por danos diretos, indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo perda de dados, lucros cessantes ou interrupção de negócios, decorrentes do uso ou da impossibilidade de uso da Plataforma.`,
  },
  {
    id: "modificacoes",
    title: "11. Modificações dos Termos",
    content: `A organização reserva-se o direito de modificar estes Termos a qualquer momento. Alterações significativas serão comunicadas através da Plataforma ou por e-mail.

A data da última atualização será sempre indicada no início deste documento. O uso continuado da Plataforma após as alterações constitui aceitação dos novos Termos.`,
  },
  {
    id: "legislacao",
    title: "12. Legislação Aplicável",
    content: `Estes Termos são regidos pelas leis da República Federativa do Brasil. Quaisquer disputas decorrentes destes Termos serão submetidas ao foro da comarca de Goiânia, Estado de Goiás, com exclusão de qualquer outro, por mais privilegiado que seja.`,
  },
  {
    id: "contato",
    title: "13. Contato",
    content: `Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco:

• E-mail: [${site.contactEmail}](mailto:${site.contactEmail})
• Site: ${site.shortName} (startupweekendsummit.com.br)`,
  },
];

export default function TermosDeUsoPage() {
  return (
    <LegalPage
      eyebrow="Documento"
      title="Termos de Uso do Serviço"
      updated="20 de outubro de 2026"
      sections={sections}
      related={{ href: "/politica-de-privacidade", label: "Política de Privacidade" }}
    />
  );
}
