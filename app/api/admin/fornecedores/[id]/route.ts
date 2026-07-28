import { query } from "@/lib/db"
import { exigirAdmin } from "@/lib/auth-servidor"
import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  const dados = await request.json()

  if (!dados.razaoSocial || !dados.razaoSocial.trim()) {
    return NextResponse.json({ erro: "Razao social e obrigatoria" }, { status: 400 })
  }

  const [fornecedor] = await query(
    `UPDATE TAB_FORNECEDOR SET
       razao_social = $1, nome_fantasia = $2, cnpj_cpf = $3, inscricao_estadual = $4, telefone = $5, email = $6,
       cep = $7, logradouro = $8, numero = $9, complemento = $10, bairro = $11,
       cidade = $12, estado = $13, observacao = $14, ativo = $15
     WHERE id = $16
     RETURNING id, razao_social, nome_fantasia, cnpj_cpf, inscricao_estadual, telefone, email, cep, logradouro, numero, complemento, bairro, cidade, estado, observacao, ativo, criado_em`,
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
      dados.ativo ?? true,
      id,
    ]
  )

  if (!fornecedor) {
    return NextResponse.json({ erro: "Fornecedor nao encontrado" }, { status: 404 })
  }

  return NextResponse.json(fornecedor)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  try {
    await query("DELETE FROM TAB_FORNECEDOR WHERE id = $1", [id])
  } catch (erro) {
    // 23503 = fornecedor ja tem compras vinculadas - nao deixa vazar o erro
    // bruto do banco pro client.
    if (erro instanceof Error && "code" in erro && erro.code === "23503") {
      return NextResponse.json(
        { erro: "Este fornecedor ja tem compras vinculadas e nao pode ser excluido. Desative-o em vez disso." },
        { status: 409 }
      )
    }
    throw erro
  }

  return NextResponse.json({ sucesso: true })
}
