---
name: revisar_acentuacao
description: Revisa as telas do sistema (admin e loja) atrás de texto visível ao usuário sem acentuação correta em português - botões, labels, mensagens de erro/sucesso, placeholders. Use quando o usuário pedir para "revisar acentuação", "checar acentos", "textos sem acento", "revisar os textos das telas" ou similar.
---

Ao ser chamada, identifique o escopo (todas as telas por padrão, ou só os arquivos que o usuário apontar) e faça uma auditoria de texto **visível ao usuário** em português — nunca de comentários de código.

## O que procurar

Texto renderizado pro usuário sem acentuação correta ou com acentuação errada:
- Texto de botões (`<Button>texto</Button>`)
- `<Label>`, `<h1>`-`<h6>`, `<p>`, `<span>` com texto literal
- Mensagens de `toast.success(...)`, `toast.error(...)`, `alert`, `confirm`
- `placeholder="..."`, `title="..."`, `aria-label="..."`
- Textos de erro retornados por rotas de API (`{ erro: "..." }`) que acabam aparecendo na tela
- Opções de `<select>`/`<option>`

## O que NUNCA reportar

- Comentários de código (`//` ou `/* */`) — este projeto escreve comentários em português **sem acento de propósito** (evita problema de encoding em alguns editores/terminais). Isso é convenção esperada, não é bug.
- Nomes de variáveis/funções/chaves de objeto em código.
- Valores técnicos usados como enum/status (ex: `"pendente"`, `"cancelada"` comparados/gravados no banco) — só reporte se o mesmo texto também aparecer renderizado como label pro usuário.
- Texto em inglês legítimo (nomes técnicos, bibliotecas).

## Escopo de busca

`app/(loja)/**/*.tsx`, `app/admin/**/*.tsx`, `components/loja/**/*.tsx`, `components/admin/**/*.tsx`, e rotas de API em `app/api/**/*.ts` (só mensagens de erro/sucesso retornadas ao cliente).

## Como executar

1. Se o escopo for "todas as telas", delegue a um agente Explore em background (a busca é ampla e não precisa bloquear a conversa) — dê a ele a lista de palavras comuns que costumam aparecer sem acento (não, você, código, número, endereço, serviço, usuário, preço, opção/opções, ação/ações, situação, confirmação, informação/informações, atenção, obrigatório, inválido, etc.) e instrua a confirmar, arquivo por arquivo, que cada achado é texto de fato renderizado (não comentário, não log interno, não chave técnica) antes de reportar.
2. Se o escopo for um arquivo ou tela específica, pode ler direto e revisar sem precisar de agente.
3. Peça o relatório final organizado por arquivo, com linha, texto encontrado e correção sugerida.

## Ao corrigir

Se o usuário pedir para aplicar as correções, use Edit por arquivo (nunca reescreva o arquivo inteiro). Depois de corrigir, rode `tsc --noEmit` pra garantir que nenhuma string usada como chave/comparação foi alterada por engano (ex: trocar `"nao"` por `"não"` num valor de enum quebraria a lógica — só corrija texto visível). Não commite automaticamente — isso é responsabilidade da skill `commit`, chamada separadamente.
