import { cookies } from "next/headers"
import { lerTokenSessao } from "@/lib/auth"
import { getConfiguracoes } from "@/lib/configuracoes"
import { statusConexaoBling } from "@/lib/bling"
import { ConfiguracoesConteudo } from "@/components/admin/configuracoes-conteudo"

const CHAVES = [
  "whatsapp",
  "instagram",
  "email_contato",
  "frete_valor_base",
  "frete_gratis_acima_de",
  "banner_texto_topo",
  "nome_loja",
  "cor_primaria",
  "texto_rodape",
]

export default async function ConfiguracoesPage() {
  const cookieStore = await cookies()
  const sessao = await lerTokenSessao(cookieStore.get("admin_sessao")?.value)

  const [configuracoes, blingStatus] = await Promise.all([
    getConfiguracoes(CHAVES),
    // So admin pode ver/gerenciar a conexao do Bling - operador enxerga a aba,
    // mas sem status (mesmo comportamento de antes, quando o fetch client-side
    // batia num 403 da rota /api/admin/bling/status).
    sessao?.papel === "admin" ? statusConexaoBling() : Promise.resolve(null),
  ])

  return (
    <ConfiguracoesConteudo
      configuracoesIniciais={{
        whatsapp: configuracoes.whatsapp || "",
        instagram: configuracoes.instagram || "",
        email_contato: configuracoes.email_contato || "",
        frete_valor_base: configuracoes.frete_valor_base || "",
        frete_gratis_acima_de: configuracoes.frete_gratis_acima_de || "",
        banner_texto_topo: configuracoes.banner_texto_topo || "",
        nome_loja: configuracoes.nome_loja || "",
        cor_primaria: configuracoes.cor_primaria || "",
        texto_rodape: configuracoes.texto_rodape || "",
      }}
      blingStatus={blingStatus}
    />
  )
}
