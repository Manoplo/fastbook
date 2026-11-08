-- Ocupación a nivel tenant (solo confirmed) + RPCs públicas de gestión por booking id.

create schema if not exists private;

-- ---------------------------------------------------------------
-- Unique: un confirmed por (tenant, fecha, start_time)
-- ---------------------------------------------------------------
alter table public.bookings
  drop constraint if exists bookings_service_id_booking_date_start_time_key;

drop index if exists public.bookings_tenant_date_start_no_service_key;

create unique index if not exists bookings_tenant_date_start_confirmed_key
  on public.bookings (tenant_id, booking_date, start_time)
  where status = 'confirmed';

-- ---------------------------------------------------------------
-- list_occupied_booking_starts — sin PII
-- ---------------------------------------------------------------
create or replace function private.list_occupied_booking_starts(
  p_tenant_id uuid,
  p_from date,
  p_to date,
  p_exclude_booking_id uuid default null
)
returns table (
  booking_date date,
  start_time time
)
language sql
stable
security definer
set search_path = public
as $$
  select b.booking_date, b.start_time
  from public.bookings b
  where b.tenant_id = p_tenant_id
    and b.status = 'confirmed'
    and b.booking_date >= p_from
    and b.booking_date <= p_to
    and (p_exclude_booking_id is null or b.id <> p_exclude_booking_id)
  order by b.booking_date, b.start_time;
$$;

revoke all on function private.list_occupied_booking_starts(uuid, date, date, uuid) from public;
grant execute on function private.list_occupied_booking_starts(uuid, date, date, uuid)
  to anon, authenticated;

create or replace function public.list_occupied_booking_starts(
  p_tenant_id uuid,
  p_from date,
  p_to date,
  p_exclude_booking_id uuid default null
)
returns table (
  booking_date date,
  start_time time
)
language sql
stable
security definer
set search_path = public
as $$
  select *
  from private.list_occupied_booking_starts(
    p_tenant_id,
    p_from,
    p_to,
    p_exclude_booking_id
  );
$$;

revoke all on function public.list_occupied_booking_starts(uuid, date, date, uuid) from public;
grant execute on function public.list_occupied_booking_starts(uuid, date, date, uuid)
  to anon, authenticated;

-- ---------------------------------------------------------------
-- get_public_booking
-- ---------------------------------------------------------------
create or replace function private.get_public_booking(
  p_tenant_slug text,
  p_booking_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'id', b.id,
    'tenant_id', b.tenant_id,
    'service_id', b.service_id,
    'booking_date', b.booking_date,
    'start_time', b.start_time,
    'end_time', b.end_time,
    'customer_name', b.customer_name,
    'customer_email', b.customer_email,
    'customer_phone', b.customer_phone,
    'status', b.status,
    'notes', b.notes,
    'tenant_slug', t.slug,
    'tenant_name', t.name,
    'service_name', s.name,
    'service_duration_minutes', s.duration_minutes
  )
  into result
  from public.bookings b
  inner join public.tenants t on t.id = b.tenant_id
  left join public.services s on s.id = b.service_id
  where b.id = p_booking_id
    and t.slug = p_tenant_slug;

  if result is null then
    raise exception 'booking_not_found' using errcode = 'P0002';
  end if;

  return result;
end;
$$;

revoke all on function private.get_public_booking(text, uuid) from public;
grant execute on function private.get_public_booking(text, uuid) to anon, authenticated;

