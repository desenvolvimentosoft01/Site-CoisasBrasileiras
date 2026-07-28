import { query } from "@/lib/db"
import { enviarEmail, templateVoltouEstoque } from "@/lib/email"

// Chamado sempre que o estoque de um produto pode ter subido (recebimento de
// compra, ajuste manual, edicao do cadastro) - se o produto ficou com
// estoque positivo, avisa todo mundo que pediu pra ser notificado e ainda
// nao foi avisado. Nunca deve travar o fluxo principal se o email falhar
// (mesma garantia de enviarEmail).
export async function notificarClientesEstoqueVoltou(produtoId: string): Promise<void> {
  const [produto] = await query("SELECT nome, slug, estoque FROM TAB_PRODUTO WHERE id = $1", [produtoId])
  if (!produto || Number(produto.estoque) <= 0) return

  const pendentes = await query(
    "SELECT email FROM TAB_NOTIFICACAO_ESTOQUE WHERE produto_id = $1 AND notificado_em IS NULL",
    [produtoId]
  )
  if (pendentes.length === 0) return

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const linkProduto = `${siteUrl}/produtos/${produto.slug}`

  for (const pendente of pendentes) {
    enviarEmail({
      to: pendente.email,
      subject: `${produto.nome} voltou ao estoque!`,
      html: templateVoltouEstoque({ nomeProduto: produto.nome, linkProduto }),
    })
  }

  await query(
    "UPDATE TAB_NOTIFICACAO_ESTOQUE SET notificado_em = NOW() WHERE produto_id = $1 AND notificado_em IS NULL",
    [produtoId]
  )
}
