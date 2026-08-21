import { query } from "@/lib/db"
import { exigirAdmin } from "@/lib/auth-servidor"
import { registrarAuditoriaServidor } from "@/lib/auditoria-servidor"
import { NextResponse } from "next/server"

const CAMPOS = `id, codigo, razao_social, nome_fantasia, cnpj_cpf, inscricao_estadual, telefone, email,
                site_rastreio, codigo_servico_frenet, cep, logradouro, numero, complemento, bairro,
                cidade, estado, observacao, ativo, criado_em`

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  const dados = await request.json()

  if (!dados.razaoSocial || !dados.razaoSocial.trim()) {
    return NextResponse.json({ erro: "Razão social é obrigatória" }, { status: 400 })
  }

  const [antes] = await query(`SELECT ${CAMPOS} FROM TAB_TRANSPORTADORA WHERE id = $1`, [id])

  const [transportadora] = await query(
    `UPDATE TAB_TRANSPORTADORA SET
       razao_social = $1, nome_fantasia = $2, cnpj_cpf = $3, inscricao_estadual = $4, telefone = $5,
       email = $6, site_rastreio = $7, codigo_servico_frenet = $8, cep = $9, logradouro = $10,
       numero = $11, complemento = $12, bairro = $13, cidade = $14, estado = $15, observacao = $16,
       ativo = $17
     WHERE id = $18
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
      dados.ativo ?? true,
      id,
    ]
  )

  if (!transportadora) {
    return NextResponse.json({ erro: "Transportadora não encontrada" }, { status: 404 })
  }

  await registrarAuditoriaServidor({
    sessao: sessaoOuErro,
    tela: "Transportadoras",
    acao: "edicao",
    tabela: "TAB_TRANSPORTADORA",
    registroId: id,
    antes: antes ?? null,
    depois: transportadora,
  })

  return NextResponse.json(transportadora)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  try {
    const [excluida] = await query(
      `DELETE FROM TAB_TRANSPORTADORA WHERE id = $1 RETURNING ${CAMPOS}`,
      [id]
    )

    if (!excluida) {
      return NextResponse.json({ erro: "Transportadora não encontrada" }, { status: 404 })
    }

    await registrarAuditoriaServidor({
      sessao: sessaoOuErro,
      tela: "Transportadoras",
      acao: "exclusao",
      tabela: "TAB_TRANSPORTADORA",
      registroId: id,
      antes: excluida,
    })

    return NextResponse.json({ sucesso: true })
  } catch (erro) {
    // 23503 = ja tem pedido despachado por ela. Apagar reescreveria o
    // historico de entrega desses pedidos - desativar preserva o passado.
    if (erro instanceof Error && "code" in erro && erro.code === "23503") {
      return NextResponse.json(
        {
          erro:
            "Esta transportadora já tem pedidos vinculados e não pode ser excluída. Desative-a em vez disso — os pedidos antigos continuam mostrando quem fez a entrega.",
        },
        { status: 409 }
      )
    }
    throw erro
  }
}
