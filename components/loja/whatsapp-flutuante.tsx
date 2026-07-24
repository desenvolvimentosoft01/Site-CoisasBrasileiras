import Link from "next/link"
import { MessageCircle } from "lucide-react"

// Mensagem padrao de contato - o numero vem da configuracao da loja
// (Configuracoes > Contato no admin). Sem numero configurado, o botao nao aparece.
const MENSAGEM_PADRAO = "Olá, quero saber mais sobre os seus produtos"

export function WhatsappFlutuante({
  whatsapp,
  mensagem,
}: {
  whatsapp: string | null
  mensagem: string | null
}) {
  const digitos = whatsapp?.replace(/\D/g, "")
  if (!digitos) return null

  const href = `https://wa.me/55${digitos}?text=${encodeURIComponent(mensagem || MENSAGEM_PADRAO)}`

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110"
      aria-label="Falar no WhatsApp"
    >
      <MessageCircle size={28} />
    </Link>
  )
}
