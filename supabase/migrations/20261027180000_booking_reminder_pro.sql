-- Recordatorio ~24h antes de la cita (solo tenants is_pro).
-- Cron pg_cron → Edge Function send-booking-reminders (cada 15 min).

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

alter table public.bookings
  add column if not exists reminder_sent_at timestamptz;

comment on column public.bookings.reminder_sent_at is
  'Marca de envío del recordatorio D-1 (solo Pro). Null = pendiente / no aplica.';

create index if not exists bookings_reminder_due_idx
  on public.bookings (booking_date, start_time)
  where reminder_sent_at is null and status = 'confirmed';

create schema if not exists private;

create table if not exists private.edge_cron_secrets (
  name text primary key,
  secret_hash text not null,
  created_at timestamptz not null default now()
);

revoke all on schema private from public, anon, authenticated;
revoke all on table private.edge_cron_secrets from public, anon, authenticated;

-- Interpreta booking_date + start_time como hora local Europe/Madrid.
create or replace function public.booking_starts_at(p_date date, p_time time)
returns timestamptz
language sql
immutable
parallel safe
as $$
  select (p_date + p_time) at time zone 'Europe/Madrid';
$$;

revoke all on function public.booking_starts_at(date, time) from public;
grant execute on function public.booking_starts_at(date, time) to anon, authenticated, service_role;

create or replace function public.verify_booking_reminder_cron_secret(p_secret text)
returns boolean
language sql
security definer
set search_path = public, private, extensions
as $$
  select exists (
    select 1
    from private.edge_cron_secrets
    where name = 'booking_reminder'
      and secret_hash = encode(extensions.digest(p_secret, 'sha256'), 'hex')
  );
$$;

revoke all on function public.verify_booking_reminder_cron_secret(text) from public;
revoke all on function public.verify_booking_reminder_cron_secret(text) from anon, authenticated;
grant execute on function public.verify_booking_reminder_cron_secret(text) to service_role;

-- Reclama filas elegibles (Pro, ventana 23–24h) de forma atómica.
create or replace function public.claim_due_booking_reminders(p_limit integer default 50)
returns table (
  id uuid,
  customer_name text,
  customer_email text,
  booking_date date,
  start_time time,
  check_in_token text,
  tenant_name text,
  tenant_slug text,
  service_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_limit is null or p_limit < 1 then
    p_limit := 50;
  end if;
  if p_limit > 100 then
    p_limit := 100;
  end if;

  return query
  with due as (
    select b.id
    from public.bookings b
    inner join public.tenants t on t.id = b.tenant_id
    where t.is_pro = true
      and b.status = 'confirmed'
      and b.reminder_sent_at is null
      and b.customer_email is not null
      and length(trim(b.customer_email)) > 0
      and public.booking_starts_at(b.booking_date, b.start_time)
          > now() + interval '23 hours'
      and public.booking_starts_at(b.booking_date, b.start_time)
          <= now() + interval '24 hours'
    order by b.booking_date, b.start_time
    limit p_limit
    for update of b skip locked
  ),
  claimed as (
    update public.bookings b
    set reminder_sent_at = now()
    from due
    where b.id = due.id
    returning b.*
  )
  select
    c.id,
    c.customer_name,
    c.customer_email,
    c.booking_date,
    c.start_time,
    c.check_in_token,
    t.name,
    t.slug,
    s.name
  from claimed c
  inner join public.tenants t on t.id = c.tenant_id
  inner join public.services s on s.id = c.service_id;
end;
$$;

revoke all on function public.claim_due_booking_reminders(integer) from public;
revoke all on function public.claim_due_booking_reminders(integer) from anon, authenticated;
grant execute on function public.claim_due_booking_reminders(integer) to service_role;

create or replace function public.release_booking_reminder(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.bookings
  set reminder_sent_at = null
  where id = p_booking_id;
end;
$$;

revoke all on function public.release_booking_reminder(uuid) from public;
revoke all on function public.release_booking_reminder(uuid) from anon, authenticated;
grant execute on function public.release_booking_reminder(uuid) to service_role;
