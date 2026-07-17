"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { mascaraMoeda, valorMoedaParaNumero } from "@/lib/mascaras"

export default function ConfiguracoesPage() {
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  const [whatsapp, setWhatsapp] = useState("")
  const [instagram, setInstagram] = useState("")
  const [emailContato, setEmailContato] = useState("")
  const [freteValorBase, setFreteValorBase] = useState("")
  const [freteGratisAcimaDe, setFreteGratisAcimaDe] = useState("")
  const [bannerTextoTopo, setBannerTextoTopo] = useState("")

  useEffect(() => {
    fetch("/api/admin/configuracoes")
      .then((r) => r.json())
      .then((dados) => {
        setWhatsapp(dados.whatsapp || "")
        setInstagram(dados.instagram || "")
        setEmailContato(dados.email_contato || "")
        setFreteValorBase(dados.frete_valor_base ? mascaraMoeda(String(Math.round(Number(dados.frete_valor_base) * 100))) : "")
        setFreteGratisAcimaDe(dados.frete_gratis_acima_de ? mascaraMoeda(String(Math.round(Number(dados.frete_gratis_acima_de) * 100))) : "")
        setBannerTextoTopo(dados.banner_texto_topo || "")
        setCarregando(false)
      })
  }, [])

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault()
    setSalvando(true)
    setSalvo(false)

    await fetch("/api/admin/configuracoes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        whatsapp,
        instagram,
        email_contato: emailContato,
        frete_valor_base: String(valorMoedaParaNumero(freteValorBase)),
        frete_gratis_acima_de: String(valorMoedaParaNumero(freteGratisAcimaDe)),
        banner_texto_topo: bannerTextoTopo,
      }),
    })

    setSalvando(false)
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2000)
  }

  if (carregando) {
    return <p className="text-sm text-neutral-400">Carregando...</p>
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Configuracoes da loja</h1>

      <form onSubmit={salvar} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-neutral-400">Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@coisasbrasileiras"
              />
            </div>
            <div className="space-y-2">
              <Label>Email de contato</Label>
              <Input
                type="email"
                value={emailContato}
                onChange={(e) => setEmailContato(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-neutral-400">Frete</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Valor base (R$)</Label>
              <Input
                inputMode="numeric"
                value={freteValorBase}
                onChange={(e) => setFreteValorBase(mascaraMoeda(e.target.value))}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label>Frete gratis acima de (R$)</Label>
              <Input
                inputMode="numeric"
                value={freteGratisAcimaDe}
                onChange={(e) => setFreteGratisAcimaDe(mascaraMoeda(e.target.value))}
                placeholder="0,00"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-neutral-400">Faixa de anuncio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label>Texto no topo do site</Label>
            <Input
              value={bannerTextoTopo}
              onChange={(e) => setBannerTextoTopo(e.target.value)}
              placeholder="Ex: Ganhe 10% off na primeira compra com o cupom BEMVINDO10"
            />
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar configuracoes"}
          </Button>
          {salvo && <span className="text-sm text-emerald-500">Salvo!</span>}
        </div>
      </form>
    </div>
  )
}
