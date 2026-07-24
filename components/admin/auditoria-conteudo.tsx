"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Filter, Search, X } from "lucide-react"
import { BotaoImprimir } from "@/components/admin/botao-imprimir"

export type RegistroAuditoria = {
  id: string
  usuario_nome: string | null
  tela: string
  acao: "cadastro" | "edicao" | "exclusao" | "inativacao" | "ativacao"
  tabela: string
  registro_id: string | null
  dados_antes: Record<string, unknown> | null
  dados_depois: Record<string, unknown> | null
  criado_em: string
}

const corAcao: Record<RegistroAuditoria["acao"], string> = {
  cadastro: "bg-emerald-600/20 text-emerald-400",
  edicao: "bg-blue-600/20 text-blue-400",
  exclusao: "bg-red-600/20 text-red-400",
  inativacao: "bg-slate-200 text-slate-500",
  ativacao: "bg-emerald-600/20 text-emerald-400",
}

const ROTULOS_ACAO: Record<RegistroAuditoria["acao"], string> = {
  cadastro: "Cadastro",
  edicao: "Edicao",
  exclusao: "Exclusao",
  inativacao: "Inativacao",
  ativacao: "Ativacao",
}

const TODOS = "__todos__"

type FiltroAuditoria = { tela: string; acao: string; usuario: string; texto: string }

const FILTRO_VAZIO: FiltroAuditoria = { tela: TODOS, acao: TODOS, usuario: TODOS, texto: "" }

