import { exigirAdmin } from "@/lib/auth-servidor"
import { listarMovimentosCaixa, resumoCaixa } from "@/lib/fluxo-caixa"
import { NextResponse } from "next/server"

// Caixa mostra o dinheiro da loja inteira - mesma restricao do resto do
// financeiro: so "admin" (a permissao por tela cuida do resto).
export async function GET(request: Request) {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const parametros = new URL(request.url).searchParams
  const inicio = parametros.get("inicio")
  const fim = parametros.get("fim")

  if (!inicio || !fim) {
    return NextResponse.json({ erro: "Informe o período (início e fim)" }, { status: 400 })
  }

  const [movimentos, resumo] = await Promise.all([
    listarMovimentosCaixa(inicio, fim),
    resumoCaixa(inicio, fim),
  ])

  return NextResponse.json({ movimentos, resumo })
}
