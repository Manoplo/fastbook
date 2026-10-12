-- ============================================================
-- FASTBOOK — tenant_availability + is_pro; drop service_availability
-- ============================================================

alter table tenants
  add column if not exists is_pro boolean not null default false;

create table tenant_availability (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time  time not null,
  end_time    time not null,
  check (end_time > start_time)
);

create index idx_tenant_availability_tenant on tenant_availability(tenant_id);

alter table tenant_availability enable row level security;

-- Migrar ventanas existentes por tenant (dedupe)
insert into tenant_availability (tenant_id, day_of_week, start_time, end_time)
select distinct s.tenant_id, sa.day_of_week, sa.start_time, sa.end_time
from service_availability sa
join services s on s.id = sa.service_id;

-- RLS pública (lectura)
create policy "public read tenant_availability"
  on tenant_availability for select
  using (true);

-- RLS owner CRUD
create policy "owner select tenant_availability"
  on tenant_availability for select
  to authenticated
  using (private.is_tenant_owner(tenant_id));

create policy "owner insert tenant_availability"
  on tenant_availability for insert
  to authenticated
  with check (private.is_tenant_owner(tenant_id));

create policy "owner update tenant_availability"
  on tenant_availability for update
  to authenticated
  using (private.is_tenant_owner(tenant_id))
  with check (private.is_tenant_owner(tenant_id));

create policy "owner delete tenant_availability"
  on tenant_availability for delete
  to authenticated
  using (private.is_tenant_owner(tenant_id));

-- Drop service_availability
drop policy if exists "public read availability" on service_availability;
drop policy if exists "owner select availability" on service_availability;
drop policy if exists "owner insert availability" on service_availability;
drop policy if exists "owner update availability" on service_availability;
drop policy if exists "owner delete availability" on service_availability;
drop table if exists service_availability;
