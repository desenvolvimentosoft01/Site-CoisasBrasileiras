"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Trash2, Pencil, Plus, List } from "lucide-react"
import { formatarMoeda } from "@/lib/mascaras"

type Cupom = {
  id: string
  codigo: string
  tipo: "percentual" | "fixo"
  valor: string
  valor_minimo: string
  primeira_compra_apenas: boolean
  validade: string | null
  uso_maximo: number | null
  usos_atuais: number
  ativo: boolean
}

export default function CuponsPage() {
  const [cupons, setCupons] = useState<Cupom[]>([])
  const [carregando, setCarregando] = useState(true)
  const [aba, setAba] = useState("lista")
  const [editando, setEditando] = useState<Cupom | null>(null)

  const [codigo, setCodigo] = useState("")
  const [tipo, setTipo] = useState<"percentual" | "fixo">("percentual")
  const [valor, setValor] = useState("")
  const [valorMinimo, setValorMinimo] = useState("0")
  const [primeiraCompraApenas, setPrimeiraCompraApenas] = useState(false)
  const [usoMaximo, setUsoMaximo] = useState("")
  const [ativo, setAtivo] = useState(true)
  const [erro, setErro] = useState("")
  const [salvando, setSalvando] = useState(false)

  async function carregar() {
    setCarregando(true)
    const resposta = await fetch("/api/admin/cupons")
    setCupons(await resposta.json())
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  function abrirNovo() {
    setEditando(null)
    setCodigo("")
    setTipo("percentual")
    setValor("")
    setValorMinimo("0")
    setPrimeiraCompraApenas(false)
    setUsoMaximo("")
    setAtivo(true)
    setErro("")
    setAba("formulario")
  }

  function abrirEdicao(cupom: Cupom) {
    setEditando(cupom)
    setCodigo(cupom.codigo)
    setTipo(cupom.tipo)
    setValor(cupom.valor)
    setValorMinimo(cupom.valor_minimo)
    setPrimeiraCompraApenas(cupom.primeira_compra_apenas)
    setUsoMaximo(cupom.uso_maximo ? String(cupom.uso_maximo) : "")
    setAtivo(cupom.ativo)
    setErro("")
    setAba("formulario")
  }

  async function salvar() {
    setErro("")
    setSalvando(true)

    const corpo = {
      codigo,
      tipo,
      valor: Number(valor),
      valorMinimo: Number(valorMinimo) || 0,
      primeiraCompraApenas,
      usoMaximo: usoMaximo ? Number(usoMaximo) : null,
      ativo,
    }

    const url = editando ? `/api/admin/cupons/${editando.id}` : "/api/admin/cupons"
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

    setAba("lista")
    carregar()
  }

  async function excluir(cupom: Cupom) {
    if (!confirm(`Excluir o cupom "${cupom.codigo}"?`)) return
    await fetch(`/api/admin/cupons/${cupom.id}`, { method: "DELETE" })
    carregar()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Cupons de desconto</h1>

      <Tabs value={aba} onValueChange={(v) => setAba(v as string)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="lista">
              <List size={14} className="mr-1.5" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="formulario">
              <Plus size={14} className="mr-1.5" />
              {editando ? "Editar" : "Novo cupom"}
            </TabsTrigger>
          </TabsList>
          {aba === "lista" && (
            <Button onClick={abrirNovo}>
              <Plus size={16} className="mr-2" />
              Novo cupom
            </Button>
          )}
        </div>

        <TabsContent value="lista" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {carregando ? (
                <p className="p-6 text-sm text-neutral-400">Carregando...</p>
              ) : cupons.length === 0 ? (
                <p className="p-6 text-sm text-neutral-400">Nenhum cupom cadastrado ainda.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-neutral-800 text-left text-neutral-400">
                        <th className="p-4 font-medium">Codigo</th>
                        <th className="p-4 font-medium">Desconto</th>
                        <th className="p-4 font-medium">Usos</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium text-right">Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cupons.map((cupom) => (
                        <tr key={cupom.id} className="border-b border-neutral-800 last:border-0">
                          <td className="p-4 font-mono">{cupom.codigo}</td>
                          <td className="p-4">
                            {cupom.tipo === "percentual"
                              ? `${Number(cupom.valor)}%`
                              : formatarMoeda(cupom.valor)}
                            {cupom.primeira_compra_apenas && (
                              <span className="ml-2 rounded-full bg-emerald-600/20 px-2 py-0.5 text-xs text-emerald-400">
                                1a compra
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-neutral-400">
                            {cupom.usos_atuais}
                            {cupom.uso_maximo ? ` / ${cupom.uso_maximo}` : ""}
                          </td>
                          <td className="p-4">
                            <span
                              className={`rounded-full px-2 py-1 text-xs ${
                                cupom.ativo
                                  ? "bg-emerald-600/20 text-emerald-400"
                                  : "bg-neutral-700/40 text-neutral-400"
                              }`}
                            >
                              {cupom.ativo ? "Ativo" : "Inativo"}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <Button variant="ghost" size="icon-lg" onClick={() => abrirEdicao(cupom)}>
                              <Pencil size={16} />
                            </Button>
                            <Button variant="ghost" size="icon-lg" onClick={() => excluir(cupom)}>
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

        <TabsContent value="formulario" className="mt-4">
          <Card className="max-w-lg">
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label>Codigo</Label>
                <Input
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  disabled={!!editando}
                  placeholder="BEMVINDO10"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as "percentual" | "fixo")}
                    className="w-full rounded-md border border-neutral-700 bg-neutral-900 p-2 text-sm"
                  >
                    <option value="percentual">Percentual (%)</option>
                    <option value="fixo">Valor fixo (R$)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor minimo da compra (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={valorMinimo}
                    onChange={(e) => setValorMinimo(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Limite de usos (opcional)</Label>
                  <Input
                    type="number"
                    value={usoMaximo}
                    onChange={(e) => setUsoMaximo(e.target.value)}
                    placeholder="Ilimitado"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>Apenas na primeira compra</Label>
                <Switch checked={primeiraCompraApenas} onCheckedChange={setPrimeiraCompraApenas} />
              </div>

              {editando && (
                <div className="flex items-center justify-between">
                  <Label>Ativo</Label>
                  <Switch checked={ativo} onCheckedChange={setAtivo} />
                </div>
              )}

              {erro && <p className="text-sm text-red-500">{erro}</p>}

              <div className="flex gap-3 pt-2">
                <Button onClick={salvar} disabled={salvando || !codigo.trim() || !valor}>
                  {salvando ? "Salvando..." : "Salvar"}
                </Button>
                <Button variant="outline" onClick={() => setAba("lista")}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
