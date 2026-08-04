---
name: commit
description: Commita e envia (push) as mudanças pendentes do projeto seguindo as convenções do Coisas Brasileiras. Use quando o usuário pedir para "commitar", "commit", "salvar no git", "subir as mudanças" ou "dar push".
---

Ao ser chamada, siga este fluxo:

1. Rode em paralelo: `git status`, `git diff` (staged e unstaged) e `git log --oneline -10` para entender o estilo de mensagens já usado no repositório.
2. Verifique a branch atual (`git branch --show-current`). Se o usuário não tiver dito explicitamente nesta conversa em qual branch commitar, **pergunte antes de commitar**: manter na branch atual, ir para `dev`, ou ir para `main`. Só pule essa pergunta se a instrução do usuário já deixou claro o destino.
3. Analise as mudanças e escreva uma mensagem de commit em **português**, curta (1-2 frases), focada no *porquê* da mudança, seguindo o padrão **Conventional Commits** com prefixo em inglês e descrição em português:
   - `feat:` nova funcionalidade
   - `fix:` correção de bug
   - `docs:` documentação (README, comentários)
   - `refactor:` reorganização de código sem mudar comportamento
   - `style:` formatação, responsividade, ajustes visuais
   - `chore:` tarefas de manutenção (deps, config, migrations)
   - `test:` testes

   Exemplos: `feat: adiciona listagem de produtos no catalogo`, `fix: corrige calculo do total do pedido`, `style: ajusta responsividade do carrinho no mobile`.
4. Nunca use `git add -A` ou `git add .` — adicione apenas os arquivos relevantes pelo nome.
5. Não inclua arquivos que pareçam conter segredos (`.env`, `.env.local`, credenciais) sem avisar o usuário.
6. Crie o commit com a mensagem via heredoc, terminando com:
   ```
   Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
   ```
7. Depois do commit, rode `git push` para a branch escolhida no passo 2 automaticamente — sem perguntar de novo, já que o destino já foi confirmado ali.
8. Rode `git status` ao final para confirmar que tudo foi commitado e enviado.

Regras específicas deste projeto:
- Se houver mudanças em `migrations/`, confirme que é um arquivo `.sql` novo e numerado (ex: `001_algo.sql`), nunca uma edição de uma migration já aplicada — o usuário roda as migrations manualmente, então a numeração/ordem importa.
- Nunca use `--no-verify`, `--force` ou outras flags destrutivas, a menos que o usuário peça explicitamente.
