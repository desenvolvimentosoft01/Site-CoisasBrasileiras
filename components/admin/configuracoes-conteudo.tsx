"use client"

import { Suspense, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { mascaraMoeda, valorMoedaParaNumero, mascaraTelefone, mascaraCEP } from "@/lib/mascaras"
import { Phone, Truck, Megaphone, Palette, Plug, Percent } from "lucide-react"

export type ConfiguracoesIniciais = {
  whatsapp: string
  whatsapp_mensagem: string
  instagram: string
  email_contato: string
  cep_origem: string
  frete_valor_base: string
  frete_gratis_acima_de: string
  banner_texto_topo: string
  nome_loja: string
  cor_primaria: string
  texto_rodape: string
  logo_url: string
  taxa_mercadopago_percentual: string
  taxa_mercadopago_fixo: string
  taxa_pagbank_percentual: string
  taxa_pagbank_fixo: string
  aliquota_imposto_percentual: string
}

export type BlingStatus = { conectado: boolean; expiraEm: string | null } | null

export function ConfiguracoesConteudo({
  configuracoesIniciais,
  blingStatus,
}: {
  configuracoesIniciais: ConfiguracoesIniciais
  blingStatus: BlingStatus
}) {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Carregando...</p>}>
      <ConfiguracoesFormulario configuracoesIniciais={configuracoesIniciais} blingStatus={blingStatus} />
    </Suspense>
  )
}

