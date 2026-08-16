import { create } from "zustand"
import { persist } from "zustand/middleware"

export type ItemCarrinho = {
  produtoId: string
  nome: string
  slug: string
  preco: number
  imagemCapa: string | null
  quantidade: number
  // Opcional pra nao quebrar carrinhos salvos antes desse campo existir
  // (localStorage persistido) - sem valor, trata como sem limite conhecido.
  estoque?: number
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
          // Limita ao estoque disponivel aqui, na store - centralizado, entao
          // vale pra qualquer lugar que chame adicionar() (card da grade,
          // botao da pagina de produto etc), nao so pros botoes +/- que
          // controlam a propria quantidade antes de chamar isso.
          const limite = item.estoque ?? Infinity
          if (existente) {
            const novaQuantidade = Math.min(limite, existente.quantidade + quantidade)
            return {
              itens: state.itens.map((i) =>
                i.produtoId === item.produtoId ? { ...i, estoque: item.estoque, quantidade: novaQuantidade } : i
              ),
              aberto: true,
            }
          }
          return {
            itens: [...state.itens, { ...item, quantidade: Math.min(limite, quantidade) }],
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
    {
      name: "coisas-brasileiras-carrinho",
      // "aberto" nao pode ser persistido: se o drawer ficar salvo como aberto
      // no localStorage, o overlay escuro dele volta a cobrir a tela em
      // qualquer pagina/recarregamento seguinte e bloqueia clique em tudo por
      // baixo (ex: botao "Ir para o pagamento" no checkout).
      partialize: (state) => ({ itens: state.itens, cupom: state.cupom }),
      // Forca aberto:false na hidratacao mesmo pra quem ja tinha um
      // localStorage antigo com aberto:true salvo (de antes desse fix) -
      // sem isso o merge padrao do zustand traria o valor travado de volta.
      merge: (persistido, atual) => ({ ...atual, ...(persistido as object), aberto: false }),
    }
  )
)

export function totalCarrinho(itens: ItemCarrinho[]) {
  return itens.reduce((soma, item) => soma + item.preco * item.quantidade, 0)
}
