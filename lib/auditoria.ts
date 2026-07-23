export type AcaoAuditoria = "cadastro" | "edicao" | "exclusao" | "inativacao" | "ativacao"

type ParametrosAuditoria = {
  tela: string
  acao: AcaoAuditoria
  tabela: string
  registroId?: string | null
  antes?: Record<string, unknown> | null
  depois?: Record<string, unknown> | null
}

// Falha ao registrar auditoria nunca deve travar a acao principal do usuario
// - por isso o erro so vai pro console, sem bloquear nem avisar a tela.
export function registrarAuditoria(parametros: ParametrosAuditoria) {
  fetch("/api/admin/auditoria", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tela: parametros.tela,
      acao: parametros.acao,
      tabela: parametros.tabela,
      registro_id: parametros.registroId ?? null,
      dados_antes: parametros.antes ?? null,
      dados_depois: parametros.depois ?? null,
    }),
  }).catch((erro) => {
    console.error("Erro ao registrar auditoria:", erro)
  })
}
