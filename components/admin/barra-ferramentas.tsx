import {
  FilePlus,
  Pencil,
  Copy,
  Trash2,
  Save,
  Eraser,
  X,
  Ban,
  Mail,
  MessageCircle,
  CheckCircle2,
  XCircle,
  ArrowRightCircle,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Icone, type NomeIcone } from "@/components/admin/icone"
import type { LucideIcon } from "lucide-react"

// Traduz o componente lucide que a tela passa pro nome da ACAO no nosso
// catalogo de icones (components/admin/icone.tsx) - e o que da a cor certa a
// cada botao sem que as 25 telas de cadastro precisem saber disso. Icone sem
// mapeamento aqui continua caindo no <btn.icon> cru.
const iconePorLucide = new Map<LucideIcon, NomeIcone>([
  [FilePlus, "novo"],
  [Pencil, "editar"],
  [Copy, "duplicar"],
  [Trash2, "excluir"],
  [Save, "salvar"],
  [Eraser, "limpar"],
  [X, "cancelar"],
  [Ban, "bloquear"],
  [Mail, "email"],
  [MessageCircle, "mensagem"],
  [CheckCircle2, "confirmar"],
  [XCircle, "recusar"],
  [ArrowRightCircle, "enviar"],
  [RefreshCw, "atualizar"],
])

export type BotaoToolbar =
  | { separator: true }
  | {
      label: string
      icon: LucideIcon
      onClick: () => void
      variante?: "default" | "primary" | "danger" | "success" | "warning"
      disabled?: boolean
      separator?: false
      title?: string
    }

interface Props {
  botoes: BotaoToolbar[]
  titulo?: string
  extra?: React.ReactNode
}

// Classes de app/globals.css, e nao utilitarios do Tailwind: assim a cor de
// cada acao sai da tela de Cores em vez de estar fixa aqui.
const varianteCss: Record<string, string> = {
  default: "text-slate-700 bg-white border-slate-300 hover:bg-slate-50 hover:text-slate-900",
  primary: "acao-primaria",
  danger: "acao-perigo",
  success: "acao-sucesso",
  warning: "acao-alerta",
}

// Barra de acoes com icone em cima do rotulo, no mesmo padrao visual do
// InMenteGestao - usada nas telas de cadastro (grade e formulario) em vez de
// botoes de texto soltos.
export function BarraFerramentas({ botoes, titulo, extra }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2.5 print:hidden">
      {titulo && (
        <span className="mr-1 border-r border-slate-300 px-2 pr-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {titulo}
        </span>
      )}
      {botoes.map((btn, indice) =>
        btn.separator ? (
          <div key={indice} className="mx-1 h-7 w-px bg-slate-300" />
        ) : (
          <button
            key={indice}
            type="button"
            onClick={btn.onClick}
            disabled={btn.disabled}
            title={btn.title}
            className={cn(
              "flex min-w-[68px] flex-col items-center gap-1 rounded-md border px-3 py-2 text-[11px] font-medium transition-all",
              "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
              varianteCss[btn.variante ?? "default"]
            )}
          >
            {iconePorLucide.has(btn.icon) ? (
              <Icone nome={iconePorLucide.get(btn.icon)!} tamanho={18} />
            ) : (
              <btn.icon size={16} strokeWidth={2} />
            )}
            {btn.label}
          </button>
        )
      )}
      {extra && <div className="ml-auto flex items-center">{extra}</div>}
    </div>
  )
}
