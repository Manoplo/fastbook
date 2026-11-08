-- Public wrappers SECURITY DEFINER: anon has no USAGE on schema private.

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
