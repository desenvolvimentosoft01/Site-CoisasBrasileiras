import {
  FilePlus,
  Pencil,
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
import type { LucideIcon } from "lucide-react"

// Emoji em vez de icone de linha nos botoes da barra, mapeado pelo
// componente lucide que a tela passa (identidade, nao label) - assim as 25
// telas de cadastro ganham o visual "realista" sem precisar editar cada
// uma. Icone sem mapeamento aqui continua caindo no <btn.icon> de linha.
const emojiPorIcone = new Map<LucideIcon, string>([
  [FilePlus, "🆕"],
  [Pencil, "✏️"],
  [Trash2, "🗑️"],
  [Save, "💾"],
  [Eraser, "🧹"],
  [X, "✖️"],
  [Ban, "🚫"],
  [Mail, "✉️"],
  [MessageCircle, "💬"],
  [CheckCircle2, "✅"],
  [XCircle, "❌"],
  [ArrowRightCircle, "➡️"],
  [RefreshCw, "🔄"],
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

const varianteCss: Record<string, string> = {
  default: "text-slate-700 bg-white border-slate-300 hover:bg-slate-50 hover:text-slate-900",
  primary: "text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100",
  danger: "text-red-700 bg-red-50 border-red-200 hover:bg-red-100",
  success: "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
  warning: "text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100",
}

// Barra de acoes com icone em cima do rotulo, no mesmo padrao visual do
// InMenteGestao - usada nas telas de cadastro (grade e formulario) em vez de
// botoes de texto soltos.
export function BarraFerramentas({ botoes, titulo, extra }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-slate-300 bg-slate-100 px-2 py-1.5 print:hidden">
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
              "flex min-w-14 flex-col items-center gap-0.5 rounded border px-3 py-1.5 text-[11px] font-semibold transition-all",
              "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
              varianteCss[btn.variante ?? "default"]
            )}
          >
            {emojiPorIcone.has(btn.icon) ? (
              <span className="text-base leading-none">{emojiPorIcone.get(btn.icon)}</span>
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
