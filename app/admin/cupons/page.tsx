import { query } from "@/lib/db"
import { CuponsConteudo } from "@/components/admin/cupons-conteudo"

export default async function CuponsPage() {
  const cupons = await query("SELECT * FROM TAB_CUPOM ORDER BY criado_em DESC")

  return <CuponsConteudo cuponsIniciais={cupons} />
}
