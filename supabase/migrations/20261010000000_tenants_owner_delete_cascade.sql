-- Si se borra el usuario de Auth, no dejar tenants huérfanos (owner_id null)
-- ocupando slugs públicos. El seed (owner_id null de origen) no se ve afectado.
alter table public.tenants
  drop constraint if exists tenants_owner_id_fkey;

alter table public.tenants
  add constraint tenants_owner_id_fkey
  foreign key (owner_id)
  references auth.users(id)
  on delete cascade;
