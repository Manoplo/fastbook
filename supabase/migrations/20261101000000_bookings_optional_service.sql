-- Reservas sin servicio de catálogo (tenant sin servicios activos)

alter table public.bookings
  alter column service_id drop not null;

-- El UNIQUE (service_id, booking_date, start_time) no cubre service_id NULL
-- (en Postgres NULL ≠ NULL). Evitar dobles en citas sin servicio.
create unique index if not exists bookings_tenant_date_start_no_service_key
  on public.bookings (tenant_id, booking_date, start_time)
  where service_id is null;

drop policy if exists "public insert bookings" on public.bookings;

create policy "public insert bookings"
  on public.bookings
  for insert
  with check (
    status = 'confirmed'
    and (
      (
        service_id is not null
        and exists (
          select 1
          from public.services s
          where s.id = bookings.service_id
            and s.tenant_id = bookings.tenant_id
            and s.active = true
        )
      )
      or (
        service_id is null
        and not exists (
          select 1
          from public.services s
          where s.tenant_id = bookings.tenant_id
            and s.active = true
        )
      )
    )
  );

-- Recordatorios D-1: permitir bookings sin servicio
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
    coalesce(s.name, 'Cita con ' || t.name)
  from claimed c
  inner join public.tenants t on t.id = c.tenant_id
  left join public.services s on s.id = c.service_id;
end;
$$;

revoke all on function public.claim_due_booking_reminders(integer) from public;
revoke all on function public.claim_due_booking_reminders(integer) from anon, authenticated;
grant execute on function public.claim_due_booking_reminders(integer) to service_role;
