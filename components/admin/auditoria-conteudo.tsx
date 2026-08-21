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
  cadastro: "selo-sucesso",
  edicao: "selo-info",
  exclusao: "selo-erro",
  inativacao: "selo-neutro",
  ativacao: "selo-sucesso",
}

const ROTULOS_ACAO: Record<RegistroAuditoria["acao"], string> = {
  cadastro: "Cadastro",
  edicao: "Edição",
  exclusao: "Exclusão",
  inativacao: "Inativação",
  ativacao: "Ativação",
}

// Nome da tabela do banco -> nome que a pessoa conhece. Quem abre a auditoria
// e o dono da loja, nao quem escreveu o banco: "TAB_SOBRE_NOS_MIDIA" nao
// significa nada pra ele.
const ROTULOS_TABELA: Record<string, string> = {
  TAB_AVALIACAO_PRODUTO: "Avaliação de produto",
  TAB_BANNER: "Banner",
  TAB_CATEGORIA: "Categoria",
  TAB_CLIENTE: "Cliente",
  TAB_COMPRA: "Entrada de NF",
  TAB_CONFIGURACAO: "Configuração da loja",
  TAB_CONFIGURACAO_MARCA: "Configuração da loja",
  TAB_CONTA: "Conta do financeiro",
  TAB_CUPOM: "Cupom",
  TAB_FEEDBACK: "Feedback",
  TAB_FORNECEDOR: "Fornecedor",
  TAB_PRODUTO: "Produto",
  TAB_SOBRE_NOS_MIDIA: "Mídia do Sobre Nós",
  TAB_USUARIO_ADMIN: "Usuário do sistema",
}

// Tabela sem rotulo cadastrado cai pra uma versao legivel do proprio nome
// (TAB_ALGUMA_COISA -> "Alguma coisa") em vez de aparecer crua.
function rotuloTabela(tabela: string): string {
  if (ROTULOS_TABELA[tabela]) return ROTULOS_TABELA[tabela]
  const texto = tabela.replace(/^TAB_/, "").replace(/_/g, " ").toLowerCase()
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// Nome da coluna do banco -> nome do campo na tela. Sem isso o detalhe da
// auditoria mostra "razao_social" e "preco_promocional" pra quem so conhece
// "Razão social" e "Preço promocional".
const ROTULOS_CAMPO: Record<string, string> = {
  razao_social: "Razão social",
  nome_fantasia: "Nome fantasia",
  cnpj_cpf: "CNPJ/CPF",
  preco_promocional: "Preço promocional",
  codigo_barras: "Código de barras",
  estoque_minimo: "Estoque mínimo",
  numero_nota: "Número da nota",
  chave_acesso: "Chave de acesso",
  forma_pagamento: "Forma de pagamento",
  data_vencimento: "Vencimento",
  valor: "Valor",
  preco: "Preço",
  custo: "Custo",
  nome: "Nome",
  sku: "Código (SKU)",
  ativo: "Ativo",
  codigo: "Código",
  itens: "Quantidade de itens",
}

function rotuloCampo(campo: string): string {
  if (ROTULOS_CAMPO[campo]) return ROTULOS_CAMPO[campo]
  const texto = campo.replace(/_/g, " ")
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function valorLegivel(valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return "—"
  if (typeof valor === "boolean") return valor ? "Sim" : "Não"
  if (typeof valor === "object") return JSON.stringify(valor)
  return String(valor)
}

// Mostra o que mudou em vez de despejar o JSON do registro. Na edicao, so os
// campos que realmente mudaram: numa tela com 20 campos, listar os 20 esconde
// justamente a alteracao que a pessoa foi procurar.
function AlteracoesDoRegistro({
  antes,
  depois,
}: {
  antes: Record<string, unknown> | null
  depois: Record<string, unknown> | null
}) {
  const campos = Array.from(new Set([...Object.keys(antes ?? {}), ...Object.keys(depois ?? {})]))
  if (campos.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem detalhes guardados para este registro.</p>
  }

  const ehEdicao = Boolean(antes && depois)
  const visiveis = ehEdicao
    ? campos.filter((campo) => valorLegivel(antes?.[campo]) !== valorLegivel(depois?.[campo]))
    : campos

  if (visiveis.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum campo mudou de valor.</p>
  }

  return (
    <div className="overflow-hidden rounded-md border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
            <th className="p-2 font-medium">Campo</th>
            {ehEdicao && <th className="p-2 font-medium">Antes</th>}
            <th className="p-2 font-medium">{ehEdicao ? "Depois" : "Valor"}</th>
          </tr>
        </thead>
        <tbody>
          {visiveis.map((campo) => (
            <tr key={campo} className="border-b border-slate-100 last:border-0">
              <td className="p-2 text-slate-500">{rotuloCampo(campo)}</td>
              {ehEdicao && <td className="p-2 text-slate-400 line-through">{valorLegivel(antes?.[campo])}</td>}
              <td className="p-2">{valorLegivel((depois ?? antes)?.[campo])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
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
            Histórico de cadastros, edições e exclusões feitas no painel (até 500 registros no período).
          </p>
        </div>
        <BotaoImprimir descricaoPeriodo={`Período: ${inicioPeriodo} a ${fimPeriodo}`} />
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
              <Label className="text-xs">Até</Label>
              <Input type="date" name="fim" defaultValue={fimPeriodo} className="w-40" />
            </div>
            <Button type="submit" variant="outline" size="sm">
              Aplicar período
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
              <Label className="text-xs">Ação</Label>
              <Select value={filtro.acao} onValueChange={(v) => setFiltro((f) => ({ ...f, acao: v || TODOS }))}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todas as ações</SelectItem>
                  {(Object.keys(ROTULOS_ACAO) as RegistroAuditoria["acao"][]).map((acao) => (
                    <SelectItem key={acao} value={acao}>
                      {ROTULOS_ACAO[acao]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-xs">Usuário</Label>
              <Select
                value={filtro.usuario}
                onValueChange={(v) => setFiltro((f) => ({ ...f, usuario: v || TODOS }))}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todos os usuários</SelectItem>
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
                  placeholder="Usuário, tela, tabela..."
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
                  <tr className="cabecalho-grade border-b border-slate-700">
                    <th className="p-4 font-medium">Data</th>
                    <th className="p-4 font-medium">Usuário</th>
                    <th className="p-4 font-medium">Tela</th>
                    <th className="p-4 font-medium">Ação</th>
                    <th className="p-4 font-medium">Registro</th>
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
                          {ROTULOS_ACAO[registro.acao] ?? registro.acao}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">{rotuloTabela(registro.tabela)}</td>
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
                {detalhe.tela} — {ROTULOS_ACAO[detalhe.acao] ?? detalhe.acao}
              </h2>
              <p className="text-sm text-muted-foreground">
                {detalhe.usuario_nome || "Sistema"} em{" "}
                {new Date(detalhe.criado_em).toLocaleString("pt-BR")}
              </p>

              <AlteracoesDoRegistro antes={detalhe.dados_antes} depois={detalhe.dados_depois} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
