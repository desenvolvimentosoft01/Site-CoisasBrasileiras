---
name: iniciar_servidor_local
description: Sobe o servidor de desenvolvimento local do Coisas Brasileiras (npm run dev) e confirma que ficou pronto. Use quando o usuário pedir para "iniciar o servidor local", "rodar o projeto", "subir o app", "npm run dev" ou similar.
---

Ao ser chamado, siga este fluxo:

1. Verifique se já existe um processo em background rodando `npm run dev` nesta sessão (task já em andamento). Se sim, não suba outro — apenas informe a URL já disponível.
2. Caso contrário, rode `npm run dev` na raiz do projeto **em background** (`run_in_background: true`), já que é um processo de longa duração.
3. Leia o arquivo de output da task algumas vezes (com pequenas pausas via `sleep`, se necessário) até aparecer a linha `✓ Ready in Xs` ou algum erro de build.
4. Reporte ao usuário a URL local (`http://localhost:3000` por padrão) assim que o servidor estiver pronto. Se houver erro de compilação, mostre a mensagem de erro relevante em vez de dizer que subiu.
5. Não rode `npm install` automaticamente antes — só sugira isso se o erro indicar dependência faltando.