export function AuditoriaConteudo({
  registrosIniciais,
  inicioPeriodo,
  fimPeriodo,
}: {
  registrosIniciais: RegistroAuditoria[]
  inicioPeriodo: string
  fimPeriodo: string
}) {
  const [detalhe, setDetalhe] = useState<RegistroAuditoria | null>(null)
  // Estado do formulario (digitando) separado do aplicado - evita refiltrar a
  // cada tecla no campo de texto; so refiltra ao clicar Pesquisar ou dar Enter.
  const [filtro, setFiltro] = useState<FiltroAuditoria>(FILTRO_VAZIO)
  const [filtroAplicado, setFiltroAplicado] = useState<FiltroAuditoria>(FILTRO_VAZIO)

  const telas = useMemo(
    () => Array.from(new Set(registrosIniciais.map((r) => r.tela))).sort(),
    [registrosIniciais]
  )
  const usuarios = useMemo(
    () =>
      Array.from(new Set(registrosIniciais.map((r) => r.usuario_nome).filter(Boolean) as string[])).sort(),
    [registrosIniciais]
  )

  const filtrados = registrosIniciais.filter((r) => {
    if (filtroAplicado.tela !== TODOS && r.tela !== filtroAplicado.tela) return false
    if (filtroAplicado.acao !== TODOS && r.acao !== filtroAplicado.acao) return false
    if (filtroAplicado.usuario !== TODOS && r.usuario_nome !== filtroAplicado.usuario) return false
    if (filtroAplicado.texto) {
      const alvo = `${r.usuario_nome || ""} ${r.tela} ${r.tabela} ${r.acao} ${r.registro_id || ""}`.toLowerCase()
      if (!alvo.includes(filtroAplicado.texto.toLowerCase())) return false
    }
    return true
  })

  function pesquisar() {
    setFiltroAplicado(filtro)
  }

  function limpar() {
    setFiltro(FILTRO_VAZIO)
    setFiltroAplicado(FILTRO_VAZIO)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Auditoria</h1>
          <p className="text-sm text-muted-foreground">
            Historico de cadastros, edicoes e exclusoes feitas no painel (ate 500 registros no periodo).
          </p>
        </div>
        <BotaoImprimir descricaoPeriodo={`Periodo: ${inicioPeriodo} a ${fimPeriodo}`} />
      </div>

      <Card className="print:hidden">
        <CardContent className="space-y-3 pt-6">
          <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Filter size={14} />
            Filtros
          </div>

          <form
            action="/admin/auditoria"
            method="get"
            className="flex flex-wrap items-end gap-3"
          >
            <div className="flex flex-col gap-1">
              <Label className="text-xs">De</Label>
              <Input type="date" name="inicio" defaultValue={inicioPeriodo} className="w-40" />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Ate</Label>
              <Input type="date" name="fim" defaultValue={fimPeriodo} className="w-40" />
            </div>
            <Button type="submit" variant="outline" size="sm">
              Aplicar periodo
            </Button>
          </form>

          <div className="flex flex-wrap items-end gap-3 border-t border-border pt-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Tela</Label>
              <Select value={filtro.tela} onValueChange={(v) => setFiltro((f) => ({ ...f, tela: v || TODOS }))}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todas as telas</SelectItem>
                  {telas.map((tela) => (
                    <SelectItem key={tela} value={tela}>
                      {tela}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-xs">Acao</Label>
              <Select value={filtro.acao} onValueChange={(v) => setFiltro((f) => ({ ...f, acao: v || TODOS }))}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todas as acoes</SelectItem>
                  {(Object.keys(ROTULOS_ACAO) as RegistroAuditoria["acao"][]).map((acao) => (
                    <SelectItem key={acao} value={acao}>
                      {ROTULOS_ACAO[acao]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-xs">Usuario</Label>
              <Select
                value={filtro.usuario}
                onValueChange={(v) => setFiltro((f) => ({ ...f, usuario: v || TODOS }))}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todos os usuarios</SelectItem>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario} value={usuario}>
                      {usuario}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-xs">Buscar</Label>
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Usuario, tela, tabela..."
                  value={filtro.texto}
                  onChange={(e) => setFiltro((f) => ({ ...f, texto: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && pesquisar()}
                  className="w-56 pl-8"
                />
              </div>
            </div>

            <Button size="sm" onClick={pesquisar}>
              Pesquisar
            </Button>
            <Button size="sm" variant="outline" onClick={limpar}>
              <X size={14} className="mr-1" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        {filtrados.length} registro{filtrados.length === 1 ? "" : "s"} encontrado
        {filtrados.length === 1 ? "" : "s"}
      </p>

      <Card>
        <CardContent className="p-0">
          {filtrados.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">Nenhum registro encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="p-4 font-medium">Data</th>
                    <th className="p-4 font-medium">Usuario</th>
                    <th className="p-4 font-medium">Tela</th>
                    <th className="p-4 font-medium">Acao</th>
                    <th className="p-4 font-medium">Tabela</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((registro) => (
                    <tr
                      key={registro.id}
                      className="cursor-pointer border-b border-slate-200 last:border-0 hover:bg-accent/50"
                      onClick={() => setDetalhe(registro)}
                    >
                      <td className="p-4 whitespace-nowrap text-slate-500">
                        {new Date(registro.criado_em).toLocaleString("pt-BR")}
                      </td>
                      <td className="p-4">{registro.usuario_nome || "-"}</td>
                      <td className="p-4 text-slate-500">{registro.tela}</td>
                      <td className="p-4">
                        <span className={`rounded-full px-2 py-1 text-xs ${corAcao[registro.acao]}`}>
                          {registro.acao}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">{registro.tabela}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {detalhe && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setDetalhe(null)}
        >
          <Card className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <CardContent className="max-h-[80vh] space-y-4 overflow-y-auto pt-6">
              <h2 className="text-lg font-semibold">
                {detalhe.tela} — {detalhe.acao}
              </h2>
              <p className="text-sm text-muted-foreground">
                {detalhe.usuario_nome || "Sistema"} em{" "}
                {new Date(detalhe.criado_em).toLocaleString("pt-BR")}
              </p>

              {detalhe.dados_antes && (
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-500">Antes</p>
                  <pre className="overflow-x-auto rounded-md bg-slate-100 p-3 text-xs">
                    {JSON.stringify(detalhe.dados_antes, null, 2)}
                  </pre>
                </div>
              )}
              {detalhe.dados_depois && (
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-500">Depois</p>
                  <pre className="overflow-x-auto rounded-md bg-slate-100 p-3 text-xs">
                    {JSON.stringify(detalhe.dados_depois, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
