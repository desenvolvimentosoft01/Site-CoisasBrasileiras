"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Trash2, Pencil, Plus, ImagePlus, List } from "lucide-react"
import { registrarAuditoria } from "@/lib/auditoria"

export type Banner = {
  id: string
  titulo: string
  subtitulo: string | null
  link: string | null
  imagem_url: string | null
  cor_fundo: string
  ordem: number
  ativo: boolean
}

const CORES = [
  { valor: "from-emerald-700 to-emerald-900", rotulo: "Verde" },
  { valor: "from-amber-700 to-amber-900", rotulo: "Ambar" },
  { valor: "from-emerald-800 to-teal-900", rotulo: "Verde-azulado" },
  { valor: "from-rose-700 to-rose-900", rotulo: "Rosa" },
  { valor: "from-neutral-700 to-neutral-900", rotulo: "Cinza" },
]

export function BannersConteudo({ bannersIniciais }: { bannersIniciais: Banner[] }) {
  const [banners, setBanners] = useState<Banner[]>(bannersIniciais)
  const [aba, setAba] = useState("lista")
  const [editando, setEditando] = useState<Banner | null>(null)

  const [titulo, setTitulo] = useState("")
  const [subtitulo, setSubtitulo] = useState("")
  const [link, setLink] = useState("")
  const [imagemUrl, setImagemUrl] = useState("")
  const [corFundo, setCorFundo] = useState(CORES[0].valor)
  const [ordem, setOrdem] = useState("0")
  const [ativo, setAtivo] = useState(true)
  const [enviandoImagem, setEnviandoImagem] = useState(false)
  const [erro, setErro] = useState("")
  const [salvando, setSalvando] = useState(false)
  const inputArquivoRef = useRef<HTMLInputElement>(null)

  async function recarregar() {
    const resposta = await fetch("/api/admin/banners")
    setBanners(await resposta.json())
  }

  function abrirNovo() {
    setEditando(null)
    setTitulo("")
    setSubtitulo("")
    setLink("")
    setImagemUrl("")
    setCorFundo(CORES[0].valor)
    setOrdem(String(banners.length))
    setAtivo(true)
    setErro("")
    setAba("formulario")
  }

  function abrirEdicao(banner: Banner) {
    setEditando(banner)
    setTitulo(banner.titulo)
    setSubtitulo(banner.subtitulo ?? "")
    setLink(banner.link ?? "")
    setImagemUrl(banner.imagem_url ?? "")
    setCorFundo(banner.cor_fundo)
    setOrdem(String(banner.ordem))
    setAtivo(banner.ativo)
    setErro("")
    setAba("formulario")
  }

  async function selecionarImagem(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0]
    if (!arquivo) return

    setEnviandoImagem(true)
    const formData = new FormData()
    formData.append("arquivo", arquivo)

    const resposta = await fetch("/api/admin/upload", { method: "POST", body: formData })
    if (resposta.ok) {
      const { url } = await resposta.json()
      setImagemUrl(url)
    }
    setEnviandoImagem(false)
    if (inputArquivoRef.current) inputArquivoRef.current.value = ""
  }

  async function salvar() {
    setErro("")
    setSalvando(true)

    const corpo = {
      titulo,
      subtitulo: subtitulo || null,
      link: link || null,
      imagemUrl: imagemUrl || null,
      corFundo,
      ordem: Number(ordem) || 0,
      ativo,
    }

    const url = editando ? `/api/admin/banners/${editando.id}` : "/api/admin/banners"
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

    const salvo = await resposta.json()
    registrarAuditoria({
      tela: "Banners",
      acao: editando ? "edicao" : "cadastro",
      tabela: "TAB_BANNER",
      registroId: editando?.id ?? salvo.id,
      antes: editando ? { titulo: editando.titulo, ativo: editando.ativo } : null,
      depois: { titulo, ativo },
    })

    setAba("lista")
    recarregar()
  }

  async function excluir(banner: Banner) {
    if (!confirm(`Excluir o banner "${banner.titulo}"?`)) return
    await fetch(`/api/admin/banners/${banner.id}`, { method: "DELETE" })
    registrarAuditoria({
      tela: "Banners",
      acao: "exclusao",
      tabela: "TAB_BANNER",
      registroId: banner.id,
      antes: { titulo: banner.titulo },
    })
    recarregar()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Banners</h1>

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
            <Button onClick={abrirNovo}>
              <Plus size={16} className="mr-2" />
              Novo banner
            </Button>
          )}
        </div>

        <TabsContent value="lista" className="mt-4">
          {banners.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nenhum banner cadastrado - a home esta usando os slides padrao.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {banners.map((banner) => (
                <Card key={banner.id}>
                  <CardContent className="space-y-3 pt-6">
                    <div
                      className={`relative flex h-28 items-center justify-center rounded-md bg-gradient-to-br px-4 text-center text-sm font-medium text-white ${banner.cor_fundo}`}
                    >
                      {banner.imagem_url && (
                        <Image src={banner.imagem_url} alt="" fill className="rounded-md object-cover opacity-40" />
                      )}
                      <span className="relative">{banner.titulo}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          banner.ativo
                            ? "bg-emerald-600/20 text-emerald-400"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {banner.ativo ? "Ativo" : "Inativo"}
                      </span>
                      <div>
                        <Button variant="ghost" size="icon-lg" onClick={() => abrirEdicao(banner)}>
                          <Pencil size={16} />
                        </Button>
                        <Button variant="ghost" size="icon-lg" onClick={() => excluir(banner)}>
                          <Trash2 size={16} className="text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="formulario" className="mt-4 space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
            <span className="text-sm font-medium text-muted-foreground">
              {editando ? `Editando: ${editando.titulo}` : "Novo banner"}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAba("lista")}>
                Cancelar
              </Button>
              <Button onClick={salvar} disabled={salvando || !titulo.trim()}>
                {salvando ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>

          <Card className="max-w-lg">
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label>Titulo</Label>
                <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} autoFocus />
              </div>
              <div className="space-y-2">
                <Label>Subtitulo</Label>
                <Input value={subtitulo} onChange={(e) => setSubtitulo(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Link (opcional)</Label>
                <Input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="/produtos?categoria=religiosos"
                />
              </div>

              <div className="space-y-2">
                <Label>Cor de fundo</Label>
                <div className="flex flex-wrap gap-2">
                  {CORES.map((cor) => (
                    <button
                      key={cor.valor}
                      type="button"
                      onClick={() => setCorFundo(cor.valor)}
                      className={`h-8 w-8 rounded-full bg-gradient-to-br ${cor.valor} ${
                        corFundo === cor.valor ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-white" : ""
                      }`}
                      aria-label={cor.rotulo}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Imagem de fundo (opcional)</Label>
                {imagemUrl ? (
                  <div className="relative h-24 w-full overflow-hidden rounded-md">
                    <Image src={imagemUrl} alt="" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setImagemUrl("")}
                      className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => inputArquivoRef.current?.click()}
                    disabled={enviandoImagem}
                    className="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-slate-300 text-slate-500 hover:border-emerald-500 hover:text-emerald-400"
                  >
                    <ImagePlus size={20} />
                    <span className="text-xs">{enviandoImagem ? "Enviando..." : "Adicionar imagem"}</span>
                  </button>
                )}
                <input
                  ref={inputArquivoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={selecionarImagem}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ordem</Label>
                  <Input type="number" value={ordem} onChange={(e) => setOrdem(e.target.value)} />
                </div>
                <div className="flex items-center justify-between pt-6">
                  <Label>Ativo</Label>
                  <Switch checked={ativo} onCheckedChange={setAtivo} />
                </div>
              </div>

              {erro && <p className="text-sm text-red-500">{erro}</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
