"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { mascaraMoeda, valorMoedaParaNumero, mascaraTelefone } from "@/lib/mascaras"
import { Phone, Truck, Megaphone, Palette, Plug } from "lucide-react"

export default function ConfiguracoesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-400">Carregando...</p>}>
      <ConfiguracoesConteudo />
    </Suspense>
  )
}

function ConfiguracoesConteudo() {
  const searchParams = useSearchParams()
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [blingStatus, setBlingStatus] = useState<{ conectado: boolean; expiraEm: string | null } | null>(
    null
  )

  const [whatsapp, setWhatsapp] = useState("")
  const [instagram, setInstagram] = useState("")
  const [emailContato, setEmailContato] = useState("")
  const [freteValorBase, setFreteValorBase] = useState("")
  const [freteGratisAcimaDe, setFreteGratisAcimaDe] = useState("")
  const [bannerTextoTopo, setBannerTextoTopo] = useState("")
  const [nomeLoja, setNomeLoja] = useState("")
  const [corPrimaria, setCorPrimaria] = useState("#047857")
  const [textoRodape, setTextoRodape] = useState("")

  useEffect(() => {
    fetch("/api/admin/configuracoes")
      .then((r) => r.json())
      .then((dados) => {
        setWhatsapp(dados.whatsapp ? mascaraTelefone(dados.whatsapp) : "")
        setInstagram(dados.instagram || "")
        setEmailContato(dados.email_contato || "")
        setFreteValorBase(dados.frete_valor_base ? mascaraMoeda(String(Math.round(Number(dados.frete_valor_base) * 100))) : "")
        setFreteGratisAcimaDe(dados.frete_gratis_acima_de ? mascaraMoeda(String(Math.round(Number(dados.frete_gratis_acima_de) * 100))) : "")
        setBannerTextoTopo(dados.banner_texto_topo || "")
        setNomeLoja(dados.nome_loja || "")
        setCorPrimaria(dados.cor_primaria || "#047857")
        setTextoRodape(dados.texto_rodape || "")
        setCarregando(false)
      })
  }, [])

  useEffect(() => {
    fetch("/api/admin/bling/status")
      .then((r) => (r.ok ? r.json() : null))
      .then(setBlingStatus)
  }, [])

  const mensagemBling = searchParams.get("bling")

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault()
    setSalvando(true)
    setSalvo(false)

    await fetch("/api/admin/configuracoes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        whatsapp: whatsapp.replace(/\D/g, ""),
        instagram,
        email_contato: emailContato,
        frete_valor_base: String(valorMoedaParaNumero(freteValorBase)),
        frete_gratis_acima_de: String(valorMoedaParaNumero(freteGratisAcimaDe)),
        banner_texto_topo: bannerTextoTopo,
        nome_loja: nomeLoja,
        cor_primaria: corPrimaria,
        texto_rodape: textoRodape,
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
        <Tabs defaultValue="contato">
          <TabsList>
            <TabsTrigger value="contato">
              <Phone size={14} className="mr-1.5" />
              Contato
            </TabsTrigger>
            <TabsTrigger value="frete">
              <Truck size={14} className="mr-1.5" />
              Frete
            </TabsTrigger>
            <TabsTrigger value="aparencia">
              <Palette size={14} className="mr-1.5" />
              Aparencia
            </TabsTrigger>
            <TabsTrigger value="anuncio">
              <Megaphone size={14} className="mr-1.5" />
              Anuncio
            </TabsTrigger>
            <TabsTrigger value="integracoes">
              <Plug size={14} className="mr-1.5" />
              Integracoes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contato" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-neutral-400">Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(mascaraTelefone(e.target.value))}
                    inputMode="tel"
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
          </TabsContent>

          <TabsContent value="frete" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-neutral-400">Frete</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Valor base / fallback (R$)</Label>
                  <Input
                    inputMode="numeric"
                    value={freteValorBase}
                    onChange={(e) => setFreteValorBase(mascaraMoeda(e.target.value))}
                    placeholder="0,00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Usado so quando nao ha faixa de peso/regiao cadastrada pro estado do cliente.
                  </p>
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
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-sm font-medium">Faixas de frete por regiao e peso</p>
                  <p className="text-xs text-muted-foreground">
                    E o que realmente calcula o valor mostrado no checkout do site.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link href="/admin/configuracoes/frete-faixas" />}
                >
                  Gerenciar faixas
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="aparencia" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-neutral-400">Aparencia do site</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome da loja</Label>
                  <Input
                    value={nomeLoja}
                    onChange={(e) => setNomeLoja(e.target.value)}
                    placeholder="Coisas Brasileiras"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cor principal (botoes, links, destaques)</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={corPrimaria}
                      onChange={(e) => setCorPrimaria(e.target.value)}
                      className="h-9 w-14 cursor-pointer rounded-md border border-neutral-700 bg-transparent"
                    />
                    <Input
                      value={corPrimaria}
                      onChange={(e) => setCorPrimaria(e.target.value)}
                      className="w-32 font-mono"
                    />
                  </div>
                  <p className="text-xs text-neutral-500">
                    Usada nos botoes do site, links e destaques de preco. Escolha um tom escuro o
                    suficiente para o texto branco ficar legivel em cima.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Texto do rodape</Label>
                  <Input
                    value={textoRodape}
                    onChange={(e) => setTextoRodape(e.target.value)}
                    placeholder="Uma frase curta sobre a loja"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="anuncio" className="mt-4">
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
          </TabsContent>

          <TabsContent value="integracoes" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-neutral-400">Bling (emissao de NF-e)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  So emite nota fiscal a partir do pedido pago - nao sincroniza estoque nem
                  financeiro com o Bling.
                </p>

                {mensagemBling === "conectado" && (
                  <p className="text-sm text-emerald-500">Bling conectado com sucesso!</p>
                )}
                {mensagemBling === "erro_state" && (
                  <p className="text-sm text-red-500">
                    Nao foi possivel confirmar a conexao (state invalido). Tente novamente.
                  </p>
                )}
                {mensagemBling === "erro_token" && (
                  <p className="text-sm text-red-500">
                    O Bling recusou a conexao. Confira as credenciais (BLING_CLIENT_ID/SECRET) e
                    tente novamente.
                  </p>
                )}

                {blingStatus === null ? (
                  <p className="text-sm text-neutral-400">Carregando status...</p>
                ) : blingStatus.conectado ? (
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-emerald-600/20 px-2 py-1 text-xs text-emerald-400">
                      Conectado
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      nativeButton={false}
                      render={<a href="/api/admin/bling/conectar" />}
                    >
                      Reconectar
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" nativeButton={false} render={<a href="/api/admin/bling/conectar" />}>
                    Conectar com o Bling
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
