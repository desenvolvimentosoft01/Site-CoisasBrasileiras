import Link from "next/link"
import { MapPin, Mail, MessageCircle, AtSign } from "lucide-react"
import { getConfiguracoesMarca } from "@/lib/configuracoes"
import { resolverMarcaAtual } from "@/lib/marca"

export default async function ContatoPage() {
  // Contato e por marca: cada site tem os proprios canais (ver migration 055).
  const marca = await resolverMarcaAtual()
  const config = await getConfiguracoesMarca(
    ["whatsapp", "whatsapp_mensagem", "instagram", "email_contato", "endereco_contato"],
    marca
  )
  const whatsappDigitos = config.whatsapp?.replace(/\D/g, "")

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 md:px-6">
      <h1 className="font-heading text-3xl font-semibold text-emerald-950">Contato</h1>
      <p className="text-neutral-600">Fale com a gente por qualquer um dos canais abaixo.</p>

      <div className="space-y-4 rounded-lg border border-black/5 bg-white p-6">
        {whatsappDigitos && (
          <Link
            href={`https://wa.me/55${whatsappDigitos}${
              config.whatsapp_mensagem ? `?text=${encodeURIComponent(config.whatsapp_mensagem)}` : ""
            }`}
            target="_blank"
            className="flex items-center gap-3 text-neutral-700 hover:text-primary"
          >
            <MessageCircle size={20} />
            WhatsApp
          </Link>
        )}
        {config.email_contato && (
          <Link
            href={`mailto:${config.email_contato}`}
            className="flex items-center gap-3 text-neutral-700 hover:text-primary"
          >
            <Mail size={20} />
            {config.email_contato}
          </Link>
        )}
        {config.instagram && (
          <Link
            href={`https://instagram.com/${config.instagram.replace("@", "")}`}
            target="_blank"
            className="flex items-center gap-3 text-neutral-700 hover:text-primary"
          >
            <AtSign size={20} />
            {config.instagram}
          </Link>
        )}
        {config.endereco_contato && (
          <div className="flex items-center gap-3 text-neutral-700">
            <MapPin size={20} />
            {config.endereco_contato}
          </div>
        )}

        {!whatsappDigitos && !config.email_contato && !config.instagram && !config.endereco_contato && (
          <p className="text-neutral-500">Nenhum canal de contato cadastrado ainda.</p>
        )}
      </div>
    </div>
  )
}
