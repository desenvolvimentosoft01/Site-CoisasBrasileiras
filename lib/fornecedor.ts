import { mascaraCpfCnpj } from "@/lib/mascaras"

// Como um fornecedor se apresenta nas listas e combos do sistema.
//
// QUAL NOME USAR: o fornecedor tem dois, e cada um serve a um publico.
// A RAZAO SOCIAL e o nome juridico - e o que sai na nota fiscal e o que o
// contador procura. O NOME FANTASIA e como o operador conhece ("Porcelanas
// BR"), e quase sempre o unico que ele reconhece de bate-pronto.
//
// Por isso o rotulo mostra o CNPJ/CPF na frente (identificador que nao
// depende de nome e desempata homonimo) e o nome fantasia depois, caindo pra
// razao social quando nao houver fantasia cadastrada. Fica no formato:
//
//   12.345.678/0001-99 - Porcelanas BR
//
// Centralizado aqui pra que combo, grade e relatorio mostrem exatamente o
// mesmo texto - fornecedor aparecendo com nome diferente em cada tela e o
// tipo de coisa que faz o operador achar que sao dois cadastros.
export type FornecedorIdentificavel = {
  razao_social: string
  nome_fantasia?: string | null
  cnpj_cpf?: string | null
}

export function rotuloFornecedor(fornecedor: FornecedorIdentificavel): string {
  const nome = fornecedor.nome_fantasia?.trim() || fornecedor.razao_social
  const documento = fornecedor.cnpj_cpf?.trim()

  if (!documento) return nome
  return `${mascaraCpfCnpj(documento)} - ${nome}`
}
