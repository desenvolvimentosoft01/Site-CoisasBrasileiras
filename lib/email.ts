import nodemailer from "nodemailer"
import { getSegredo } from "@/lib/segredos"

// Credenciais configuraveis em Configuracoes > Integracoes
// (TAB_INTEGRACAO_SEGREDO, chaves "email_user"/"email_pass") - caem pra
// EMAIL_USER/EMAIL_PASS se nao houver nada configurado no banco. O
// transporter e criado por envio (nao cacheado como antes) pra uma troca de
// credencial pelo admin refletir sem precisar reiniciar o processo.
export async function enviarEmail(opcoes: { to: string; subject: string; html: string }) {
  const [user, pass] = await Promise.all([getSegredo("email_user"), getSegredo("email_pass")])

  if (!user || !pass) {
    console.warn("[email] Credenciais de email nao configuradas - email nao enviado")
    return
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  })

  try {
    await transporter.sendMail({
      from: `"Coisas Brasileiras" <${user}>`,
      ...opcoes,
    })
  } catch (erro) {
    // Nunca deixa uma falha de email quebrar o fluxo principal (checkout,
    // confirmacao de pagamento etc.) - so registra no log.
    console.error("[email] Falha ao enviar:", erro)
  }
}

function escapeHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function envelope(conteudo: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.1);">
        <tr>
          <td style="background:#065f46;padding:28px 30px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:800;letter-spacing:1px;">Coisas Brasileiras</p>
          </td>
        </tr>
        <tr><td style="padding:30px;">${conteudo}</td></tr>
        <tr>
          <td style="padding:20px 30px;background-color:#f8f8f8;text-align:center;">
            <p style="margin:0;color:#999;font-size:12px;">&copy; ${new Date().getFullYear()} Coisas Brasileiras</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

type ItemEmail = { nome: string; quantidade: number; precoUnitario: number }

