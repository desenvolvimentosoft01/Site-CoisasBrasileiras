import { Suspense } from "react"
import { query } from "@/lib/db"
import { ProdutoCard } from "@/components/loja/produto-card"
import { BuscaCatalogo } from "@/components/loja/busca-catalogo"

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; busca?: string }>
}) {
  const { categoria, busca } = await searchParams

  const condicoes = ["p.ativo = true"]
  const parametros: string[] = []

  if (categoria) {
    parametros.push(categoria)
    condicoes.push(`c.slug = $${parametros.length}`)
  }

  if (busca) {
    parametros.push(`%${busca}%`)
    condicoes.push(`p.nome ILIKE $${parametros.length}`)
  }

  const produtos = await query(
    `
    SELECT
      p.id, p.nome, p.slug, p.preco, p.preco_promocional,
      (SELECT url FROM TAB_PRODUTO_IMAGEM WHERE produto_id = p.id ORDER BY ordem LIMIT 1) AS imagem_capa
    FROM TAB_PRODUTO p
    ${categoria ? "JOIN TAB_PRODUTO_CATEGORIA pc ON pc.produto_id = p.id JOIN TAB_CATEGORIA c ON c.id = pc.categoria_id" : ""}
    WHERE ${condicoes.join(" AND ")}
    GROUP BY p.id
    ORDER BY p.criado_em DESC
    `,
    parametros
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <h1 className="font-heading mb-6 text-3xl font-semibold text-emerald-950">
        {categoria ? "Produtos" : "Todos os produtos"}
      </h1>

      <Suspense fallback={null}>
        <BuscaCatalogo />
      </Suspense>

      {produtos.length === 0 ? (
        <p className="text-sm text-neutral-500">
          {busca ? `Nenhum produto encontrado para "${busca}".` : "Nenhum produto encontrado."}
        </p>
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
