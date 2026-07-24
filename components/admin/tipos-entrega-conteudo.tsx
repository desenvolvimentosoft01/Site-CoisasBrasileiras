"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Trash2, Pencil, Plus, ArrowLeft } from "lucide-react"

export type TipoEntrega = {
  id: string
  nome: string
  ativo: boolean
  criado_em: string
}

export function TiposEntregaConteudo({ tiposIniciais }: { tiposIniciais: TipoEntrega[] }) {
  const [tipos, setTipos] = useState<TipoEntrega[]>(tiposIniciais)
  const [editando, setEditando] = useState<TipoEntrega | null>(null)
  const [criando, setCriando] = useState(false)
  const [nome, setNome] = useState("")
  const [ativo, setAtivo] = useState(true)
  const [erro, setErro] = useState("")
  const [salvando, setSalvando] = useState(false)

  async function recarregar() {
    const resposta = await fetch("/api/admin/tipos-entrega")
    setTipos(await resposta.json())
  }

  function abrirNovo() {
    setEditando(null)
    setNome("")
    setAtivo(true)
    setErro("")
    setCriando(true)
  }

  function abrirEdicao(tipo: TipoEntrega) {
    setEditando(tipo)
    setNome(tipo.nome)
    setAtivo(tipo.ativo)
    setErro("")
    setCriando(true)
  }

  function fechar() {
    setCriando(false)
    setEditando(null)
  }

  async function salvar() {
    setErro("")
    setSalvando(true)

    const url = editando ? `/api/admin/tipos-entrega/${editando.id}` : "/api/admin/tipos-entrega"
    const method = editando ? "PUT" : "POST"

    const resposta = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, ativo }),
    })

    setSalvando(false)

    if (!resposta.ok) {
      const dados = await resposta.json()
      setErro(dados.erro || "Erro ao salvar")
      return
    }

    fechar()
    recarregar()
  }

  async function excluir(tipo: TipoEntrega) {
    if (!confirm(`Excluir o tipo de entrega "${tipo.nome}"?`)) return
    await fetch(`/api/admin/tipos-entrega/${tipo.id}`, { method: "DELETE" })
    recarregar()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" nativeButton={false} render={<Link href="/admin/configuracoes" />}>
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Tipos de entrega</h1>
          <p className="text-sm text-muted-foreground">
            Usado na venda balcao quando a venda tem alguma forma de entrega (retirada, motoboy etc).
          </p>
        </div>
        <Button onClick={abrirNovo}>
          <Plus size={16} className="mr-2" />
          Novo tipo
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {tipos.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">Nenhum tipo de entrega cadastrado ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="p-4 font-medium">Nome</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {tipos.map((tipo) => (
                    <tr key={tipo.id} className="border-b border-slate-200 last:border-0">
                      <td className="p-4">{tipo.nome}</td>
                      <td className="p-4">
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            tipo.ativo
                              ? "bg-emerald-600/20 text-emerald-400"
                              : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {tipo.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="icon-lg" onClick={() => abrirEdicao(tipo)}>
                          <Pencil size={16} />
                        </Button>
                        <Button variant="ghost" size="icon-lg" onClick={() => excluir(tipo)}>
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

      {criando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="space-y-4 pt-6">
              <h2 className="text-lg font-semibold">
                {editando ? `Editando: ${editando.nome}` : "Novo tipo de entrega"}
              </h2>

              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
              </div>

              {editando && (
                <div className="flex items-center justify-between">
                  <Label>Ativo</Label>
                  <Switch checked={ativo} onCheckedChange={setAtivo} />
                </div>
              )}

              {erro && <p className="text-sm text-red-500">{erro}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={fechar}>
                  Cancelar
                </Button>
                <Button onClick={salvar} disabled={salvando || !nome.trim()}>
                  {salvando ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
