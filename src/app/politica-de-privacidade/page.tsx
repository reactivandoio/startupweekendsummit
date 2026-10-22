import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal-page";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: `Política de Privacidade do ${site.name}. Saiba como coletamos, usamos e protegemos seus dados pessoais nas inscrições, no voluntariado e no site.`,
  alternates: { canonical: "/politica-de-privacidade" },
};

/* Texto herdado da Política de Privacidade do Hub Community (8020 Digital), com as adaptações listadas na revisão STA-2:
   nome do serviço, dados que este site coleta, provedores usados (Stripe, Opa Pingou, Google Analytics, e-mail) e forma de acesso ao painel. */
const sections: LegalSection[] = [
  {
    id: "introducao",
    title: "1. Introdução",
    content: `A organização do ${site.name} ("nós", "nosso" ou "Plataforma") está comprometida em proteger a privacidade dos seus usuários. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e compartilhamos suas informações pessoais quando você utiliza o site do evento.

Ao utilizar a Plataforma, você concorda com as práticas descritas nesta Política. Recomendamos que leia este documento com atenção.`,
  },
  {
    id: "dados-coletados",
    title: "2. Dados que Coletamos",
    content: `Coletamos diferentes tipos de dados para fornecer e melhorar nossos serviços:

**Dados de Inscrição**
• Nome completo
• Endereço de e-mail
• Telefone (WhatsApp)
• CPF
• Data de nascimento

**Dados de Voluntariado**
• Nome completo, e-mail, telefone (WhatsApp) e cidade
• Área de interesse, disponibilidade e motivação informadas no formulário

**Imagem e Voz**
• Fotos, vídeos, áudios e transmissões captados durante o evento, nos termos da seção [Uso de Imagem e Voz](/termos-de-uso#uso-de-imagem) dos Termos de Uso

**Dados de Pagamento**
• O pagamento da inscrição é processado pelo Stripe (cartão) ou pelo Opa Pingou (Pix). Não armazenamos dados de cartão nem de conta bancária; recebemos apenas a confirmação do pagamento, o valor pago e o identificador da cobrança.

**Dados de Acesso ao Painel**
• E-mail da equipe da organização e links de acesso de uso único (sem senha)

**Dados de Uso e Navegação**
• Páginas visitadas e funcionalidades utilizadas
• Endereço IP e informações do navegador
• Tipo de dispositivo e sistema operacional

**Dados de Analytics**
• Dados de navegação coletados pelo Google Analytics`,
  },
  {
    id: "como-usamos",
    title: "3. Como Usamos seus Dados",
    content: `Utilizamos seus dados pessoais para as seguintes finalidades:

**Funcionamento da Plataforma**
• Processar sua inscrição no evento e confirmar o pagamento
• Avaliar e organizar as candidaturas de voluntariado
• Emitir credenciais, comprovantes e certificados
• Autenticar a equipe da organização no painel

**Divulgação do Evento**
• Produzir e publicar conteúdo de divulgação do evento e da organização com fotos e vídeos captados no evento, conforme a autorização de uso de imagem prevista nos [Termos de Uso](/termos-de-uso#uso-de-imagem)

**Melhorias e Analytics**
• Analisar o uso da Plataforma para identificar melhorias
• Entender padrões de navegação e engajamento
• Gerar relatórios agregados e estatísticas

**Comunicações**
• Enviar a confirmação da inscrição e o comprovante de pagamento
• Informar sobre a programação, orientações e atualizações do evento
• Comunicar alterações nos nossos Termos ou Políticas`,
  },
  {
    id: "cookies",
    title: "4. Cookies e Tecnologias de Rastreamento",
    content: `Utilizamos cookies e tecnologias similares para coletar informações sobre sua interação com a Plataforma. As principais tecnologias utilizadas são:

• **Google Analytics**: Monitora tráfego, sessões e métricas de engajamento
• **Cookie de sessão do painel**: Mantém a equipe da organização autenticada no painel; não é usado para rastreamento
• **Stripe**: Durante o pagamento com cartão, o Stripe pode utilizar cookies próprios para segurança e prevenção de fraude
• **Opa Pingou**: O pagamento via Pix é feito no app do seu banco; o Opa Pingou não instala cookies neste site

Você pode gerenciar ou bloquear cookies nas configurações do seu navegador. Bloquear o cookie de sessão impede o uso do painel da organização.`,
  },
  {
    id: "compartilhamento",
    title: "5. Compartilhamento de Dados",
    content: `Não vendemos seus dados pessoais a terceiros. Seus dados podem ser compartilhados nas seguintes circunstâncias:

**Provedores de Serviço**
• **Stripe**: Processa o pagamento das inscrições com cartão. Os dados são tratados de acordo com a Política de Privacidade do Stripe.
• **Opa Pingou**: Gera e confirma as cobranças Pix das inscrições (nome do participante, valor e identificador da cobrança). Os dados são tratados de acordo com a Política de Privacidade do Opa Pingou.
• **Google**: Utilizamos o Google Analytics para análise de dados. Os dados são processados de acordo com a Política de Privacidade do Google.
• **Provedores de e-mail e infraestrutura**: Serviços de envio de e-mail e de hospedagem que processam dados em nosso nome.

**Patrocinadores do Evento (somente com o seu consentimento)**
• Com base no seu consentimento específico (art. 7º, I, da LGPD), dado na opção própria do formulário de inscrição, separada do aceite dos Termos, podemos compartilhar **nome completo, e-mail e telefone (WhatsApp)** com os patrocinadores do evento, para que entrem em contato com você sobre produtos, serviços, vagas, programas e oportunidades ligados ao ecossistema de startups
• O consentimento é opcional e não é condição para a inscrição. Sem ele, seus dados não são enviados a patrocinadores
• CPF, data de nascimento e dados de pagamento nunca são compartilhados com patrocinadores
• Ao receber os dados, cada patrocinador passa a ser controlador independente e responde pelo tratamento que fizer deles, de acordo com a própria política de privacidade
• Detalhes na seção [Compartilhamento de Dados com Patrocinadores](/termos-de-uso#patrocinadores) dos Termos de Uso

**Obrigações Legais**
• Quando exigido por lei, ordem judicial ou processo legal
• Para proteger os direitos, propriedade ou segurança da organização, seus usuários ou terceiros

**Dados Públicos**
• Nomes, logotipos e sites de patrocinadores cadastrados são exibidos publicamente na Plataforma
• Dados cadastrais de participantes e voluntários não são publicados; fotos e vídeos do evento podem ser publicados conforme a autorização de uso de imagem dos Termos de Uso`,
  },
  {
    id: "direitos",
    title: "6. Seus Direitos (LGPD)",
    content: `De acordo com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018), você tem os seguintes direitos em relação aos seus dados pessoais:

• **Acesso**: Solicitar acesso aos seus dados pessoais que mantemos
• **Correção**: Solicitar a correção de dados incompletos, inexatos ou desatualizados
• **Exclusão**: Solicitar a exclusão dos seus dados pessoais
• **Portabilidade**: Solicitar a portabilidade dos seus dados para outro serviço
• **Informação**: Ser informado sobre as entidades com as quais seus dados são compartilhados
• **Revogação**: Revogar o consentimento para o tratamento de dados, quando aplicável, incluindo o consentimento para o compartilhamento com patrocinadores
• **Oposição**: Opor-se ao tratamento de dados em determinadas situações

**Dados compartilhados com patrocinadores**
• Ao revogar o consentimento, seus dados deixam de ser enviados a patrocinadores a partir da revogação; a revogação não afeta os envios já feitos
• Mediante pedido, informamos quais patrocinadores receberam os seus dados
• Para corrigir ou excluir seus dados na base de um patrocinador, ou para deixar de receber as comunicações dele, fale diretamente com o patrocinador, que é o controlador desses dados; se precisar, ajudamos a encaminhar o pedido

Para exercer qualquer um desses direitos, entre em contato conosco pelo e-mail [${site.contactEmail}](mailto:${site.contactEmail}). Responderemos à sua solicitação em até 15 dias úteis, conforme previsto na legislação.`,
  },
  {
    id: "seguranca",
    title: "7. Segurança dos Dados",
    content: `Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados pessoais contra acesso não autorizado, destruição, perda, alteração ou divulgação indevida, incluindo:

• Criptografia de dados em trânsito (HTTPS/TLS)
• Acesso ao painel por link de uso único enviado por e-mail, com validade curta
• Controle de acesso baseado em funções
• Monitoramento de atividades suspeitas
• Backups regulares

Apesar das medidas de segurança adotadas, nenhum sistema é completamente seguro. Caso ocorra um incidente de segurança que afete seus dados, notificaremos você e as autoridades competentes conforme exigido pela legislação.`,
  },
  {
    id: "retencao",
    title: "8. Retenção de Dados",
    content: `Mantemos seus dados pessoais pelo tempo necessário para cumprir as finalidades descritas nesta Política, a menos que um período de retenção mais longo seja exigido ou permitido por lei.

• **Dados de conta**: Mantidos enquanto o acesso ao painel estiver ativo. Após a exclusão do acesso, os dados serão removidos em até 30 dias.
• **Dados de analytics**: Retidos de forma agregada e anonimizada, conforme as políticas de retenção do Google Analytics.
• **Registro de consentimento**: O registro do seu consentimento (ou da revogação) para o compartilhamento com patrocinadores é mantido enquanto for necessário para comprovar a legalidade do tratamento.
• **Dados de logs**: Mantidos por até 12 meses para fins de segurança e diagnóstico.`,
  },
  {
    id: "menores",
    title: "9. Menores de Idade",
    content: `A Plataforma não é direcionada a menores de 18 anos: a inscrição no evento e o voluntariado exigem maioridade. Não coletamos intencionalmente dados pessoais de menores de 18 anos. Se tomarmos conhecimento de que coletamos dados de um menor sem o consentimento adequado, tomaremos medidas para excluir essas informações o mais rápido possível.`,
  },
  {
    id: "alteracoes",
    title: "10. Alterações nesta Política",
    content: `Podemos atualizar esta Política de Privacidade periodicamente para refletir mudanças em nossas práticas, tecnologias ou requisitos legais.

Alterações significativas serão comunicadas através da Plataforma. A data da última atualização será sempre indicada no início deste documento.

Recomendamos que revise esta Política periodicamente para se manter informado sobre como protegemos seus dados.`,
  },
  {
    id: "contato",
    title: "11. Contato",
    content: `Se você tiver dúvidas, solicitações ou preocupações sobre esta Política de Privacidade ou sobre o tratamento dos seus dados pessoais, entre em contato conosco:

• E-mail: [${site.contactEmail}](mailto:${site.contactEmail})
• Site: ${site.shortName} (startupweekendsummit.com.br)

Para questões relacionadas à LGPD, nosso encarregado de proteção de dados pode ser contactado pelo mesmo e-mail.`,
  },
];

export default function PoliticaDePrivacidadePage() {
  return (
    <LegalPage
      eyebrow="Documento"
      title="Política de Privacidade"
      updated="20 de outubro de 2026"
      sections={sections}
      related={{ href: "/termos-de-uso", label: "Termos de Uso" }}
    />
  );
}
