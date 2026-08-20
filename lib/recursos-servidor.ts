import { query } from "@/lib/db"
import { CATALOGO_RECURSOS, type ChaveRecurso, type Recursos } from "@/lib/recursos"

// Leitura dos recursos no banco. Fica separado de lib/recursos.ts (que so tem
// catalogo e tipos) porque componente client importa o catalogo - e arrastar
// o driver do Postgres pro navegador quebra o build.

// Le a tabela de excecoes e devolve o mapa completo, ja com o padrao "ligado"
// pros recursos que ninguem desligou.
export async function carregarRecursos(): Promise<Recursos> {
  const linhas = await query("SELECT chave, habilitado FROM TAB_RECURSO")
  const excecoes = new Map(linhas.map((linha) => [String(linha.chave), Boolean(linha.habilitado)]))

  const recursos = {} as Recursos
  for (const recurso of CATALOGO_RECURSOS) {
    recursos[recurso.chave] = excecoes.get(recurso.chave) ?? true
  }
  return recursos
}

export async function recursoLigado(chave: ChaveRecurso): Promise<boolean> {
  const [linha] = await query("SELECT habilitado FROM TAB_RECURSO WHERE chave = $1", [chave])
  return linha ? Boolean(linha.habilitado) : true
}
