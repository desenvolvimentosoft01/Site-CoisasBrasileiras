import { query } from "@/lib/db"
import { AuditoriaConteudo } from "@/components/admin/auditoria-conteudo"

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ inicio?: string; fim?: string }>
}) {
  const { inicio, fim } = await searchParams

  const hoje = new Date()
  const inicioDefault = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10)
  const fimDefault = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0, 10)
  const inicioPeriodo = inicio || inicioDefault
  const fimPeriodo = fim || fimDefault
  const inicioTs = `${inicioPeriodo}T00:00:00`
  const fimTs = `${fimPeriodo}T23:59:59`

  const registros = await query(
    `SELECT id, usuario_nome, tela, acao, tabela, registro_id, dados_antes, dados_depois, criado_em
     FROM TAB_AUDITORIA
     WHERE criado_em BETWEEN $1 AND $2
     ORDER BY criado_em DESC
     LIMIT 500`,
    [inicioTs, fimTs]
  )

  return (
    <AuditoriaConteudo registrosIniciais={registros} inicioPeriodo={inicioPeriodo} fimPeriodo={fimPeriodo} />
  )
}
