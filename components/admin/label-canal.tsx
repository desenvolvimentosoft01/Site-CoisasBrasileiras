import { Globe, ShoppingBag, Store } from "lucide-react"
import { WhatsappIcon } from "@/components/icons/whatsapp-icon"
import { InstagramIcon } from "@/components/icons/instagram-icon"
import { CANAL_LABEL, type CanalPedido } from "@/lib/canal-pedido"

const CORES: Record<CanalPedido, string> = {
  site: "text-blue-500",
  whatsapp: "text-emerald-600",
  instagram: "text-pink-500",
  balcao: "text-slate-500",
  mercadolivre: "text-yellow-500",
  shopee: "text-orange-500",
}

export function LabelCanal({ canal, className }: { canal: CanalPedido | null; className?: string }) {
  if (!canal) return <span className={className}>-</span>

  const Icone =
    canal === "whatsapp"
      ? WhatsappIcon
      : canal === "instagram"
        ? InstagramIcon
        : canal === "site"
          ? Globe
          : canal === "mercadolivre" || canal === "shopee"
            ? ShoppingBag
            : Store

  return (
    <span className={`inline-flex items-center gap-1.5 ${className ?? ""}`}>
      <Icone size={13} className={CORES[canal]} />
      {CANAL_LABEL[canal]}
    </span>
  )
}
