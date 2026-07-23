import { query } from "@/lib/db"
import { FreteFaixasConteudo } from "@/components/admin/frete-faixas-conteudo"

export default async function FreteFaixasPage() {
  const faixas = await query(
    `SELECT id, regiao, peso_min_kg, peso_max_kg, valor, prazo_dias
     FROM TAB_FRETE_FAIXA
     ORDER BY regiao, peso_min_kg`
  )

  return <FreteFaixasConteudo faixasIniciais={faixas} />
}
