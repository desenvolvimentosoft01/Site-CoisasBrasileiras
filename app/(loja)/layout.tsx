import { Header } from "@/components/loja/header"
import { Footer } from "@/components/loja/footer"
import { CarrinhoDrawer } from "@/components/loja/carrinho-drawer"
import { WhatsappFlutuante } from "@/components/loja/whatsapp-flutuante"
import { getConfiguracoes } from "@/lib/configuracoes"
import { query } from "@/lib/db"

// Sem isso, o Next tenta pre-renderizar as paginas da loja em build-time (SSG)
// e precisa do banco disponivel durante o "npm run build" - quebra em builds
// feitos numa maquina sem acesso ao Postgres de producao (ex: build separado
// do deploy). Forcar dinamico faz a busca (config/categorias) rodar sempre a
// cada request, na maquina que de fato serve o site - e configuracao/estoque
// mudam com frequencia mesmo, cache estatico aqui so traria dado desatualizado.
export const dynamic = "force-dynamic"

export default async function LojaLayout({ children }: { children: React.ReactNode }) {
  const [config, categorias] = await Promise.all([
    getConfiguracoes([
      "banner_texto_topo",
      "cor_primaria",
      "nome_loja",
      "logo_url",
      "whatsapp",
      "whatsapp_mensagem",
    ]),
    query("SELECT id, nome, slug, categoria_pai_id FROM TAB_CATEGORIA WHERE ativa = true ORDER BY nome"),
  ])

  return (
    // Sobrescreve a cor primaria do tema (usada em botoes, links, badges) com
    // o valor configurado pelo admin em Configuracoes > Aparencia - so nesse
    // wrapper, entao o painel admin (dark, fixo) nao e afetado.
    <div
      className="flex min-h-full flex-1 flex-col"
      style={config.cor_primaria ? ({ "--primary": config.cor_primaria } as React.CSSProperties) : undefined}
    >
      {config.banner_texto_topo && (
        <div className="bg-primary px-4 py-2 text-center text-sm font-medium text-white">
          {config.banner_texto_topo}
        </div>
      )}
      <Header
        nomeLoja={config.nome_loja || undefined}
        logoUrl={config.logo_url || undefined}
        categorias={categorias}
      />
      <main className="flex-1">{children}</main>
      <Footer />
      <CarrinhoDrawer />
      <WhatsappFlutuante whatsapp={config.whatsapp || null} mensagem={config.whatsapp_mensagem || null} />
    </div>
  )
}
