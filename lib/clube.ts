import { MercadoPagoConfig, PreApproval } from "mercadopago"
import { query } from "@/lib/db"
import { getConfiguracoes } from "@/lib/configuracoes"

// Assinatura recorrente do "Clube" via Mercado Pago PreApproval - mesma
// conta/credencial ja usada pro checkout (MERCADOPAGO_ACCESS_TOKEN), recurso
// diferente (cobranca automatica mensal em vez de pagamento avulso).
const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! })
const preApprovalMP = new PreApproval(client)

const STATUS_MP_PARA_ASSINATURA: Record<string, string> = {
  authorized: "autorizada",
  paused: "pausada",
  cancelled: "cancelada",
  pending: "pendente",
}

export async function valorMensalidadeClube(): Promise<number> {
  const config = await getConfiguracoes(["clube_valor_mensalidade"])
  return Number(config.clube_valor_mensalidade) || 0
}

export async function assinaturaAtualDoCliente(clienteId: string) {
  const [assinatura] = await query(
    `SELECT id, status, valor_mensalidade, proximo_vencimento, mp_preapproval_id
     FROM TAB_ASSINATURA_CLUBE WHERE cliente_id = $1
     ORDER BY criado_em DESC LIMIT 1`,
    [clienteId]
  )
  return assinatura ?? null
}

export async function clienteTemClubeAtivo(clienteId: string): Promise<boolean> {
  const assinatura = await assinaturaAtualDoCliente(clienteId)
  return assinatura?.status === "autorizada"
}

// Cria a assinatura no Mercado Pago e ja registra localmente como "pendente"
// - so vira "autorizada" quando o webhook confirmar (o cliente ainda precisa
// autorizar a cobranca recorrente no checkout do MP, pra onde init_point leva).
export async function criarAssinaturaClube(params: {
  clienteId: string
  email: string
  siteUrl: string
}): Promise<string> {
  // Evita duplo-clique criar duas assinaturas cobrando em paralelo - so
  // permite uma nova se a atual (se existir) ja estiver cancelada.
  const assinaturaExistente = await assinaturaAtualDoCliente(params.clienteId)
  if (assinaturaExistente && assinaturaExistente.status !== "cancelada") {
    throw new Error("Voce ja tem uma assinatura do Clube em andamento")
  }

  const valor = await valorMensalidadeClube()
  if (valor <= 0) {
    throw new Error("O valor da mensalidade do Clube ainda nao foi configurado pela loja")
  }

  const preapproval = await preApprovalMP.create({
    body: {
      reason: "Clube - assinatura mensal",
      payer_email: params.email,
      back_url: `${params.siteUrl}/minha-conta`,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: valor,
        currency_id: "BRL",
      },
    },
  })

  if (!preapproval.id || !preapproval.init_point) {
    throw new Error("Mercado Pago nao devolveu os dados esperados da assinatura")
  }

  await query(
    `INSERT INTO TAB_ASSINATURA_CLUBE (cliente_id, mp_preapproval_id, status, valor_mensalidade)
     VALUES ($1, $2, 'pendente', $3)`,
    [params.clienteId, preapproval.id, valor]
  )

  return preapproval.init_point
}

export async function cancelarAssinaturaClube(clienteId: string): Promise<void> {
  const assinatura = await assinaturaAtualDoCliente(clienteId)
  if (!assinatura || !assinatura.mp_preapproval_id || assinatura.status !== "autorizada") {
    throw new Error("Nenhuma assinatura ativa encontrada pra cancelar")
  }

  await preApprovalMP.update({ id: assinatura.mp_preapproval_id, body: { status: "cancelled" } })

  await query("UPDATE TAB_ASSINATURA_CLUBE SET status = 'cancelada', atualizado_em = NOW() WHERE id = $1", [
    assinatura.id,
  ])
}

// Chamado pelo webhook do Mercado Pago (topico "subscription_preapproval") -
// nunca confia no corpo da notificacao, sempre rebusca o preapproval direto
// na API do MP antes de atualizar o status local.
export async function sincronizarAssinaturaClube(mpPreapprovalId: string): Promise<void> {
  const preapproval = await preApprovalMP.get({ id: mpPreapprovalId })
  const novoStatus = STATUS_MP_PARA_ASSINATURA[preapproval.status ?? ""] ?? "pendente"

  const proximoVencimento = preapproval.next_payment_date
    ? new Date(preapproval.next_payment_date).toISOString().slice(0, 10)
    : null

  await query(
    `UPDATE TAB_ASSINATURA_CLUBE
     SET status = $1, proximo_vencimento = $2, atualizado_em = NOW()
     WHERE mp_preapproval_id = $3`,
    [novoStatus, proximoVencimento, mpPreapprovalId]
  )
}
