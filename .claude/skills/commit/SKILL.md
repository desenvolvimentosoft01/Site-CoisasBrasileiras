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
4. **Antes de commitar, verifique se a mudança desatualiza o `README.md`** e atualize junto, no mesmo commit. Não é para reescrever o README a cada commit — é para conferir estes pontos, que são os que costumam ficar para trás:
   - **Migrations**: o README cita o intervalo aplicado (ex: "de `000` até `044`"). Migration nova = atualizar o número.
   - **Variáveis de ambiente**: variável nova, removida ou que mudou de obrigatória/opcional precisa aparecer na tabela de env vars (e no `.env.example`).
   - **Funcionalidade ou tela nova**: se o README lista o que o sistema faz, a funcionalidade nova entra lá.
   - **Deploy, infraestrutura ou dependência nova**: mudou como roda, onde roda ou o que precisa instalar, o README acompanha.

   Vale o mesmo raciocínio para os documentos em `DOCS/` que descrevam o que foi mexido (ex: `tecnico.md` para módulo novo, `bling-descricao-app.md` se a integração com o Bling mudar). Documentação que mente é pior que documentação ausente — já aconteceu de o `vercel.json` descrever crons que nunca rodaram em produção.
5. Nunca use `git add -A` ou `git add .` — adicione apenas os arquivos relevantes pelo nome.
5.1. **Sempre commitar por módulo, um commit por assunto** — nunca juntar várias mudanças sem relação num commit só. Se a pendência mexeu em Notas Fiscais, no DANFE e na tela de Configurações, são três commits, cada um com sua mensagem explicando o *porquê* daquele módulo. Isso vale mesmo quando o usuário só disse "commita tudo": "tudo" significa não deixar nada de fora, não amontoar num commit só.
   - Se um mesmo arquivo carrega mudanças de dois módulos (ex: `admin-shell.tsx` com o ícone de um módulo e o item de menu de outro), separe as partes — dá pra desfazer temporariamente a parte do segundo módulo, commitar a primeira e recolocar — em vez de misturar os dois assuntos.
   - Mudanças que o usuário fez em paralelo (não suas) também entram como commit próprio, com mensagem que descreva o que elas fazem.
6. Não inclua arquivos que pareçam conter segredos (`.env`, `.env.local`, credenciais) sem avisar o usuário.
7. Crie o commit com a mensagem via heredoc, terminando com:
   ```
   Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
   ```
8. Depois do commit, rode `git push` para a branch escolhida no passo 2 automaticamente — sem perguntar de novo, já que o destino já foi confirmado ali.
9. Rode `git status` ao final para confirmar que tudo foi commitado e enviado.

Regras específicas deste projeto:
- Se houver mudanças em `migrations/`, confirme que é um arquivo `.sql` novo e numerado (ex: `001_algo.sql`), nunca uma edição de uma migration já aplicada — o usuário roda as migrations manualmente, então a numeração/ordem importa.
- Nunca use `--no-verify`, `--force` ou outras flags destrutivas, a menos que o usuário peça explicitamente.
