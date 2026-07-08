-- ============================================================
-- NOVRA — Acesso ao painel interno de leads (rota oculta do site)
--
-- Modelo de segurança (site estático + chave pública anon):
--   • A leitura dos leads NÃO é um SELECT direto. Passa por funções
--     SECURITY DEFINER que exigem credenciais válidas.
--   • O login devolve um TOKEN de sessão (12h). O navegador guarda
--     só o token — nunca a senha. O token é revogável e expira.
--   • Rate limiting: após 5 tentativas erradas, o e-mail é bloqueado
--     por tempo crescente (lockout progressivo).
--   • Verificação de senha em tempo ~constante (evita enumeração).
--
-- Este arquivo é IDEMPOTENTE e re-executável: pode rodar por cima
-- de uma versão anterior. Depois de rodar, cadastre/atualize o
-- usuário com o INSERT fornecido à parte (senha fora do repositório).
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

-- ------------------------------------------------------------
-- Tabelas
-- ------------------------------------------------------------
create table if not exists public.dashboard_usuarios (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  senha_hash text not null,  -- bcrypt via extensions.crypt — nunca texto puro
  criado_em  timestamptz not null default now()
);
comment on table public.dashboard_usuarios is
  'Usuários do painel interno de leads da NOVRA. Acesso só via funções SECURITY DEFINER / service_role.';

-- contador de tentativas de login por e-mail (rate limit / lockout)
create table if not exists public.dashboard_login_falhas (
  email         text primary key,
  falhas        int not null default 0,
  bloqueado_ate timestamptz,
  atualizado_em timestamptz not null default now()
);

-- sessões emitidas no login (guardamos só o hash do token)
create table if not exists public.dashboard_sessoes (
  token_hash text primary key,          -- sha256(token) em hex
  email      text not null,
  criado_em  timestamptz not null default now(),
  expira_em  timestamptz not null
);
create index if not exists dashboard_sessoes_expira_idx on public.dashboard_sessoes (expira_em);

-- Nenhuma das tabelas é acessível pela API pública:
alter table public.dashboard_usuarios      enable row level security;
alter table public.dashboard_login_falhas  enable row level security;
alter table public.dashboard_sessoes       enable row level security;
revoke all on public.dashboard_usuarios,
              public.dashboard_login_falhas,
              public.dashboard_sessoes
  from anon, authenticated;

-- ------------------------------------------------------------
-- dashboard_login(email, senha) → token (text) ou NULL
--   NULL = credenciais inválidas OU e-mail temporariamente bloqueado.
--   Nunca lança exceção no caminho de falha, para que o incremento
--   do contador de tentativas seja efetivamente gravado (commit).
-- ------------------------------------------------------------
drop function if exists public.dashboard_login(text, text);
create function public.dashboard_login(p_email text, p_senha text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email  text := lower(trim(coalesce(p_email, '')));
  v_hash   text;
  v_falhas int;
  v_bloq   timestamptz;
  v_ok     boolean := false;
  v_token  text;
  -- hash bcrypt fixo (custo 10) para gastar o mesmo tempo quando o
  -- usuário NÃO existe — mantém o tempo de resposta ~constante.
  c_dummy constant text := '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
begin
  -- limpeza oportunista (limita o crescimento da tabela de falhas)
  delete from public.dashboard_login_falhas where atualizado_em < now() - interval '1 day';

  -- 1) bloqueio ativo? nega sem sequer checar a senha
  select falhas, bloqueado_ate into v_falhas, v_bloq
  from public.dashboard_login_falhas where email = v_email;
  if v_bloq is not null and v_bloq > now() then
    return null;
  end if;

  -- 2) verificação em tempo ~constante: sempre roda exatamente 1 bcrypt
  select senha_hash into v_hash
  from public.dashboard_usuarios where lower(email) = v_email;
  if v_hash is null then
    perform extensions.crypt(coalesce(p_senha, ''), c_dummy);
    v_ok := false;
  else
    v_ok := (extensions.crypt(coalesce(p_senha, ''), v_hash) = v_hash);
  end if;

  -- 3a) falha: incrementa contador e aplica lockout progressivo
  if not v_ok then
    insert into public.dashboard_login_falhas (email, falhas, bloqueado_ate, atualizado_em)
    values (v_email, 1, null, now())
    on conflict (email) do update set
      falhas        = public.dashboard_login_falhas.falhas + 1,
      atualizado_em = now(),
      bloqueado_ate = case
        when public.dashboard_login_falhas.falhas + 1 >= 5
          then now() + (interval '1 minute' * least(public.dashboard_login_falhas.falhas + 1, 60))
        else null
      end;
    return null;
  end if;

  -- 3b) sucesso: zera falhas e emite token de sessão (12h)
  delete from public.dashboard_login_falhas where email = v_email;
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.dashboard_sessoes (token_hash, email, expira_em)
  values (encode(extensions.digest(v_token, 'sha256'), 'hex'), v_email, now() + interval '12 hours');
  delete from public.dashboard_sessoes where expira_em < now();  -- limpeza oportunista
  return v_token;
end;
$$;

revoke all on function public.dashboard_login(text, text) from public, authenticated;
grant execute on function public.dashboard_login(text, text) to anon;

-- ------------------------------------------------------------
-- dashboard_leads(token) → todos os leads (mais recentes primeiro),
-- somente com um token de sessão válido e não expirado.
-- ------------------------------------------------------------
drop function if exists public.dashboard_leads(text, text);  -- versão antiga (email, senha)
drop function if exists public.dashboard_leads(text);
create function public.dashboard_leads(p_token text)
returns setof public.leads_diagnostico
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
begin
  select email into v_email
  from public.dashboard_sessoes
  where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
    and expira_em > now();
  if v_email is null then
    raise exception 'sessão inválida ou expirada' using errcode = '28000';
  end if;
  return query
    select * from public.leads_diagnostico order by created_at desc;
end;
$$;

revoke all on function public.dashboard_leads(text) from public, authenticated;
grant execute on function public.dashboard_leads(text) to anon;
