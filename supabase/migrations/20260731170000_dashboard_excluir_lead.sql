-- Exclusão de lead pelo painel, sem dar DELETE ao papel anon.
-- Mesmo padrão de dashboard_leads: a função valida o token de sessão e roda
-- como dona da tabela (security definer). A chave pública só chama a função.

create table if not exists public.dashboard_exclusoes (
  id           uuid primary key default gen_random_uuid(),
  excluido_em  timestamptz not null default now(),
  por_email    text not null,
  lead_id      uuid not null,
  lead_nome    text,
  lead_empresa text,
  lead_email   text
);
comment on table public.dashboard_exclusoes is 'Auditoria: quem apagou qual lead e quando.';
alter table public.dashboard_exclusoes enable row level security;  -- sem policy: ninguém lê pela API pública

drop function if exists public.dashboard_excluir_lead(text, uuid);
create function public.dashboard_excluir_lead(p_token text, p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_lead  public.leads_diagnostico;
begin
  select email into v_email
  from public.dashboard_sessoes
  where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
    and expira_em > now();
  if v_email is null then
    raise exception 'sessão inválida ou expirada' using errcode = '28000';
  end if;

  select * into v_lead from public.leads_diagnostico where id = p_id;
  if not found then
    return false;
  end if;

  -- guarda o rastro antes de apagar (exclusão é irreversível)
  insert into public.dashboard_exclusoes (por_email, lead_id, lead_nome, lead_empresa, lead_email)
  values (v_email, v_lead.id, v_lead.nome, v_lead.empresa, v_lead.email);

  delete from public.leads_diagnostico where id = p_id;
  return true;
end;
$$;

revoke all on function public.dashboard_excluir_lead(text, uuid) from public, authenticated;
grant execute on function public.dashboard_excluir_lead(text, uuid) to anon;
