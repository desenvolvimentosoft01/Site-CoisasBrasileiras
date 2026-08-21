import { query } from "@/lib/db"
import { exigirAdmin, exigirSessao } from "@/lib/auth-servidor"
import { registrarAuditoriaServidor } from "@/lib/auditoria-servidor"
import { NextResponse } from "next/server"

const CAMPOS = `id, codigo, razao_social, nome_fantasia, cnpj_cpf, inscricao_estadual, telefone, email,
                site_rastreio, codigo_servico_frenet, cep, logradouro, numero, complemento, bairro,
                cidade, estado, observacao, ativo, criado_em`

export async function GET() {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const transportadoras = await query(
    `SELECT ${CAMPOS} FROM TAB_TRANSPORTADORA ORDER BY razao_social`
  )
  return NextResponse.json(transportadoras)
}

export async function POST(request: Request) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const dados = await request.json()

  if (!dados.razaoSocial || !dados.razaoSocial.trim()) {
    return NextResponse.json({ erro: "Razão social é obrigatória" }, { status: 400 })
  }

  const [transportadora] = await query(
    `INSERT INTO TAB_TRANSPORTADORA
       (razao_social, nome_fantasia, cnpj_cpf, inscricao_estadual, telefone, email, site_rastreio,
        codigo_servico_frenet, cep, logradouro, numero, complemento, bairro, cidade, estado, observacao)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     RETURNING ${CAMPOS}`,
    [
      dados.razaoSocial.trim(),
      dados.nomeFantasia || null,
      dados.cnpjCpf || null,
      dados.inscricaoEstadual || null,
      dados.telefone || null,
      dados.email || null,
      dados.siteRastreio || null,
      dados.codigoServicoFrenet || null,
      dados.cep || null,
      dados.logradouro || null,
      dados.numero || null,
      dados.complemento || null,
      dados.bairro || null,
      dados.cidade || null,
      dados.estado || null,
      dados.observacao || null,
    ]
  )

  await registrarAuditoriaServidor({
    sessao: sessaoOuErro,
    tela: "Transportadoras",
    acao: "cadastro",
    tabela: "TAB_TRANSPORTADORA",
    registroId: transportadora.id,
    depois: transportadora,
  })

  return NextResponse.json(transportadora, { status: 201 })
}
