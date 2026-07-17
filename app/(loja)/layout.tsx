import { Header } from "@/components/loja/header"
import { Footer } from "@/components/loja/footer"
import { CarrinhoDrawer } from "@/components/loja/carrinho-drawer"
import { getConfiguracoes } from "@/lib/configuracoes"

export default async function LojaLayout({ children }: { children: React.ReactNode }) {
  const config = await getConfiguracoes(["banner_texto_topo"])

  return (
    <>
      {config.banner_texto_topo && (
        <div className="bg-emerald-700 px-4 py-2 text-center text-sm font-medium text-white">
          {config.banner_texto_topo}
        </div>
      )}
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CarrinhoDrawer />
    </>
  )
}
