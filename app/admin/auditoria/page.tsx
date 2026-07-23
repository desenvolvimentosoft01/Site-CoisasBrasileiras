import { query } from "@/lib/db"
import { AuditoriaConteudo } from "@/components/admin/auditoria-conteudo"

export default async function AuditoriaPage() {
  const registros = await query(
    `SELECT id, usuario_nome, tela, acao, tabela, registro_id, dados_antes, dados_depois, criado_em
     FROM TAB_AUDITORIA
     ORDER BY criado_em DESC
     LIMIT 500`
  )

  return <AuditoriaConteudo registrosIniciais={registros} />
}
