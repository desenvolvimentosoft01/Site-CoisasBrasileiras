---
name: revisar_qualidade
description: Revisa a qualidade do código (indentação, nomes de função/variável, comentários) das mudanças recentes/pendentes do projeto Coisas Brasileiras, e roda o typecheck/lint. Use quando o usuário pedir para "revisar o código", "está bem escrito?", "está bem comentado?", "revisar nomes/indentação", ou sempre que terminar de criar uma feature nova ou corrigir um bug, antes de sugerir commit.
---

Ao ser chamada, identifique o escopo (arquivos alterados desde o último commit via `git diff --name-only`, ou os arquivos criados/editados na conversa atual se não houver diff) e avalie quatro pontos:

## A. Nomes de funções e variáveis
- Nomes em português, no padrão já usado no projeto (`resolverMarca`, `getConfiguracoesMarca`, `calcularOpcoesFrete`) — verbo + complemento pra funções, substantivo claro pra variáveis.
- Nada de nomes genéricos (`data`, `handleClick`, `temp`, `x`) quando existe um nome mais específico óbvio.
- Booleanos com prefixo que deixe claro que é booleano (`ativo`, `clubeAtivo`, `enviandoImagem`) — evitar `status` genérico pra um valor true/false.
- Nomes consistentes com o mesmo conceito em todo o arquivo (não misturar `clienteId`/`idCliente` pro mesmo campo).

## B. Indentação e formatação
- Indentação consistente com o resto do arquivo (2 espaços, sem mistura de tabs).
- Sem linhas trailing-whitespace ou blocos de código comentado esquecidos.
- JSX com fechamento de tags alinhado e legível — sinalizar apenas quando dificultar leitura de verdade, não por gosto estético.

## C. Comentários
- Funções com lógica não-óbvia (regra de negócio, cálculo, workaround, decisão de UX específica) têm um comentário curto explicando o *porquê*, não o *o quê*.
- Nenhum comentário órfão (explica código que não existe mais) ou redundante (repete o que o nome já diz).
- Todos os comentários em português, sem acento (convenção do projeto — ver CLAUDE.md).
- Texto visível ao usuário (labels, toasts, mensagens de erro) tem acentuação correta — se achar algo sem acento nessa categoria, aponte, mas a checagem completa é responsabilidade da skill `revisar_acentuacao`.

## D. Typecheck e lint
Depois da revisão manual, rode:
```
npx tsc --noEmit
npm run lint
```
Reporte qualquer erro/warning novo introduzido pelas mudanças do escopo (ignore warnings pré-existentes em arquivos não tocados).

## Saída
Reporte um resumo curto por categoria (arquivo:linha — problema), igual a um code review: liste só o que for relevante, sem inflar a lista com observações óbvias. Se uma categoria não tiver achados, diga "sem problemas notáveis" — não invente ressalvas.

Se o usuário pedir para corrigir os achados, aplique as correções diretamente (Edit/Write) e rode `tsc --noEmit` + `npm run lint` de novo antes de reportar como concluído. Não commite automaticamente — isso é responsabilidade da skill `commit`, chamada separadamente.
