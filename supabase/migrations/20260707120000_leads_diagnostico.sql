-- ============================================================
-- NOVRA — Tabela de leads do formulário de diagnóstico (/formulario)
-- Rode este arquivo no Supabase: Dashboard → SQL Editor → New query
-- (ou via CLI: supabase db push)
-- ============================================================

create table if not exists public.leads_diagnostico (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),

  -- respostas estratégicas (etapas 01–07)
  desafio      text,     -- principal desafio que trava o crescimento
  impacto      text,     -- maior impacto do problema no negócio
  solucoes     text[] not null default '{}',  -- soluções buscadas (múltipla escolha)
  faturamento  text,     -- faixa de faturamento mensal
  investimento text,     -- faixa de investimento viável
  urgencia     text,     -- prazo desejado
  decisao      text,     -- como funciona a decisão do projeto

  -- perfil (etapa 08)
  nome         text not null,
  empresa      text not null,
  cargo        text,
  segmento     text,
  funcionarios text,     -- faixa de nº de funcionários

  -- contato (etapa final)
  email        text not null,
  whatsapp     text not null,

  -- metadados do envio
  origem       text,     -- URL da página no momento do envio
  user_agent   text,

  -- validações de sanidade (a tabela recebe inserts públicos)
  constraint leads_diagnostico_email_valido
    check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint leads_diagnostico_limites check (
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
  )
);

comment on table public.leads_diagnostico is
  'Leads capturados pelo formulário de diagnóstico (/formulario) do site NOVRA.';

create index if not exists leads_diagnostico_created_at_idx
  on public.leads_diagnostico (created_at desc);

-- ------------------------------------------------------------
-- Segurança (RLS): o site usa a chave pública (anon) apenas para INSERIR.
-- Sem policy de SELECT/UPDATE/DELETE, ninguém lê os leads com a chave
-- pública — leitura só pelo Dashboard ou pela service_role key.
-- ------------------------------------------------------------
alter table public.leads_diagnostico enable row level security;

drop policy if exists "formulario_publico_pode_inserir" on public.leads_diagnostico;
create policy "formulario_publico_pode_inserir"
  on public.leads_diagnostico
  for insert
  to anon
  with check (true);

-- Privilégios em nível de coluna: o papel anon só consegue preencher os campos
-- do formulário — id e created_at ficam sempre com os defaults do servidor
-- (impede backdating/forja de timestamps via POST direto na API).
revoke all on public.leads_diagnostico from anon;
grant insert (desafio, impacto, solucoes, faturamento, investimento, urgencia, decisao,
              nome, empresa, cargo, segmento, funcionarios, email, whatsapp, origem, user_agent)
  on public.leads_diagnostico to anon;
