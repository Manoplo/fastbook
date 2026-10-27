-- ============================================================
-- FASTBOOK — branding: fondo de cajas + tipografía
-- Permite cajas oscuras con texto claro en la página pública.
-- ============================================================

alter table public.tenants
  add column if not exists brand_surface text,
  add column if not exists brand_on_surface text;

comment on column public.tenants.brand_surface is
  'Color de fondo de cajas/página pública #rrggbb. Null = blanco Fastbook.';
comment on column public.tenants.brand_on_surface is
  'Color de tipografía principal sobre brand_surface #rrggbb. Null = por defecto.';

alter table public.tenants
  drop constraint if exists tenants_brand_surface_hex_check,
  drop constraint if exists tenants_brand_on_surface_hex_check;

alter table public.tenants
  add constraint tenants_brand_surface_hex_check
    check (brand_surface is null or brand_surface ~ '^#[0-9a-fA-F]{6}$'),
  add constraint tenants_brand_on_surface_hex_check
    check (brand_on_surface is null or brand_on_surface ~ '^#[0-9a-fA-F]{6}$');
