import { query } from "@/lib/db"
import { exigirAdmin, exigirDesenvolvedor } from "@/lib/auth-servidor"
import { CATALOGO_RECURSOS, RECURSOS_POR_PLANO, type ChaveRecurso } from "@/lib/recursos"
import { carregarRecursos } from "@/lib/recursos-servidor"
import { registrarAuditoriaServidor } from "@/lib/auditoria-servidor"
import { NextResponse } from "next/server"

// Leitura: qualquer admin (a tela de Configuracoes mostra o plano contratado).
export async function GET() {
  const sessaoOuErro = await exigirAdmin()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const [configuracao] = await query("SELECT valor FROM TAB_CONFIGURACAO WHERE chave = 'plano'")
  return NextResponse.json({
    plano: configuracao?.valor ?? "avancado",
    recursos: await carregarRecursos(),
  })
}

// Escrita: so o desenvolvedor. Plano e o que a loja pode usar - se o proprio
// cliente pudesse ligar recurso, plano deixaria de significar alguma coisa.
export async function PUT(request: Request) {
  const sessaoOuErro = await exigirDesenvolvedor()
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro

  const { plano, recursos }: { plano?: string; recursos?: Record<string, boolean> } = await request.json()

  // Estado anterior lido ANTES de mexer - a auditoria precisa do "de que jeito
  // estava", e depois da alteracao esse valor nao existe mais em lugar nenhum.
  const [configuracaoAnterior] = await query("SELECT valor FROM TAB_CONFIGURACAO WHERE chave = 'plano'")
  const planoAnterior = configuracaoAnterior?.valor ?? "avancado"
  const recursosAntes = await carregarRecursos()

  if (plano) {
    await query(
      `INSERT INTO TAB_CONFIGURACAO (chave, valor, atualizado_em) VALUES ('plano', $1, NOW())
       ON CONFLICT (chave) DO UPDATE SET valor = $1, atualizado_em = NOW()`,
      [plano]
    )

    // Trocar de plano reescreve TODOS os recursos pro conjunto daquele plano -
    // senao o cliente subiria de plano e continuaria sem o que acabou de
    // contratar. Ajuste fino continua possivel logo depois, recurso a recurso.
    const doPlano = RECURSOS_POR_PLANO[plano as keyof typeof RECURSOS_POR_PLANO]
    if (doPlano) {
      for (const recurso of CATALOGO_RECURSOS) {
        await query(
          `INSERT INTO TAB_RECURSO (chave, habilitado, atualizado_em) VALUES ($1, $2, NOW())
           ON CONFLICT (chave) DO UPDATE SET habilitado = $2, atualizado_em = NOW()`,
          [recurso.chave, doPlano.includes(recurso.chave)]
        )
      }
    }
  }

  if (recursos) {
    const chavesValidas = new Set<string>(CATALOGO_RECURSOS.map((r) => r.chave))
    for (const [chave, habilitado] of Object.entries(recursos)) {
      // Chave fora do catalogo e ignorada: a tabela nao pode virar deposito de
      // nome errado que ninguem mais entende de onde veio.
      if (!chavesValidas.has(chave)) continue
      await query(
        `INSERT INTO TAB_RECURSO (chave, habilitado, atualizado_em) VALUES ($1, $2, NOW())
         ON CONFLICT (chave) DO UPDATE SET habilitado = $2, atualizado_em = NOW()`,
        [chave as ChaveRecurso, Boolean(habilitado)]
      )
    }
  }

  await registrarAuditoriaServidor({
    sessao: sessaoOuErro,
    tela: "Plano e Recursos",
    acao: "edicao",
    tabela: "TAB_RECURSO",
    antes: { plano: planoAnterior, recursos: recursosAntes },
    depois: { plano: plano ?? planoAnterior, recursos: await carregarRecursos() },
  })

  return NextResponse.json({ recursos: await carregarRecursos() })
}
