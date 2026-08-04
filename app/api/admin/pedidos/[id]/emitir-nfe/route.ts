import { query, transacao } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { emitirNotaFiscalBling } from "@/lib/bling"
import { enviarEmail, templateNotaFiscalEmitida } from "@/lib/email"
import { NextResponse } from "next/server"

// Gatilho manual (botao na tela do pedido) - nunca automatico. Erro do Bling
// aqui nunca apaga nem altera nada do pedido, so devolve a mensagem pro admin
// tentar de novo.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params

  try {
    // FOR UPDATE trava o pedido ate o fim da transacao (incluindo a chamada
    // ao Bling) - evita que dois cliques quase simultaneos no botao "Emitir
    // NF-e" passem os dois pela checagem antes de qualquer um gravar.
    const pedidoAtualizado = await transacao(async (q) => {
      const [pedido] = await q(
        `SELECT p.id, p.valor_frete, p.bling_nota_id, p.bling_nota_cancelada_em,
           COALESCE(c.nome, p.cliente_nome_avulso, 'Cliente avulso') AS cliente_nome,
           c.email AS cliente_email, c.cpf_cnpj AS cliente_documento,
           e.cep, e.logradouro, e.numero, e.complemento, e.bairro, e.cidade, e.estado
         FROM TAB_PEDIDO p
         LEFT JOIN TAB_CLIENTE c ON c.id = p.cliente_id
         LEFT JOIN TAB_ENDERECO e ON e.id = p.endereco_id
         WHERE p.id = $1
         FOR UPDATE OF p`,
        [id]
      )

      if (!pedido) throw new Error("NOT_FOUND")
      // So bloqueia se ja tem nota emitida E ela NAO foi cancelada - depois
      // de cancelada, o admin pode emitir uma nova pro mesmo pedido.
      if (pedido.bling_nota_id && !pedido.bling_nota_cancelada_em) {
        throw new Error("Este pedido ja tem uma NF-e emitida")
      }

      const itens = await q(
        `SELECT pi.quantidade, pi.preco_unitario, pr.nome, pr.ncm, pr.codigo_barras
         FROM TAB_PEDIDO_ITEM pi JOIN TAB_PRODUTO pr ON pr.id = pi.produto_id
         WHERE pi.pedido_id = $1`,
        [id]
      )

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
          ncm: item.ncm,
          gtin: item.codigo_barras,
        })),
        valorFrete: Number(pedido.valor_frete || 0),
        numeroPedidoLoja: String(pedido.id).slice(0, 8).toUpperCase(),
      })

      const [atualizado] = await q(
        `UPDATE TAB_PEDIDO
         SET bling_nota_id = $1, bling_link_danfe = $2, bling_link_pdf = $3, bling_nota_cancelada_em = NULL
         WHERE id = $4
         RETURNING bling_nota_id, bling_link_danfe, bling_link_pdf, bling_nota_cancelada_em`,
        [resultado.blingNotaId, resultado.linkDanfe, resultado.linkPdf, id]
      )
      return { atualizado, clienteNome: pedido.cliente_nome, clienteEmail: pedido.cliente_email }
    })

    // Fora da transacao, de proposito - falha no envio de email nunca deve
    // desfazer a emissao, que ja aconteceu de verdade no Bling. So grava
    // bling_nota_email_enviada_em quando o envio realmente da certo, pra
    // esse status aparecer certo na tela do pedido (nao e "atire e esqueca").
    let emailEnviadoEm: string | null = null
    if (pedidoAtualizado.clienteEmail) {
      try {
        await enviarEmail({
          to: pedidoAtualizado.clienteEmail,
          subject: "Nota fiscal emitida",
          html: templateNotaFiscalEmitida({
            nomeCliente: pedidoAtualizado.clienteNome,
            pedidoId: id,
            linkDanfe: pedidoAtualizado.atualizado.bling_link_danfe,
            linkPdf: pedidoAtualizado.atualizado.bling_link_pdf,
          }),
        })
        const [linha] = await query(
          "UPDATE TAB_PEDIDO SET bling_nota_email_enviada_em = NOW() WHERE id = $1 RETURNING bling_nota_email_enviada_em",
          [id]
        )
        emailEnviadoEm = linha.bling_nota_email_enviada_em
      } catch {
        // Emissao ja aconteceu de verdade - so o e-mail falhou. Fica sem
        // bling_nota_email_enviada_em, o admin ve na tela que nao foi enviado.
      }
    }

    return NextResponse.json({ ...pedidoAtualizado.atualizado, bling_nota_email_enviada_em: emailEnviadoEm })
  } catch (erro) {
    if (erro instanceof Error && erro.message === "NOT_FOUND") {
      return NextResponse.json({ erro: "Pedido não encontrado" }, { status: 404 })
    }
    return NextResponse.json(
      { erro: erro instanceof Error ? erro.message : "Erro ao emitir NF-e no Bling" },
      { status: 400 }
    )
  }
}
