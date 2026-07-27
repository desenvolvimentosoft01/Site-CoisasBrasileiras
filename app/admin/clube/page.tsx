import { query } from "@/lib/db"
import { ClubeConteudo } from "@/components/admin/clube-conteudo"

export default async function ClubePage() {
  const assinaturas = await query(`
    SELECT a.id, a.status, a.valor_mensalidade, a.proximo_vencimento, a.criado_em,
           c.nome AS cliente_nome, c.email AS cliente_email
    FROM TAB_ASSINATURA_CLUBE a
    JOIN TAB_CLIENTE c ON c.id = a.cliente_id
    ORDER BY a.criado_em DESC
  `)

  return <ClubeConteudo assinaturas={assinaturas} />
}
