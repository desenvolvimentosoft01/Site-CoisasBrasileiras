"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImagePlus, X } from "lucide-react"
import { mascaraMoeda, valorMoedaParaNumero } from "@/lib/mascaras"
import { registrarAuditoria } from "@/lib/auditoria"

type Categoria = { id: string; nome: string; categoria_pai_id: string | null }

type ProdutoExistente = {
  id: string
  nome: string
  descricao: string | null
  preco: string
  preco_promocional: string | null
  custo: string
  estoque: number
  estoque_minimo: number
  ativo: boolean
  sku: string | null
  ncm: string | null
  peso_kg: string | null
  altura_cm: string | null
  largura_cm: string | null
  comprimento_cm: string | null
  categoriaIds: string[]
  imagens: { url: string }[]
}

export function ProdutoForm({
  produto,
  onSalvo,
  onCancelar,
}: {
  produto?: ProdutoExistente
  onSalvo: () => void
  onCancelar: () => void
}) {
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<Categoria[]>([])

  const [nome, setNome] = useState(produto?.nome ?? "")
  const [descricao, setDescricao] = useState(produto?.descricao ?? "")
  const [preco, setPreco] = useState(produto ? mascaraMoeda(String(Math.round(Number(produto.preco) * 100))) : "")
  const [precoPromocional, setPrecoPromocional] = useState(
    produto?.preco_promocional
      ? mascaraMoeda(String(Math.round(Number(produto.preco_promocional) * 100)))
      : ""
  )
  const [estoque, setEstoque] = useState(String(produto?.estoque ?? 0))
  const [estoqueMinimo, setEstoqueMinimo] = useState(String(produto?.estoque_minimo ?? 0))
  const [ativo, setAtivo] = useState(produto?.ativo ?? true)
  const [sku, setSku] = useState(produto?.sku ?? "")
  const [ncm, setNcm] = useState(produto?.ncm ?? "")
  const [pesoKg, setPesoKg] = useState(produto?.peso_kg ?? "")
  const [alturaCm, setAlturaCm] = useState(produto?.altura_cm ?? "")
  const [larguraCm, setLarguraCm] = useState(produto?.largura_cm ?? "")
  const [comprimentoCm, setComprimentoCm] = useState(produto?.comprimento_cm ?? "")
  const [categoriaIds, setCategoriaIds] = useState<string[]>(produto?.categoriaIds ?? [])
  const [imagensUrls, setImagensUrls] = useState<string[]>(
    produto?.imagens.map((i) => i.url) ?? []
  )
  const [enviandoImagem, setEnviandoImagem] = useState(false)
  const [erro, setErro] = useState("")
  const [salvando, setSalvando] = useState(false)
  const inputArquivoRef = useRef<HTMLInputElement>(null)

  async function selecionarImagens(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = evento.target.files
    if (!arquivos || arquivos.length === 0) return

    setErro("")
    setEnviandoImagem(true)

    for (const arquivo of Array.from(arquivos)) {
      const formData = new FormData()
      formData.append("arquivo", arquivo)

      const resposta = await fetch("/api/admin/upload", { method: "POST", body: formData })

      if (!resposta.ok) {
        const dados = await resposta.json()
        setErro(dados.erro || "Erro ao enviar imagem")
        continue
      }

      const { url } = await resposta.json()
      setImagensUrls((atual) => [...atual, url])
    }

    setEnviandoImagem(false)
    if (inputArquivoRef.current) inputArquivoRef.current.value = ""
  }

  function removerImagem(url: string) {
    setImagensUrls((atual) => atual.filter((u) => u !== url))
  }

  useEffect(() => {
    fetch("/api/admin/categorias")
      .then((r) => r.json())
      .then(setCategoriasDisponiveis)
  }, [])

  function alternarCategoria(id: string) {
    setCategoriaIds((atual) =>
      atual.includes(id) ? atual.filter((c) => c !== id) : [...atual, id]
    )
  }

  async function salvar() {
    setErro("")

    if (!nome.trim() || !preco) {
      setErro("Nome e preco sao obrigatorios")
      return
    }

    setSalvando(true)

    const corpo = {
      nome,
      descricao: descricao || null,
      preco: valorMoedaParaNumero(preco),
      precoPromocional: precoPromocional ? valorMoedaParaNumero(precoPromocional) : null,
      estoque: Number(estoque) || 0,
      estoqueMinimo: Number(estoqueMinimo) || 0,
      ativo,
      sku: sku || null,
      ncm: ncm || null,
      pesoKg: pesoKg ? Number(pesoKg) : null,
      alturaCm: alturaCm ? Number(alturaCm) : null,
      larguraCm: larguraCm ? Number(larguraCm) : null,
      comprimentoCm: comprimentoCm ? Number(comprimentoCm) : null,
      categoriaIds,
      imagensUrls,
    }

    const url = produto ? `/api/admin/produtos/${produto.id}` : "/api/admin/produtos"
    const method = produto ? "PUT" : "POST"

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
      tela: "Produtos",
      acao: produto ? "edicao" : "cadastro",
      tabela: "TAB_PRODUTO",
      registroId: produto?.id ?? salvo.id,
      antes: produto
        ? { nome: produto.nome, preco: produto.preco, estoque: produto.estoque, ativo: produto.ativo }
        : null,
      depois: { nome, preco: corpo.preco, estoque: corpo.estoque, ativo },
    })

    onSalvo()
  }

  return (
    <div className="w-full space-y-6">
      {/* Barra de acoes no topo do formulario. Nao e sticky de proposito -
          rola junto com o conteudo, igual as demais telas de cadastro do admin
          (Categorias, Cupons etc). Uma barra grudada aqui cobria o rotulo do
          primeiro campo (Nome/SKU) ao rolar. */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
        <span className="text-sm font-medium text-muted-foreground">
          {produto ? `Editando: ${produto.nome}` : "Novo produto"}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancelar}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      {erro && <p className="text-sm text-red-500">{erro}</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Dados do produto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Nome</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>SKU / codigo interno</Label>
                <Input
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
              <div className="space-y-2">
                <Label>NCM (fiscal)</Label>
                <Input
                  value={ncm}
                  onChange={(e) => setNcm(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder="Opcional"
                  inputMode="numeric"
                />
                <p className="text-xs text-muted-foreground">
                  Enviado na nota fiscal quando emitida pelo Bling.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descricao</Label>
              <textarea
                className="min-h-24 w-full rounded-md border border-input bg-transparent p-3 text-sm"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <Label>Preco (R$)</Label>
                <Input
                  inputMode="numeric"
                  value={preco}
                  onChange={(e) => setPreco(mascaraMoeda(e.target.value))}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label>Preco promocional (R$)</Label>
                <Input
                  inputMode="numeric"
                  value={precoPromocional}
                  onChange={(e) => setPrecoPromocional(mascaraMoeda(e.target.value))}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label>Estoque</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={estoque}
                  onChange={(e) => setEstoque(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Estoque minimo</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={estoqueMinimo}
                  onChange={(e) => setEstoqueMinimo(e.target.value)}
                />
              </div>
            </div>

            {produto && Number(produto.custo) > 0 && (
              <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
                <span className="text-muted-foreground">
                  Custo medio atual:{" "}
                  <span className="font-medium text-foreground">
                    {Number(produto.custo).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </span>
                {valorMoedaParaNumero(preco) > 0 && (
                  <span className="text-muted-foreground">
                    Margem:{" "}
                    <span className="font-medium text-foreground">
                      {(
                        ((valorMoedaParaNumero(preco) - Number(produto.custo)) / valorMoedaParaNumero(preco)) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  (atualizado automaticamente ao receber uma compra em Compras &gt; Fornecedores)
                </span>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-muted-foreground">
                Peso e dimensoes (para calculo de frete)
              </Label>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="space-y-2">
                  <Label className="text-xs">Peso (kg)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={pesoKg}
                    onChange={(e) => setPesoKg(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Altura (cm)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={alturaCm}
                    onChange={(e) => setAlturaCm(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Largura (cm)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={larguraCm}
                    onChange={(e) => setLarguraCm(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Comprimento (cm)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={comprimentoCm}
                    onChange={(e) => setComprimentoCm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Categorias</Label>
              <div className="flex flex-wrap gap-2">
                {categoriasDisponiveis.map((categoria) => {
                  const pai = categoriasDisponiveis.find((c) => c.id === categoria.categoria_pai_id)
                  return (
                    <button
                      key={categoria.id}
                      type="button"
                      onClick={() => alternarCategoria(categoria.id)}
                      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                        categoriaIds.includes(categoria.id)
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-input text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {pai ? `${pai.nome} › ${categoria.nome}` : categoria.nome}
                    </button>
                  )
                })}
                {categoriasDisponiveis.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma categoria cadastrada ainda.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label>Produto ativo no site</Label>
                <Switch checked={ativo} onCheckedChange={setAtivo} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Imagens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {imagensUrls.map((url) => (
                  <div
                    key={url}
                    className="group relative h-24 w-24 overflow-hidden rounded-md border border-input"
                  >
                    <Image src={url} alt="" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removerImagem(url)}
                      className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Remover imagem"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => inputArquivoRef.current?.click()}
                  disabled={enviandoImagem}
                  className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-input text-muted-foreground hover:border-primary hover:text-primary"
                >
                  <ImagePlus size={20} />
                  <span className="text-xs">{enviandoImagem ? "Enviando..." : "Adicionar"}</span>
                </button>
              </div>

              {/* capture="environment" abre a camera direto no celular; em desktop so abre o seletor de arquivo normal */}
              <input
                ref={inputArquivoRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={selecionarImagens}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
