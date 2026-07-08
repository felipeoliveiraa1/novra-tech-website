-- ============================================================
-- PATCH — para quem já rodou a versão inicial de
-- 20260707120000_leads_diagnostico.sql. Aplica só o delta:
--   1) limite de tamanho total do array `solucoes` (anti-abuso:
--      era o único campo texto sem teto num endpoint público)
--   2) privilégios em nível de coluna: anon só preenche os campos
--      do formulário — id/created_at ficam com os defaults do
--      servidor (impede backdating via POST direto na API)
-- Rode no SQL Editor. Pode rodar mais de uma vez sem problema.
-- ============================================================

alter table public.leads_diagnostico
  drop constraint if exists leads_diagnostico_limites;

alter table public.leads_diagnostico
  add constraint leads_diagnostico_limites check (
    char_length(coalesce(desafio, ''))      <= 200 and
    char_length(coalesce(impacto, ''))      <= 200 and
    coalesce(array_length(solucoes, 1), 0)  <= 12  and
    char_length(array_to_string(solucoes, ',')) <= 2000 and
    char_length(coalesce(faturamento, ''))  <= 100 and
    char_length(coalesce(investimento, '')) <= 100 and
    char_length(coalesce(urgencia, ''))     <= 200 and
    char_length(coalesce(decisao, ''))      <= 200 and
    char_length(nome)                       between 1 and 160 and
    char_length(empresa)                    between 1 and 160 and
    char_length(coalesce(cargo, ''))        <= 120 and
    char_length(coalesce(segmento, ''))     <= 120 and
    char_length(coalesce(funcionarios, '')) <= 40  and
    char_length(email)                      <= 254 and
    char_length(whatsapp)                   between 1 and 40 and
    char_length(coalesce(origem, ''))       <= 500 and
    char_length(coalesce(user_agent, ''))   <= 500
  );

revoke all on public.leads_diagnostico from anon;
grant insert (desafio, impacto, solucoes, faturamento, investimento, urgencia, decisao,
              nome, empresa, cargo, segmento, funcionarios, email, whatsapp, origem, user_agent)
  on public.leads_diagnostico to anon;
