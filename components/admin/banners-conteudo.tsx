"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Trash2, Pencil, ImagePlus, FilePlus, Save, Eraser, X } from "lucide-react"
import { registrarAuditoria } from "@/lib/auditoria"
import { useConfirmar } from "@/components/admin/confirm-provider"
import { BarraFerramentas } from "@/components/admin/barra-ferramentas"
import { ModalDetalhe } from "@/components/admin/modal-detalhe"

export type Banner = {
  id: string
  titulo: string
  subtitulo: string | null
  link: string | null
  imagem_url: string | null
  cor_fundo: string
  ordem: number
  ativo: boolean
  marca: "colorido" | "branco"
}

const CORES = [
  { valor: "from-emerald-700 to-emerald-900", rotulo: "Verde" },
  { valor: "from-amber-700 to-amber-900", rotulo: "Âmbar" },
  { valor: "from-emerald-800 to-teal-900", rotulo: "Verde-azulado" },
  { valor: "from-rose-700 to-rose-900", rotulo: "Rosa" },
  { valor: "from-neutral-700 to-neutral-900", rotulo: "Cinza" },
]

export function BannersConteudo({ bannersIniciais }: { bannersIniciais: Banner[] }) {
  const confirmar = useConfirmar()
  const [banners, setBanners] = useState<Banner[]>(bannersIniciais)
  const [aba, setAba] = useState("lista")
  const [filtroMarca, setFiltroMarca] = useState<"todas" | "colorido" | "branco">("todas")
  const [editando, setEditando] = useState<Banner | null>(null)
  const [linhaSelecionada, setLinhaSelecionada] = useState<string | null>(null)
  const [detalhe, setDetalhe] = useState<Banner | null>(null)

  const [titulo, setTitulo] = useState("")
  const [subtitulo, setSubtitulo] = useState("")
  const [link, setLink] = useState("")
  const [imagemUrl, setImagemUrl] = useState("")
  const [corFundo, setCorFundo] = useState(CORES[0].valor)
  const [ordem, setOrdem] = useState("0")
  const [ativo, setAtivo] = useState(true)
  const [marca, setMarca] = useState<"colorido" | "branco">("colorido")
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
    setLinhaSelecionada(null)
    setTitulo("")
    setSubtitulo("")
    setLink("")
    setImagemUrl("")
    setCorFundo(CORES[0].valor)
    setOrdem(String(banners.length))
    setAtivo(true)
    setMarca(filtroMarca === "todas" ? "colorido" : filtroMarca)
    setErro("")
    setAba("formulario")
  }

  function abrirEdicao(banner: Banner) {
    setEditando(banner)
    setLinhaSelecionada(banner.id)
    setTitulo(banner.titulo)
    setSubtitulo(banner.subtitulo ?? "")
    setLink(banner.link ?? "")
    setImagemUrl(banner.imagem_url ?? "")
    setCorFundo(banner.cor_fundo)
    setOrdem(String(banner.ordem))
    setAtivo(banner.ativo)
    setMarca(banner.marca)
    setErro("")
    setAba("formulario")
  }

  function limpar() {
    if (editando) {
      setTitulo(editando.titulo)
      setSubtitulo(editando.subtitulo ?? "")
      setLink(editando.link ?? "")
      setImagemUrl(editando.imagem_url ?? "")
      setCorFundo(editando.cor_fundo)
      setOrdem(String(editando.ordem))
      setAtivo(editando.ativo)
      setMarca(editando.marca)
    } else {
      setTitulo("")
      setSubtitulo("")
      setLink("")
      setImagemUrl("")
      setCorFundo(CORES[0].valor)
      setOrdem(String(banners.length))
      setAtivo(true)
      setMarca(filtroMarca === "todas" ? "colorido" : filtroMarca)
    }
    setErro("")
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
      marca,
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
    if (!(await confirmar({ descricao: `Excluir o banner "${banner.titulo}"?`, destrutivo: true }))) return
    await fetch(`/api/admin/banners/${banner.id}`, { method: "DELETE" })
    registrarAuditoria({
      tela: "Banners",
      acao: "exclusao",
      tabela: "TAB_BANNER",
      registroId: banner.id,
      antes: { titulo: banner.titulo },
    })
    setLinhaSelecionada(null)
    recarregar()
  }

  const bannerSelecionado = banners.find((b) => b.id === linhaSelecionada) ?? null
  const bannersFiltrados =
    filtroMarca === "todas" ? banners : banners.filter((b) => b.marca === filtroMarca)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Banners</h1>

      <Tabs value={aba} onValueChange={(v) => setAba(v as string)}>
        <TabsList>
          <TabsTrigger value="lista">
            <span className="mr-1.5 text-sm leading-none">📋</span>
            Grade
          </TabsTrigger>
          <TabsTrigger value="formulario">
            <span className="mr-1.5 text-sm leading-none">➕</span>
            Cadastro
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="mt-4 space-y-4">
          <Tabs value={filtroMarca} onValueChange={(v) => setFiltroMarca(v as typeof filtroMarca)}>
            <TabsList>
              <TabsTrigger value="todas">Todos</TabsTrigger>
              <TabsTrigger value="colorido">🎨 Coisas Brasileiras</TabsTrigger>
              <TabsTrigger value="branco">⚪ Porcelanas Brancas</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="overflow-hidden rounded-lg border border-slate-300">
            <BarraFerramentas
              botoes={[
                { label: "Novo", icon: FilePlus, onClick: abrirNovo, variante: "primary" },
                {
                  label: "Editar",
                  icon: Pencil,
                  onClick: () => bannerSelecionado && abrirEdicao(bannerSelecionado),
                  disabled: !bannerSelecionado,
                },
                {
                  label: "Excluir",
                  icon: Trash2,
                  onClick: () => bannerSelecionado && excluir(bannerSelecionado),
                  disabled: !bannerSelecionado,
                  variante: "danger",
                },
              ]}
            />
          </div>

          {bannersFiltrados.length === 0 ? (
            <p className="text-sm text-slate-500">
              {banners.length === 0
                ? "Nenhum banner cadastrado - a home está usando os slides padrão."
                : "Nenhum banner encontrado para essa marca."}
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {bannersFiltrados.map((banner) => (
                <Card
                  key={banner.id}
                  onClick={() =>
                    setLinhaSelecionada((atual) => (atual === banner.id ? null : banner.id))
                  }
                  onDoubleClick={() => abrirEdicao(banner)}
                  className={`cursor-pointer transition-colors ${
                    linhaSelecionada === banner.id ? "ring-2 ring-amber-400" : ""
                  }`}
                >
                  <CardContent className="space-y-3 pt-6">
                    <div
                      className={`relative flex h-28 items-center justify-center rounded-md bg-gradient-to-br px-4 text-center text-sm font-medium text-white ${banner.cor_fundo}`}
                    >
                      {banner.imagem_url && (
                        <Image src={banner.imagem_url} alt="" fill className="rounded-md object-cover opacity-40" />
                      )}
                      <span className="relative flex items-center gap-1.5">
                        <span title={banner.marca === "branco" ? "Porcelanas Brancas" : "Coisas Brasileiras"}>
                          {banner.marca === "branco" ? "⚪" : "🎨"}
                        </span>
                        {banner.titulo}
                      </span>
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
                        <Button
                          variant="ghost"
                          size="icon-lg"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDetalhe(banner)
                          }}
                        >
                          <span className="text-base leading-none">👁️</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-lg"
                          onClick={(e) => {
                            e.stopPropagation()
                            abrirEdicao(banner)
                          }}
                        >
                          <span className="text-base leading-none">✏️</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-lg"
                          onClick={(e) => {
                            e.stopPropagation()
                            excluir(banner)
                          }}
                        >
                          <span className="text-base leading-none">🗑️</span>
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
          <p className="px-1 text-sm font-medium text-muted-foreground">
            {editando ? `Editando: ${editando.titulo}` : "Novo banner"}
          </p>
          <div className="overflow-hidden rounded-lg border border-border">
            <BarraFerramentas
              botoes={[
                { label: "Gravar", icon: Save, onClick: salvar, variante: "success", disabled: salvando || !titulo.trim() },
                { label: "Limpar", icon: Eraser, onClick: limpar, variante: "warning" },
                { label: "Cancelar", icon: X, onClick: () => setAba("lista"), variante: "danger" },
              ]}
            />
          </div>

          <Card className="max-w-lg">
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} autoFocus />
              </div>
              <div className="space-y-2">
                <Label>Subtítulo</Label>
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
                <Label>Cadastrar para o site</Label>
                <div className="flex flex-wrap gap-2">
                  {(["colorido", "branco"] as const).map((opcao) => (
                    <button
                      key={opcao}
                      type="button"
                      onClick={() => setMarca(opcao)}
                      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                        marca === opcao
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-input text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {opcao === "branco" ? "⚪ Porcelanas Brancas" : "🎨 Coisas Brasileiras"}
                    </button>
                  ))}
                </div>
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
                      <span className="text-xs leading-none">🗑️</span>
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

      <ModalDetalhe
        aberto={!!detalhe}
        onOpenChange={(aberto) => !aberto && setDetalhe(null)}
        titulo={detalhe?.titulo ?? ""}
        campos={
          detalhe
            ? [
                { label: "Site", valor: detalhe.marca === "branco" ? "Porcelanas Brancas" : "Coisas Brasileiras" },
                { label: "Subtítulo", valor: detalhe.subtitulo },
                { label: "Link", valor: detalhe.link },
                { label: "Ordem", valor: detalhe.ordem },
                { label: "Status", valor: detalhe.ativo ? "Ativo" : "Inativo" },
              ]
            : []
        }
      />
    </div>
  )
}
