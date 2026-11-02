-- Ban de plataforma: columnas + protección frente a owners (mismo patrón que is_pro).

alter table public.tenants
  add column if not exists banned_at timestamptz,
  add column if not exists banned_reason text;

comment on column public.tenants.banned_at is 'Si no es null, la cuenta está desactivada por plataforma';
comment on column public.tenants.banned_reason is 'Motivo opcional del ban de plataforma';

create or replace function private.enforce_tenant_platform_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text := coalesce(auth.role(), '');
begin
  -- service_role JWT (PostgREST admin / BFF) o SQL directo sin JWT (Studio / migraciones)
  if v_role = 'service_role' or v_role = '' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.is_pro is true then
      raise exception 'is_pro can only be set by platform admin'
        using errcode = '42501';
    end if;
    if new.banned_at is not null or new.banned_reason is not null then
      raise exception 'ban fields can only be set by platform admin'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.is_pro is distinct from old.is_pro then
      raise exception 'is_pro can only be changed by platform admin'
        using errcode = '42501';
    end if;

    if new.owner_id is distinct from old.owner_id then
      raise exception 'owner_id can only be changed by platform admin'
        using errcode = '42501';
    end if;

    if new.banned_at is distinct from old.banned_at
      or new.banned_reason is distinct from old.banned_reason then
      raise exception 'ban fields can only be changed by platform admin'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;
