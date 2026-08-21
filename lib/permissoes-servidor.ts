import { query } from "@/lib/db"
import { TELAS_ADMIN, podeAbrir, type Permissoes, type ChaveTela } from "@/lib/telas-admin"

// Leitura das permissões no banco. Separado de lib/telas-admin.ts (catálogo e
// regra, sem dependência de servidor) porque o menu é componente client e
// importa o catálogo — arrastar o driver do Postgres pro navegador quebra o
// build, como já aconteceu com lib/recursos.

export async function carregarPermissoes(usuarioId: string): Promise<Permissoes> {
  const linhas = await query(
    "SELECT tela, permitido FROM TAB_USUARIO_PERMISSAO WHERE usuario_id = $1",
    [usuarioId]
  )

  const permissoes: Permissoes = {}
  for (const linha of linhas) {
    permissoes[String(linha.tela)] = Boolean(linha.permitido)
  }
  return permissoes
}

// Lista das telas que a pessoa pode abrir. É o que o menu usa pra montar e o
// layout usa pra barrar acesso por URL - as duas coisas saindo da MESMA conta,
// pra que esconder no menu e bloquear no acesso nunca discordem.
export async function telasPermitidas(
  usuarioId: string,
  papel: string
): Promise<Set<ChaveTela>> {
  const permissoes = papel === "admin" ? {} : await carregarPermissoes(usuarioId)
  return new Set(TELAS_ADMIN.filter((tela) => podeAbrir(tela, papel, permissoes)).map((t) => t.chave))
}

export async function salvarPermissoes(usuarioId: string, permissoes: Permissoes) {
  const chavesValidas = new Set<string>(TELAS_ADMIN.map((t) => t.chave))

  for (const [tela, permitido] of Object.entries(permissoes)) {
    // Chave fora do catálogo é ignorada: a tabela não pode virar depósito de
    // nome errado que ninguém mais sabe de onde veio.
    if (!chavesValidas.has(tela)) continue

    await query(
      `INSERT INTO TAB_USUARIO_PERMISSAO (usuario_id, tela, permitido, atualizado_em)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (usuario_id, tela) DO UPDATE SET permitido = $3, atualizado_em = NOW()`,
      [usuarioId, tela, permitido]
    )
  }
}
