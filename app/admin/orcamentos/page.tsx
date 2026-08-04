import { query } from "@/lib/db"
import { OrcamentosConteudo } from "@/components/admin/orcamentos-conteudo"

export default async function OrcamentosPage() {
  const orcamentos = await query(
    `SELECT id, numero, titulo, cliente_nome, cliente_telefone, cliente_email, status, subtotal, desconto,
       total, pedido_id, token_aprovacao, canal_resposta, observacao_cliente, enviado_email_em,
       respondido_em, criado_em
     FROM TAB_ORCAMENTO
     ORDER BY criado_em DESC`
  )

  return <OrcamentosConteudo orcamentosIniciais={orcamentos} />
}
