import { create } from "zustand"
import { persist } from "zustand/middleware"

export type ItemCarrinho = {
  produtoId: string
  nome: string
  slug: string
  preco: number
  imagemCapa: string | null
  quantidade: number
}

export type CupomAplicado = { codigo: string; desconto: number }

type CarrinhoState = {
  itens: ItemCarrinho[]
  aberto: boolean
  cupom: CupomAplicado | null
  adicionar: (item: Omit<ItemCarrinho, "quantidade">, quantidade?: number) => void
  remover: (produtoId: string) => void
  alterarQuantidade: (produtoId: string, quantidade: number) => void
  limpar: () => void
  abrir: () => void
  fechar: () => void
  setCupom: (cupom: CupomAplicado | null) => void
}

export const useCarrinho = create<CarrinhoState>()(
  persist(
    (set) => ({
      itens: [],
      aberto: false,
      cupom: null,

      adicionar: (item, quantidade = 1) =>
        set((state) => {
          const existente = state.itens.find((i) => i.produtoId === item.produtoId)
          if (existente) {
            return {
              itens: state.itens.map((i) =>
                i.produtoId === item.produtoId
                  ? { ...i, quantidade: i.quantidade + quantidade }
                  : i
              ),
              aberto: true,
            }
          }
          return {
            itens: [...state.itens, { ...item, quantidade }],
            aberto: true,
          }
        }),

      remover: (produtoId) =>
        set((state) => ({ itens: state.itens.filter((i) => i.produtoId !== produtoId) })),

      alterarQuantidade: (produtoId, quantidade) =>
        set((state) => ({
          itens:
            quantidade <= 0
              ? state.itens.filter((i) => i.produtoId !== produtoId)
              : state.itens.map((i) =>
                  i.produtoId === produtoId ? { ...i, quantidade } : i
                ),
        })),

      limpar: () => set({ itens: [], cupom: null }),
      abrir: () => set({ aberto: true }),
      fechar: () => set({ aberto: false }),
      setCupom: (cupom) => set({ cupom }),
    }),
    { name: "coisas-brasileiras-carrinho" }
  )
)

export function totalCarrinho(itens: ItemCarrinho[]) {
  return itens.reduce((soma, item) => soma + item.preco * item.quantidade, 0)
}
