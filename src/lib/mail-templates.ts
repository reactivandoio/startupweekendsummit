// Templates dos e-mails transacionais na marca da edição Goiânia. Sem "server-only" de propósito:
// o script de prévia (scratch) e testes podem renderizar o HTML fora do Next.
// HTML de e-mail: tabelas, CSS inline, 600px, imagens PNG hospedadas no site (muitos clientes não mostram SVG),
// cores explícitas em todo bloco (bgcolor + style) pra sobreviver ao modo escuro do Gmail/Outlook/Apple Mail.
import { site } from "../content/site.ts";

export type Mail = { subject: string; text: string; html: string };

const INK = "#0f0f0f";
const PAPER = "#ffffff";
const GRASS = "#439642";
const GRASS_DEEP = "#2e6b2d";
const GRASS_WASH = "#e4f0e3";
const MARIGOLD = "#EAB53D";
const MARIGOLD_WASH = "#fbf0d6";
const GRAPHITE = "#3d3d3d";
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";

export const escapeHtml = (v: string) => v.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const brl = (cents: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
const asset = (file: string) => `${site.url}/email/${file}`;

const p = (html: string, extra = "") =>
  `<p style="margin:0 0 20px;font-family:${FONT};font-size:16px;line-height:24px;color:${INK};${extra}">${html}</p>`;
const small = (html: string) => `<p style="margin:0 0 12px;font-family:${FONT};font-size:14px;line-height:20px;color:${GRAPHITE}">${html}</p>`;
const link = (url: string, label: string, color = INK) => `<a href="${url}" style="color:${color};text-decoration:underline;word-break:break-all;overflow-wrap:anywhere">${label}</a>`;

/* Botão principal: Marigold com borda Ink de 2px, como no site. Tabela com bgcolor pra funcionar no Outlook. */
export const button = (url: string, label: string) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px">
  <tr>
    <td bgcolor="${MARIGOLD}" style="background-color:${MARIGOLD};border:2px solid ${INK}">
      <a href="${url}" style="display:inline-block;padding:16px 28px;font-family:${FONT};font-size:18px;font-weight:700;line-height:24px;color:${INK};text-decoration:none">${label}</a>
    </td>
  </tr>
</table>`;

/* Caixa de destaque (ingresso, aviso): borda Ink 2px sobre o tom claro */
const box = (inner: string, bg = GRASS_WASH) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px">
  <tr><td bgcolor="${bg}" style="background-color:${bg};border:2px solid ${INK};padding:20px 24px">${inner}</td></tr>
</table>`;

/* Moldura: logo em cima, corpo em papel, faixa Grass→Marigold e rodapé preto com "Bora pro futuro_" */
export function layout(opts: { eyebrow: string; title: string; body: string; preheader?: string }) {
  const { eyebrow, title, body, preheader = "" } = opts;
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f2f2f2" bgcolor="#f2f2f2">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f2f2f2">${escapeHtml(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#f2f2f2" style="background-color:#f2f2f2">
  <tr>
    <td align="center" style="padding:24px 12px">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;table-layout:fixed">
        <!-- Logo -->
        <tr>
          <td bgcolor="${PAPER}" style="background-color:${PAPER};padding:28px 32px 8px">
            <a href="${site.url}" style="text-decoration:none"><img src="${asset("logo.png")}" width="160" height="74" alt="${escapeHtml(site.name)}" style="display:block;border:0;width:160px;height:auto"></a>
          </td>
        </tr>
        <!-- Corpo -->
        <tr>
          <td bgcolor="${PAPER}" style="background-color:${PAPER};padding:16px 32px 8px">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:0;vertical-align:middle"><div style="width:24px;height:3px;background-color:${GRASS};font-size:0;line-height:0;overflow:hidden">&nbsp;</div></td>
                <td style="padding-left:12px;font-family:${FONT};font-size:13px;font-weight:600;letter-spacing:.03em;text-transform:uppercase;color:${INK}">${escapeHtml(eyebrow)}</td>
              </tr>
            </table>
            <h1 style="margin:16px 0 20px;font-family:${FONT};font-size:28px;font-weight:700;line-height:32px;letter-spacing:-.01em;color:${INK}">${title}</h1>
            ${body}
          </td>
        </tr>
        <!-- Faixa -->
        <tr>
          <td bgcolor="${GRASS}" style="background-color:${GRASS};font-size:0;line-height:0;padding:0">
            <img src="${asset("faixa.png")}" width="600" height="8" alt="" style="display:block;border:0;width:100%;height:8px">
          </td>
        </tr>
        <!-- Rodapé -->
        <tr>
          <td bgcolor="#000000" style="background-color:#000000;padding:28px 32px 32px">
            <img src="${asset("logo-negativo.png")}" width="120" height="56" alt="${escapeHtml(site.name)}" style="display:block;border:0;width:120px;height:auto;margin:0 0 16px">
            <p style="margin:0 0 16px;font-family:${FONT};font-size:20px;font-weight:700;line-height:24px;color:${PAPER}">Bora pro futuro<span style="color:${MARIGOLD}">_</span></p>
            <p style="margin:0 0 12px;font-family:${FONT};font-size:13px;line-height:20px;color:#e2e2e2">${escapeHtml(site.name)}<br>${escapeHtml(site.date)} · ${escapeHtml(site.venue)} · ${escapeHtml(site.city)}</p>
            <p style="margin:0 0 12px;font-family:${FONT};font-size:13px;line-height:20px;color:#e2e2e2">Dúvidas: ${link(`mailto:${site.contactEmail}`, site.contactEmail, PAPER)}</p>
            <p style="margin:0;font-family:${FONT};font-size:13px;line-height:20px;color:#e2e2e2">${link(`${site.url}/termos-de-uso`, "Termos de Participação", PAPER)} &nbsp;·&nbsp; ${link(`${site.url}/politica-de-privacidade`, "Política de Privacidade", PAPER)} &nbsp;·&nbsp; ${link(`${site.url}/politica-de-cancelamento-e-reembolso`, "Cancelamento e Reembolso", PAPER)} &nbsp;·&nbsp; ${link(site.url, "startupweekendsummit.com.br", PAPER)}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

const textFooter = `\n\n—\n${site.name}\n${site.date} · ${site.venue} · ${site.city}\nDúvidas: ${site.contactEmail}\nTermos de Participação: ${site.url}/termos-de-uso · Política de Privacidade: ${site.url}/politica-de-privacidade · Cancelamento e Reembolso: ${site.url}/politica-de-cancelamento-e-reembolso`;

/* Link de acesso de uso único ao painel (pedido na tela de login) */
export function loginLinkMail(url: string): Mail {
  const text = `Seu link de acesso ao painel do ${site.shortName}:\n\n${url}\n\nEle vale por 15 minutos e só pode ser usado uma vez. Se você não pediu este acesso, ignore este e-mail.${textFooter}`;
  const html = layout({
    eyebrow: "Painel",
    title: "Seu link de acesso ao painel",
    preheader: "Vale por 15 minutos e só pode ser usado uma vez.",
    body: `${p("Clique no botão para entrar. Não há senha.")}
      ${button(url, "Entrar no painel")}
      ${small(`Ou copie e cole no navegador:<br>${link(url, escapeHtml(url))}`)}
      ${small("O link vale por 15 minutos e só pode ser usado uma vez. Se você não pediu este acesso, ignore este e-mail.")}`,
  });
  return { subject: `Acesso ao painel — ${site.shortName}`, text, html };
}

/* Convite de acesso ao painel, pra quem acabou de ser cadastrado em /admin/usuarios (e reenvio) */
export function accessInviteMail(name: string, url: string, loginUrl: string): Mail {
  const hi = name ? `Olá, ${name}.` : "Olá.";
  const text = `${hi}\n\nVocê recebeu acesso ao painel do ${site.shortName}.\n\nEntre por este link:\n${url}\n\nEle vale por 15 minutos e só pode ser usado uma vez. Se expirar, abra ${loginUrl}, informe este e-mail e um link novo chega na hora. Não há senha.${textFooter}`;
  const html = layout({
    eyebrow: "Painel",
    title: "Você tem acesso ao painel",
    preheader: "Entre pelo link de uso único; sem senha.",
    body: `${p(`${escapeHtml(hi)} Você foi incluído(a) no painel do ${escapeHtml(site.shortName)}, onde ficam as inscrições, os convites, os ingressos e os patrocinadores.`)}
      ${button(url, "Entrar no painel")}
      ${small(`Ou copie e cole no navegador:<br>${link(url, escapeHtml(url))}`)}
      ${small(`O link vale por 15 minutos e só pode ser usado uma vez. Se expirar, abra ${link(loginUrl, escapeHtml(loginUrl))}, informe este e-mail e um link novo chega na hora. Não há senha.`)}`,
  });
  return { subject: `Seu acesso ao painel — ${site.shortName}`, text, html };
}

/* Convite pra inscrição (criado ou reenviado no painel) */
export function inviteMail(name: string, url: string): Mail {
  const hi = name ? `Olá, ${name}.` : "Olá.";
  const text = `${hi}\n\nVocê foi convidado(a) para o ${site.name}, em ${site.city}, ${site.date}.\n\nGaranta sua vaga pelo link:\n${url}\n\nO link é pessoal. Dúvidas: ${site.contactEmail}.${textFooter}`;
  const html = layout({
    eyebrow: "Convite",
    title: `Chega mais. Você foi convidado(a) para o ${escapeHtml(site.shortName)}.`,
    preheader: `${site.date}, em ${site.city}. Sua inscrição é por convite.`,
    body: `${p(`${escapeHtml(hi)} O encontro nacional das lideranças de comunidades de startups chega a Goiânia, de ${escapeHtml(site.date)}. Sua inscrição é por convite: preencha seus dados e conclua o pagamento pelo botão abaixo.`)}
      ${button(url, "Fazer minha inscrição")}
      ${small(`Ou copie e cole no navegador:<br>${link(url, escapeHtml(url))}`)}
      ${small("O link é pessoal — não compartilhe.")}`,
  });
  return { subject: `Seu convite — ${site.shortName}`, text, html };
}

// Número do ingresso: 8 primeiros caracteres do id da inscrição, o mesmo que o painel mostra
export const ticketNumber = (registrationId: string) => registrationId.replace(/-/g, "").slice(0, 8).toUpperCase();

const maskCpf = (cpf: string) => cpf.replace(/^(\d{3})\d{6}(\d{2})$/, "$1.***.***-$2");
const firstOf = (name: string) => name.trim().split(/\s+/)[0];

/* Confirmação + ingresso: vale como comprovante e traz o número conferido no credenciamento.
   approved: cadastro aberto aprovado no painel (o pagamento já tinha chegado antes). */
export function registrationConfirmedMail(reg: { id: string; name: string; cpf: string; amountCents: number; lotName?: string }, opts: { approved?: boolean } = {}): Mail {
  const first = firstOf(reg.name);
  const amountLabel = brl(reg.amountCents);
  const number = ticketNumber(reg.id);
  const cpf = maskCpf(reg.cpf);
  const kind = reg.lotName ? `Ingresso — ${reg.lotName}` : "Ingresso";
  const courtesy = reg.amountCents === 0; // convite com 100% de desconto
  const lead = opts.approved
    ? { text: `Sua inscrição foi aprovada pela organização. O pagamento de ${amountLabel} já tinha sido recebido.`, html: `Sua inscrição foi <strong>aprovada</strong> pela organização. O pagamento de <strong>${amountLabel}</strong> já tinha sido recebido.` }
    : courtesy
      ? { text: "Seu ingresso é cortesia da organização.", html: "Seu ingresso é <strong>cortesia</strong> da organização e sua inscrição está confirmada." }
      : { text: `Pagamento de ${amountLabel} recebido.`, html: `Recebemos o pagamento de <strong>${amountLabel}</strong> e sua inscrição está confirmada.` };
  const text = `${first}, sua inscrição no ${site.name} está ${opts.approved ? "aprovada" : "confirmada"}.\n\n${lead.text}\n\n${kind}\nNº ${number}\nParticipante: ${reg.name}\nCPF: ${cpf}\n\nGuarde este e-mail: ele é o seu comprovante e o seu ingresso. No credenciamento, apresente um documento com foto.\n\nNos vemos em ${site.city}, ${site.date}.${textFooter}`;
  const html = layout({
    eyebrow: opts.approved ? "Inscrição aprovada" : "Inscrição confirmada",
    title: `${escapeHtml(first)}, sua vaga está garantida.`,
    preheader: `${kind} nº ${number}. Este e-mail é o seu comprovante.`,
    body: `${p(lead.html)}
      ${box(`
        <p style="margin:0 0 6px;font-family:${FONT};font-size:13px;font-weight:600;letter-spacing:.03em;text-transform:uppercase;color:${GRASS_DEEP}">${escapeHtml(kind)}</p>
        <p style="margin:0 0 12px;font-family:${FONT};font-size:32px;font-weight:700;letter-spacing:.04em;line-height:36px;color:${INK}">${number}</p>
        <p style="margin:0;font-family:${FONT};font-size:14px;line-height:20px;color:${INK}">${escapeHtml(reg.name)}<br>CPF ${cpf}<br>${escapeHtml(site.date)} · ${escapeHtml(site.venue)} · ${escapeHtml(site.city)}</p>`)}
      ${p("Guarde este e-mail: ele é o seu comprovante e o seu ingresso. No credenciamento, apresente um documento com foto. Em breve mandamos a programação e as orientações para este e-mail.")}
      ${p(`Nos vemos em ${escapeHtml(site.city)}, ${escapeHtml(site.date)}.`, "margin:0 0 8px")}`,
  });
  return { subject: opts.approved ? `Inscrição aprovada: seu ingresso — ${site.shortName}` : `Seu ingresso — ${site.shortName}`, text, html };
}

/* Cadastro aberto pago: recebemos o pagamento, a inscrição passa pela aprovação da organização (ainda sem ingresso) */
export function registrationUnderReviewMail(reg: { name: string; amountCents: number }): Mail {
  const first = firstOf(reg.name);
  const amountLabel = brl(reg.amountCents);
  const text = `${first}, recebemos o pagamento de ${amountLabel} da sua inscrição no ${site.name}.\n\nAs inscrições pelo cadastro aberto passam pela aprovação da organização. Assim que a sua for analisada, você recebe outro e-mail: com o ingresso, se aprovada; se não for, o valor pago é devolvido integralmente.${textFooter}`;
  const html = layout({
    eyebrow: "Inscrição em análise",
    title: `${escapeHtml(first)}, recebemos sua inscrição.`,
    preheader: "Pagamento recebido. O ingresso chega depois da aprovação.",
    body: `${p(`Recebemos o pagamento de <strong>${amountLabel}</strong>. As inscrições pelo cadastro aberto passam pela aprovação da organização.`)}
      ${notice(p("Assim que a sua for analisada, você recebe outro e-mail: <strong>com o ingresso</strong>, se aprovada; se não for, o valor pago é devolvido integralmente.", "margin:0"))}
      ${small("Este e-mail ainda não é o ingresso. Guarde-o como comprovante do pagamento.")}`,
  });
  return { subject: `Inscrição recebida, em análise — ${site.shortName}`, text, html };
}

/* Cadastro aberto reprovado: avisa que o reembolso será feito (manual, no meio de pagamento) */
export function registrationRejectedMail(reg: { name: string; amountCents: number }): Mail {
  const first = firstOf(reg.name);
  const amountLabel = brl(reg.amountCents);
  const text = `${first}, sua inscrição no ${site.name} não foi aprovada desta vez.\n\nO valor pago (${amountLabel}) será devolvido integralmente pelo mesmo meio de pagamento. Se tiver dúvidas, responda este e-mail ou escreva para ${site.contactEmail}.${textFooter}`;
  const html = layout({
    eyebrow: "Inscrição",
    title: `${escapeHtml(first)}, sua inscrição não foi aprovada.`,
    preheader: "O valor pago será devolvido integralmente.",
    body: `${p("Agradecemos o interesse. As vagas do Summit são limitadas e, desta vez, sua inscrição não foi aprovada pela organização.")}
      ${notice(p(`O valor pago (<strong>${amountLabel}</strong>) será devolvido integralmente pelo mesmo meio de pagamento.`, "margin:0"))}
      ${small(`Dúvidas: responda este e-mail ou escreva para ${link(`mailto:${site.contactEmail}`, site.contactEmail)}.`)}`,
  });
  return { subject: `Sobre sua inscrição — ${site.shortName}`, text, html };
}

/* Pagamento que chegou depois do prazo (link do cartão não expira) e não cabe mais no lote/convite: recebemos, mas
   a inscrição passa pela organização antes do ingresso. Mesma promessa do cadastro aberto: ingresso ou devolução integral. */
export function latePaymentReviewMail(reg: { name: string; amountCents: number }): Mail {
  const first = firstOf(reg.name);
  const amountLabel = brl(reg.amountCents);
  const text = `${first}, recebemos o pagamento de ${amountLabel} da sua inscrição no ${site.name}, mas ele chegou depois do prazo de 1 hora da reserva e a vaga não estava mais garantida.\n\nA organização vai analisar a sua inscrição e você recebe outro e-mail: com o ingresso, se houver vaga; se não houver, o valor pago é devolvido integralmente, pelo mesmo meio de pagamento.${textFooter}`;
  const html = layout({
    eyebrow: "Inscrição em análise",
    title: `${escapeHtml(first)}, recebemos seu pagamento.`,
    preheader: "O pagamento chegou depois do prazo da reserva. O ingresso depende da análise da organização.",
    body: `${p(`Recebemos o pagamento de <strong>${amountLabel}</strong>, mas ele chegou depois do prazo de 1 hora da reserva e a vaga não estava mais garantida.`)}
      ${notice(p("A organização vai analisar a sua inscrição e você recebe outro e-mail: <strong>com o ingresso</strong>, se houver vaga; se não houver, o valor pago é devolvido integralmente, pelo mesmo meio de pagamento.", "margin:0"))}
      ${small("Este e-mail ainda não é o ingresso. Guarde-o como comprovante do pagamento.")}`,
  });
  return { subject: `Pagamento recebido, inscrição em análise — ${site.shortName}`, text, html };
}

/* Aviso para a organização (contato do site): pagamento tardio entrou em aprovação no painel */
export function latePaymentAlertMail(reg: { id: string; name: string; email: string; amountCents: number }, reason: string, panelUrl: string): Mail {
  const amountLabel = brl(reg.amountCents);
  const text = `Pagamento tardio para revisar no painel.\n\n${reg.name} (${reg.email}) pagou ${amountLabel} depois do prazo da reserva.\nMotivo: ${reason}.\nInscrição ${ticketNumber(reg.id)}.\n\nAprove (se houver vaga) ou reprove e faça a devolução no painel do Opa Pingou:\n${panelUrl}`;
  const html = layout({
    eyebrow: "Painel",
    title: "Pagamento tardio para revisar.",
    preheader: `${reg.name} pagou ${amountLabel} depois do prazo.`,
    body: `${p(`<strong>${escapeHtml(reg.name)}</strong> (${escapeHtml(reg.email)}) pagou <strong>${amountLabel}</strong> depois do prazo da reserva.`)}
      ${notice(p(`${escapeHtml(reason)}. A inscrição ${ticketNumber(reg.id)} está em <strong>Aguardando aprovação</strong>.`, "margin:0"))}
      ${p("Aprove, se houver vaga, ou reprove e faça a devolução no painel do Opa Pingou.")}
      ${button(panelUrl, "Abrir participantes")}`,
  });
  return { subject: `Pagamento tardio para revisar — ${reg.name}`, text, html };
}

/* Aviso para a organização: a inscrição já estava paga e outra cobrança dela também foi paga (ex.: Pix e depois o link
   do cartão). A inscrição segue valendo; a segunda cobrança precisa ser estornada à mão no painel do Opa Pingou. */
export function duplicatePaymentAlertMail(reg: { id: string; name: string; email: string }, chargeId: string, panelUrl: string): Mail {
  const text = `Pagamento em dobro para estornar.\n\n${reg.name} (${reg.email}) já tinha a inscrição ${ticketNumber(reg.id)} paga, e outra cobrança dela também foi paga.\nCobrança para estornar no Opa Pingou: ${chargeId}\n\nDepois de estornar, marque no painel:\n${panelUrl}`;
  const html = layout({
    eyebrow: "Painel",
    title: "Pagamento em dobro para estornar.",
    preheader: `${reg.name} pagou duas vezes a mesma inscrição.`,
    body: `${p(`<strong>${escapeHtml(reg.name)}</strong> (${escapeHtml(reg.email)}) já tinha a inscrição ${ticketNumber(reg.id)} paga, e outra cobrança dela também foi paga.`)}
      ${notice(p(`Estorne no painel do Opa Pingou a cobrança <strong>${escapeHtml(chargeId)}</strong>. A inscrição continua valendo.`, "margin:0"))}
      ${button(panelUrl, "Abrir participantes")}`,
  });
  return { subject: `Pagamento em dobro para estornar — ${reg.name}`, text, html };
}

/* Aviso de uso: caixa Marigold claro (reservada pra e-mails futuros de alerta) */
export const notice = (inner: string) => box(inner, MARIGOLD_WASH);
