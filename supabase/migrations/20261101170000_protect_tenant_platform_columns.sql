-- Bloquear escalada de privilegios de plataforma en tenants.
-- RLS solo filtra por fila: el owner podía PATCH is_pro / tocar owner_id.
-- Solo service_role JWT o SQL directo sin JWT (Studio/MCP) pueden mutar esas columnas.
--
-- Nota: la función es SECURITY DEFINER → current_user es el owner de la función,
-- no el rol del request. Autorizar con auth.role() (claims JWT).

create schema if not exists private;

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
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_tenant_platform_columns() from public;

drop trigger if exists tenants_enforce_platform_columns on public.tenants;

create trigger tenants_enforce_platform_columns
  before insert or update on public.tenants
  for each row
  execute function private.enforce_tenant_platform_columns();

-- Higiene advisor: SECURITY DEFINER no debe ser callable por anon/authenticated.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke all on function public.rls_auto_enable() from public;
    revoke execute on function public.rls_auto_enable() from anon, authenticated;
  end if;
end;
$$;
