import { query } from "@/lib/db"
import { AvaliacoesConteudo } from "@/components/admin/avaliacoes-conteudo"

export default async function AvaliacoesPage() {
  const avaliacoes = await query(`
    SELECT a.id, a.nota, a.comentario, a.aprovado, a.criado_em,
           p.nome AS produto_nome, c.nome AS cliente_nome
    FROM TAB_AVALIACAO_PRODUTO a
    JOIN TAB_PRODUTO p ON p.id = a.produto_id
    JOIN TAB_CLIENTE c ON c.id = a.cliente_id
    ORDER BY a.aprovado ASC, a.criado_em DESC
  `)

  return <AvaliacoesConteudo avaliacoesIniciais={avaliacoes} />
}
