"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Icone } from "@/components/admin/icone"

// Linha de filtros no padrao do InMenteGestao: os campos, o botao Pesquisar, o
// "Limpar filtros" e o selo com quantos registros a busca achou.
//
// Existe como componente pra que toda tela filtre do mesmo jeito - hoje cada
// grade inventa a sua barra, e o operador precisa reaprender onde clicar a
// cada tela.
export function LinhaFiltros({
  children,
  aoPesquisar,
  aoLimpar,
  temFiltro,
  encontrados,
}: {
  children: ReactNode
  // Quando existe, a busca so acontece no clique/Enter - util em tela com
  // muito registro, onde filtrar a cada tecla trava a digitacao. Sem isso, os
  // proprios campos ja filtram enquanto se digita.
  aoPesquisar?: () => void
  aoLimpar: () => void
  temFiltro: boolean
  encontrados: number
}) {
  return (
    <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2.5">
      {children}

      {aoPesquisar && (
        <Button size="sm" onClick={aoPesquisar} className="h-9">
          <Icone nome="ver" tamanho={15} className="mr-1.5" />
          Pesquisar
        </Button>
      )}

      {temFiltro && (
        <Button variant="ghost" size="sm" onClick={aoLimpar} className="h-9 text-slate-500">
          Limpar filtros
        </Button>
      )}

      <span className="ml-auto rounded-full bg-slate-200/70 px-3 py-1 text-xs text-slate-600">
        {encontrados} {encontrados === 1 ? "registro encontrado" : "registros encontrados"}
      </span>
    </div>
  )
}

// Campo rotulado da linha de filtros - mantem rotulo e controle alinhados sem
// cada tela repetir a mesma marcacao.
export function CampoFiltro({
  rotulo,
  children,
  largura,
}: {
  rotulo: string
  children: ReactNode
  largura?: string
}) {
  return (
    <div className={largura}>
      <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {rotulo}
      </label>
      {children}
    </div>
  )
}
