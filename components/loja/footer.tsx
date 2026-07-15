import Image from "next/image"
import { Truck, CreditCard, MessageCircle } from "lucide-react"

export function Footer() {
  return (
    <footer className="mt-16 border-t border-black/5 bg-emerald-950 text-emerald-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3 md:px-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Image src="/logo.webp" alt="Coisas Brasileiras" width={36} height={36} />
            <span className="font-heading text-lg font-semibold">Coisas Brasileiras</span>
          </div>
          <p className="text-sm text-emerald-200">
            Artesanato e produtos tipicamente brasileiros, direto pra sua casa.
          </p>
        </div>

        <div className="space-y-3 text-sm text-emerald-200">
          <div className="flex items-center gap-2">
            <Truck size={18} />
            Envio para todo o Brasil
          </div>
          <div className="flex items-center gap-2">
            <CreditCard size={18} />
            Pix, cartao e boleto
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle size={18} />
            Atendimento via WhatsApp
          </div>
        </div>

        <div className="text-sm text-emerald-300">
          <p>&copy; {new Date().getFullYear()} Coisas Brasileiras. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
