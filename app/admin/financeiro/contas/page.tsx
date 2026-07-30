import { query } from "@/lib/db"
import { ContasFinanceiroConteudo } from "@/components/admin/contas-financeiro-conteudo"

export default async function ContasFinanceiroPage() {
  const contas = await query(
    `SELECT id, tipo, descricao, valor, vencimento, pago, pago_em, categoria, observacao, criado_em
     FROM TAB_CONTA
     ORDER BY pago ASC, vencimento ASC`
  )

  return <ContasFinanceiroConteudo contasIniciais={contas} />
}
