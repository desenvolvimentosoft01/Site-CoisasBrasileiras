import { query } from "@/lib/db"
import { notFound } from "next/navigation"
import { Truck } from "lucide-react"
import { ProdutoGaleria } from "@/components/loja/produto-galeria"
import { AdicionarCarrinhoButton } from "@/components/loja/adicionar-carrinho-button"

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

  const precoFinal = produto.preco_promocional ?? produto.preco

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <div className="grid gap-10 md:grid-cols-2">
        <ProdutoGaleria imagens={imagens.map((i) => i.url)} nome={produto.nome} />

        <div className="space-y-6">
          <div>
            <h1 className="font-heading text-3xl font-semibold text-emerald-950">
              {produto.nome}
            </h1>

            <div className="mt-3">
              {produto.preco_promocional ? (
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
    </div>
  )
}
