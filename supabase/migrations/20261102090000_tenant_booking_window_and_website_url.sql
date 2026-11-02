-- Ventana de fechas reservables (nivel tenant) + URL de sitio Pro

alter table public.tenants
  add column if not exists booking_opens_on date,
  add column if not exists booking_closes_on date,
  add column if not exists website_url text;

comment on column public.tenants.booking_opens_on is
  'Primera fecha (inclusive) en la que el público puede reservar. Null = sin mínimo (hoy).';
comment on column public.tenants.booking_closes_on is
  'Última fecha (inclusive) reservable. Null = sin máximo (horizonte por defecto del FE).';
comment on column public.tenants.website_url is
  'URL del sitio del negocio. Visible en página pública solo si is_pro.';

alter table public.tenants
  drop constraint if exists tenants_booking_window_check;

alter table public.tenants
  add constraint tenants_booking_window_check
  check (
    booking_opens_on is null
    or booking_closes_on is null
    or booking_closes_on >= booking_opens_on
  );

alter table public.tenants
  drop constraint if exists tenants_website_url_length_check;

alter table public.tenants
  add constraint tenants_website_url_length_check
  check (website_url is null or char_length(website_url) <= 2048);
