"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImagePlus, X, Save, Eraser } from "lucide-react"
import { CampoDica } from "@/components/ui/campo-dica"
import { BarraFerramentas } from "@/components/admin/barra-ferramentas"
import {
  mascaraMoeda,
  valorMoedaParaNumero,
  mascaraNCM,
  somenteDigitos,
  mascaraDecimal,
  decimalParaNumero,
} from "@/lib/mascaras"
import { validarCodigoBarras } from "@/lib/codigo-barras"
import { registrarAuditoria } from "@/lib/auditoria"

type Categoria = { id: string; nome: string; categoria_pai_id: string | null; marca: "colorido" | "branco" }

type ProdutoExistente = {
  id: string
  nome: string
  descricao: string | null
  preco: string
  preco_promocional: string | null
  preco_clube: string | null
  preco_clube_tipo: "fixo" | "percentual"
  custo: string
  estoque: number
  estoque_minimo: number
  ativo: boolean
  marca: "colorido" | "branco"
  sku: string | null
  ncm: string | null
  codigo_barras: string | null
  peso_kg: string | null
  altura_cm: string | null
  largura_cm: string | null
  comprimento_cm: string | null
  categoriaIds: string[]
  imagens: { url: string }[]
}

// Preco fixo usa mascara de moeda (centavos); percentual usa decimal comum
// (0-100), entao a formatacao inicial de "preco_clube" depende do tipo salvo.
function valorClubeInicial(produto?: ProdutoExistente): string {
  if (!produto?.preco_clube) return ""
  if (produto.preco_clube_tipo === "percentual") return produto.preco_clube.replace(".", ",")
  return mascaraMoeda(String(Math.round(Number(produto.preco_clube) * 100)))
}

