import { transacao } from "@/lib/db"
import { exigirSessao } from "@/lib/auth-servidor"
import { notificarClientesEstoqueVoltou } from "@/lib/notificar-estoque"
import {
  registrarMovimentoEstoque,
  MOTIVOS_AJUSTE_MANUAL,
  type MotivoMovimento,
} from "@/lib/estoque-movimento"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

// Ajuste de estoque de um produto (tela de Controle de Estoque). So mexe no
// campo estoque - o cadastro completo continua na tela de Produtos.
//
// Exige MOTIVO desde a migration 062: um ajuste sem motivo e exatamente o
// buraco que o kardex existe pra fechar. Saber que o saldo caiu de 40 pra 12
// nao ajuda ninguem se ninguem registrou se foi quebra, furto ou contagem.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessaoOuErro = await exigirSessao()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { id } = await params
  const { estoque, motivo, observacao }: { estoque: number; motivo?: string; observacao?: string } =
    await request.json()

  const novoEstoque = Number(estoque)
  if (!Number.isFinite(novoEstoque) || novoEstoque < 0) {
    return NextResponse.json({ erro: "Estoque inválido" }, { status: 400 })
  }

  if (!motivo || !MOTIVOS_AJUSTE_MANUAL.includes(motivo as MotivoMovimento)) {
    return NextResponse.json(
      { erro: "Escolha o motivo do ajuste (inventário, quebra, perda, devolução ou ajuste)." },
      { status: 400 }
    )
  }

  try {
    const produto = await transacao(async (q) => {
      // FOR UPDATE: dois ajustes ao mesmo tempo no mesmo produto gravariam
      // movimentos com o mesmo "saldo antes", e o historico ficaria mentindo.
      const [atual] = await q("SELECT id, estoque FROM TAB_PRODUTO WHERE id = $1 FOR UPDATE", [id])
      if (!atual) throw new Error("Produto não encontrado")

      const estoqueAnterior = Number(atual.estoque)
      const diferenca = novoEstoque - estoqueAnterior

      const [atualizado] = await q(
        `UPDATE TAB_PRODUTO SET estoque = $1, atualizado_em = NOW()
         WHERE id = $2
         RETURNING id, nome, estoque, estoque_minimo`,
        [novoEstoque, id]
      )

      // Salvar sem mudar a quantidade nao gera movimento: linha de kardex com
      // quantidade zero so polui o historico.
      if (diferenca !== 0) {
        await registrarMovimentoEstoque(q, {
          produtoId: id,
          quantidade: Math.abs(diferenca),
          tipo: diferenca > 0 ? "entrada" : "saida",
          motivo: motivo as MotivoMovimento,
          saldoApos: novoEstoque,
          usuarioId: sessaoOuErro.id,
          observacao: observacao?.trim() || null,
        })
      }

      return atualizado
    })

    notificarClientesEstoqueVoltou(produto.id)
    revalidatePath("/", "layout")

    return NextResponse.json(produto)
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao ajustar o estoque"
    return NextResponse.json({ erro: mensagem }, { status: 400 })
  }
}
