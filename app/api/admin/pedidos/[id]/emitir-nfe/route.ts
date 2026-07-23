import { query } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { emitirNotaFiscalBling } from "@/lib/bling"
import { NextResponse } from "next/server"

// Gatilho manual (botao na tela do pedido) - nunca automatico. Erro do Bling
// aqui nunca apaga nem altera nada do pedido, so devolve a mensagem pro admin
// tentar de novo.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  const [pedido] = await query(
    `SELECT p.id, p.valor_frete, p.bling_nota_id,
       COALESCE(c.nome, p.cliente_nome_avulso, 'Cliente avulso') AS cliente_nome,
       c.email AS cliente_email, c.cpf_cnpj AS cliente_documento,
       e.cep, e.logradouro, e.numero, e.complemento, e.bairro, e.cidade, e.estado
     FROM TAB_PEDIDO p
     LEFT JOIN TAB_CLIENTE c ON c.id = p.cliente_id
     LEFT JOIN TAB_ENDERECO e ON e.id = p.endereco_id
     WHERE p.id = $1`,
    [id]
  )

  if (!pedido) {
    return NextResponse.json({ erro: "Pedido nao encontrado" }, { status: 404 })
  }
  if (pedido.bling_nota_id) {
    return NextResponse.json({ erro: "Este pedido ja tem uma NF-e emitida" }, { status: 409 })
  }

  const itens = await query(
    `SELECT pi.quantidade, pi.preco_unitario, pr.nome
     FROM TAB_PEDIDO_ITEM pi JOIN TAB_PRODUTO pr ON pr.id = pi.produto_id
     WHERE pi.pedido_id = $1`,
    [id]
  )

  try {
    const resultado = await emitirNotaFiscalBling({
      clienteNome: pedido.cliente_nome,
      clienteDocumento: pedido.cliente_documento,
      clienteEmail: pedido.cliente_email,
      endereco: pedido.logradouro
        ? {
            cep: pedido.cep,
            logradouro: pedido.logradouro,
            numero: pedido.numero,
            complemento: pedido.complemento,
            bairro: pedido.bairro,
            cidade: pedido.cidade,
            estado: pedido.estado,
          }
        : null,
      itens: itens.map((item) => ({
        descricao: item.nome,
        quantidade: item.quantidade,
        valorUnitario: Number(item.preco_unitario),
      })),
      valorFrete: Number(pedido.valor_frete || 0),
      numeroPedidoLoja: String(pedido.id).slice(0, 8).toUpperCase(),
    })

    const [pedidoAtualizado] = await query(
      `UPDATE TAB_PEDIDO
       SET bling_nota_id = $1, bling_link_danfe = $2, bling_link_pdf = $3
       WHERE id = $4
       RETURNING bling_nota_id, bling_link_danfe, bling_link_pdf`,
      [resultado.blingNotaId, resultado.linkDanfe, resultado.linkPdf, id]
    )

    return NextResponse.json(pedidoAtualizado)
  } catch (erro) {
    return NextResponse.json(
      { erro: erro instanceof Error ? erro.message : "Erro ao emitir NF-e no Bling" },
      { status: 400 }
    )
  }
}
