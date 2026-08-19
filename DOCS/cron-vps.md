# Tarefas agendadas (cron) na VPS

A produção roda numa **VPS da Hostinger**, não na Vercel. Antes, os agendamentos
estavam declarados em `vercel.json` (Vercel Cron) — que só funciona quando o
projeto está hospedado na Vercel. Na prática isso significa que **as rotas
`/api/cron/*` existiam mas ninguém as chamava em produção**. O `vercel.json` foi
removido e o disparo passou para o crontab do próprio servidor.

## O que roda hoje

| Rota | O que faz | Horário sugerido |
|------|-----------|------------------|
| `/api/cron/notas-bling-pendentes` | Verifica notas de entrada novas no Bling, atualiza o contador de pendentes e avisa o admin por e-mail | 09h BRT |
| `/api/cron/importar-pedidos-marketplace` | Importa pedidos de Mercado Livre/Shopee que chegaram no Bling | 10h BRT |

## Pré-requisito: `CRON_SECRET`

As duas rotas **exigem** a variável `CRON_SECRET` e o header
`Authorization: Bearer <secret>`. Sem a variável definida, elas respondem `401` —
falham fechado de propósito, para que a rota nunca fique aberta na internet por
esquecimento de configuração.

Gere um valor aleatório e coloque no `.env` do projeto na VPS:

```bash
openssl rand -hex 32
```

```
CRON_SECRET=<o valor gerado>
```

Depois reinicie o processo do Next.js (`pm2 restart <app>` ou
`systemctl restart <servico>`), porque a variável é lida na inicialização.

## Instalar no crontab

O script `scripts/cron-vps.sh` carrega o `.env` do projeto, chama a rota com o
header de autorização e escreve o resultado no log. Ele precisa ser executável:

```bash
chmod +x /caminho/do/projeto/scripts/cron-vps.sh
```

Abra o crontab do usuário que roda a aplicação (`crontab -e`) e adicione:

```cron
# Notificação de notas de fornecedor pendentes no Bling — 09h BRT
0 9 * * * /caminho/do/projeto/scripts/cron-vps.sh notas-bling-pendentes >> /var/log/coisas-brasileiras-cron.log 2>&1

# Importação de pedidos de marketplace do Bling — 10h BRT
0 10 * * * /caminho/do/projeto/scripts/cron-vps.sh importar-pedidos-marketplace >> /var/log/coisas-brasileiras-cron.log 2>&1
```

Dois detalhes que costumam morder:

- **Fuso do servidor.** O cron usa o fuso do sistema. Confirme com `timedatectl`
  — se o servidor estiver em UTC, `0 9` é 06h no Brasil. Ajuste o horário ou
  acerte o fuso da máquina (`timedatectl set-timezone America/Sao_Paulo`).
- **O cron não tem o ambiente do shell de login.** Por isso o script carrega o
  `.env` explicitamente e usa caminho absoluto — não troque por caminho relativo.

## Verificar se está funcionando

Rodar na mão, como o cron rodaria:

```bash
/caminho/do/projeto/scripts/cron-vps.sh notas-bling-pendentes
```

Saída esperada (`HTTP 200` e um JSON de resultado):

```
2026-08-18 09:00:01 [notas-bling-pendentes] HTTP 200 {"verificado":true,"novas":0,"totalPendentes":0}
```

Se aparecer `HTTP 401`, o `CRON_SECRET` do `.env` não bate com o que a aplicação
carregou — normalmente é o processo que não foi reiniciado depois de editar o
`.env`.

Por padrão o script chama `http://127.0.0.1:3000`. Se a aplicação escuta em outra
porta, defina `CRON_URL_BASE` no `.env` (chamar pelo `127.0.0.1` evita depender
de DNS e do proxy reverso para uma chamada que é interna).

## Ao adicionar um cron novo

1. Criar a rota em `app/api/cron/<nome>/route.ts`, copiando a checagem do
   `CRON_SECRET` de uma das rotas existentes.
2. Adicionar a linha no crontab da VPS apontando para o mesmo script:
   `scripts/cron-vps.sh <nome>`.
3. Documentar na tabela no topo deste arquivo.
