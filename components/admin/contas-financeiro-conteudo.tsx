"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash2, Pencil, Plus, List, ArrowLeft } from "lucide-react"
import { formatarMoeda } from "@/lib/mascaras"
import { registrarAuditoria } from "@/lib/auditoria"
import { useConfirmar } from "@/components/admin/confirm-provider"

export type Conta = {
  id: string
  tipo: "pagar" | "receber"
  descricao: string
  valor: string
  vencimento: string
  pago: boolean
  pago_em: string | null
  categoria: string | null
  observacao: string | null
}

export function ContasFinanceiroConteudo({ contasIniciais }: { contasIniciais: Conta[] }) {
  const confirmar = useConfirmar()
  const [contas, setContas] = useState<Conta[]>(contasIniciais)
  const [aba, setAba] = useState("lista")
  const [editando, setEditando] = useState<Conta | null>(null)

  const [tipo, setTipo] = useState<"pagar" | "receber">("pagar")
  const [descricao, setDescricao] = useState("")
  const [valor, setValor] = useState("")
  const [vencimento, setVencimento] = useState("")
  const [categoria, setCategoria] = useState("")
  const [observacao, setObservacao] = useState("")
  const [pago, setPago] = useState(false)
  const [erro, setErro] = useState("")
  const [salvando, setSalvando] = useState(false)

  async function recarregar() {
    const resposta = await fetch("/api/admin/financeiro/contas")
    setContas(await resposta.json())
  }

  function abrirNova() {
    setEditando(null)
    setTipo("pagar")
    setDescricao("")
    setValor("")
    setVencimento("")
    setCategoria("")
    setObservacao("")
    setPago(false)
    setErro("")
    setAba("formulario")
  }

  function abrirEdicao(conta: Conta) {
    setEditando(conta)
    setTipo(conta.tipo)
    setDescricao(conta.descricao)
    setValor(conta.valor)
    setVencimento(conta.vencimento.slice(0, 10))
    setCategoria(conta.categoria || "")
    setObservacao(conta.observacao || "")
    setPago(conta.pago)
    setErro("")
    setAba("formulario")
  }

  function limpar() {
    if (editando) {
      setTipo(editando.tipo)
      setDescricao(editando.descricao)
      setValor(editando.valor)
      setVencimento(editando.vencimento.slice(0, 10))
      setCategoria(editando.categoria || "")
      setObservacao(editando.observacao || "")
      setPago(editando.pago)
    } else {
      setTipo("pagar")
      setDescricao("")
      setValor("")
      setVencimento("")
      setCategoria("")
      setObservacao("")
      setPago(false)
    }
    setErro("")
  }

  async function salvar() {
    setErro("")
    setSalvando(true)

    const corpo = {
      tipo,
      descricao,
      valor: Number(valor),
      vencimento,
      categoria: categoria || null,
      observacao: observacao || null,
      pago,
    }

    const url = editando ? `/api/admin/financeiro/contas/${editando.id}` : "/api/admin/financeiro/contas"
    const method = editando ? "PUT" : "POST"

    const resposta = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    })

    setSalvando(false)

    if (!resposta.ok) {
      const dados = await resposta.json()
      setErro(dados.erro || "Erro ao salvar")
      return
    }

    const salva = await resposta.json()
    registrarAuditoria({
      tela: "Financeiro - Contas",
      acao: editando ? "edicao" : "cadastro",
      tabela: "TAB_CONTA",
      registroId: editando?.id ?? salva.id,
      antes: editando
        ? { descricao: editando.descricao, valor: editando.valor, pago: editando.pago }
        : null,
      depois: { descricao, valor: corpo.valor, pago },
    })

    setAba("lista")
    recarregar()
  }

  async function excluir(conta: Conta) {
    if (!(await confirmar({ descricao: `Excluir a conta "${conta.descricao}"?`, destrutivo: true }))) return
    await fetch(`/api/admin/financeiro/contas/${conta.id}`, { method: "DELETE" })
    registrarAuditoria({
      tela: "Financeiro - Contas",
      acao: "exclusao",
      tabela: "TAB_CONTA",
      registroId: conta.id,
      antes: { descricao: conta.descricao, valor: conta.valor },
    })
    recarregar()
  }

  async function alternarPago(conta: Conta) {
    const resposta = await fetch(`/api/admin/financeiro/contas/${conta.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: conta.tipo,
        descricao: conta.descricao,
        valor: conta.valor,
        vencimento: conta.vencimento.slice(0, 10),
        categoria: conta.categoria,
        observacao: conta.observacao,
        pago: !conta.pago,
      }),
    })
    if (!resposta.ok) return
    registrarAuditoria({
      tela: "Financeiro - Contas",
      acao: "edicao",
      tabela: "TAB_CONTA",
      registroId: conta.id,
      antes: { pago: conta.pago },
      depois: { pago: !conta.pago },
    })
    recarregar()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" nativeButton={false} render={<Link href="/admin/financeiro" />}>
          <ArrowLeft size={18} />
        </Button>
        <h1 className="text-2xl font-semibold">Contas a pagar / receber</h1>
      </div>

      <Tabs value={aba} onValueChange={(v) => setAba(v as string)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="lista">
              <List size={14} className="mr-1.5" />
              Grade
            </TabsTrigger>
            <TabsTrigger value="formulario">
              <Plus size={14} className="mr-1.5" />
              Cadastro
            </TabsTrigger>
          </TabsList>
          {aba === "lista" && (
            <Button onClick={abrirNova}>
              <Plus size={16} className="mr-2" />
              Nova conta
            </Button>
          )}
        </div>

        <TabsContent value="lista" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {contas.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">Nenhuma conta cadastrada ainda.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-500">
                        <th className="p-4 font-medium">Tipo</th>
                        <th className="p-4 font-medium">Descricao</th>
                        <th className="p-4 font-medium">Vencimento</th>
                        <th className="p-4 font-medium">Valor</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium text-right">Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contas.map((conta) => (
                        <tr key={conta.id} className="border-b border-slate-200 last:border-0">
                          <td className="p-4 capitalize">{conta.tipo}</td>
                          <td className="p-4">{conta.descricao}</td>
                          <td className="p-4 text-slate-500">
                            {new Date(conta.vencimento).toLocaleDateString("pt-BR")}
                          </td>
                          <td className={conta.tipo === "pagar" ? "p-4 text-red-400" : "p-4 text-emerald-400"}>
                            {formatarMoeda(conta.valor)}
                          </td>
                          <td className="p-4">
                            <button onClick={() => alternarPago(conta)}>
                              <span
                                className={`rounded-full px-2 py-1 text-xs ${
                                  conta.pago
                                    ? "bg-emerald-600/20 text-emerald-400"
                                    : "bg-amber-600/20 text-amber-400"
                                }`}
                              >
                                {conta.pago ? "Pago" : "Em aberto"}
                              </span>
                            </button>
                          </td>
                          <td className="p-4 text-right">
                            <Button variant="ghost" size="icon-lg" onClick={() => abrirEdicao(conta)}>
                              <Pencil size={16} />
                            </Button>
                            <Button variant="ghost" size="icon-lg" onClick={() => excluir(conta)}>
                              <Trash2 size={16} className="text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="formulario" className="mt-4 space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
            <span className="text-sm font-medium text-muted-foreground">
              {editando ? `Editando: ${editando.descricao}` : "Nova conta"}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAba("lista")}>
                Cancelar
              </Button>
              <Button variant="outline" onClick={limpar}>
                Limpar
              </Button>
              <Button onClick={salvar} disabled={salvando || !descricao.trim() || !valor || !vencimento}>
                {salvando ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>

          <Card className="max-w-lg">
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={(v) => setTipo((v as "pagar" | "receber") || "pagar")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pagar">A pagar</SelectItem>
                    <SelectItem value="receber">A receber</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Descricao</Label>
                <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} autoFocus />
              </div>

              <div className="grid items-end grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Vencimento</Label>
                  <Input type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Categoria (opcional)</Label>
                <Input
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  placeholder="Ex: Fornecedor, Aluguel, Energia"
                />
              </div>

              <div className="space-y-2">
                <Label>Observacao (opcional)</Label>
                <textarea
                  className="min-h-20 w-full rounded-md border border-input bg-transparent p-3 text-sm"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                />
              </div>

              {editando && (
                <div className="flex items-center justify-between">
                  <Label>Pago</Label>
                  <Switch checked={pago} onCheckedChange={setPago} />
                </div>
              )}

              {erro && <p className="text-sm text-red-500">{erro}</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
