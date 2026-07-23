"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Trash2, Plus } from "lucide-react"

type Faixa = {
  id: string
  regiao: "norte" | "nordeste" | "centro_oeste" | "sudeste" | "sul"
  peso_min_kg: string
  peso_max_kg: string
  valor: string
  prazo_dias: number
}

const ROTULOS_REGIAO: Record<Faixa["regiao"], string> = {
  norte: "Norte",
  nordeste: "Nordeste",
  centro_oeste: "Centro-Oeste",
  sudeste: "Sudeste",
  sul: "Sul",
}

export default function FreteFaixasPage() {
  const [faixas, setFaixas] = useState<Faixa[]>([])
  const [carregando, setCarregando] = useState(true)
  const [edicoes, setEdicoes] = useState<Record<string, { valor: string; prazoDias: string }>>({})
  const [salvandoId, setSalvandoId] = useState<string | null>(null)

  const [novaRegiao, setNovaRegiao] = useState<Faixa["regiao"]>("sudeste")
  const [novoPesoMin, setNovoPesoMin] = useState("")
  const [novoPesoMax, setNovoPesoMax] = useState("")
  const [novoValor, setNovoValor] = useState("")
  const [novoPrazo, setNovoPrazo] = useState("7")
  const [erro, setErro] = useState("")

  async function carregar() {
    setCarregando(true)
    const resposta = await fetch("/api/admin/frete-faixas")
    const dados: Faixa[] = await resposta.json()
    setFaixas(dados)
    setEdicoes(
      Object.fromEntries(dados.map((f) => [f.id, { valor: f.valor, prazoDias: String(f.prazo_dias) }]))
    )
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  async function salvarFaixa(id: string) {
    setSalvandoId(id)
    const edicao = edicoes[id]
    await fetch(`/api/admin/frete-faixas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valor: Number(edicao.valor), prazoDias: Number(edicao.prazoDias) }),
    })
    setSalvandoId(null)
    carregar()
  }

  async function excluir(faixa: Faixa) {
    if (!confirm(`Excluir a faixa ${ROTULOS_REGIAO[faixa.regiao]} (${faixa.peso_min_kg}-${faixa.peso_max_kg}kg)?`))
      return
    await fetch(`/api/admin/frete-faixas/${faixa.id}`, { method: "DELETE" })
    carregar()
  }

  async function adicionarFaixa() {
    setErro("")
    const resposta = await fetch("/api/admin/frete-faixas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        regiao: novaRegiao,
        pesoMinKg: Number(novoPesoMin),
        pesoMaxKg: Number(novoPesoMax),
        valor: Number(novoValor),
        prazoDias: Number(novoPrazo),
      }),
    })
    if (!resposta.ok) {
      const dados = await resposta.json()
      setErro(dados.erro || "Erro ao adicionar faixa")
      return
    }
    setNovoPesoMin("")
    setNovoPesoMax("")
    setNovoValor("")
    carregar()
  }

  const porRegiao = faixas.reduce<Record<string, Faixa[]>>((acc, f) => {
    acc[f.regiao] = acc[f.regiao] || []
    acc[f.regiao].push(f)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" nativeButton={false} render={<Link href="/admin/configuracoes" />}>
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Faixas de frete</h1>
          <p className="text-sm text-muted-foreground">
            Valor por regiao e peso, usado no calculo do frete real no checkout. Sem contrato
            com os Correios ainda - ajuste esses valores conforme o custo real de envio.
          </p>
        </div>
      </div>

      {carregando ? (
        <p className="text-sm text-neutral-400">Carregando...</p>
      ) : (
        Object.entries(porRegiao).map(([regiao, lista]) => (
          <Card key={regiao}>
            <CardHeader>
              <CardTitle className="text-sm text-neutral-400">
                {ROTULOS_REGIAO[regiao as Faixa["regiao"]]}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-neutral-800 text-left text-neutral-400">
                      <th className="p-4 font-medium">Peso (kg)</th>
                      <th className="p-4 font-medium">Valor (R$)</th>
                      <th className="p-4 font-medium">Prazo (dias)</th>
                      <th className="p-4 font-medium text-right">Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((faixa) => (
                      <tr key={faixa.id} className="border-b border-neutral-800 last:border-0">
                        <td className="p-4 text-neutral-400">
                          {faixa.peso_min_kg} - {faixa.peso_max_kg}
                        </td>
                        <td className="p-4">
                          <Input
                            type="number"
                            step="0.01"
                            className="w-28"
                            value={edicoes[faixa.id]?.valor ?? faixa.valor}
                            onChange={(e) =>
                              setEdicoes((atual) => ({
                                ...atual,
                                [faixa.id]: { ...atual[faixa.id], valor: e.target.value },
                              }))
                            }
                          />
                        </td>
                        <td className="p-4">
                          <Input
                            type="number"
                            className="w-20"
                            value={edicoes[faixa.id]?.prazoDias ?? String(faixa.prazo_dias)}
                            onChange={(e) =>
                              setEdicoes((atual) => ({
                                ...atual,
                                [faixa.id]: { ...atual[faixa.id], prazoDias: e.target.value },
                              }))
                            }
                          />
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => salvarFaixa(faixa.id)}
                            disabled={salvandoId === faixa.id}
                          >
                            {salvandoId === faixa.id ? "Salvando..." : "Salvar"}
                          </Button>
                          <Button variant="ghost" size="icon-lg" onClick={() => excluir(faixa)}>
                            <Trash2 size={16} className="text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-neutral-400">Adicionar faixa</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-5">
          <div className="space-y-2">
            <Label>Regiao</Label>
            <Select value={novaRegiao} onValueChange={(v) => setNovaRegiao((v as Faixa["regiao"]) || "sudeste")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROTULOS_REGIAO).map(([valor, rotulo]) => (
                  <SelectItem key={valor} value={valor}>
                    {rotulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Peso min (kg)</Label>
            <Input type="number" step="0.001" value={novoPesoMin} onChange={(e) => setNovoPesoMin(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Peso max (kg)</Label>
            <Input type="number" step="0.001" value={novoPesoMax} onChange={(e) => setNovoPesoMax(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Valor (R$)</Label>
            <Input type="number" step="0.01" value={novoValor} onChange={(e) => setNovoValor(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Prazo (dias)</Label>
            <Input type="number" value={novoPrazo} onChange={(e) => setNovoPrazo(e.target.value)} />
          </div>
          {erro && <p className="text-sm text-red-500 sm:col-span-5">{erro}</p>}
          <Button onClick={adicionarFaixa} className="sm:col-span-5 sm:w-fit">
            <Plus size={16} className="mr-2" />
            Adicionar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
