import { query } from "@/lib/db"
import { HeroCarousel } from "@/components/loja/hero-carousel"
import { CategoriaGrid } from "@/components/loja/categoria-grid"
import { ProdutoCard } from "@/components/loja/produto-card"
import { FeedbacksSecao } from "@/components/loja/feedbacks-secao"

export default async function HomePage() {
  const banners = await query(
    "SELECT id, titulo, subtitulo, link, imagem_url, cor_fundo FROM TAB_BANNER WHERE ativo = true ORDER BY ordem"
  )

  const categorias = await query(
    "SELECT id, nome, slug, imagem_url FROM TAB_CATEGORIA WHERE ativa = true ORDER BY nome"
  )

  const destaques = await query(`
    SELECT
      p.id, p.nome, p.slug, p.preco, p.preco_promocional,
      (SELECT url FROM TAB_PRODUTO_IMAGEM WHERE produto_id = p.id ORDER BY ordem LIMIT 1) AS imagem_capa
    FROM TAB_PRODUTO p
    WHERE p.ativo = true
    ORDER BY p.criado_em DESC
    LIMIT 8
  `)

  // Mais vendidos: soma a quantidade vendida em pedidos ja pagos, por produto.
  // So conta vendas de origem 'site' - venda balcao nao entra aqui, porque
  // essa vitrine e sobre o que realmente vende no site (a venda balcao pode
  // ter negociacao/desconto que nao reflete a demanda real do catalogo online).
  const feedbacks = await query(
    "SELECT id, nome, texto, imagem_url, nota FROM TAB_FEEDBACK WHERE ativo = true ORDER BY ordem, criado_em DESC LIMIT 6"
  )

  const maisVendidos = await query(`
    SELECT
      p.id, p.nome, p.slug, p.preco, p.preco_promocional,
      (SELECT url FROM TAB_PRODUTO_IMAGEM WHERE produto_id = p.id ORDER BY ordem LIMIT 1) AS imagem_capa,
      SUM(pi.quantidade) AS total_vendido
    FROM TAB_PEDIDO_ITEM pi
    JOIN TAB_PEDIDO ped ON ped.id = pi.pedido_id
    JOIN TAB_PRODUTO p ON p.id = pi.produto_id
    WHERE ped.status = 'pago' AND ped.origem = 'site' AND p.ativo = true
    GROUP BY p.id
    ORDER BY total_vendido DESC
    LIMIT 8
  `)

  return (
    <div>
      <HeroCarousel banners={banners} />

      <CategoriaGrid categorias={categorias} />

      {maisVendidos.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12 md:px-6">
          <h2 className="font-heading mb-6 text-2xl font-semibold text-emerald-950">
            Mais vendidos
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {maisVendidos.map((produto) => (
              <ProdutoCard key={produto.id} produto={produto} />
            ))}
          </div>
        </section>
      )}

      <section id="destaques" className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <h2 className="font-heading mb-6 text-2xl font-semibold text-emerald-950">
          Destaques da loja
        </h2>

        {destaques.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Nenhum produto cadastrado ainda. Assim que o admin cadastrar produtos, eles aparecem aqui.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {destaques.map((produto) => (
              <ProdutoCard key={produto.id} produto={produto} />
            ))}
          </div>
        )}
      </section>

      <FeedbacksSecao feedbacks={feedbacks} />
    </div>
  )
}
