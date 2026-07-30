import { getConfiguracoes } from "@/lib/configuracoes"
import { ConfiguracoesConteudo } from "@/components/admin/configuracoes-conteudo"

const CHAVES = [
  "whatsapp",
  "whatsapp_mensagem",
  "instagram",
  "email_contato",
  "endereco_contato",
  "texto_sobre_nos",
  "cep_origem",
  "frete_valor_base",
  "frete_gratis_acima_de",
  "banner_texto_topo",
  "nome_loja",
  "cor_primaria",
  "texto_rodape",
  "logo_url",
  "clube_valor_mensalidade",
]

export default async function ConfiguracoesPage() {
  const configuracoes = await getConfiguracoes(CHAVES)

  return (
    <ConfiguracoesConteudo
      configuracoesIniciais={{
        whatsapp: configuracoes.whatsapp || "",
        whatsapp_mensagem: configuracoes.whatsapp_mensagem || "",
        instagram: configuracoes.instagram || "",
        email_contato: configuracoes.email_contato || "",
        endereco_contato: configuracoes.endereco_contato || "",
        texto_sobre_nos: configuracoes.texto_sobre_nos || "",
        cep_origem: configuracoes.cep_origem || "",
        frete_valor_base: configuracoes.frete_valor_base || "",
        frete_gratis_acima_de: configuracoes.frete_gratis_acima_de || "",
        banner_texto_topo: configuracoes.banner_texto_topo || "",
        nome_loja: configuracoes.nome_loja || "",
        cor_primaria: configuracoes.cor_primaria || "",
        texto_rodape: configuracoes.texto_rodape || "",
        logo_url: configuracoes.logo_url || "",
        clube_valor_mensalidade: configuracoes.clube_valor_mensalidade || "",
      }}
    />
  )
}
