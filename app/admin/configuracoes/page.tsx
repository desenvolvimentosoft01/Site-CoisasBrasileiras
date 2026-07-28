import { cookies } from "next/headers"
import { lerTokenSessao } from "@/lib/auth"
import { getConfiguracoes } from "@/lib/configuracoes"
import { statusConexaoBling } from "@/lib/bling"
import { ConfiguracoesConteudo } from "@/components/admin/configuracoes-conteudo"

const CHAVES = [
  "whatsapp",
  "whatsapp_mensagem",
  "instagram",
  "email_contato",
  "cep_origem",
  "frete_valor_base",
  "frete_gratis_acima_de",
  "banner_texto_topo",
  "nome_loja",
  "cor_primaria",
  "texto_rodape",
  "logo_url",
  "taxa_mercadopago_percentual",
  "taxa_mercadopago_fixo",
  "taxa_pagbank_percentual",
  "taxa_pagbank_fixo",
  "aliquota_imposto_percentual",
  "regime_tributario",
  "clube_valor_mensalidade",
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
        whatsapp_mensagem: configuracoes.whatsapp_mensagem || "",
        instagram: configuracoes.instagram || "",
        email_contato: configuracoes.email_contato || "",
        cep_origem: configuracoes.cep_origem || "",
        frete_valor_base: configuracoes.frete_valor_base || "",
        frete_gratis_acima_de: configuracoes.frete_gratis_acima_de || "",
        banner_texto_topo: configuracoes.banner_texto_topo || "",
        nome_loja: configuracoes.nome_loja || "",
        cor_primaria: configuracoes.cor_primaria || "",
        texto_rodape: configuracoes.texto_rodape || "",
        logo_url: configuracoes.logo_url || "",
        taxa_mercadopago_percentual: configuracoes.taxa_mercadopago_percentual || "",
        taxa_mercadopago_fixo: configuracoes.taxa_mercadopago_fixo || "",
        taxa_pagbank_percentual: configuracoes.taxa_pagbank_percentual || "",
        taxa_pagbank_fixo: configuracoes.taxa_pagbank_fixo || "",
        aliquota_imposto_percentual: configuracoes.aliquota_imposto_percentual || "",
        regime_tributario: configuracoes.regime_tributario || "",
        clube_valor_mensalidade: configuracoes.clube_valor_mensalidade || "",
      }}
      blingStatus={blingStatus}
    />
  )
}
