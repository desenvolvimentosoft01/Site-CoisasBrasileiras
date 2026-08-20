import { query } from "@/lib/db"
import { CotacoesConteudo } from "@/components/admin/cotacoes-conteudo"

export default async function CotacoesPage() {
  const [cotacoes, fornecedores, produtos] = await Promise.all([
    query(
      `SELECT ct.id, ct.numero, ct.status, ct.observacao, ct.token_resposta, ct.enviado_email_em,
         ct.respondido_em, ct.pedido_compra_id, ct.criado_em, ct.fornecedor_id,
         f.razao_social AS fornecedor_nome, f.email AS fornecedor_email, f.telefone AS fornecedor_telefone
       FROM TAB_COTACAO ct
       JOIN TAB_FORNECEDOR f ON f.id = ct.fornecedor_id
       ORDER BY ct.criado_em DESC`
    ),
    query(
      "SELECT id, razao_social, nome_fantasia, cnpj_cpf, email FROM TAB_FORNECEDOR WHERE ativo = true ORDER BY razao_social"
    ),
    query("SELECT id, codigo, nome, sku FROM TAB_PRODUTO WHERE ativo = true ORDER BY codigo"),
  ])

  return <CotacoesConteudo cotacoesIniciais={cotacoes} fornecedores={fornecedores} produtos={produtos} />
}
