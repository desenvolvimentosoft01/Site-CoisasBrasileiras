"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Trash2, Pencil, Plus, ImagePlus, Star, FilePlus, Save, Eraser, X } from "lucide-react"
import { registrarAuditoria } from "@/lib/auditoria"
import { useConfirmar } from "@/components/admin/confirm-provider"
import { BarraFerramentas } from "@/components/admin/barra-ferramentas"
import { ModalDetalhe } from "@/components/admin/modal-detalhe"

export type Feedback = {
  id: string
  nome: string
  texto: string
  imagem_url: string | null
  nota: number
  ordem: number
  ativo: boolean
}

function SeletorNota({ valor, onChange }: { valor: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} estrelas`}>
          <Star
            size={22}
            className={n <= valor ? "fill-amber-400 text-amber-400" : "text-slate-300"}
          />
        </button>
      ))}
    </div>
  )
}

export function FeedbacksConteudo({ feedbacksIniciais }: { feedbacksIniciais: Feedback[] }) {
  const confirmar = useConfirmar()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(feedbacksIniciais)
  const [aba, setAba] = useState("lista")
  const [editando, setEditando] = useState<Feedback | null>(null)
  const [linhaSelecionada, setLinhaSelecionada] = useState<string | null>(null)
  const [detalhe, setDetalhe] = useState<Feedback | null>(null)

  const [nome, setNome] = useState("")
  const [texto, setTexto] = useState("")
  const [imagemUrl, setImagemUrl] = useState("")
  const [nota, setNota] = useState(5)
  const [ordem, setOrdem] = useState("0")
  const [ativo, setAtivo] = useState(true)
  const [enviandoImagem, setEnviandoImagem] = useState(false)
  const [erro, setErro] = useState("")
  const [salvando, setSalvando] = useState(false)
  const inputArquivoRef = useRef<HTMLInputElement>(null)

  async function recarregar() {
    const resposta = await fetch("/api/admin/feedbacks")
    setFeedbacks(await resposta.json())
  }

  function abrirNovo() {
    setEditando(null)
    setLinhaSelecionada(null)
    setNome("")
    setTexto("")
    setImagemUrl("")
    setNota(5)
    setOrdem(String(feedbacks.length))
    setAtivo(true)
    setErro("")
    setAba("formulario")
  }

  function abrirEdicao(feedback: Feedback) {
    setEditando(feedback)
    setLinhaSelecionada(feedback.id)
    setNome(feedback.nome)
    setTexto(feedback.texto)
    setImagemUrl(feedback.imagem_url ?? "")
    setNota(feedback.nota)
    setOrdem(String(feedback.ordem))
    setAtivo(feedback.ativo)
    setErro("")
    setAba("formulario")
  }

  async function selecionarImagem(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0]
    if (!arquivo) return

    setEnviandoImagem(true)
    const formData = new FormData()
    formData.append("arquivo", arquivo)
    formData.append("pasta", "feedbacks")

    const resposta = await fetch("/api/admin/upload", { method: "POST", body: formData })
    if (resposta.ok) {
      const { url } = await resposta.json()
      setImagemUrl(url)
    }
    setEnviandoImagem(false)
    if (inputArquivoRef.current) inputArquivoRef.current.value = ""
  }

  function limpar() {
    if (editando) {
      setNome(editando.nome)
      setTexto(editando.texto)
      setImagemUrl(editando.imagem_url ?? "")
      setNota(editando.nota)
      setOrdem(String(editando.ordem))
      setAtivo(editando.ativo)
    } else {
      setNome("")
      setTexto("")
      setImagemUrl("")
      setNota(5)
      setOrdem(String(feedbacks.length))
      setAtivo(true)
    }
    setErro("")
  }

  async function salvar() {
    setErro("")
    setSalvando(true)

    const corpo = {
      nome,
      texto,
      imagemUrl: imagemUrl || null,
      nota,
      ordem: Number(ordem) || 0,
      ativo,
    }

    const url = editando ? `/api/admin/feedbacks/${editando.id}` : "/api/admin/feedbacks"
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
      tela: "Feedbacks",
      acao: editando ? "edicao" : "cadastro",
      tabela: "TAB_FEEDBACK",
      registroId: editando?.id ?? salvo.id,
      antes: editando ? { nome: editando.nome, ativo: editando.ativo } : null,
      depois: { nome, ativo },
    })

    setAba("lista")
    recarregar()
  }

  async function excluir(feedback: Feedback) {
    if (!(await confirmar({ descricao: `Excluir o depoimento de "${feedback.nome}"?`, destrutivo: true }))) return
    await fetch(`/api/admin/feedbacks/${feedback.id}`, { method: "DELETE" })
    registrarAuditoria({
      tela: "Feedbacks",
      acao: "exclusao",
      tabela: "TAB_FEEDBACK",
      registroId: feedback.id,
      antes: { nome: feedback.nome },
    })
    setLinhaSelecionada(null)
    recarregar()
  }

  const feedbackSelecionado = feedbacks.find((f) => f.id === linhaSelecionada) ?? null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Feedbacks</h1>

      <Tabs value={aba} onValueChange={(v) => setAba(v as string)}>
        <TabsList>
          <TabsTrigger value="lista">
            <span className="mr-1.5 text-sm leading-none">📋</span>
            Grade
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
                  onClick: () => feedbackSelecionado && abrirEdicao(feedbackSelecionado),
                  disabled: !feedbackSelecionado,
                },
                {
                  label: "Excluir",
                  icon: Trash2,
                  onClick: () => feedbackSelecionado && excluir(feedbackSelecionado),
                  disabled: !feedbackSelecionado,
                  variante: "danger",
                },
              ]}
            />
          </div>

          {feedbacks.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum feedback cadastrado ainda.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {feedbacks.map((feedback) => (
                <Card
                  key={feedback.id}
                  onClick={() =>
                    setLinhaSelecionada((atual) => (atual === feedback.id ? null : feedback.id))
                  }
                  onDoubleClick={() => abrirEdicao(feedback)}
                  className={`cursor-pointer transition-colors ${
                    linhaSelecionada === feedback.id ? "ring-2 ring-amber-400" : ""
                  }`}
                >
                  <CardContent className="space-y-3 pt-6">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100">
                        {feedback.imagem_url && (
                          <Image src={feedback.imagem_url} alt="" fill className="object-cover" sizes="40px" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{feedback.nome}</p>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              size={12}
                              className={n <= feedback.nota ? "fill-amber-400 text-amber-400" : "text-slate-300"}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="line-clamp-3 text-sm text-slate-500">{feedback.texto}</p>
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          feedback.ativo
                            ? "bg-emerald-600/20 text-emerald-400"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {feedback.ativo ? "Ativo" : "Inativo"}
                      </span>
                      <div>
                        <Button
                          variant="ghost"
                          size="icon-lg"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDetalhe(feedback)
                          }}
                        >
                          <span className="text-base leading-none">👁️</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-lg"
                          onClick={(e) => {
                            e.stopPropagation()
                            abrirEdicao(feedback)
                          }}
                        >
                          <span className="text-base leading-none">✏️</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-lg"
                          onClick={(e) => {
                            e.stopPropagation()
                            excluir(feedback)
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
            {editando ? `Editando: ${editando.nome}` : "Novo feedback"}
          </p>
          <div className="overflow-hidden rounded-lg border border-border">
            <BarraFerramentas
              botoes={[
                {
                  label: "Gravar",
                  icon: Save,
                  onClick: salvar,
                  variante: "success",
                  disabled: salvando || !nome.trim() || !texto.trim(),
                },
                { label: "Limpar", icon: Eraser, onClick: limpar, variante: "warning" },
                { label: "Cancelar", icon: X, onClick: () => setAba("lista"), variante: "danger" },
              ]}
            />
          </div>

          <Card className="max-w-lg">
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label>Nome do cliente</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
              </div>
              <div className="space-y-2">
                <Label>Depoimento</Label>
                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  placeholder="Adorei a porcelana, chegou rápido e muito bem embalada..."
                />
              </div>
              <div className="space-y-2">
                <Label>Nota</Label>
                <SeletorNota valor={nota} onChange={setNota} />
              </div>

              <div className="space-y-2">
                <Label>Foto do cliente (opcional)</Label>
                {imagemUrl ? (
                  <div className="relative h-20 w-20 overflow-hidden rounded-full">
                    <Image src={imagemUrl} alt="" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setImagemUrl("")}
                      className="absolute right-0 top-0 rounded-full bg-black/70 p-1 text-white"
                    >
                      <span className="text-xs leading-none">🗑️</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => inputArquivoRef.current?.click()}
                    disabled={enviandoImagem}
                    className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-full border border-dashed border-slate-300 text-slate-500 hover:border-emerald-500 hover:text-emerald-400"
                  >
                    <ImagePlus size={18} />
                    <span className="text-[10px]">{enviandoImagem ? "..." : "Adicionar"}</span>
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
        titulo={detalhe?.nome ?? ""}
        campos={
          detalhe
            ? [
                { label: "Depoimento", valor: detalhe.texto },
                { label: "Nota", valor: `${detalhe.nota} / 5` },
                { label: "Ordem", valor: detalhe.ordem },
                { label: "Status", valor: detalhe.ativo ? "Ativo" : "Inativo" },
              ]
            : []
        }
      />
    </div>
  )
}
