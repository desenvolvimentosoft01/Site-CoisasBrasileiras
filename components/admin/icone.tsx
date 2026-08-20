import Image from "next/image"

// Icones proprios do sistema, em SVG, guardados em public/icones (um arquivo
// por funcao, nomeado pelo que ele significa - "excluir.svg", e nao
// "lixeira.svg", pra que trocar o desenho um dia nao obrigue a mexer em tela
// nenhuma).
//
// Substituem os emoji que o sistema usava antes: emoji e fonte do sistema
// operacional, entao o mesmo icone saia diferente em Windows, Mac e celular, e
// varios viravam borrao em tamanho pequeno.
export type NomeIcone =
  | "novo"
  | "ver"
  | "editar"
  | "excluir"
  | "salvar"
  | "limpar"
  | "cancelar"
  | "confirmar"
  | "recusar"
  | "bloquear"
  | "email"
  | "mensagem"
  | "enviar"
  | "atualizar"
  | "imprimir"
  | "baixar"
  | "alerta"
  | "grade"
  | "visao_geral"
  | "venda_balcao"
  | "pedido_venda"
  | "orcamento"
  | "clientes"
  | "produtos"
  | "marketing"
  | "financeiro"
  | "notas_fiscais"
  | "compras"
  | "relatorios"
  | "configuracoes"
  | "cores"
  | "estoque"
  | "mais"
  | "menos"

export function Icone({
  nome,
  tamanho = 16,
  className,
}: {
  nome: NomeIcone
  tamanho?: number
  className?: string
}) {
  return (
    <Image
      src={`/icones/${nome}.svg`}
      alt=""
      width={tamanho}
      height={tamanho}
      // Icone e decorativo: o rotulo ao lado (ou o title do botao) e que diz o
      // que a acao faz, entao repetir no alt so atrapalharia leitor de tela.
      aria-hidden
      className={className}
      // SVG proprio, ja minusculo - passar pelo otimizador de imagem so
      // adicionaria uma ida ao servidor por icone.
      unoptimized
    />
  )
}
