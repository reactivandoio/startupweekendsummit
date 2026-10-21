import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal-page";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: `Política de Privacidade do ${site.name}. Saiba como coletamos, usamos e protegemos seus dados pessoais nas inscrições, no voluntariado e no site.`,
  alternates: { canonical: "/politica-de-privacidade" },
};

/* Texto herdado da Política de Privacidade do Hub Community (8020 Digital), com as adaptações listadas na revisão STA-2:
   nome do serviço, dados que este site coleta, provedores usados (Stripe, Google Analytics, e-mail) e forma de acesso ao painel. */
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

**Dados de Pagamento**
• O pagamento da inscrição é processado pelo Stripe. Não armazenamos dados de cartão; recebemos apenas a confirmação do pagamento e o valor pago.

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
• **Stripe**: Durante o pagamento, o Stripe pode utilizar cookies próprios para segurança e prevenção de fraude

Você pode gerenciar ou bloquear cookies nas configurações do seu navegador. Bloquear o cookie de sessão impede o uso do painel da organização.`,
  },
  {
    id: "compartilhamento",
    title: "5. Compartilhamento de Dados",
    content: `Não vendemos seus dados pessoais a terceiros. Seus dados podem ser compartilhados nas seguintes circunstâncias:

**Provedores de Serviço**
• **Stripe**: Processa o pagamento das inscrições. Os dados são tratados de acordo com a Política de Privacidade do Stripe.
• **Google**: Utilizamos o Google Analytics para análise de dados. Os dados são processados de acordo com a Política de Privacidade do Google.
• **Provedores de e-mail e infraestrutura**: Serviços de envio de e-mail e de hospedagem que processam dados em nosso nome.

**Obrigações Legais**
• Quando exigido por lei, ordem judicial ou processo legal
• Para proteger os direitos, propriedade ou segurança da organização, seus usuários ou terceiros

**Dados Públicos**
• Nomes, logotipos e sites de patrocinadores cadastrados são exibidos publicamente na Plataforma
• Dados de participantes e voluntários não são publicados`,
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
• **Revogação**: Revogar o consentimento para o tratamento de dados, quando aplicável
• **Oposição**: Opor-se ao tratamento de dados em determinadas situações

Para exercer qualquer um desses direitos, entre em contato conosco pelo e-mail contato@8020digital.com.br. Responderemos à sua solicitação em até 15 dias úteis, conforme previsto na legislação.`,
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
• **Dados de logs**: Mantidos por até 12 meses para fins de segurança e diagnóstico.`,
  },
  {
    id: "menores",
    title: "9. Menores de Idade",
    content: `A Plataforma não é direcionada a menores de 16 anos. Não coletamos intencionalmente dados pessoais de menores de 16 anos. Se tomarmos conhecimento de que coletamos dados de um menor sem o consentimento adequado, tomaremos medidas para excluir essas informações o mais rápido possível.`,
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

• E-mail: contato@8020digital.com.br
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
