-- Al borrar un servicio del catálogo, conservar la reserva y desligar el servicio.
alter table public.bookings
  drop constraint bookings_service_id_fkey;

alter table public.bookings
  add constraint bookings_service_id_fkey
  foreign key (service_id)
  references public.services(id)
  on delete set null;
