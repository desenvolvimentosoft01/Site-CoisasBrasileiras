import { query } from "@/lib/db"
import { TransportadorasConteudo } from "@/components/admin/transportadoras-conteudo"

export default async function TransportadorasPage() {
  const transportadoras = await query(
    `SELECT id, codigo, razao_social, nome_fantasia, cnpj_cpf, inscricao_estadual, telefone, email,
            site_rastreio, codigo_servico_frenet, cep, logradouro, numero, complemento, bairro,
            cidade, estado, observacao, ativo, criado_em
     FROM TAB_TRANSPORTADORA ORDER BY razao_social`
  )

  return <TransportadorasConteudo transportadorasIniciais={transportadoras} />
}
