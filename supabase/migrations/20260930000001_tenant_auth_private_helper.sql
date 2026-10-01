-- Mover helper SECURITY DEFINER a schema privado (best practice)

create schema if not exists private;

create or replace function private.is_tenant_owner(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from tenants t
    where t.id = p_tenant_id
      and t.owner_id = auth.uid()
  );
$$;

revoke all on function private.is_tenant_owner(uuid) from public;
grant execute on function private.is_tenant_owner(uuid) to authenticated, anon;

drop policy if exists "owner select services" on services;
drop policy if exists "owner insert services" on services;
drop policy if exists "owner update services" on services;
drop policy if exists "owner delete services" on services;

create policy "owner select services"
  on services for select
  to authenticated
  using (private.is_tenant_owner(tenant_id));

create policy "owner insert services"
  on services for insert
  to authenticated
  with check (private.is_tenant_owner(tenant_id));

create policy "owner update services"
  on services for update
  to authenticated
  using (private.is_tenant_owner(tenant_id))
  with check (private.is_tenant_owner(tenant_id));

create policy "owner delete services"
  on services for delete
  to authenticated
  using (private.is_tenant_owner(tenant_id));

drop policy if exists "owner select availability" on service_availability;
drop policy if exists "owner insert availability" on service_availability;
drop policy if exists "owner update availability" on service_availability;
drop policy if exists "owner delete availability" on service_availability;

create policy "owner select availability"
  on service_availability for select
  to authenticated
  using (
    exists (
      select 1 from services s
      where s.id = service_availability.service_id
        and private.is_tenant_owner(s.tenant_id)
    )
  );

create policy "owner insert availability"
  on service_availability for insert
  to authenticated
  with check (
    exists (
      select 1 from services s
      where s.id = service_availability.service_id
        and private.is_tenant_owner(s.tenant_id)
    )
  );

create policy "owner update availability"
  on service_availability for update
  to authenticated
  using (
    exists (
      select 1 from services s
      where s.id = service_availability.service_id
        and private.is_tenant_owner(s.tenant_id)
    )
  )
  with check (
    exists (
      select 1 from services s
      where s.id = service_availability.service_id
        and private.is_tenant_owner(s.tenant_id)
    )
  );

create policy "owner delete availability"
  on service_availability for delete
  to authenticated
  using (
    exists (
      select 1 from services s
      where s.id = service_availability.service_id
        and private.is_tenant_owner(s.tenant_id)
    )
  );

drop policy if exists "owner select bookings" on bookings;
drop policy if exists "owner update bookings" on bookings;
drop policy if exists "owner delete bookings" on bookings;

create policy "owner select bookings"
  on bookings for select
  to authenticated
  using (private.is_tenant_owner(tenant_id));

create policy "owner update bookings"
  on bookings for update
  to authenticated
  using (private.is_tenant_owner(tenant_id))
  with check (private.is_tenant_owner(tenant_id));

create policy "owner delete bookings"
  on bookings for delete
  to authenticated
  using (private.is_tenant_owner(tenant_id));

drop function if exists public.is_tenant_owner(uuid);
