import { cookies } from "next/headers"
import { query } from "@/lib/db"
import { notFound } from "next/navigation"
import { Truck, Sparkles, Star } from "lucide-react"
import { ProdutoGaleria } from "@/components/loja/produto-galeria"
import { AdicionarCarrinhoButton } from "@/components/loja/adicionar-carrinho-button"
import { AvaliacaoProduto } from "@/components/loja/avaliacao-produto"
import { lerTokenSessaoCliente } from "@/lib/auth"
import { clienteTemClubeAtivo } from "@/lib/clube"

function formatarPreco(valor: string) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default async function ProdutoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const [produto] = await query(
    "SELECT * FROM TAB_PRODUTO WHERE slug = $1 AND ativo = true",
    [slug]
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

  const precoFinal = precoClubeDisponivel ? produto.preco_clube : (produto.preco_promocional ?? produto.preco)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
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
                <div className="flex items-baseline gap-3">
                  <span className="text-lg text-neutral-400 line-through">
                    {formatarPreco(produto.preco_promocional ?? produto.preco)}
                  </span>
                  <span className="text-3xl font-semibold text-emerald-700">
                    {formatarPreco(produto.preco_clube)}
                  </span>
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
              {precoClubeDisponivel && (
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-amber-600">
                  <Sparkles size={14} />
                  Oferta exclusiva para membros do Clube
                </p>
              )}
              {!clubeAtivo && produto.preco_clube && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Membros do Clube pagam {formatarPreco(produto.preco_clube)} neste produto.{" "}
                  <a href="/minha-conta" className="underline hover:text-emerald-700">
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

          <AdicionarCarrinhoButton
            produtoId={produto.id}
            nome={produto.nome}
            slug={produto.slug}
            preco={Number(precoFinal)}
            imagemCapa={imagens[0]?.url ?? null}
            estoque={produto.estoque}
          />
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
