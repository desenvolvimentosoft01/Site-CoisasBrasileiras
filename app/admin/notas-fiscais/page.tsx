import { query } from "@/lib/db"
import { listarNotasFiscais } from "@/lib/notas-fiscais"
import { NotasFiscaisConteudo } from "@/components/admin/notas-fiscais-conteudo"

export default async function NotasFiscaisPage() {
  // A lista de fornecedores vem do cadastro, e nao dos fornecedores que
  // aparecem nas notas: o filtro precisa funcionar tambem pra um periodo em
  // que aquele fornecedor nao teve nota nenhuma (que e uma resposta valida).
  const [notas, fornecedores] = await Promise.all([
    listarNotasFiscais(),
    query("SELECT id, razao_social FROM TAB_FORNECEDOR ORDER BY razao_social"),
  ])

  return (
    <NotasFiscaisConteudo
      notasIniciais={notas}
      fornecedores={fornecedores.map((f) => ({ id: String(f.id), razaoSocial: f.razao_social }))}
    />
  )
}
