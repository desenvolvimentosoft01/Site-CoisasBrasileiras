import { cookies } from "next/headers"
import { lerTokenSessao } from "@/lib/auth"
import { getConfiguracoes, getConfiguracoesMarca } from "@/lib/configuracoes"
import { statusConexaoBling } from "@/lib/bling"
import { ConfiguracoesConteudo } from "@/components/admin/configuracoes-conteudo"

const CHAVES = [
  "cep_origem",
  "frete_valor_base",
  "frete_gratis_acima_de",
  "cor_primaria",
  "taxa_mercadopago_percentual",
  "taxa_mercadopago_fixo",
  "aliquota_imposto_percentual",
  "regime_tributario",
  "clube_valor_mensalidade",
  "bling_loja_mercadolivre",
  "bling_loja_shopee",
  "cpf_obrigatorio_checkout",
]

// Campos de identidade/vitrine, salvos por marca (colorido/branco) - a tela
// abre sempre na marca "colorido" (mesmo comportamento de antes); o toggle
// pra "branco" busca esses campos de novo no client via /api/admin/configuracoes?marca=branco.
const CHAVES_MARCA = [
  "whatsapp",
  "whatsapp_mensagem",
  "instagram",
  "email_contato",
  "endereco_contato",
  "texto_sobre_nos",
  "banner_texto_topo",
  "nome_loja",
  "texto_rodape",
  "logo_url",
]

export default async function ConfiguracoesPage() {
  const cookieStore = await cookies()
  const sessao = await lerTokenSessao(cookieStore.get("admin_sessao")?.value)

  const [configuracoes, configuracoesMarca, blingStatus] = await Promise.all([
    getConfiguracoes(CHAVES),
    getConfiguracoesMarca(CHAVES_MARCA, "colorido"),
    // So admin pode ver/gerenciar a conexao do Bling - operador enxerga a aba,
    // mas sem status (mesmo comportamento de antes, quando o fetch client-side
    // batia num 403 da rota /api/admin/bling/status).
    sessao?.papel === "admin" ? statusConexaoBling() : Promise.resolve(null),
  ])

  return (
    <ConfiguracoesConteudo
      configuracoesIniciais={{
        whatsapp: configuracoesMarca.whatsapp || "",
        whatsapp_mensagem: configuracoesMarca.whatsapp_mensagem || "",
        instagram: configuracoesMarca.instagram || "",
        email_contato: configuracoesMarca.email_contato || "",
        endereco_contato: configuracoesMarca.endereco_contato || "",
        texto_sobre_nos: configuracoesMarca.texto_sobre_nos || "",
        cep_origem: configuracoes.cep_origem || "",
        frete_valor_base: configuracoes.frete_valor_base || "",
        frete_gratis_acima_de: configuracoes.frete_gratis_acima_de || "",
        banner_texto_topo: configuracoesMarca.banner_texto_topo || "",
        nome_loja: configuracoesMarca.nome_loja || "",
        cor_primaria: configuracoes.cor_primaria || "",
        texto_rodape: configuracoesMarca.texto_rodape || "",
        logo_url: configuracoesMarca.logo_url || "",
        taxa_mercadopago_percentual: configuracoes.taxa_mercadopago_percentual || "",
        taxa_mercadopago_fixo: configuracoes.taxa_mercadopago_fixo || "",
        aliquota_imposto_percentual: configuracoes.aliquota_imposto_percentual || "",
        regime_tributario: configuracoes.regime_tributario || "",
        clube_valor_mensalidade: configuracoes.clube_valor_mensalidade || "",
        bling_loja_mercadolivre: configuracoes.bling_loja_mercadolivre || "",
        bling_loja_shopee: configuracoes.bling_loja_shopee || "",
        cpf_obrigatorio_checkout: configuracoes.cpf_obrigatorio_checkout || "",
      }}
      blingStatus={blingStatus}
    />
  )
}
