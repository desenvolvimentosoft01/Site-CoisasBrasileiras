import { query } from "@/lib/db"
import { ClientesConteudo } from "@/components/admin/clientes-conteudo"

export default async function ClientesPage() {
  const clientes = await query(
    `SELECT id, nome, email, telefone, cpf_cnpj, ativo, criado_em,
       (senha_hash IS NOT NULL) AS veio_do_site
     FROM TAB_CLIENTE ORDER BY nome`
  )

  return <ClientesConteudo clientesIniciais={clientes} />
}
