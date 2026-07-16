import { Header } from "@/components/loja/header"
import { Footer } from "@/components/loja/footer"
import { CarrinhoDrawer } from "@/components/loja/carrinho-drawer"

export default function LojaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CarrinhoDrawer />
    </>
  )
}
