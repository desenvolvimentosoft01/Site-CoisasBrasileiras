import { Icone } from "@/components/admin/icone"

// Subtitulo das telas de cadastro: explica as duas interacoes da grade que
// nao tem nenhuma pista visual - duplo clique pra editar e selecionar a linha
// pra habilitar a barra.
//
// Existe como componente, e nao como texto repetido em 12 telas, pelo mesmo
// motivo das classes de cor: se o texto mudar, muda num lugar so. E porque
// texto repetido na mao acaba divergindo (uma tela diz "clique duas vezes",
// a outra "duplo clique") e o operador acha que sao coisas diferentes.
export function DicaGrade({ children }: { children?: React.ReactNode }) {
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-500">
      <Icone nome="grade" tamanho={13} />
      <span>
        Duplo clique na linha para editar · Selecione uma linha para habilitar as ações da barra
      </span>
      {children}
    </p>
  )
}
