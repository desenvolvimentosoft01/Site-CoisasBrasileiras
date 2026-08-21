import { query } from "@/lib/db"
import type { SessaoAdmin } from "@/lib/auth"

// Auditoria gravada NO SERVIDOR, dentro da própria rota que fez a alteração.
//
// A auditoria do sistema nasceu registrada pela tela (`lib/auditoria.ts`,
// chamada depois do sucesso). Isso funciona pro caminho feliz, mas tem duas
// falhas: uma alteração feita fora da interface (chamada direta na API) não
// deixa rastro, e se a chamada de auditoria falhar a ação acontece sem log.
//
// Para as ações sensíveis — credenciais de integração, plano, permissão,
// NF-e, status de pedido, configurações — isso não serve: são exatamente as
// que alguém teria motivo para fazer sem deixar rastro. Essas passam por aqui.
export async function registrarAuditoriaServidor(dados: {
  sessao: SessaoAdmin
  tela: string
  acao: "cadastro" | "edicao" | "exclusao" | "inativacao" | "ativacao"
  tabela: string
  registroId?: string | null
  antes?: unknown
  depois?: unknown
}) {
  try {
    await query(
      `INSERT INTO TAB_AUDITORIA
         (usuario_id, usuario_nome, tela, acao, tabela, registro_id, dados_antes, dados_depois)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        dados.sessao.id,
        dados.sessao.nome,
        dados.tela,
        dados.acao,
        dados.tabela,
        dados.registroId ?? null,
        dados.antes ? JSON.stringify(dados.antes) : null,
        dados.depois ? JSON.stringify(dados.depois) : null,
      ]
    )
  } catch (erro) {
    // Falha ao auditar não pode desfazer uma ação que já aconteceu - seria pior
    // (o cliente veria erro numa operação que deu certo). Fica no log do
    // servidor, que é onde alguém procura quando falta registro.
    console.error("[auditoria] Falha ao registrar:", erro)
  }
}
