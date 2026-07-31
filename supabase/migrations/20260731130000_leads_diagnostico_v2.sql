-- Formulário v2: perguntas que revelam o gargalo, não só qualificam o lead.
-- Seguro de rodar mais de uma vez (if not exists) e não toca nos dados existentes.
-- A coluna antiga `solucoes` fica preservada por causa dos leads já capturados.

alter table public.leads_diagnostico
  add column if not exists perde_tempo   text[] not null default '{}',  -- onde a equipe perde tempo (múltipla)
  add column if not exists ja_tentou     text,   -- o que já tentaram para resolver
  add column if not exists custo_inacao  text,   -- o que acontece se nada mudar em 6 meses
  add column if not exists sistemas      text,   -- sistemas que usa hoje (ERP, planilha, marketplace...)
  add column if not exists time_operacao text;   -- nº de pessoas na operação do dia a dia

-- IMPRESCINDÍVEL: o grant de insert da migration original é POR COLUNA
-- (revoke all + grant insert (col, col, ...)). Sem estender o grant, o Postgres
-- nega o INSERT inteiro quando as colunas novas vão no payload — 42501.
grant insert (perde_tempo, ja_tentou, custo_inacao, sistemas, time_operacao)
  on public.leads_diagnostico to anon;

comment on column public.leads_diagnostico.perde_tempo   is 'Etapa 03: onde a equipe mais perde tempo';
comment on column public.leads_diagnostico.ja_tentou     is 'Etapa 04: tentativas anteriores de resolver';
comment on column public.leads_diagnostico.custo_inacao  is 'Etapa 05: custo de não fazer nada em 6 meses';
comment on column public.leads_diagnostico.sistemas      is 'Etapa 09: stack atual declarada pelo lead';
comment on column public.leads_diagnostico.time_operacao is 'Etapa 09: tamanho do time de operação';
comment on column public.leads_diagnostico.solucoes      is 'LEGADO: pergunta removida no formulário v2';
