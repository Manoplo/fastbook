-- SECURITY DEFINER hace que current_user sea el owner de la función (postgres),
-- no el rol del request. La autorización debe basarse en auth.role() (JWT).
-- Studio/MCP: auth.role() is null → permitir. API authenticated/anon → aplicar guard.

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
