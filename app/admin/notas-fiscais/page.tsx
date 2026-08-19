import { listarNotasFiscais } from "@/lib/notas-fiscais"
import { NotasFiscaisConteudo } from "@/components/admin/notas-fiscais-conteudo"

export default async function NotasFiscaisPage() {
  const notas = await listarNotasFiscais()

  return <NotasFiscaisConteudo notasIniciais={notas} />
}
