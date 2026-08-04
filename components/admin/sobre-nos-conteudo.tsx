"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Trash2, Pencil, Plus, ImagePlus, List, FilePlus, Save, Eraser, X, Video, Link2, PlayCircle, Eye } from "lucide-react"
import { registrarAuditoria } from "@/lib/auditoria"
import { useConfirmar } from "@/components/admin/confirm-provider"
import { BarraFerramentas } from "@/components/admin/barra-ferramentas"
import { ModalDetalhe } from "@/components/admin/modal-detalhe"

export type SobreNosMidia = {
  id: string
  tipo: "imagem" | "video_link" | "video_arquivo"
  url: string
  legenda: string | null
  ordem: number
}

const TIPOS = [
  { valor: "imagem" as const, rotulo: "Foto", icone: ImagePlus },
  { valor: "video_link" as const, rotulo: "Vídeo (link do YouTube/Vimeo)", icone: Link2 },
  { valor: "video_arquivo" as const, rotulo: "Vídeo (arquivo)", icone: Video },
]

export function SobreNosConteudo({ midiasIniciais }: { midiasIniciais: SobreNosMidia[] }) {
  const confirmar = useConfirmar()
  const [midias, setMidias] = useState<SobreNosMidia[]>(midiasIniciais)
  const [aba, setAba] = useState("lista")
  const [editando, setEditando] = useState<SobreNosMidia | null>(null)
  const [selecionada, setSelecionada] = useState<string | null>(null)
  const [detalhe, setDetalhe] = useState<SobreNosMidia | null>(null)

  const [tipo, setTipo] = useState<SobreNosMidia["tipo"]>("imagem")
  const [url, setUrl] = useState("")
  const [legenda, setLegenda] = useState("")
  const [ordem, setOrdem] = useState("0")
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState("")
  const [salvando, setSalvando] = useState(false)
  const inputArquivoRef = useRef<HTMLInputElement>(null)

  async function recarregar() {
    const resposta = await fetch("/api/admin/sobre-nos-midia")
    setMidias(await resposta.json())
  }

  function abrirNovo() {
    setEditando(null)
    setSelecionada(null)
    setTipo("imagem")
    setUrl("")
    setLegenda("")
    setOrdem(String(midias.length))
    setErro("")
    setAba("formulario")
  }

  function abrirEdicao(midia: SobreNosMidia) {
    setEditando(midia)
    setSelecionada(midia.id)
    setTipo(midia.tipo)
    setUrl(midia.url)
    setLegenda(midia.legenda ?? "")
    setOrdem(String(midia.ordem))
    setErro("")
    setAba("formulario")
  }

  function limpar() {
    if (editando) {
      setTipo(editando.tipo)
      setUrl(editando.url)
      setLegenda(editando.legenda ?? "")
      setOrdem(String(editando.ordem))
    } else {
      setTipo("imagem")
      setUrl("")
      setLegenda("")
      setOrdem(String(midias.length))
    }
    setErro("")
  }

  async function selecionarArquivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0]
    if (!arquivo) return

    setEnviando(true)
    setErro("")
    const formData = new FormData()
    formData.append("arquivo", arquivo)
    formData.append("pasta", "sobre")

    const resposta = await fetch("/api/admin/upload", { method: "POST", body: formData })
    if (resposta.ok) {
      const { url: urlEnviada } = await resposta.json()
      setUrl(urlEnviada)
    } else {
      const dados = await resposta.json().catch(() => null)
      setErro(dados?.erro || "Erro ao enviar arquivo")
    }
    setEnviando(false)
    if (inputArquivoRef.current) inputArquivoRef.current.value = ""
  }

  async function salvar() {
    setErro("")

    if (!url.trim()) {
      setErro(tipo === "video_link" ? "Cole o link do vídeo" : "Envie o arquivo")
      return
    }

    setSalvando(true)

    const corpo = editando
      ? { legenda: legenda || null, ordem: Number(ordem) || 0 }
      : { tipo, url: url.trim(), legenda: legenda || null, ordem: Number(ordem) || 0 }

    const requisicaoUrl = editando ? `/api/admin/sobre-nos-midia/${editando.id}` : "/api/admin/sobre-nos-midia"
    const method = editando ? "PUT" : "POST"

    const resposta = await fetch(requisicaoUrl, {
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
      tela: "Sobre Nós",
      acao: editando ? "edicao" : "cadastro",
      tabela: "TAB_SOBRE_NOS_MIDIA",
      registroId: editando?.id ?? salvo.id,
      antes: editando ? { legenda: editando.legenda, ordem: editando.ordem } : null,
      depois: { tipo, legenda, ordem },
    })

    setAba("lista")
    recarregar()
  }

  async function excluir(midia: SobreNosMidia) {
    if (!(await confirmar({ descricao: `Excluir esse item da galeria "Sobre Nós"?`, destrutivo: true }))) return
    await fetch(`/api/admin/sobre-nos-midia/${midia.id}`, { method: "DELETE" })
    registrarAuditoria({
      tela: "Sobre Nós",
      acao: "exclusao",
      tabela: "TAB_SOBRE_NOS_MIDIA",
      registroId: midia.id,
      antes: { tipo: midia.tipo, url: midia.url },
    })
    setSelecionada(null)
    recarregar()
  }

  const midiaSelecionada = midias.find((m) => m.id === selecionada) ?? null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Sobre Nós - fotos e vídeos</h1>
      <p className="text-sm text-muted-foreground">
        Gerencia a galeria de fotos e vídeos mostrada na página /sobre do site. O texto da página
        continua em Configurações &gt; Páginas.
      </p>

      <Tabs value={aba} onValueChange={(v) => setAba(v as string)}>
        <TabsList>
          <TabsTrigger value="lista">
            <List size={14} className="mr-1.5" />
            Galeria
          </TabsTrigger>
          <TabsTrigger value="formulario">
            <Plus size={14} className="mr-1.5" />
            Cadastro
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="mt-4 space-y-4">
          <div className="overflow-hidden rounded-lg border border-slate-300">
            <BarraFerramentas
              botoes={[
                { label: "Novo", icon: FilePlus, onClick: abrirNovo, variante: "primary" },
                {
                  label: "Editar",
                  icon: Pencil,
                  onClick: () => midiaSelecionada && abrirEdicao(midiaSelecionada),
                  disabled: !midiaSelecionada,
                },
                {
                  label: "Excluir",
                  icon: Trash2,
                  onClick: () => midiaSelecionada && excluir(midiaSelecionada),
                  disabled: !midiaSelecionada,
                  variante: "danger",
                },
              ]}
            />
          </div>

          {midias.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma foto ou vídeo cadastrado ainda.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {midias.map((midia) => (
                <Card
                  key={midia.id}
                  onClick={() => setSelecionada((atual) => (atual === midia.id ? null : midia.id))}
                  onDoubleClick={() => abrirEdicao(midia)}
                  className={`cursor-pointer transition-colors ${
                    selecionada === midia.id ? "ring-2 ring-amber-400" : ""
                  }`}
                >
                  <CardContent className="space-y-2 pt-6">
                    <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-md bg-slate-100">
                      {midia.tipo === "imagem" ? (
                        <Image src={midia.url} alt={midia.legenda ?? ""} fill className="object-cover" />
                      ) : (
                        <PlayCircle size={32} className="text-slate-400" />
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">
                        {midia.legenda || TIPOS.find((t) => t.valor === midia.tipo)?.rotulo}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon-lg"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDetalhe(midia)
                        }}
                      >
                        <Eye size={16} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="formulario" className="mt-4 space-y-4">
          <p className="px-1 text-sm font-medium text-muted-foreground">
            {editando ? "Editando item" : "Novo item da galeria"}
          </p>
          <div className="overflow-hidden rounded-lg border border-border">
            <BarraFerramentas
              botoes={[
                { label: "Gravar", icon: Save, onClick: salvar, variante: "success", disabled: salvando || !url.trim() },
                { label: "Limpar", icon: Eraser, onClick: limpar, variante: "warning" },
                { label: "Cancelar", icon: X, onClick: () => setAba("lista"), variante: "danger" },
              ]}
            />
          </div>

          <Card className="max-w-lg">
            <CardContent className="space-y-4 pt-6">
              {!editando && (
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <div className="flex flex-wrap gap-2">
                    {TIPOS.map((t) => (
                      <button
                        key={t.valor}
                        type="button"
                        onClick={() => {
                          setTipo(t.valor)
                          setUrl("")
                        }}
                        className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm ${
                          tipo === t.valor
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-slate-300 text-slate-600"
                        }`}
                      >
                        <t.icone size={14} />
                        {t.rotulo}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tipo === "video_link" ? (
                <div className="space-y-2">
                  <Label>Link do vídeo</Label>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    disabled={!!editando}
                  />
                  <p className="text-xs text-slate-400">Aceita link do YouTube, Vimeo ou Instagram.</p>
                </div>
              ) : (
                !editando && (
                  <div className="space-y-2">
                    <Label>{tipo === "imagem" ? "Foto" : "Arquivo de vídeo"}</Label>
                    {url ? (
                      <div className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-md bg-slate-100">
                        {tipo === "imagem" ? (
                          <Image src={url} alt="" fill className="object-cover" />
                        ) : (
                          <PlayCircle size={32} className="text-slate-400" />
                        )}
                        <button
                          type="button"
                          onClick={() => setUrl("")}
                          className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => inputArquivoRef.current?.click()}
                        disabled={enviando}
                        className="flex h-32 w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-slate-300 text-slate-500 hover:border-emerald-500 hover:text-emerald-400"
                      >
                        {tipo === "imagem" ? <ImagePlus size={20} /> : <Video size={20} />}
                        <span className="text-xs">{enviando ? "Enviando..." : "Selecionar arquivo"}</span>
                      </button>
                    )}
                    <input
                      ref={inputArquivoRef}
                      type="file"
                      accept={tipo === "imagem" ? "image/*" : "video/*"}
                      className="hidden"
                      onChange={selecionarArquivo}
                    />
                    {tipo === "video_arquivo" && (
                      <p className="text-xs text-slate-400">Vídeo até 50MB (mp4, webm ou mov).</p>
                    )}
                  </div>
                )
              )}

              {editando && (
                <p className="text-xs text-slate-400">
                  Pra trocar a foto/vídeo em si, exclua este item e adicione um novo.
                </p>
              )}

              <div className="space-y-2">
                <Label>Legenda (opcional)</Label>
                <Input value={legenda} onChange={(e) => setLegenda(e.target.value)} placeholder="Nossa loja física" />
              </div>

              <div className="space-y-2">
                <Label>Ordem</Label>
                <Input type="number" value={ordem} onChange={(e) => setOrdem(e.target.value)} className="max-w-32" />
              </div>

              {erro && <p className="text-sm text-red-500">{erro}</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ModalDetalhe
        aberto={!!detalhe}
        onOpenChange={(aberto) => !aberto && setDetalhe(null)}
        titulo={detalhe?.legenda || (detalhe ? TIPOS.find((t) => t.valor === detalhe.tipo)?.rotulo : "") || ""}
        campos={
          detalhe
            ? [
                { label: "Tipo", valor: TIPOS.find((t) => t.valor === detalhe.tipo)?.rotulo },
                { label: "Ordem", valor: detalhe.ordem },
              ]
            : []
        }
      />
    </div>
  )
}
