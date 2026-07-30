"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CampoDica } from "@/components/ui/campo-dica"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { mascaraMoeda, valorMoedaParaNumero, mascaraTelefone, mascaraCEP } from "@/lib/mascaras"
import { Phone, Truck, Megaphone, Palette, Plug, Percent, KeyRound, Check, FileText } from "lucide-react"

export type ConfiguracoesIniciais = {
  whatsapp: string
  whatsapp_mensagem: string
  instagram: string
  email_contato: string
  endereco_contato: string
  cep_origem: string
  frete_valor_base: string
  frete_gratis_acima_de: string
  banner_texto_topo: string
  nome_loja: string
  cor_primaria: string
  texto_rodape: string
  logo_url: string
  clube_valor_mensalidade: string
  texto_sobre_nos: string
}

export function ConfiguracoesConteudo({
  configuracoesIniciais,
}: {
  configuracoesIniciais: ConfiguracoesIniciais
}) {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Carregando...</p>}>
      <ConfiguracoesFormulario configuracoesIniciais={configuracoesIniciais} />
    </Suspense>
  )
}

function ConfiguracoesFormulario({
  configuracoesIniciais,
}: {
  configuracoesIniciais: ConfiguracoesIniciais
}) {
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  const [whatsapp, setWhatsapp] = useState(
    configuracoesIniciais.whatsapp ? mascaraTelefone(configuracoesIniciais.whatsapp) : ""
  )
  const [whatsappMensagem, setWhatsappMensagem] = useState(configuracoesIniciais.whatsapp_mensagem)
  const [instagram, setInstagram] = useState(configuracoesIniciais.instagram)
  const [emailContato, setEmailContato] = useState(configuracoesIniciais.email_contato)
  const [enderecoContato, setEnderecoContato] = useState(configuracoesIniciais.endereco_contato)
  const [textoSobreNos, setTextoSobreNos] = useState(configuracoesIniciais.texto_sobre_nos)
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

  const [clubeMensalidade, setClubeMensalidade] = useState(
    configuracoesIniciais.clube_valor_mensalidade
      ? mascaraMoeda(String(Math.round(Number(configuracoesIniciais.clube_valor_mensalidade) * 100)))
      : ""
  )

  // Segredos (Frenet, Mercado Pago, Email) - carregados a parte, nunca vem
  // no ConfiguracoesIniciais (evita misturar dado sensivel com config geral).
  const [segredosStatus, setSegredosStatus] = useState<Record<string, boolean>>({})
  const [frenetToken, setFrenetToken] = useState("")
  const [mpAccessToken, setMpAccessToken] = useState("")
  const [mpWebhookSecret, setMpWebhookSecret] = useState("")
  const [emailUser, setEmailUser] = useState("")
  const [emailPass, setEmailPass] = useState("")
  const [emailNotificacoesAdmin, setEmailNotificacoesAdmin] = useState("")
  const [salvandoSegredos, setSalvandoSegredos] = useState(false)
  const [segredosSalvos, setSegredosSalvos] = useState(false)

  useEffect(() => {
    fetch("/api/admin/segredos")
      .then((r) => (r.ok ? r.json() : null))
      .then((dados) => {
        if (!dados) return
        setSegredosStatus(
          Object.fromEntries(Object.entries(dados).map(([chave, info]: [string, any]) => [chave, info.configurado]))
        )
        setEmailUser(dados.email_user?.valor || "")
        setEmailNotificacoesAdmin(dados.email_notificacoes_admin?.valor || "")
      })
  }, [])

  async function salvarSegredos() {
    setSalvandoSegredos(true)
    setSegredosSalvos(false)

    await fetch("/api/admin/segredos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        frenet_token: frenetToken,
        mercadopago_access_token: mpAccessToken,
        mercadopago_webhook_secret: mpWebhookSecret,
        email_user: emailUser,
        email_pass: emailPass,
        email_notificacoes_admin: emailNotificacoesAdmin,
      }),
    })

    setSalvandoSegredos(false)
    setSegredosSalvos(true)
    setFrenetToken("")
    setMpAccessToken("")
    setMpWebhookSecret("")
    setEmailPass("")
    setTimeout(() => setSegredosSalvos(false), 2500)

    const resposta = await fetch("/api/admin/segredos")
    if (resposta.ok) {
      const dados = await resposta.json()
      setSegredosStatus(
        Object.fromEntries(Object.entries(dados).map(([chave, info]: [string, any]) => [chave, info.configurado]))
      )
    }
  }

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
        endereco_contato: enderecoContato,
        texto_sobre_nos: textoSobreNos,
        cep_origem: cepOrigem.replace(/\D/g, ""),
        frete_valor_base: String(valorMoedaParaNumero(freteValorBase)),
        frete_gratis_acima_de: String(valorMoedaParaNumero(freteGratisAcimaDe)),
        banner_texto_topo: bannerTextoTopo,
        nome_loja: nomeLoja,
        cor_primaria: corPrimaria,
        texto_rodape: textoRodape,
        logo_url: logoUrl,
        clube_valor_mensalidade: String(valorMoedaParaNumero(clubeMensalidade || "0,00")),
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
            <TabsTrigger value="paginas">
              <FileText size={14} className="mr-1.5" />
              Paginas
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
              Clube
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
                <div className="space-y-2">
                  <Label>Endereco</Label>
                  <Input
                    value={enderecoContato}
                    onChange={(e) => setEnderecoContato(e.target.value)}
                    placeholder="Rua Exemplo, 123 - Bairro, Cidade - UF"
                  />
                  <p className="text-xs text-slate-400">Mostrado na pagina de Contato do site.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paginas" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-slate-500">Pagina "Sobre Nos"</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label>Texto da pagina</Label>
                <textarea
                  value={textoSobreNos}
                  onChange={(e) => setTextoSobreNos(e.target.value)}
                  rows={10}
                  placeholder="Conte a historia da loja, missao, valores etc."
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                />
                <p className="text-xs text-slate-400">
                  Mostrado na pagina /sobre do site. Use linhas em branco pra separar paragrafos.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="frete" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-slate-500">Frete</CardTitle>
              </CardHeader>
              <CardContent className="grid items-start gap-4 sm:grid-cols-2">
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
                    Necessario so se for usar cotacao real de frete (Frenet). Preenchido +
                    token configurado no ambiente, o frete passa a ser calculado automaticamente
                    pela transportadora real em vez da tabela abaixo.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>
                    Valor base / fallback (R$)
                    <CampoDica>Usado so quando nao ha faixa de peso/regiao cadastrada pro estado do cliente.</CampoDica>
                  </Label>
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
                <CardTitle className="text-sm text-slate-500">Clube (assinatura mensal)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label>Valor da mensalidade (R$)</Label>
                <Input
                  inputMode="numeric"
                  value={clubeMensalidade}
                  onChange={(e) => setClubeMensalidade(mascaraMoeda(e.target.value))}
                  placeholder="0,00"
                  className="max-w-48"
                />
                <p className="text-xs text-muted-foreground">
                  Cobrada automaticamente todo mes via Mercado Pago enquanto a assinatura
                  estiver ativa. Produtos com "Preco do Clube" preenchido (no cadastro de
                  produto) mostram esse preco so pra quem tem assinatura ativa.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integracoes" className="mt-4">
            <Tabs defaultValue="mercadopago">
              <TabsList>
                <TabsTrigger value="mercadopago">Mercado Pago</TabsTrigger>
                <TabsTrigger value="frenet">Frenet</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
              </TabsList>

              <TabsContent value="mercadopago" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm text-slate-500">
                      <KeyRound size={16} />
                      Mercado Pago
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                      Token guardado de forma isolada, nunca aparece em nenhuma tela ou resposta
                      de API - so mostramos se ja esta "configurado". Deixe em branco pra nao
                      mexer no que ja esta salvo.
                    </p>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        Token de acesso (producao)
                        {segredosStatus.mercadopago_access_token && (
                          <span className="flex items-center gap-1 text-xs text-emerald-500">
                            <Check size={12} /> configurado
                          </span>
                        )}
                      </Label>
                      <Input
                        type="password"
                        value={mpAccessToken}
                        onChange={(e) => setMpAccessToken(e.target.value)}
                        placeholder={
                          segredosStatus.mercadopago_access_token
                            ? "•••••••• (deixe em branco pra manter)"
                            : "Colar access token"
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        Assinatura secreta do webhook
                        {segredosStatus.mercadopago_webhook_secret && (
                          <span className="flex items-center gap-1 text-xs text-emerald-500">
                            <Check size={12} /> configurado
                          </span>
                        )}
                        <CampoDica>
                          Painel do Mercado Pago &gt; sua aplicacao &gt; Webhooks &gt; "Assinatura secreta" (so
                          existe depois de configurar a URL do webhook la). Sem isso, o webhook ainda funciona,
                          mas sem validar se a notificacao realmente veio do Mercado Pago.
                        </CampoDica>
                      </Label>
                      <Input
                        type="password"
                        value={mpWebhookSecret}
                        onChange={(e) => setMpWebhookSecret(e.target.value)}
                        placeholder={
                          segredosStatus.mercadopago_webhook_secret
                            ? "•••••••• (deixe em branco pra manter)"
                            : "Colar assinatura secreta"
                        }
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Button type="button" onClick={salvarSegredos} disabled={salvandoSegredos}>
                        {salvandoSegredos ? "Salvando..." : "Salvar"}
                      </Button>
                      {segredosSalvos && <span className="text-sm text-emerald-500">Salvo!</span>}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="frenet" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm text-slate-500">
                      <KeyRound size={16} />
                      Frenet (frete)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                      Usado pra cotacao real de frete no checkout e validacao de rastreio. Sem
                      isso configurado, o frete cai na tabela de faixas por regiao.
                    </p>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        Token
                        {segredosStatus.frenet_token && (
                          <span className="flex items-center gap-1 text-xs text-emerald-500">
                            <Check size={12} /> configurado
                          </span>
                        )}
                      </Label>
                      <Input
                        type="password"
                        value={frenetToken}
                        onChange={(e) => setFrenetToken(e.target.value)}
                        placeholder={
                          segredosStatus.frenet_token ? "•••••••• (deixe em branco pra manter)" : "Colar token"
                        }
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Button type="button" onClick={salvarSegredos} disabled={salvandoSegredos}>
                        {salvandoSegredos ? "Salvando..." : "Salvar"}
                      </Button>
                      {segredosSalvos && <span className="text-sm text-emerald-500">Salvo!</span>}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="email" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm text-slate-500">
                      <KeyRound size={16} />
                      Email (Gmail, envio de notificacoes)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid items-start gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>E-mail remetente</Label>
                        <Input
                          type="email"
                          value={emailUser}
                          onChange={(e) => setEmailUser(e.target.value)}
                          placeholder="loja@gmail.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1.5">
                          Senha de app
                          {segredosStatus.email_pass && (
                            <span className="flex items-center gap-1 text-xs text-emerald-500">
                              <Check size={12} /> configurado
                            </span>
                          )}
                        </Label>
                        <Input
                          type="password"
                          value={emailPass}
                          onChange={(e) => setEmailPass(e.target.value)}
                          placeholder={
                            segredosStatus.email_pass ? "•••••••• (deixe em branco pra manter)" : "Senha de app do Gmail"
                          }
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>E-mail pra receber notificacoes internas (opcional)</Label>
                        <Input
                          type="email"
                          value={emailNotificacoesAdmin}
                          onChange={(e) => setEmailNotificacoesAdmin(e.target.value)}
                          placeholder="Vazio usa o proprio e-mail remetente acima"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button type="button" onClick={salvarSegredos} disabled={salvandoSegredos}>
                        {salvandoSegredos ? "Salvando..." : "Salvar"}
                      </Button>
                      {segredosSalvos && <span className="text-sm text-emerald-500">Salvo!</span>}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
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
