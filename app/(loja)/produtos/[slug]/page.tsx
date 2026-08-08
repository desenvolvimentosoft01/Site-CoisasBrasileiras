import { cookies } from "next/headers"
import Link from "next/link"
import { query } from "@/lib/db"
import { notFound } from "next/navigation"
import { ArrowLeft, Truck, Sparkles, Star } from "lucide-react"
import { ProdutoGaleria } from "@/components/loja/produto-galeria"
import { AdicionarCarrinhoButton } from "@/components/loja/adicionar-carrinho-button"
import { AvaliacaoProduto } from "@/components/loja/avaliacao-produto"
import { NotificarEstoque } from "@/components/loja/notificar-estoque"
import { BotaoFavoritar } from "@/components/loja/botao-favoritar"
import { lerTokenSessaoCliente } from "@/lib/auth"
import { clienteTemClubeAtivo } from "@/lib/clube"
import { calcularPrecoClube } from "@/lib/preco-clube"
import { resolverMarcaAtual } from "@/lib/marca"

function formatarPreco(valor: string | number) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default async function ProdutoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const marca = await resolverMarcaAtual()

  const [produto] = await query(
    "SELECT * FROM TAB_PRODUTO WHERE slug = $1 AND ativo = true AND marca = $2",
    [slug, marca]
  )
  if (!produto) notFound()

  const imagens = await query(
    "SELECT url FROM TAB_PRODUTO_IMAGEM WHERE produto_id = $1 ORDER BY ordem",
    [produto.id]
  )

  const cookieStore = await cookies()
  const sessaoCliente = await lerTokenSessaoCliente(cookieStore.get("cliente_sessao")?.value)
  const clubeAtivo = sessaoCliente ? await clienteTemClubeAtivo(sessaoCliente.id) : false
  const precoClubeDisponivel = clubeAtivo && produto.preco_clube
  const clube = produto.preco_clube
    ? calcularPrecoClube(produto.preco, produto.preco_clube, produto.preco_clube_tipo)
    : null

  const [resumoAvaliacoes] = await query(
    `SELECT COUNT(*) AS total, COALESCE(AVG(nota), 0) AS media
     FROM TAB_AVALIACAO_PRODUTO WHERE produto_id = $1 AND aprovado = true`,
    [produto.id]
  )
  const avaliacoes = await query(
    `SELECT a.nota, a.comentario, a.criado_em, c.nome AS cliente_nome
     FROM TAB_AVALIACAO_PRODUTO a JOIN TAB_CLIENTE c ON c.id = a.cliente_id
     WHERE a.produto_id = $1 AND a.aprovado = true
     ORDER BY a.criado_em DESC`,
    [produto.id]
  )
  const totalAvaliacoes = Number(resumoAvaliacoes.total)
  const mediaAvaliacoes = Number(resumoAvaliacoes.media)

  const favoritado = sessaoCliente
    ? Boolean(
        (
          await query(
            "SELECT 1 FROM TAB_LISTA_DESEJOS WHERE cliente_id = $1 AND produto_id = $2",
            [sessaoCliente.id, produto.id]
          )
        )[0]
      )
    : false

  const precoFinal = precoClubeDisponivel ? clube!.valorFinal : (produto.preco_promocional ?? produto.preco)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <Link
        href="/produtos"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-primary"
      >
        <ArrowLeft size={16} />
        Voltar para todos os produtos
      </Link>

      <div className="grid gap-10 md:grid-cols-2">
        <ProdutoGaleria imagens={imagens.map((i) => i.url)} nome={produto.nome} />

        <div className="space-y-6">
          <div>
            <h1 className="font-heading text-3xl font-semibold text-emerald-950">
              {produto.nome}
            </h1>

            {totalAvaliacoes > 0 && (
              <div className="mt-1 flex items-center gap-1.5">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={14}
                      className={n <= Math.round(mediaAvaliacoes) ? "fill-amber-400 text-amber-400" : "text-neutral-300"}
                    />
                  ))}
                </div>
                <span className="text-sm text-neutral-500">
                  {mediaAvaliacoes.toFixed(1)} ({totalAvaliacoes} avaliaç{totalAvaliacoes === 1 ? "ão" : "ões"})
                </span>
              </div>
            )}

            <div className="mt-3">
              {precoClubeDisponivel ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-600">
                    <Sparkles size={14} />
                    Preço Clube
                  </div>
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="text-lg text-neutral-400 line-through">
                      {formatarPreco(produto.preco_promocional ?? produto.preco)}
                    </span>
                    <span className="text-4xl font-bold text-emerald-700">
                      {formatarPreco(clube!.valorFinal)}
                    </span>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      {clube!.percentual}% OFF
                    </span>
                  </div>
                </div>
              ) : produto.preco_promocional ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-lg text-neutral-400 line-through">
                    {formatarPreco(produto.preco)}
                  </span>
                  <span className="text-3xl font-semibold text-emerald-700">
                    {formatarPreco(produto.preco_promocional)}
                  </span>
                </div>
              ) : (
                <span className="text-3xl font-semibold text-emerald-700">
                  {formatarPreco(produto.preco)}
                </span>
              )}
              {!clubeAtivo && clube && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sparkles size={13} className="text-amber-500" />
                  Membros do Clube pagam{" "}
                  <span className="font-semibold text-amber-700">
                    {formatarPreco(clube.valorFinal)} ({clube.percentual}% OFF)
                  </span>{" "}
                  neste produto.{" "}
                  <a href="/minha-conta?assinar=1" className="font-medium underline hover:text-emerald-700">
                    Saiba mais
                  </a>
                </p>
              )}
            </div>
          </div>

          {produto.descricao && (
            <p className="leading-relaxed text-neutral-600">{produto.descricao}</p>
          )}

          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Truck size={18} />
            Envio para todo o Brasil
          </div>

          <BotaoFavoritar produtoId={produto.id} logado={Boolean(sessaoCliente)} favoritadoInicial={favoritado} />

          <AdicionarCarrinhoButton
            produtoId={produto.id}
            nome={produto.nome}
            slug={produto.slug}
            preco={Number(precoFinal)}
            imagemCapa={imagens[0]?.url ?? null}
            estoque={produto.estoque}
          />

          {produto.estoque <= 0 && <NotificarEstoque produtoId={produto.id} />}
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-2xl space-y-6">
        <h2 className="font-heading text-2xl font-semibold text-emerald-950">Avaliações</h2>

        <AvaliacaoProduto produtoId={produto.id} />

        {avaliacoes.length === 0 ? (
          <p className="text-sm text-neutral-500">Nenhuma avaliação ainda.</p>
        ) : (
          <div className="space-y-4">
            {avaliacoes.map((avaliacao, indice) => (
              <div key={indice} className="border-b border-black/5 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={14}
                        className={n <= avaliacao.nota ? "fill-amber-400 text-amber-400" : "text-neutral-300"}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{avaliacao.cliente_nome}</span>
                  <span className="text-xs text-neutral-400">
                    {new Date(avaliacao.criado_em).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                {avaliacao.comentario && (
                  <p className="mt-1 text-sm text-neutral-600">{avaliacao.comentario}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