export function ProdutoForm({
  produto,
  marcaPadrao,
  onSalvo,
  onCancelar,
}: {
  produto?: ProdutoExistente
  marcaPadrao?: "colorido" | "branco"
  onSalvo: () => void
  onCancelar: () => void
}) {
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<Categoria[]>([])
  const [marca, setMarca] = useState<"colorido" | "branco">(produto?.marca ?? marcaPadrao ?? "colorido")

  const [nome, setNome] = useState(produto?.nome ?? "")
  const [descricao, setDescricao] = useState(produto?.descricao ?? "")
  const [preco, setPreco] = useState(produto ? mascaraMoeda(String(Math.round(Number(produto.preco) * 100))) : "")
  const [precoPromocional, setPrecoPromocional] = useState(
    produto?.preco_promocional
      ? mascaraMoeda(String(Math.round(Number(produto.preco_promocional) * 100)))
      : ""
  )
  const [precoClubeTipo, setPrecoClubeTipo] = useState<"fixo" | "percentual">(
    produto?.preco_clube_tipo ?? "fixo"
  )
  const [precoClube, setPrecoClube] = useState(() => valorClubeInicial(produto))
  const [estoque, setEstoque] = useState(String(produto?.estoque ?? 0))
  const [estoqueMinimo, setEstoqueMinimo] = useState(String(produto?.estoque_minimo ?? 0))
  const [ativo, setAtivo] = useState(produto?.ativo ?? true)
  const [sku, setSku] = useState(produto?.sku ?? "")
  const [ncm, setNcm] = useState(produto?.ncm ?? "")
  const [codigoBarras, setCodigoBarras] = useState(produto?.codigo_barras ?? "")
  const [pesoKg, setPesoKg] = useState((produto?.peso_kg ?? "").replace(".", ","))
  const [alturaCm, setAlturaCm] = useState((produto?.altura_cm ?? "").replace(".", ","))
  const [larguraCm, setLarguraCm] = useState((produto?.largura_cm ?? "").replace(".", ","))
  const [comprimentoCm, setComprimentoCm] = useState((produto?.comprimento_cm ?? "").replace(".", ","))
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

  // Categorias sao por marca - trocar a marca do produto invalida categorias
  // que nao pertencem mais a ela.
  function trocarMarca(novaMarca: "colorido" | "branco") {
    setMarca(novaMarca)
    setCategoriaIds((atual) =>
      atual.filter((id) => categoriasDisponiveis.find((c) => c.id === id)?.marca === novaMarca)
    )
  }

  function alternarCategoria(id: string) {
    setCategoriaIds((atual) =>
      atual.includes(id) ? atual.filter((c) => c !== id) : [...atual, id]
    )
  }

  async function salvar() {
    setErro("")

    if (!nome.trim() || !preco) {
      setErro("Nome e preço são obrigatórios")
      return
    }
    if (!codigoBarras.trim()) {
      setErro("Código de barras (GTIN/EAN) é obrigatório")
      return
    }
    if (!validarCodigoBarras(codigoBarras)) {
      setErro("Código de barras inválido - precisa ter 13 dígitos (EAN-13) com dígito verificador correto")
      return
    }
    if (!ncm.trim()) {
      setErro("NCM é obrigatório")
      return
    }
    if (precoClube && precoClubeTipo === "percentual") {
      const percentual = decimalParaNumero(precoClube)
      if (percentual <= 0 || percentual > 100) {
        setErro("Percentual do Clube deve ser entre 0 e 100")
        return
      }
    }

    setSalvando(true)

    const corpo = {
      nome,
      descricao: descricao || null,
      preco: valorMoedaParaNumero(preco),
      precoPromocional: precoPromocional ? valorMoedaParaNumero(precoPromocional) : null,
      precoClube: precoClube
        ? precoClubeTipo === "percentual"
          ? decimalParaNumero(precoClube)
          : valorMoedaParaNumero(precoClube)
        : null,
      precoClubeTipo,
      estoque: Number(estoque) || 0,
      estoqueMinimo: Number(estoqueMinimo) || 0,
      ativo,
      marca,
      sku: sku || null,
      ncm: ncm || null,
      codigoBarras: codigoBarras || null,
      pesoKg: pesoKg ? decimalParaNumero(pesoKg) : null,
      alturaCm: alturaCm ? decimalParaNumero(alturaCm) : null,
      larguraCm: larguraCm ? decimalParaNumero(larguraCm) : null,
      comprimentoCm: comprimentoCm ? decimalParaNumero(comprimentoCm) : null,
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

  // Restaura os campos ao estado original (em branco pra um produto novo, ou
  // aos valores salvos se estiver editando) sem fechar o formulario - util
  // pra desfazer edicoes digitadas por engano.
  function limpar() {
    setNome(produto?.nome ?? "")
    setDescricao(produto?.descricao ?? "")
    setPreco(produto ? mascaraMoeda(String(Math.round(Number(produto.preco) * 100))) : "")
    setPrecoPromocional(
      produto?.preco_promocional
        ? mascaraMoeda(String(Math.round(Number(produto.preco_promocional) * 100)))
        : ""
    )
    setPrecoClubeTipo(produto?.preco_clube_tipo ?? "fixo")
    setPrecoClube(valorClubeInicial(produto))
    setEstoque(String(produto?.estoque ?? 0))
    setEstoqueMinimo(String(produto?.estoque_minimo ?? 0))
    setAtivo(produto?.ativo ?? true)
    setMarca(produto?.marca ?? marcaPadrao ?? "colorido")
    setSku(produto?.sku ?? "")
    setNcm(produto?.ncm ?? "")
    setCodigoBarras(produto?.codigo_barras ?? "")
    setPesoKg((produto?.peso_kg ?? "").replace(".", ","))
    setAlturaCm((produto?.altura_cm ?? "").replace(".", ","))
    setLarguraCm((produto?.largura_cm ?? "").replace(".", ","))
    setComprimentoCm((produto?.comprimento_cm ?? "").replace(".", ","))
    setCategoriaIds(produto?.categoriaIds ?? [])
    setImagensUrls(produto?.imagens.map((i) => i.url) ?? [])
    setErro("")
  }

  return (
    <div className="w-full space-y-4">
      <p className="px-1 text-sm font-medium text-muted-foreground">
        {produto ? `Editando: ${produto.nome}` : "Novo produto"}
      </p>
      {/* Nao e sticky de proposito - rola junto com o conteudo, igual as
          demais telas de cadastro do admin (Categorias, Cupons etc). Uma
          barra grudada aqui cobria o rotulo do primeiro campo (Nome/SKU) ao rolar. */}
      <div className="overflow-hidden rounded-lg border border-border">
        <BarraFerramentas
          botoes={[
            { label: "Gravar", icon: Save, onClick: salvar, variante: "success", disabled: salvando },
            { label: "Limpar", icon: Eraser, onClick: limpar, variante: "warning" },
            { label: "Cancelar", icon: X, onClick: onCancelar, variante: "danger" },
          ]}
          extra={
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Cadastrar para o site:</span>
              {(["colorido", "branco"] as const).map((opcao) => (
                <button
                  key={opcao}
                  type="button"
                  onClick={() => trocarMarca(opcao)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    marca === opcao
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-slate-300 bg-white text-slate-500 hover:border-primary/50"
                  }`}
                >
                  {opcao === "branco" ? "⚪ Porcelanas Brancas" : "🎨 Coisas Brasileiras"}
                </button>
              ))}
            </div>
          }
        />
      </div>

      {erro && <p className="text-sm text-red-500">{erro}</p>}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Dados do produto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* items-start: com todos os rotulos em 1 linha, os campos alinham
                pelo topo - e o que aparece abaixo do campo (aviso de validacao
                do EAN) nao desloca os vizinhos. max-w nos campos curtos pra
                nao esticarem alem do conteudo que recebem. */}
            <div className="grid items-start gap-3 sm:grid-cols-5">
              <div className="space-y-2 sm:col-span-2">
                <Label>Nome</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>
                  SKU
                  <CampoDica>Código interno do produto, opcional - usado só pra controle próprio.</CampoDica>
                </Label>
                <Input
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Opcional"
                  className="max-w-40"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  EAN *
                  <CampoDica>
                    Código de barras (GTIN/EAN-13), 13 dígitos. Usado no leitor da Venda Balcão e na
                    importação de XML de compra.
                  </CampoDica>
                </Label>
                <Input
                  value={codigoBarras}
                  onChange={(e) => setCodigoBarras(e.target.value.replace(/\D/g, "").slice(0, 13))}
                  placeholder="13 dígitos"
                  inputMode="numeric"
                  className="max-w-40"
                />
                {codigoBarras.length > 0 && codigoBarras.length < 13 ? (
                  <p className="text-xs text-amber-500">Faltam {13 - codigoBarras.length} dígito(s)</p>
                ) : codigoBarras.length === 13 && !validarCodigoBarras(codigoBarras) ? (
                  <p className="text-xs text-red-500">Dígito verificador não confere - confira o código</p>
                ) : codigoBarras.length === 13 ? (
                  <p className="text-xs text-emerald-500">Código válido</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>
                  NCM (fiscal) *
                  <CampoDica>Enviado na nota fiscal quando emitida pelo Bling.</CampoDica>
                </Label>
                <Input
                  value={mascaraNCM(ncm)}
                  onChange={(e) => setNcm(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder="0000.00.00"
                  inputMode="numeric"
                  className="max-w-36"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <textarea
                className="min-h-24 w-full rounded-md border border-input bg-transparent p-3 text-sm"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>

            <div className="grid items-start gap-4 sm:grid-cols-5">
              <div className="space-y-2">
                <Label>Preço (R$)</Label>
                <Input
                  inputMode="numeric"
                  value={preco}
                  onChange={(e) => setPreco(mascaraMoeda(e.target.value))}
                  placeholder="0,00"
                  className="max-w-32"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Promo (R$)
                  <CampoDica>Preço promocional - quando preenchido, substitui o preço normal no site.</CampoDica>
                </Label>
                <Input
                  inputMode="numeric"
                  value={precoPromocional}
                  onChange={(e) => setPrecoPromocional(mascaraMoeda(e.target.value))}
                  placeholder="0,00"
                  className="max-w-32"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Clube
                  <CampoDica>Só aparece pra clientes com assinatura do Clube ativa. Vazio = não participa.</CampoDica>
                </Label>
                <div className="flex gap-1">
                  <select
                    value={precoClubeTipo}
                    onChange={(e) => {
                      setPrecoClubeTipo(e.target.value as "fixo" | "percentual")
                      setPrecoClube("")
                    }}
                    className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
                  >
                    <option value="fixo">R$</option>
                    <option value="percentual">%</option>
                  </select>
                  <Input
                    inputMode={precoClubeTipo === "percentual" ? "decimal" : "numeric"}
                    value={precoClube}
                    onChange={(e) =>
                      setPrecoClube(
                        precoClubeTipo === "percentual"
                          ? mascaraDecimal(e.target.value)
                          : mascaraMoeda(e.target.value)
                      )
                    }
                    placeholder={precoClubeTipo === "percentual" ? "Ex: 20" : "0,00"}
                    className="max-w-28"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Estoque</Label>
                <Input
                  inputMode="numeric"
                  value={estoque}
                  onChange={(e) => setEstoque(somenteDigitos(e.target.value))}
                  className="max-w-28"
                />
              </div>
              <div className="space-y-2">
                <Label>Estoque mínimo</Label>
                <Input
                  inputMode="numeric"
                  value={estoqueMinimo}
                  onChange={(e) => setEstoqueMinimo(somenteDigitos(e.target.value))}
                  className="max-w-28"
                />
              </div>
            </div>

            {produto && Number(produto.custo) > 0 && (
              <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
                <span className="text-muted-foreground">
                  Custo médio atual:{" "}
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
                Peso e dimensões (para cálculo de frete)
              </Label>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="space-y-2">
                  <Label className="text-xs">Peso (kg)</Label>
                  <Input
                    inputMode="decimal"
                    value={pesoKg}
                    onChange={(e) => setPesoKg(mascaraDecimal(e.target.value))}
                    className="max-w-32"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Altura (cm)</Label>
                  <Input
                    inputMode="decimal"
                    value={alturaCm}
                    onChange={(e) => setAlturaCm(mascaraDecimal(e.target.value))}
                    className="max-w-32"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Largura (cm)</Label>
                  <Input
                    inputMode="decimal"
                    value={larguraCm}
                    onChange={(e) => setLarguraCm(mascaraDecimal(e.target.value))}
                    className="max-w-32"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Comprimento (cm)</Label>
                  <Input
                    inputMode="decimal"
                    value={comprimentoCm}
                    onChange={(e) => setComprimentoCm(mascaraDecimal(e.target.value))}
                    className="max-w-32"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Categorias</Label>
              <div className="flex flex-wrap gap-2">
                {categoriasDisponiveis
                  .filter((categoria) => categoria.marca === marca)
                  .map((categoria) => {
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
                {categoriasDisponiveis.filter((c) => c.marca === marca).length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma categoria cadastrada ainda para essa marca.
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
