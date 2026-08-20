import { query } from "@/lib/db"
import { exigirAdmin } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

export async function GET() {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const fornecedores = await query(
    `SELECT id, codigo, razao_social, nome_fantasia, cnpj_cpf, inscricao_estadual, telefone, email,
            cep, logradouro, numero, complemento, bairro, cidade, estado,
            observacao, ativo, criado_em
     FROM TAB_FORNECEDOR ORDER BY razao_social`
  )
  return NextResponse.json(fornecedores)
}

export async function POST(request: Request) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const dados = await request.json()

  if (!dados.razaoSocial || !dados.razaoSocial.trim()) {
    return NextResponse.json({ erro: "Razão social é obrigatória" }, { status: 400 })
  }

  const [fornecedor] = await query(
    `INSERT INTO TAB_FORNECEDOR
       (razao_social, nome_fantasia, cnpj_cpf, inscricao_estadual, telefone, email, cep, logradouro, numero, complemento, bairro, cidade, estado, observacao)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING id, codigo, razao_social, nome_fantasia, cnpj_cpf, inscricao_estadual, telefone, email, cep, logradouro, numero, complemento, bairro, cidade, estado, observacao, ativo, criado_em`,
    [
      dados.razaoSocial.trim(),
      dados.nomeFantasia || null,
      dados.cnpjCpf || null,
      dados.inscricaoEstadual || null,
      dados.telefone || null,
      dados.email || null,
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

  return NextResponse.json(fornecedor, { status: 201 })
}
