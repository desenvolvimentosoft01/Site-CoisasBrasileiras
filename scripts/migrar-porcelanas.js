// Migra os dados do Porcelanas Brancas (banco separado) pro banco do Coisas
// Brasileiras, marcados como marca='branco'. So LEITURA no banco de origem
// (PORCELANAS_DATABASE_URL) e ESCRITA no banco local do Coisas Brasileiras
// (DATABASE_URL do .env.local deste projeto) - nunca escreve no banco de
// producao do Porcelanas.
//
// Idempotente: pode rodar mais de uma vez sem duplicar (categorias/produtos
// ja migrados sao identificados pelo nome+marca e atualizados em vez de
// duplicados).
//
// Uso: node scripts/migrar-porcelanas.js
// Precisa de PORCELANAS_DATABASE_URL no .env.local deste projeto, apontando
// pro Supabase de producao do Porcelanas Brancas (so leitura).

require("dotenv").config({ path: require("path").join(process.cwd(), ".env.local") })
const { Client } = require("pg")

const CHAVES_CONFIG_MARCA = [
  "nome_loja", "logo_url", "whatsapp", "whatsapp_mensagem", "instagram",
  "email_contato", "endereco_contato", "texto_rodape", "texto_sobre_nos",
  "banner_texto_topo",
  "cor_primaria", "cor_primaria_texto", "cor_secundaria", "cor_secundaria_texto",
  "cor_destaque", "cor_destaque_texto", "cor_neutra", "cor_neutra_texto",
  "cor_perigo", "cor_fundo", "cor_texto", "cor_borda",
]

// Estoque real do Porcelanas nunca existiu (site so de vitrine) - entra
// zerado de proposito, pra nao deixar produto "vendavel" com estoque
// inventado antes do cliente conferir/preencher o numero real.
const ESTOQUE_PLACEHOLDER = 0

