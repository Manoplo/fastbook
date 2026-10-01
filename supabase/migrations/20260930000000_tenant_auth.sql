-- ============================================================
-- FASTBOOK — Auth de tenants (owner_id + RLS authenticated)
-- ============================================================

alter table tenants
  add column owner_id uuid references auth.users(id) on delete set null;

create unique index tenants_owner_id_unique
  on tenants(owner_id)
  where owner_id is not null;

create or replace function public.is_tenant_owner(p_tenant_id uuid)
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

revoke all on function public.is_tenant_owner(uuid) from public;
grant execute on function public.is_tenant_owner(uuid) to authenticated, anon;

create policy "owner insert tenants"
  on tenants for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "owner update tenants"
  on tenants for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "owner select services"
  on services for select
  to authenticated
  using (public.is_tenant_owner(tenant_id));

create policy "owner insert services"
  on services for insert
  to authenticated
  with check (public.is_tenant_owner(tenant_id));

create policy "owner update services"
  on services for update
  to authenticated
  using (public.is_tenant_owner(tenant_id))
  with check (public.is_tenant_owner(tenant_id));

create policy "owner delete services"
  on services for delete
  to authenticated
  using (public.is_tenant_owner(tenant_id));

create policy "owner select availability"
  on service_availability for select
  to authenticated
  using (
    exists (
      select 1
      from services s
      where s.id = service_availability.service_id
        and public.is_tenant_owner(s.tenant_id)
    )
  );

create policy "owner insert availability"
  on service_availability for insert
  to authenticated
  with check (
    exists (
      select 1
      from services s
      where s.id = service_availability.service_id
        and public.is_tenant_owner(s.tenant_id)
    )
  );

create policy "owner update availability"
  on service_availability for update
  to authenticated
  using (
    exists (
      select 1
      from services s
      where s.id = service_availability.service_id
        and public.is_tenant_owner(s.tenant_id)
    )
  )
  with check (
    exists (
      select 1
      from services s
      where s.id = service_availability.service_id
        and public.is_tenant_owner(s.tenant_id)
    )
  );

create policy "owner delete availability"
  on service_availability for delete
  to authenticated
  using (
    exists (
      select 1
      from services s
      where s.id = service_availability.service_id
        and public.is_tenant_owner(s.tenant_id)
    )
  );

create policy "owner select bookings"
  on bookings for select
  to authenticated
  using (public.is_tenant_owner(tenant_id));

create policy "owner update bookings"
  on bookings for update
  to authenticated
  using (public.is_tenant_owner(tenant_id))
  with check (public.is_tenant_owner(tenant_id));

create policy "owner delete bookings"
  on bookings for delete
  to authenticated
  using (public.is_tenant_owner(tenant_id));
