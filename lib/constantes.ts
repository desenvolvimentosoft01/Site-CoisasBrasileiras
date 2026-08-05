// Constantes sem nenhuma dependencia de servidor (sem checagem de env,
// sem crypto) - de proposito num arquivo a parte de lib/auth.ts, pra poder
// ser importado com seguranca por componentes client ("use client"). Se
// isso fosse exportado de lib/auth.ts, o bundler levaria o modulo inteiro
// (inclusive a checagem de AUTH_SECRET) pro navegador, que quebra em runtime
// porque essa variavel de ambiente nao existe no client.
export const EMAIL_DESENVOLVEDOR = "desenvolvimentosoft01@gmail.com"
