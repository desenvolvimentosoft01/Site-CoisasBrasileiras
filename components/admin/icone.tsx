import {
  AlertTriangle,
  ArrowRightCircle,
  Ban,
  BarChart3,
  CheckCircle2,
  Download,
  Eraser,
  Eye,
  FilePlus,
  FileText,
  LayoutDashboard,
  Mail,
  Megaphone,
  MessageCircle,
  Minus,
  Package,
  Palette,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Settings,
  ShoppingCart,
  Store,
  Table2,
  Trash2,
  TrendingUp,
  Truck,
  Users,
  Wallet,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react"

// Icones do sistema, no mesmo padrao do InMenteGestao: traco fino, monocromatico,
// com a cor vindo do significado da acao (azul consulta, ambar edita, vermelho
// remove, verde confirma). Os dois sistemas compartilham a mesma base e vao
// compartilhar o mesmo visual quando o ERP for portado pra la.
//
// O componente recebe o NOME DA FUNCAO ("excluir"), e nao o do desenho
// ("lixeira"): trocar o icone de uma acao um dia nao obriga a mexer em tela
// nenhuma.
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

const DESENHO: Record<NomeIcone, LucideIcon> = {
  novo: FilePlus,
  ver: Eye,
  editar: Pencil,
  excluir: Trash2,
  salvar: Save,
  limpar: Eraser,
  cancelar: X,
  confirmar: CheckCircle2,
  recusar: XCircle,
  bloquear: Ban,
  email: Mail,
  mensagem: MessageCircle,
  enviar: ArrowRightCircle,
  atualizar: RefreshCw,
  imprimir: Printer,
  baixar: Download,
  alerta: AlertTriangle,
  grade: Table2,
  visao_geral: LayoutDashboard,
  venda_balcao: Store,
  pedido_venda: ShoppingCart,
  orcamento: FileText,
  clientes: Users,
  produtos: Package,
  marketing: Megaphone,
  financeiro: Wallet,
  notas_fiscais: FileText,
  compras: Truck,
  relatorios: TrendingUp,
  configuracoes: Settings,
  cores: Palette,
  estoque: BarChart3,
  mais: Plus,
  menos: Minus,
}

// Cor por significado. Icone de modulo (menu) fica sem cor propria: quem manda
// ali e o estado do item (ativo/inativo), definido pela tela.
const COR: Partial<Record<NomeIcone, string>> = {
  novo: "text-blue-600",
  ver: "text-slate-500",
  editar: "text-blue-600",
  excluir: "text-red-500",
  salvar: "text-emerald-600",
  limpar: "text-amber-600",
  cancelar: "text-slate-500",
  confirmar: "text-emerald-600",
  recusar: "text-red-500",
  bloquear: "text-red-500",
  alerta: "text-amber-500",
  baixar: "text-emerald-600",
}

export function Icone({
  nome,
  tamanho = 16,
  className,
}: {
  nome: NomeIcone
  tamanho?: number
  className?: string
}) {
  const Desenho = DESENHO[nome]
  return <Desenho size={tamanho} strokeWidth={1.8} className={[COR[nome], className].filter(Boolean).join(" ")} />
}
