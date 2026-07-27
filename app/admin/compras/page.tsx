import { query } from "@/lib/db"
import { listarCompras } from "@/lib/compras"
import { ComprasConteudo } from "@/components/admin/compras-conteudo"

export default async function ComprasPage() {
  const [compras, fornecedores, produtos] = await Promise.all([
    listarCompras(),
    query("SELECT id, razao_social, cnpj_cpf FROM TAB_FORNECEDOR WHERE ativo = true ORDER BY razao_social"),
    query("SELECT id, nome, sku, custo, estoque FROM TAB_PRODUTO WHERE ativo = true ORDER BY nome"),
  ])

  return <ComprasConteudo comprasIniciais={compras} fornecedores={fornecedores} produtos={produtos} />
}
