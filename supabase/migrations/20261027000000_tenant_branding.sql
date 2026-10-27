-- ============================================================
-- FASTBOOK — personalización de marca (Pro)
-- Logo + colores + tipografía de la página pública /:slug
-- Bucket público tenant-branding. Path: {tenant_id}/{filename}
-- ============================================================

alter table public.tenants
  add column if not exists logo_url text,
  add column if not exists brand_primary text,
  add column if not exists brand_secondary text,
  add column if not exists brand_font text,
  add column if not exists brand_logo_height smallint;

comment on column public.tenants.logo_url is
  'URL pública del logo (Storage tenant-branding). Solo se aplica si is_pro.';
comment on column public.tenants.brand_primary is
  'Color primario #rrggbb de la página pública. Null = por defecto de Fastbook.';
comment on column public.tenants.brand_secondary is
  'Color secundario #rrggbb de la página pública. Null = por defecto de Fastbook.';
comment on column public.tenants.brand_font is
  'Clave de fuente del catálogo cerrado (ver tenant-branding.utils.ts). Null = por defecto.';
comment on column public.tenants.brand_logo_height is
  'Alto del logo en px en la cabecera pública (24–64). Null = 40.';

alter table public.tenants
  drop constraint if exists tenants_brand_primary_hex_check,
  drop constraint if exists tenants_brand_secondary_hex_check,
  drop constraint if exists tenants_brand_font_check,
  drop constraint if exists tenants_brand_logo_height_check;

alter table public.tenants
  add constraint tenants_brand_primary_hex_check
    check (brand_primary is null or brand_primary ~ '^#[0-9a-fA-F]{6}$'),
  add constraint tenants_brand_secondary_hex_check
    check (brand_secondary is null or brand_secondary ~ '^#[0-9a-fA-F]{6}$'),
  add constraint tenants_brand_font_check
    check (
      brand_font is null
      or brand_font in ('space-grotesk', 'inter', 'dm-sans', 'manrope', 'playfair-display', 'lora')
    ),
  add constraint tenants_brand_logo_height_check
    check (brand_logo_height is null or brand_logo_height between 24 and 64);

-- Bucket público (lectura en la página de reserva)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tenant-branding',
  'tenant-branding',
  true,
  1048576,
  array['image/webp', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read tenant branding" on storage.objects;
create policy "Public read tenant branding"
  on storage.objects for select
  using (bucket_id = 'tenant-branding');

drop policy if exists "Owner upload tenant branding" on storage.objects;
create policy "Owner upload tenant branding"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'tenant-branding'
    and private.is_tenant_owner(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "Owner update tenant branding" on storage.objects;
create policy "Owner update tenant branding"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'tenant-branding'
    and private.is_tenant_owner(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'tenant-branding'
    and private.is_tenant_owner(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "Owner delete tenant branding" on storage.objects;
create policy "Owner delete tenant branding"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'tenant-branding'
    and private.is_tenant_owner(((storage.foldername(name))[1])::uuid)
  );
