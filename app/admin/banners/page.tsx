import { query } from "@/lib/db"
import { BannersConteudo } from "@/components/admin/banners-conteudo"

export default async function BannersPage() {
  const banners = await query("SELECT * FROM TAB_BANNER ORDER BY ordem")

  return <BannersConteudo bannersIniciais={banners} />
}
