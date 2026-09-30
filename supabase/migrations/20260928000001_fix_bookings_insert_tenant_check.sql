-- Corrige el WITH CHECK: tenant_id debe referirse a bookings, no al alias s
drop policy if exists "public insert bookings" on bookings;

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
