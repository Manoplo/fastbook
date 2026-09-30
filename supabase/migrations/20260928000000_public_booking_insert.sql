-- Reservas públicas (anon) + comentarios opcionales del cliente
alter table bookings
  add column if not exists notes text;

create policy "public insert bookings"
  on bookings
  for insert
  with check (
    status = 'confirmed'
    and exists (
      select 1
      from services s
      where s.id = bookings.service_id
        and s.tenant_id = bookings.tenant_id
        and s.active = true
    )
  );
