import { Header } from "@/components/loja/header"
import { Footer } from "@/components/loja/footer"
import { CarrinhoDrawer } from "@/components/loja/carrinho-drawer"
import { getConfiguracoes } from "@/lib/configuracoes"

export default async function LojaLayout({ children }: { children: React.ReactNode }) {
  const config = await getConfiguracoes(["banner_texto_topo", "cor_primaria", "nome_loja"])

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
      <Header nomeLoja={config.nome_loja || undefined} />
      <main className="flex-1">{children}</main>
      <Footer />
      <CarrinhoDrawer />
    </div>
  )
}