function ConfiguracoesFormulario({
  configuracoesIniciais,
  blingStatus,
}: {
  configuracoesIniciais: ConfiguracoesIniciais
  blingStatus: BlingStatus
}) {
  const searchParams = useSearchParams()
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  const [whatsapp, setWhatsapp] = useState(
    configuracoesIniciais.whatsapp ? mascaraTelefone(configuracoesIniciais.whatsapp) : ""
  )
  const [whatsappMensagem, setWhatsappMensagem] = useState(configuracoesIniciais.whatsapp_mensagem)
  const [instagram, setInstagram] = useState(configuracoesIniciais.instagram)
  const [emailContato, setEmailContato] = useState(configuracoesIniciais.email_contato)
  const [cepOrigem, setCepOrigem] = useState(
    configuracoesIniciais.cep_origem ? mascaraCEP(configuracoesIniciais.cep_origem) : ""
  )
  const [freteValorBase, setFreteValorBase] = useState(
    configuracoesIniciais.frete_valor_base
      ? mascaraMoeda(String(Math.round(Number(configuracoesIniciais.frete_valor_base) * 100)))
      : ""
  )
  const [freteGratisAcimaDe, setFreteGratisAcimaDe] = useState(
    configuracoesIniciais.frete_gratis_acima_de
      ? mascaraMoeda(String(Math.round(Number(configuracoesIniciais.frete_gratis_acima_de) * 100)))
      : ""
  )
  const [bannerTextoTopo, setBannerTextoTopo] = useState(configuracoesIniciais.banner_texto_topo)
  const [nomeLoja, setNomeLoja] = useState(configuracoesIniciais.nome_loja)
  const [corPrimaria, setCorPrimaria] = useState(configuracoesIniciais.cor_primaria || "#047857")
  const [textoRodape, setTextoRodape] = useState(configuracoesIniciais.texto_rodape)
  const [logoUrl, setLogoUrl] = useState(configuracoesIniciais.logo_url)
  const [enviandoLogo, setEnviandoLogo] = useState(false)
  const inputLogoRef = useRef<HTMLInputElement>(null)

  const [taxaMpPercentual, setTaxaMpPercentual] = useState(configuracoesIniciais.taxa_mercadopago_percentual)
  const [taxaMpFixo, setTaxaMpFixo] = useState(
    configuracoesIniciais.taxa_mercadopago_fixo
      ? mascaraMoeda(String(Math.round(Number(configuracoesIniciais.taxa_mercadopago_fixo) * 100)))
      : ""
  )
  const [taxaPagbankPercentual, setTaxaPagbankPercentual] = useState(
    configuracoesIniciais.taxa_pagbank_percentual
  )
  const [taxaPagbankFixo, setTaxaPagbankFixo] = useState(
    configuracoesIniciais.taxa_pagbank_fixo
      ? mascaraMoeda(String(Math.round(Number(configuracoesIniciais.taxa_pagbank_fixo) * 100)))
      : ""
  )
  const [aliquotaImposto, setAliquotaImposto] = useState(configuracoesIniciais.aliquota_imposto_percentual)

  const mensagemBling = searchParams.get("bling")

  async function selecionarLogo(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0]
    if (!arquivo) return

    setEnviandoLogo(true)
    const formData = new FormData()
    formData.append("arquivo", arquivo)
    formData.append("pasta", "loja")

    const resposta = await fetch("/api/admin/upload", { method: "POST", body: formData })
    if (resposta.ok) {
      const { url } = await resposta.json()
      setLogoUrl(url)
    }
    setEnviandoLogo(false)
    if (inputLogoRef.current) inputLogoRef.current.value = ""
  }

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault()
    setSalvando(true)
    setSalvo(false)

    await fetch("/api/admin/configuracoes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        whatsapp: whatsapp.replace(/\D/g, ""),
        whatsapp_mensagem: whatsappMensagem,
        instagram,
        email_contato: emailContato,
        cep_origem: cepOrigem.replace(/\D/g, ""),
        frete_valor_base: String(valorMoedaParaNumero(freteValorBase)),
        frete_gratis_acima_de: String(valorMoedaParaNumero(freteGratisAcimaDe)),
        banner_texto_topo: bannerTextoTopo,
        nome_loja: nomeLoja,
        cor_primaria: corPrimaria,
        texto_rodape: textoRodape,
        logo_url: logoUrl,
        taxa_mercadopago_percentual: taxaMpPercentual,
        taxa_mercadopago_fixo: String(valorMoedaParaNumero(taxaMpFixo || "0,00")),
        taxa_pagbank_percentual: taxaPagbankPercentual,
        taxa_pagbank_fixo: String(valorMoedaParaNumero(taxaPagbankFixo || "0,00")),
        aliquota_imposto_percentual: aliquotaImposto,
      }),
    })

    setSalvando(false)
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2000)
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
            <TabsTrigger value="custos">
              <Percent size={14} className="mr-1.5" />
              Custos
            </TabsTrigger>
            <TabsTrigger value="integracoes">
              <Plug size={14} className="mr-1.5" />
              Integracoes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contato" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-slate-500">Contato</CardTitle>
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
                  <Label>Mensagem padrao do WhatsApp</Label>
                  <Input
                    value={whatsappMensagem}
                    onChange={(e) => setWhatsappMensagem(e.target.value)}
                    placeholder="Olá, quero saber mais sobre os seus produtos"
                  />
                  <p className="text-xs text-slate-400">
                    Preenchida automaticamente quando o cliente clica no botao de WhatsApp do site.
                  </p>
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
                <CardTitle className="text-sm text-slate-500">Frete</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>CEP de origem (endereco da loja)</Label>
                  <Input
                    value={cepOrigem}
                    onChange={(e) => setCepOrigem(mascaraCEP(e.target.value))}
                    inputMode="numeric"
                    placeholder="00000-000"
                    className="max-w-40"
                  />
                  <p className="text-xs text-muted-foreground">
                    Necessario so se for usar cotacao real de frete (Melhor Envio). Preenchido +
                    token configurado no ambiente, o frete passa a ser calculado automaticamente
                    pela transportadora real em vez da tabela abaixo.
                  </p>
                </div>
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

            <Card>
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-sm font-medium">Tipos de entrega (venda balcao)</p>
                  <p className="text-xs text-muted-foreground">
                    Retirada na loja, motoboy etc - escolhido ao finalizar uma venda balcao.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link href="/admin/configuracoes/tipos-entrega" />}
                >
                  Gerenciar tipos
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="aparencia" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-slate-500">Aparencia do site</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Logo da loja</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50">
                      {logoUrl ? (
                        <Image src={logoUrl} alt="Logo" width={64} height={64} className="h-full w-full object-contain" />
                      ) : (
                        <Image src="/logo.webp" alt="Logo padrao" width={64} height={64} className="h-full w-full object-contain" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <input
                        ref={inputLogoRef}
                        type="file"
                        accept="image/*"
                        onChange={selecionarLogo}
                        className="hidden"
                        id="upload-logo"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={enviandoLogo}
                        onClick={() => inputLogoRef.current?.click()}
                      >
                        {enviandoLogo ? "Enviando..." : "Trocar logo"}
                      </Button>
                      {logoUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-2"
                          onClick={() => setLogoUrl("")}
                        >
                          Usar padrao
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">
                    Usada no cabecalho e rodape do site e no painel administrativo. Se nao enviar
                    nenhuma, usa a logo padrao do sistema.
                  </p>
                </div>
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
                      className="h-9 w-14 cursor-pointer rounded-md border border-slate-300 bg-transparent"
                    />
                    <Input
                      value={corPrimaria}
                      onChange={(e) => setCorPrimaria(e.target.value)}
                      className="w-32 font-mono"
                    />
                  </div>
                  <p className="text-xs text-slate-400">
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
                <CardTitle className="text-sm text-slate-500">Faixa de anuncio</CardTitle>
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

          <TabsContent value="custos" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-slate-500">Taxas de pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Usadas so pro calculo do relatorio de lucro (nao afetam o valor cobrado do
                  cliente no checkout). Confira a taxa real no painel do gateway - varia por
                  forma de pagamento e volume negociado. Deixe em branco ate a implantacao.
                </p>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Mercado Pago</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Taxa percentual (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={taxaMpPercentual}
                        onChange={(e) => setTaxaMpPercentual(e.target.value)}
                        placeholder="4,99"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Taxa fixa por transacao (R$)</Label>
                      <Input
                        inputMode="numeric"
                        value={taxaMpFixo}
                        onChange={(e) => setTaxaMpFixo(mascaraMoeda(e.target.value))}
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-slate-400">PagBank</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Taxa percentual (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={taxaPagbankPercentual}
                        onChange={(e) => setTaxaPagbankPercentual(e.target.value)}
                        placeholder="3,99"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Taxa fixa por transacao (R$)</Label>
                      <Input
                        inputMode="numeric"
                        value={taxaPagbankFixo}
                        onChange={(e) => setTaxaPagbankFixo(mascaraMoeda(e.target.value))}
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-slate-500">Imposto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label>Aliquota sobre faturamento (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={aliquotaImposto}
                  onChange={(e) => setAliquotaImposto(e.target.value)}
                  placeholder="Ex: 6 (Simples Nacional)"
                  className="max-w-48"
                />
                <p className="text-xs text-muted-foreground">
                  Percentual estimado usado so no relatorio de lucro liquido - confirme a
                  aliquota real com o contador da loja antes de configurar aqui.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integracoes" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-slate-500">Bling (emissao de NF-e)</CardTitle>
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
                  <p className="text-sm text-slate-500">
                    Apenas administradores podem conectar o Bling.
                  </p>
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