create or replace function public.get_public_booking(
  p_tenant_slug text,
  p_booking_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select private.get_public_booking(p_tenant_slug, p_booking_id);
$$;

revoke all on function public.get_public_booking(text, uuid) from public;
grant execute on function public.get_public_booking(text, uuid) to anon, authenticated;

-- ---------------------------------------------------------------
-- update_public_booking — contacto y/o reprogramar (solo confirmed)
-- ---------------------------------------------------------------
create or replace function private.update_public_booking(
  p_tenant_slug text,
  p_booking_id uuid,
  p_customer_email text default null,
  p_customer_phone text default null,
  p_booking_date date default null,
  p_start_time time default null,
  p_end_time time default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_status text;
  v_new_date date;
  v_new_start time;
  v_new_end time;
  v_new_email text;
  v_new_phone text;
  v_reschedule boolean;
begin
  select b.tenant_id, b.status, b.booking_date, b.start_time, b.end_time,
         b.customer_email, b.customer_phone
  into v_tenant_id, v_status, v_new_date, v_new_start, v_new_end,
       v_new_email, v_new_phone
  from public.bookings b
  inner join public.tenants t on t.id = b.tenant_id
  where b.id = p_booking_id
    and t.slug = p_tenant_slug
  for update of b;

  if v_tenant_id is null then
    raise exception 'booking_not_found' using errcode = 'P0002';
  end if;

  if v_status <> 'confirmed' then
    raise exception 'booking_not_modifiable' using errcode = 'P0001';
  end if;

  v_reschedule := p_booking_date is not null
    or p_start_time is not null
    or p_end_time is not null;

  if v_reschedule then
    if p_booking_date is null or p_start_time is null or p_end_time is null then
      raise exception 'booking_reschedule_incomplete' using errcode = 'P0001';
    end if;
    if p_end_time <= p_start_time then
      raise exception 'booking_invalid_time_range' using errcode = 'P0001';
    end if;

    if exists (
      select 1
      from public.bookings other
      where other.tenant_id = v_tenant_id
        and other.status = 'confirmed'
        and other.booking_date = p_booking_date
        and other.start_time = p_start_time
        and other.id <> p_booking_id
    ) then
      raise exception 'booking_slot_taken' using errcode = 'P0001';
    end if;

    v_new_date := p_booking_date;
    v_new_start := p_start_time;
    v_new_end := p_end_time;
  end if;

  if p_customer_email is not null then
    v_new_email := lower(trim(p_customer_email));
    if v_new_email = '' or position('@' in v_new_email) = 0 then
      raise exception 'booking_invalid_email' using errcode = 'P0001';
    end if;
  end if;

  if p_customer_phone is not null then
    v_new_phone := nullif(trim(p_customer_phone), '');
  end if;

  update public.bookings
  set
    booking_date = v_new_date,
    start_time = v_new_start,
    end_time = v_new_end,
    customer_email = v_new_email,
    customer_phone = v_new_phone
  where id = p_booking_id;

  return private.get_public_booking(p_tenant_slug, p_booking_id);
end;
$$;

revoke all on function private.update_public_booking(text, uuid, text, text, date, time, time)
  from public;
grant execute on function private.update_public_booking(text, uuid, text, text, date, time, time)
  to anon, authenticated;

create or replace function public.update_public_booking(
  p_tenant_slug text,
  p_booking_id uuid,
  p_customer_email text default null,
  p_customer_phone text default null,
  p_booking_date date default null,
  p_start_time time default null,
  p_end_time time default null
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select private.update_public_booking(
    p_tenant_slug,
    p_booking_id,
    p_customer_email,
    p_customer_phone,
    p_booking_date,
    p_start_time,
    p_end_time
  );
$$;

revoke all on function public.update_public_booking(text, uuid, text, text, date, time, time)
  from public;
grant execute on function public.update_public_booking(text, uuid, text, text, date, time, time)
  to anon, authenticated;

-- ---------------------------------------------------------------
-- cancel_public_booking
-- ---------------------------------------------------------------
create or replace function private.cancel_public_booking(
  p_tenant_slug text,
  p_booking_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_status text;
begin
  select b.tenant_id, b.status
  into v_tenant_id, v_status
  from public.bookings b
  inner join public.tenants t on t.id = b.tenant_id
  where b.id = p_booking_id
    and t.slug = p_tenant_slug
  for update of b;

  if v_tenant_id is null then
    raise exception 'booking_not_found' using errcode = 'P0002';
  end if;

  if v_status = 'cancelled' then
    return private.get_public_booking(p_tenant_slug, p_booking_id);
  end if;

  update public.bookings
  set status = 'cancelled'
  where id = p_booking_id;

  return private.get_public_booking(p_tenant_slug, p_booking_id);
end;
$$;

revoke all on function private.cancel_public_booking(text, uuid) from public;
grant execute on function private.cancel_public_booking(text, uuid) to anon, authenticated;

create or replace function public.cancel_public_booking(
  p_tenant_slug text,
  p_booking_id uuid
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select private.cancel_public_booking(p_tenant_slug, p_booking_id);
$$;

revoke all on function public.cancel_public_booking(text, uuid) from public;
grant execute on function public.cancel_public_booking(text, uuid) to anon, authenticated;
