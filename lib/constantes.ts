// Constantes sem nenhuma dependencia de servidor (sem checagem de env,
// sem crypto) - de proposito num arquivo a parte de lib/auth.ts, pra poder
// ser importado com seguranca por componentes client ("use client"). Se
// isso fosse exportado de lib/auth.ts, o bundler levaria o modulo inteiro
// (inclusive a checagem de AUTH_SECRET) pro navegador, que quebra em runtime
// porque essa variavel de ambiente nao existe no client.
export const EMAIL_DESENVOLVEDOR = "desenvolvimentosoft01@gmail.com"

// Nome do produto (o sistema), diferente do nome da loja que o cliente
// configura em Configuracoes. Aparece no rodape do DANFE, no cabecalho do
// admin e nos e-mails - todo lugar onde a pergunta e "que sistema gerou
// isso?". Quem assina como fabricante do software e a In Mente Agencia.
export const NOME_SISTEMA = "In Mente Gestão"
export const FABRICANTE_SISTEMA = "In Mente Agência"

// Contato da agencia, exibido na tela de entrada do sistema. Fica aqui (e nao
// em Configuracoes) de proposito: e o contato de quem faz o sistema, nao da
// loja que usa - o cliente nao deve poder trocar por engano.
export const CONTATO_FABRICANTE = {
  email: "desenvolvimentosoft01@gmail.com",
  telefone: "(18) 99669-2266",
  cidade: "Araçatuba-SP",
}
