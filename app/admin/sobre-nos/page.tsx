import { query } from "@/lib/db"
import { SobreNosConteudo } from "@/components/admin/sobre-nos-conteudo"

export default async function SobreNosPage() {
  const midias = await query("SELECT * FROM TAB_SOBRE_NOS_MIDIA ORDER BY ordem")

  return <SobreNosConteudo midiasIniciais={midias} />
}
