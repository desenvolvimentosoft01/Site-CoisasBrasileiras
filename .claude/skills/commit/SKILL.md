---
name: commit
description: Commita e envia (push) as mudanças pendentes do projeto seguindo as convenções do Coisas Brasileiras. Use quando o usuário pedir para "commitar", "commit", "salvar no git", "subir as mudanças" ou "dar push".
---

Ao ser chamada, siga este fluxo:

1. Rode em paralelo: `git status`, `git diff` (staged e unstaged) e `git log --oneline -10` para entender o estilo de mensagens já usado no repositório.
2. Analise as mudanças e escreva uma mensagem de commit em **português**, curta (1-2 frases), focada no *porquê* da mudança, seguindo o padrão **Conventional Commits** com prefixo em inglês e descrição em português:
   - `feat:` nova funcionalidade
   - `fix:` correção de bug
   - `docs:` documentação (README, comentários)
   - `refactor:` reorganização de código sem mudar comportamento
   - `style:` formatação, responsividade, ajustes visuais
   - `chore:` tarefas de manutenção (deps, config, migrations)
   - `test:` testes

   Exemplos: `feat: adiciona listagem de produtos no catalogo`, `fix: corrige calculo do total do pedido`, `style: ajusta responsividade do carrinho no mobile`.
3. Nunca use `git add -A` ou `git add .` — adicione apenas os arquivos relevantes pelo nome.
4. Não inclua arquivos que pareçam conter segredos (`.env`, `.env.local`, credenciais) sem avisar o usuário.
5. Crie o commit com a mensagem via heredoc, terminando com:
   ```
   Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
   ```
6. Depois do commit, rode `git push` para a branch atual automaticamente — **sem perguntar antes**, pois esse é o fluxo já validado com o usuário.
7. Rode `git status` ao final para confirmar que tudo foi commitado e enviado.

Regras específicas deste projeto:
- Se houver mudanças em `migrations/`, confirme que é um arquivo `.sql` novo e numerado (ex: `001_algo.sql`), nunca uma edição de uma migration já aplicada — o usuário roda as migrations manualmente, então a numeração/ordem importa.
- Nunca use `--no-verify`, `--force` ou outras flags destrutivas, a menos que o usuário peça explicitamente.
