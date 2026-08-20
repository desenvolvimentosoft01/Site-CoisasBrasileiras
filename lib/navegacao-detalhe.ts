import type { NavegacaoDetalhe } from "@/components/admin/modal-detalhe"

// Monta a navegação "anterior / próximo" do ModalDetalhe a partir da lista que
// a grade está exibindo. Fica aqui, e não em cada tela, porque a regra é
// sempre a mesma: andar na lista FILTRADA (o que a pessoa vê na tela), e não
// no total do cadastro - senão a seta levaria pra um registro que o filtro
// tinha acabado de esconder.
//
// Devolve undefined quando não há registro aberto: o modal só mostra as setas
// quando elas fazem sentido.
export function montarNavegacaoDetalhe<T>(
  lista: T[],
  atual: T | null,
  abrir: (registro: T) => void,
  mesmoRegistro: (a: T, b: T) => boolean = (a, b) => a === b
): NavegacaoDetalhe | undefined {
  if (!atual) return undefined

  const indice = lista.findIndex((registro) => mesmoRegistro(registro, atual))
  // Registro que saiu da lista (foi excluído ou o filtro mudou com o modal
  // aberto): sem posição, sem setas - mas o modal continua mostrando o que já
  // estava na tela, em vez de fechar sozinho na cara da pessoa.
  if (indice === -1) return undefined

  return {
    posicao: indice + 1,
    total: lista.length,
    aoAnterior: () => indice > 0 && abrir(lista[indice - 1]),
    aoProximo: () => indice < lista.length - 1 && abrir(lista[indice + 1]),
  }
}
