// Rodape da grade, no padrao do InMenteGestao: quantos registros estao sendo
// mostrados de quantos existem, e o estado da tela do lado direito.
//
// Serve pra duas coisas praticas: saber que o filtro escondeu registros (o
// "de N" nao bate com o total) e ter certeza de que a tela terminou de
// carregar - sem isso, uma grade vazia parece defeito, e nao filtro.
export function BarraStatusGrade({
  exibidos,
  total,
  estado = "Pronto",
}: {
  exibidos: number
  total: number
  estado?: string
}) {
  const rotulo =
    exibidos === total
      ? `${total} ${total === 1 ? "registro" : "registros"}`
      : `${exibidos} de ${total} ${total === 1 ? "registro" : "registros"}`

  return (
    <div className="flex items-center justify-between border-t border-slate-700 bg-slate-800 px-3 py-1.5 text-[11px] text-slate-300 print:hidden">
      <span>{rotulo}</span>
      <span className="text-slate-400">{estado}</span>
    </div>
  )
}
