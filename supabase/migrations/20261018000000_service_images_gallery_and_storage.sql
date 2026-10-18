-- ============================================================
-- FASTBOOK — galería de imágenes de servicios + Storage
-- Pro: hasta 10 imágenes + youtube_url; bucket público service-images
-- ============================================================

alter table public.services
  add column if not exists image_urls text[] not null default '{}',
  add column if not exists youtube_url text;

comment on column public.services.image_urls is
  'URLs públicas de la galería (Storage). Máx. 10. image_url sigue siendo la portada/legacy.';
comment on column public.services.youtube_url is
  'Enlace opcional a un vídeo de YouTube del servicio (plan Pro).';

-- Backfill desde image_url legacy
update public.services
set image_urls = array[image_url]
where image_url is not null
  and btrim(image_url) <> ''
  and coalesce(cardinality(image_urls), 0) = 0;

alter table public.services
  drop constraint if exists services_image_urls_max_check;

alter table public.services
  add constraint services_image_urls_max_check
  check (cardinality(image_urls) <= 10);

-- Bucket público (lectura en página de reserva)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'service-images',
  'service-images',
  true,
  5242880,
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Path: {tenant_id}/{service_id}/{filename}
drop policy if exists "Public read service images" on storage.objects;
create policy "Public read service images"
  on storage.objects for select
  using (bucket_id = 'service-images');

drop policy if exists "Owner upload service images" on storage.objects;
create policy "Owner upload service images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'service-images'
    and private.is_tenant_owner(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "Owner update service images" on storage.objects;
create policy "Owner update service images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'service-images'
    and private.is_tenant_owner(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'service-images'
    and private.is_tenant_owner(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "Owner delete service images" on storage.objects;
create policy "Owner delete service images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'service-images'
    and private.is_tenant_owner(((storage.foldername(name))[1])::uuid)
  );
