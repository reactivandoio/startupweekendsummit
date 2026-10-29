import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal-page";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Política de Cancelamento e Reembolso",
  description: `Política de Cancelamento e Reembolso das inscrições do ${site.name}: direito de arrependimento de 7 dias, cancelamento até o evento, inscrições não aprovadas, cancelamento ou adiamento pela organização e como pedir.`,
  alternates: { canonical: "/politica-de-cancelamento-e-reembolso" },
};

const mail = `[${site.contactEmail}](mailto:${site.contactEmail})`;

/* Pedida pelo provedor de pagamento na análise da conta da organizadora. Prazos ligados às datas do evento (4 a 6/12/2026):
   cancelamento com 50% até 19/11 (15 dias antes) e transferência da inscrição até 2/12 (2 dias antes). */
const sections: LegalSection[] = [
  {
    id: "sobre",
    title: "Sobre esta política",
    content: `Esta política vale para as inscrições (ingressos) do ${site.name}, que acontece de ${site.date}, em ${site.cityName}, ${site.state}, compradas neste site.

A organizadora e responsável pelas vendas é a **${site.legalName}**, CNPJ **${site.cnpj}**. Ela complementa os [Termos de Participação](/termos-de-uso), que você aceita ao se inscrever.`,
  },
  {
    id: "pagamento-unico",
    title: "Pagamento único, sem assinatura",
    content: `A inscrição é cobrada **uma única vez**, no valor mostrado na página de inscrição. **Não é assinatura**: não há mensalidade, cobrança recorrente nem renovação automática, e nenhum outro valor é cobrado depois.

O pagamento é feito por **Pix** ou por **cartão de crédito, à vista** (sem parcelamento), processados pelo Opa Pingou com a Abacate Pay. O valor é o mesmo nas duas formas: a tarifa do cartão não é repassada a você. A organização não armazena dados de cartão nem de conta bancária.

O pagamento reserva a vaga por **1 hora**. Se ele chegar depois disso e o lote ou o convite já estiver completo, a inscrição passa pela análise da organização: você recebe o ingresso, se houver vaga, ou a **devolução integral**, pelo mesmo meio de pagamento.`,
  },
  {
    id: "arrependimento",
    title: "Direito de arrependimento (7 dias)",
    content: `Como a compra é feita pela internet, você pode desistir da inscrição em até **7 (sete) dias corridos contados da data da compra** (a confirmação do pagamento), sem precisar justificar, conforme o art. 49 do Código de Defesa do Consumidor (Lei nº 8.078/1990).

Nesse caso, o reembolso é **integral**: devolvemos todo o valor pago, sem descontar taxas, **pelo mesmo meio de pagamento** usado na compra. Pagamentos por Pix são devolvidos por Pix para a conta de origem; pagamentos no cartão de crédito são **estornados no mesmo cartão**. O estorno é feito manualmente pela organização no meio de pagamento, e o prazo para aparecer na fatura depende da operadora do cartão.`,
  },
  {
    id: "cancelamento",
    title: "Cancelamento depois de 7 dias",
    content: `Passado o prazo de arrependimento, valem estas regras até a data do evento:

• **Até 19 de novembro de 2026** (15 dias antes do início do evento): você pode cancelar a inscrição com reembolso de **50% do valor pago**, pelo mesmo meio de pagamento
• **A partir de 20 de novembro de 2026**: não há reembolso, mas você pode **transferir a inscrição** para outra pessoa, sem custo, até **2 de dezembro de 2026**. A nova pessoa precisa cumprir os mesmos requisitos da inscrição (por exemplo, ter 18 anos ou mais) e informar os próprios dados; o ingresso é reemitido no nome dela
• **Não comparecimento**: quem não for ao evento sem ter cancelado ou transferido a inscrição nos prazos acima não tem direito a reembolso

A participação retirada pela organização por descumprimento das regras de conduta dos [Termos de Participação](/termos-de-uso#conduta) também não dá direito a reembolso.`,
  },
  {
    id: "nao-aprovadas",
    title: "Inscrições não aprovadas",
    content: `Todas as inscrições, por convite ou pela página de inscrição, passam pela aprovação da organização depois do pagamento. Se a sua **não for aprovada**, o valor pago é **devolvido integralmente**, pelo mesmo meio de pagamento, sem que você precise pedir. Você recebe um e-mail avisando da decisão, e a devolução é feita em até 10 dias úteis a partir dele.`,
  },
  {
    id: "cancelamento-pela-organizacao",
    title: "Cancelamento ou adiamento pela organização",
    content: `• **Evento cancelado**: todas as inscrições pagas são reembolsadas **integralmente**, pelo mesmo meio de pagamento, sem que você precise pedir, em até 10 dias úteis a partir do aviso do cancelamento
• **Evento adiado ou com mudança de local**: a inscrição continua valendo para a nova data ou o novo local. Se você não puder ir, pode pedir o reembolso **integral** em até 30 dias a partir do aviso da mudança

Avisamos cancelamentos e adiamentos pelo e-mail cadastrado na inscrição e neste site. O reembolso cobre o valor da inscrição; despesas como passagens e hospedagem não são reembolsadas pela organização.`,
  },
  {
    id: "como-pedir",
    title: "Como pedir o cancelamento ou o reembolso",
    content: `Escreva para ${mail} com:

• Nome completo e e-mail usados na inscrição
• CPF do participante
• O pedido: cancelamento com reembolso ou transferência (nesse caso, com nome, e-mail e CPF da nova pessoa)

**Prazos**
• Respondemos em até **5 dias úteis** a partir do recebimento do pedido
• Aprovado o reembolso, a devolução é feita em até **10 dias úteis**. No Pix, o valor volta para a conta de origem; no cartão, o estorno aparece na fatura conforme o prazo da operadora (em geral, em até duas faturas)

O prazo de arrependimento e os prazos de cancelamento são contados pela data em que o seu e-mail chega até nós.`,
  },
];

export default function PoliticaDeCancelamentoPage() {
  return (
    <LegalPage
      eyebrow="Documento"
      title="Política de Cancelamento e Reembolso."
      updated="29 de outubro de 2026"
      intro={{
        label: "Resumo",
        text: "Pagamento único, sem assinatura. Até 7 dias depois da compra, você desiste e recebe tudo de volta, pelo mesmo meio. Depois disso, cancelamento com 50% até 19/11/2026 e transferência da inscrição até 2/12/2026.",
      }}
      sections={sections}
      closing={{
        text: `Dúvidas ou pedidos de cancelamento e reembolso: fale com a organização. ${site.legalName}, CNPJ ${site.cnpj}.`,
        cta: { href: `mailto:${site.contactEmail}`, label: site.contactEmail },
      }}
      related={{ href: "/termos-de-uso", label: "Termos de Participação" }}
    />
  );
}
