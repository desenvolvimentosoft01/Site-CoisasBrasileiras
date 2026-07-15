import { query } from "@/lib/db"
import { ProdutoCard } from "@/components/loja/produto-card"

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>
}) {
  const { categoria } = await searchParams

  const produtos = await query(
    `
    SELECT
      p.id, p.nome, p.slug, p.preco, p.preco_promocional,
      (SELECT url FROM TAB_PRODUTO_IMAGEM WHERE produto_id = p.id ORDER BY ordem LIMIT 1) AS imagem_capa
    FROM TAB_PRODUTO p
    ${categoria ? "JOIN TAB_PRODUTO_CATEGORIA pc ON pc.produto_id = p.id JOIN TAB_CATEGORIA c ON c.id = pc.categoria_id" : ""}
    WHERE p.ativo = true ${categoria ? "AND c.slug = $1" : ""}
    GROUP BY p.id
    ORDER BY p.criado_em DESC
    `,
    categoria ? [categoria] : []
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <h1 className="font-heading mb-8 text-3xl font-semibold text-emerald-950">
        {categoria ? "Produtos" : "Todos os produtos"}
      </h1>

      {produtos.length === 0 ? (
        <p className="text-sm text-neutral-500">Nenhum produto encontrado.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {produtos.map((produto) => (
            <ProdutoCard key={produto.id} produto={produto} />
          ))}
        </div>
      )}
    </div>
  )
}
