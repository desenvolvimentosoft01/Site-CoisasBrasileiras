# Mover o banco para São Paulo (Supabase)

Motivo: o banco está em `aws-1-us-west-2` (Oregon) e a VPS não. Cada ida ao banco custa a viagem de ida e volta, e uma tela que faz 7 consultas paga isso 7 vezes. Aproximar o banco da VPS resolve o admin **e** o site — enquanto aproximar a VPS do banco deixaria o site lento para o cliente final brasileiro.

## Antes de começar

**O Supabase não muda a região de um projeto existente.** O caminho é criar um projeto novo em São Paulo (`sa-east-1`) e levar os dados para lá. Não existe botão de "mudar região".

**Meça primeiro.** Se ainda não fez, rode na VPS:

```bash
time psql "$DATABASE_URL" -c "SELECT 1"
```

Acima de ~100ms, a distância é o problema e a migração vale a pena. Abaixo de ~30ms, o gargalo é outro e essa migração não vai resolver — melhor investigar antes de trabalhar à toa.

## Roteiro

### 1. Criar o projeto novo

No painel do Supabase, novo projeto com região **South America (São Paulo)**. Guarde a senha do banco — ela só aparece uma vez.

### 2. Fazer o backup do banco atual

Na sua máquina ou na VPS, com a `DATABASE_URL` **antiga**:

```bash
pg_dump "$DATABASE_URL_ANTIGA" \
  --no-owner --no-privileges --no-comments \
  --exclude-schema='supabase_functions|graphql|graphql_public|realtime|storage|vault|extensions|pgbouncer|auth' \
  -f backup-coisas-brasileiras.sql
```

`--no-owner --no-privileges` evita erro de permissão no restore (os papéis do projeto novo têm outros nomes). Os schemas excluídos são internos do Supabase e já existem no projeto novo — restaurar por cima dá conflito.

Confira que o arquivo não saiu vazio antes de seguir: `wc -l backup-coisas-brasileiras.sql`.

### 3. Restaurar no projeto novo

Use a connection string **direta** do projeto novo (porta 5432, não a do pooler) — restore por pooler costuma falhar no meio:

```bash
psql "$DATABASE_URL_NOVA_DIRETA" -f backup-coisas-brasileiras.sql
```

Erros de `extension already exists` são normais e podem ser ignorados. Qualquer outro erro, pare e leia antes de continuar.

### 4. Conferir que os dados chegaram

```sql
SELECT COUNT(*) FROM TAB_PRODUTO;
SELECT COUNT(*) FROM TAB_PEDIDO;
SELECT versao FROM _migracoes_aplicadas ORDER BY versao DESC LIMIT 5;
```

As contagens têm que bater com as do banco antigo, e a última migration aplicada tem que ser a mesma.

### 5. Trocar a `DATABASE_URL` na VPS

Use a string do **pooler em transaction mode** (porta `6543`), e não a de session mode (`5432`):

```
postgresql://postgres.PROJETO:SENHA@aws-1-sa-east-1.pooler.supabase.com:6543/postgres
```

O transaction mode aceita muito mais conexões simultâneas — foi o session mode que causou o `EMAXCONNSESSION` de 19/08. Com ele, dá para subir o `DB_POOL_MAX` de volta (5 a 10 por instância) e ganhar mais um tanto de velocidade.

Depois: `npm run build` e reiniciar o processo.

### 6. Testar antes de considerar pronto

- Entrar no admin
- Abrir Visão Geral, Produtos e Notas Fiscais
- Fazer uma venda de teste no balcão
- Abrir o site público e adicionar algo no carrinho

## Cuidados

**Escolha o horário.** Tudo que for gravado no banco antigo *depois* do `pg_dump` se perde. Faça fora do horário de venda, e do dump até a troca da `DATABASE_URL` o ideal é ninguém estar usando o sistema.

**Não apague o projeto antigo no mesmo dia.** Deixe alguns dias no ar como rede de segurança — se algo tiver ficado para trás, os dados ainda estão lá.

**Guarde o arquivo do dump** fora da VPS até ter certeza de que o novo está redondo.

**As credenciais mudam**: quem tiver a `DATABASE_URL` antiga anotada em algum lugar (script de backup, `.env.local` da sua máquina) precisa atualizar também.
