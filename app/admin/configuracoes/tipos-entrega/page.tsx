import { query } from "@/lib/db"
import { TiposEntregaConteudo } from "@/components/admin/tipos-entrega-conteudo"

export default async function TiposEntregaPage() {
  const tipos = await query("SELECT id, nome, ativo, criado_em FROM TAB_TIPO_ENTREGA ORDER BY nome")

  return <TiposEntregaConteudo tiposIniciais={tipos} />
}
