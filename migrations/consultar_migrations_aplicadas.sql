-- ============================================================
-- CONSULTA — quais migrations já rodaram neste banco
-- Apenas leitura. NÃO é uma migration numerada (não faz parte do
-- histórico de schema) — depende da tabela criada em 004.
--
-- Compare o resultado com os arquivos em migrations/: qualquer número
-- de arquivo que não apareça aqui ainda não foi aplicado neste banco
-- e precisa ser rodado (na ordem).
-- ============================================================

SELECT versao, aplicada_em
FROM _migracoes_aplicadas
ORDER BY versao;