async function main() {
  if (!process.env.PORCELANAS_DATABASE_URL) {
    console.error("Defina PORCELANAS_DATABASE_URL no .env.local (Supabase do Porcelanas Brancas, so leitura).")
    process.exit(1)
  }

  const origem = new Client({ connectionString: process.env.PORCELANAS_DATABASE_URL })
  const destino = new Client({ connectionString: process.env.DATABASE_URL })
  await origem.connect()
  await destino.connect()

  try {
    // ===== Identidade visual (configuracoes) =====
    const configs = await origem.query("SELECT chave, valor FROM configuracoes WHERE chave = ANY($1)", [
      CHAVES_CONFIG_MARCA,
    ])
    for (const { chave, valor } of configs.rows) {
      await destino.query(
        `INSERT INTO TAB_CONFIGURACAO_MARCA (chave, marca, valor, atualizado_em)
         VALUES ($1, 'branco', $2, NOW())
         ON CONFLICT (chave, marca) DO UPDATE SET valor = $2, atualizado_em = NOW()`,
        [chave, valor]
      )
    }
    console.log(`Identidade visual: ${configs.rows.length} chaves migradas.`)

    // ===== Categorias (com hierarquia pai/filho) =====
    const categorias = await origem.query(
      "SELECT id, nome, slug, imagem_url, categoria_pai_id, ordem, ativa FROM TAB_CATEGORIA"
    )
    const mapaCategoriaId = new Map() // id antigo (Porcelanas) -> id novo (Coisas Brasileiras)

    // Duas passadas: primeiro as categorias-pai (sem categoria_pai_id), depois
    // as filhas, pra poder resolver o categoria_pai_id novo.
    const principais = categorias.rows.filter((c) => !c.categoria_pai_id)
    const filhas = categorias.rows.filter((c) => c.categoria_pai_id)

    for (const c of [...principais, ...filhas]) {
      const paiIdNovo = c.categoria_pai_id ? mapaCategoriaId.get(c.categoria_pai_id) : null
      const existente = await destino.query(
        "SELECT id FROM TAB_CATEGORIA WHERE slug = $1 AND marca = 'branco'",
        [c.slug]
      )
      let idNovo
      if (existente.rows.length > 0) {
        idNovo = existente.rows[0].id
        await destino.query(
          "UPDATE TAB_CATEGORIA SET nome = $1, imagem_url = $2, categoria_pai_id = $3, ordem = $4, ativa = $5 WHERE id = $6",
          [c.nome, c.imagem_url, paiIdNovo, c.ordem, c.ativa, idNovo]
        )
      } else {
        const [nova] = (
          await destino.query(
            `INSERT INTO TAB_CATEGORIA (nome, slug, imagem_url, categoria_pai_id, ordem, ativa, marca)
             VALUES ($1, $2, $3, $4, $5, $6, 'branco') RETURNING id`,
            [c.nome, c.slug, c.imagem_url, paiIdNovo, c.ordem, c.ativa]
          )
        ).rows
        idNovo = nova.id
      }
      mapaCategoriaId.set(c.id, idNovo)
    }
    console.log(`Categorias: ${categorias.rows.length} migradas.`)

    // ===== Produtos + imagens =====
    const produtos = await origem.query(
      "SELECT id, nome, slug, descricao, categoria_id, ativo, ordem, preco FROM TAB_PRODUTO"
    )
    let produtosMigrados = 0
    for (const p of produtos.rows) {
      const categoriaIdNova = p.categoria_id ? mapaCategoriaId.get(p.categoria_id) : null
      const existente = await destino.query(
        "SELECT id FROM TAB_PRODUTO WHERE slug = $1 AND marca = 'branco'",
        [p.slug]
      )
      let produtoIdNovo
      if (existente.rows.length > 0) {
        produtoIdNovo = existente.rows[0].id
        await destino.query(
          "UPDATE TAB_PRODUTO SET nome = $1, descricao = $2, ativo = $3, preco = $4 WHERE id = $5",
          [p.nome, p.descricao, p.ativo, p.preco ?? 0, produtoIdNovo]
        )
      } else {
        const [novo] = (
          await destino.query(
            `INSERT INTO TAB_PRODUTO (nome, slug, descricao, preco, estoque, estoque_minimo, ativo, marca)
             VALUES ($1, $2, $3, $4, $5, 0, $6, 'branco') RETURNING id`,
            [p.nome, p.slug, p.descricao, p.preco ?? 0, ESTOQUE_PLACEHOLDER, p.ativo]
          )
        ).rows
        produtoIdNovo = novo.id
      }

      if (categoriaIdNova) {
        await destino.query(
          `INSERT INTO TAB_PRODUTO_CATEGORIA (produto_id, categoria_id)
           VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [produtoIdNovo, categoriaIdNova]
        )
      }

      const imagens = await origem.query(
        "SELECT url, ordem FROM TAB_PRODUTO_IMAGEM WHERE produto_id = $1 ORDER BY ordem",
        [p.id]
      )
      await destino.query("DELETE FROM TAB_PRODUTO_IMAGEM WHERE produto_id = $1", [produtoIdNovo])
      for (const img of imagens.rows) {
        await destino.query(
          "INSERT INTO TAB_PRODUTO_IMAGEM (produto_id, url, ordem) VALUES ($1, $2, $3)",
          [produtoIdNovo, img.url, img.ordem]
        )
      }
      produtosMigrados++
    }
    console.log(`Produtos: ${produtosMigrados} migrados (estoque = ${ESTOQUE_PLACEHOLDER}, SKU/NCM/codigo de barras em branco - completar antes de vender).`)

    // ===== Banners =====
    const banners = await origem.query(
      "SELECT titulo, subtitulo, link, imagem_url, cor_fundo, ordem, ativo FROM TAB_BANNER"
    )
    // Sem chave natural pra deduplicar (banners nao tem slug) - so insere se
    // ainda nao existir nenhum banner branco com o mesmo titulo.
    let bannersMigrados = 0
    for (const b of banners.rows) {
      const existente = await destino.query(
        "SELECT id FROM TAB_BANNER WHERE titulo = $1 AND marca = 'branco'",
        [b.titulo]
      )
      if (existente.rows.length > 0) continue
      await destino.query(
        `INSERT INTO TAB_BANNER (titulo, subtitulo, link, imagem_url, cor_fundo, ordem, ativo, marca)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'branco')`,
        [b.titulo, b.subtitulo, b.link, b.imagem_url, b.cor_fundo, b.ordem, b.ativo]
      )
      bannersMigrados++
    }
    console.log(`Banners: ${bannersMigrados} migrados.`)

    console.log("\nMigração concluída.")
  } finally {
    await origem.end()
    await destino.end()
  }
}

main().catch((erro) => {
  console.error("Erro na migração:", erro.message)
  process.exit(1)
})
