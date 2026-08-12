import Image from "next/image"
import Link from "next/link"
import { Truck, CreditCard, MessageCircle, AtSign, Mail } from "lucide-react"
import { getConfiguracoes, getConfiguracoesMarca } from "@/lib/configuracoes"
import { resolverMarcaAtual } from "@/lib/marca"

export async function Footer() {
  const marca = await resolverMarcaAtual()
  const [config, configMarca] = await Promise.all([
    getConfiguracoes(["whatsapp", "whatsapp_mensagem", "instagram", "email_contato", "texto_rodape"]),
    getConfiguracoesMarca(["nome_loja", "logo_url"], marca),
  ])
  const whatsappDigitos = config.whatsapp?.replace(/\D/g, "")
  const nomeLoja = configMarca.nome_loja || "Coisas Brasileiras"
  // Porcelanas (marca "branco") pede um rodape clean, claro; o site colorido
  // mantem o rodape escuro original.
  const clean = marca === "branco"

  return (
    <footer
      className={
        clean
          ? "mt-16 border-t border-primary/15 bg-primary/5 text-foreground"
          : "mt-16 border-t border-black/5 bg-emerald-950 text-emerald-50"
      }
    >
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3 md:px-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Image src={configMarca.logo_url || "/logo.webp"} alt={nomeLoja} width={36} height={36} />
            <span className="font-heading text-lg font-semibold">{nomeLoja}</span>
          </div>
          <p className={clean ? "text-sm text-muted-foreground" : "text-sm text-emerald-200"}>
            {config.texto_rodape ||
              "Porcelanas decorativas, presentes, artigos religiosos e perfumaria, direto pra sua casa."}
          </p>
        </div>

        <div className={clean ? "space-y-3 text-sm text-muted-foreground" : "space-y-3 text-sm text-emerald-200"}>
          <Link href="/sobre" className={clean ? "block hover:text-primary" : "block hover:text-white"}>
            Sobre nós
          </Link>
          <Link href="/contato" className={clean ? "block hover:text-primary" : "block hover:text-white"}>
            Contato
          </Link>
          <Link href="/politica-de-privacidade" className={clean ? "block hover:text-primary" : "block hover:text-white"}>
            Política de Privacidade
          </Link>
          <Link href="/termos-de-uso" className={clean ? "block hover:text-primary" : "block hover:text-white"}>
            Termos de Uso
          </Link>
          <div className="flex items-center gap-2">
            <Truck size={18} />
            Envio para todo o Brasil
          </div>
          <div className="flex items-center gap-2">
            <CreditCard size={18} />
            Pix, cartão e boleto
          </div>
          {whatsappDigitos && (
            <Link
              href={`https://wa.me/55${whatsappDigitos}${
                config.whatsapp_mensagem ? `?text=${encodeURIComponent(config.whatsapp_mensagem)}` : ""
              }`}
              target="_blank"
              rel="noopener noreferrer"
              className={clean ? "flex items-center gap-2 hover:text-primary" : "flex items-center gap-2 hover:text-white"}
            >
              <MessageCircle size={18} />
              Atendimento via WhatsApp
            </Link>
          )}
          {config.instagram && (
            <Link
              href={`https://instagram.com/${config.instagram.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className={clean ? "flex items-center gap-2 hover:text-primary" : "flex items-center gap-2 hover:text-white"}
            >
              <AtSign size={18} />
              {config.instagram}
            </Link>
          )}
          {config.email_contato && (
            <Link
              href={`mailto:${config.email_contato}`}
              className={clean ? "flex items-center gap-2 hover:text-primary" : "flex items-center gap-2 hover:text-white"}
            >
              <Mail size={18} />
              {config.email_contato}
            </Link>
          )}
        </div>

        <div className={clean ? "space-y-1 text-sm text-muted-foreground" : "space-y-1 text-sm text-emerald-300"}>
          <p>&copy; {new Date().getFullYear()} {nomeLoja}. Todos os direitos reservados.</p>
          <p className={clean ? "text-xs text-muted-foreground/70" : "text-xs text-emerald-400"}>Desenvolvido por InMente Agência</p>
        </div>
      </div>
    </footer>
  )
}
