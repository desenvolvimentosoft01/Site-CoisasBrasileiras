import { query } from "@/lib/db"
import { FornecedoresConteudo } from "@/components/admin/fornecedores-conteudo"

export default async function FornecedoresPage() {
  const fornecedores = await query(
    `SELECT id, codigo, razao_social, nome_fantasia, cnpj_cpf, telefone, email,
            cep, logradouro, numero, complemento, bairro, cidade, estado,
            observacao, ativo, criado_em
     FROM TAB_FORNECEDOR ORDER BY razao_social`
  )

  return <FornecedoresConteudo fornecedoresIniciais={fornecedores} />
}