function tabelaItens(itens: ItemEmail[]): string {
  const linhas = itens
    .map(
      (item) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;">
        ${item.quantidade}x ${escapeHtml(item.nome)}
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;text-align:right;">
        ${(item.precoUnitario * item.quantidade).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
      </td>
    </tr>`
    )
    .join("")

  return `<table width="100%" cellpadding="0" cellspacing="0">${linhas}</table>`
}

export function templatePedidoCriado(params: {
  nomeCliente: string
  pedidoId: string
  itens: ItemEmail[]
  total: number
}): string {
  return envelope(`
    <h1 style="margin:0 0 12px;font-size:20px;color:#065f46;">Pedido recebido!</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#555;">
      Ola ${escapeHtml(params.nomeCliente)}, recebemos seu pedido e ele esta aguardando confirmacao de pagamento.
    </p>
    ${tabelaItens(params.itens)}
    <p style="margin:16px 0 0;font-size:16px;font-weight:700;color:#065f46;text-align:right;">
      Total: ${params.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
    </p>
  `)
}

export function templatePedidoPago(params: {
  nomeCliente: string
  pedidoId: string
  itens: ItemEmail[]
  total: number
}): string {
  return envelope(`
    <h1 style="margin:0 0 12px;font-size:20px;color:#065f46;">Pagamento confirmado!</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#555;">
      Ola ${escapeHtml(params.nomeCliente)}, seu pagamento foi aprovado e ja estamos preparando seu pedido.
    </p>
    ${tabelaItens(params.itens)}
    <p style="margin:16px 0 0;font-size:16px;font-weight:700;color:#065f46;text-align:right;">
      Total: ${params.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
    </p>
  `)
}

export function templateNovoPedidoAdmin(params: {
  nomeCliente: string
  emailCliente: string
  pedidoId: string
  itens: ItemEmail[]
  total: number
}): string {
  return envelope(`
    <h1 style="margin:0 0 12px;font-size:20px;color:#065f46;">Novo pedido pago</h1>
    <p style="margin:0 0 4px;font-size:14px;color:#555;">Cliente: ${escapeHtml(params.nomeCliente)}</p>
    <p style="margin:0 0 20px;font-size:14px;color:#555;">Email: ${escapeHtml(params.emailCliente)}</p>
    ${tabelaItens(params.itens)}
    <p style="margin:16px 0 0;font-size:16px;font-weight:700;color:#065f46;text-align:right;">
      Total: ${params.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
    </p>
    <p style="margin:20px 0 0;font-size:12px;color:#999;">Pedido #${params.pedidoId}</p>
  `)
}

export function templateNotasBlingPendentes(
  notas: { numero: string; fornecedorNome: string | null; valorTotal: number }[]
): string {
  const linhas = notas
    .map(
      (n) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;color:#333;">${escapeHtml(n.numero)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;color:#333;">${escapeHtml(n.fornecedorNome ?? "-")}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;color:#333;text-align:right;">
            ${n.valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </td>
        </tr>`
    )
    .join("")

  return envelope(`
    <h1 style="margin:0 0 12px;font-size:20px;color:#065f46;">Notas de fornecedor pendentes no Bling</h1>
    <p style="margin:0 0 16px;font-size:14px;color:#555;">
      ${notas.length} nota(s) nova(s) de entrada esperando ser lançada(s) em Compras.
    </p>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr>
          <th style="text-align:left;padding:0 0 8px;font-size:12px;color:#999;">Número</th>
          <th style="text-align:left;padding:0 0 8px;font-size:12px;color:#999;">Fornecedor</th>
          <th style="text-align:right;padding:0 0 8px;font-size:12px;color:#999;">Valor</th>
        </tr>
      </thead>
      <tbody>${linhas}</tbody>
    </table>
  `)
}

const ROTULOS_STATUS: Record<string, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pagamento confirmado",
  em_separacao: "Em separação",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
}

// Notifica o cliente sempre que o admin muda o status do pedido manualmente
// (em_separacao, enviado, entregue, cancelado) - o "pago" tem template
// proprio (templatePedidoPago), disparado pelo webhook do Mercado Pago.
export function templateStatusAtualizado(params: {
  nomeCliente: string
  pedidoId: string
  status: string
  codigoRastreio: string | null
  transportadora: string | null
}): string {
  const rotulo = ROTULOS_STATUS[params.status] ?? params.status
  const numeroPedido = params.pedidoId.slice(0, 8).toUpperCase()

  return envelope(`
    <h1 style="margin:0 0 12px;font-size:20px;color:#065f46;">Atualizacao do seu pedido</h1>
    <p style="margin:0 0 8px;font-size:14px;color:#555;">
      Ola ${escapeHtml(params.nomeCliente)}, o pedido #${numeroPedido} agora esta:
    </p>
    <p style="margin:0 0 20px;font-size:18px;font-weight:700;color:#065f46;">${escapeHtml(rotulo)}</p>
    ${
      params.codigoRastreio
        ? `<p style="margin:0;font-size:14px;color:#555;">
            Codigo de rastreio: <strong>${escapeHtml(params.codigoRastreio)}</strong>
            ${params.transportadora ? ` (${escapeHtml(params.transportadora)})` : ""}
          </p>`
        : ""
    }
  `)
}

export function templateNotaFiscalEmitida(params: {
  nomeCliente: string
  pedidoId: string
  linkDanfe: string | null
  linkPdf: string | null
}): string {
  const numeroPedido = params.pedidoId.slice(0, 8).toUpperCase()
  const link = params.linkDanfe ?? params.linkPdf

  return envelope(`
    <h1 style="margin:0 0 12px;font-size:20px;color:#065f46;">Nota fiscal emitida</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#555;">
      Ola ${escapeHtml(params.nomeCliente)}, a nota fiscal do seu pedido #${numeroPedido} foi emitida.
    </p>
    ${
      link
        ? `<p style="margin:0;">
            <a href="${link}" style="display:inline-block;background:#065f46;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
              Ver nota fiscal (DANFE)
            </a>
          </p>`
        : ""
    }
  `)
}

export function templateOrcamentoEnviado(params: {
  nomeCliente: string
  numero: number
  titulo: string | null
  itens: ItemEmail[]
  subtotal: number
  desconto: number
  total: number
  link: string
}): string {
  const numeroFormatado = `OR.${String(params.numero).padStart(4, "0")}`
  return envelope(`
    <h1 style="margin:0 0 12px;font-size:20px;color:#065f46;">Orcamento ${numeroFormatado}</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#555;">
      Ola ${escapeHtml(params.nomeCliente)}, segue o orcamento${params.titulo ? ` "${escapeHtml(params.titulo)}"` : ""} para sua avaliacao.
    </p>
    ${tabelaItens(params.itens)}
    ${
      params.desconto > 0
        ? `<p style="margin:16px 0 0;font-size:14px;color:#555;text-align:right;">
            Subtotal: ${params.subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}<br>
            Desconto: -${params.desconto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>`
        : ""
    }
    <p style="margin:8px 0 20px;font-size:18px;font-weight:700;color:#065f46;text-align:right;">
      Total: ${params.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
    </p>
    <p style="margin:0;text-align:center;">
      <a href="${params.link}" style="display:inline-block;background:#065f46;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
        Ver orcamento e responder
      </a>
    </p>
    <p style="margin:16px 0 0;font-size:12px;color:#999;text-align:center;">
      Clique no botao acima para ver os detalhes e aprovar ou recusar.
    </p>
  `)
}

export function templateOrcamentoRespondido(params: {
  numero: number
  titulo: string | null
  clienteNome: string
  aprovado: boolean
  canal: "email" | "whatsapp"
  observacao: string | null
}): string {
  const numeroFormatado = `OR.${String(params.numero).padStart(4, "0")}`
  const cor = params.aprovado ? "#065f46" : "#dc2626"
  return envelope(`
    <h1 style="margin:0 0 12px;font-size:20px;color:${cor};">
      Orcamento ${params.aprovado ? "aprovado" : "recusado"} pelo cliente
    </h1>
    <p style="margin:0 0 4px;font-size:14px;color:#555;">
      ${numeroFormatado}${params.titulo ? ` - ${escapeHtml(params.titulo)}` : ""}
    </p>
    <p style="margin:0 0 4px;font-size:14px;color:#555;">Cliente: ${escapeHtml(params.clienteNome)}</p>
    <p style="margin:0 0 20px;font-size:14px;color:#555;">
      Canal: ${params.canal === "whatsapp" ? "WhatsApp" : "E-mail"}
    </p>
    ${
      params.observacao
        ? `<p style="margin:0;font-size:14px;color:#555;">
            <strong>Observacao do cliente:</strong><br>${escapeHtml(params.observacao)}
          </p>`
        : ""
    }
  `)
}

export function templateVoltouEstoque(params: { nomeProduto: string; linkProduto: string }): string {
  return envelope(`
    <h1 style="margin:0 0 12px;font-size:20px;color:#065f46;">Voltou ao estoque!</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#555;">
      O produto <strong>${escapeHtml(params.nomeProduto)}</strong> que voce queria ja esta disponivel de novo.
    </p>
    <p style="margin:0;">
      <a href="${params.linkProduto}" style="display:inline-block;background:#065f46;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
        Ver produto
      </a>
    </p>
  `)
}
