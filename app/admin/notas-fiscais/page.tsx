import { query } from "@/lib/db"
import { listarNotasFiscais } from "@/lib/notas-fiscais"
import { NotasFiscaisConteudo } from "@/components/admin/notas-fiscais-conteudo"

export default async function NotasFiscaisPage() {
  // A lista de fornecedores vem do cadastro, e nao dos fornecedores que
  // aparecem nas notas: o filtro precisa funcionar tambem pra um periodo em
  // que aquele fornecedor nao teve nota nenhuma (que e uma resposta valida).
  const [notas, fornecedores] = await Promise.all([
    listarNotasFiscais(),
    query("SELECT id, codigo, razao_social, nome_fantasia, cnpj_cpf FROM TAB_FORNECEDOR ORDER BY codigo"),
  ])

  return (
    <NotasFiscaisConteudo
      notasIniciais={notas}
      fornecedores={fornecedores.map((f) => ({
        id: String(f.id),
        codigo: Number(f.codigo),
        // Nome fantasia e como o operador conhece o fornecedor no dia a dia;
        // a razao social entra so quando nao ha fantasia cadastrado.
        nome: f.nome_fantasia || f.razao_social,
        cnpjCpf: f.cnpj_cpf,
      }))}
    />
  )
}
