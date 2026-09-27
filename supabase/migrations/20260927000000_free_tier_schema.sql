-- ============================================================
-- FASTBOOK — Esquema capa gratuita (Supabase / PostgreSQL)
-- ============================================================

-- ---------------------------------------------------------------
-- TENANTS (empresas)
-- ---------------------------------------------------------------
create table tenants (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,          -- usado en booked.es/{slug}
  name         text not null,
  booking_note text,                          -- comentario especial antes de confirmar reserva
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- SERVICES (servicios de cada empresa)
-- ---------------------------------------------------------------
create table services (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references tenants(id) on delete cascade,
  name              text not null,
  price             numeric(10,2) not null,
  description       text,
  image_url         text,
  tags              text[],
  duration_minutes  integer not null default 30,   -- clave para calcular huecos disponibles
  active            boolean not null default true, -- para poder "ocultar" sin borrar
  created_at        timestamptz not null default now()
);

create index idx_services_tenant on services(tenant_id);

-- ---------------------------------------------------------------
-- SERVICE_AVAILABILITY (días/horas disponibles por servicio)
-- ---------------------------------------------------------------
create table service_availability (
  id          uuid primary key default gen_random_uuid(),
  service_id  uuid not null references services(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0=domingo ... 6=sábado
  start_time  time not null,
  end_time    time not null,
  check (end_time > start_time)
);

create index idx_availability_service on service_availability(service_id);

-- ---------------------------------------------------------------
-- BOOKINGS (reservas)
-- ---------------------------------------------------------------
create table bookings (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  service_id      uuid not null references services(id) on delete restrict,
  booking_date    date not null,
  start_time      time not null,
  end_time        time not null,
  customer_name   text not null,
  customer_email  text not null,
  customer_phone  text,                       -- opcional
  status          text not null default 'confirmed'
                  check (status in ('confirmed','cancelled')),
  created_at      timestamptz not null default now(),

  -- evita doble reserva del mismo servicio a la misma hora
  unique (service_id, booking_date, start_time)
);

create index idx_bookings_tenant_date on bookings(tenant_id, booking_date);
create index idx_bookings_service_date on bookings(service_id, booking_date);

-- ---------------------------------------------------------------
-- RLS (Row Level Security) — recomendado desde el día 1 en Supabase
-- ---------------------------------------------------------------
alter table tenants enable row level security;
alter table services enable row level security;
alter table service_availability enable row level security;
alter table bookings enable row level security;

-- Lectura pública de tenants/services/availability (para el calendario público booked.es/{slug})
create policy "public read tenants" on tenants for select using (true);
create policy "public read services" on services for select using (active = true);
create policy "public read availability" on service_availability for select using (true);

-- Las reservas solo se leen/escriben vía backend con service_role,
-- o bien se restringen por tenant_id si el dashboard usa auth de Supabase.
