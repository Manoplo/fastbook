-- ============================================================
-- FASTBOOK — Seed de desarrollo (cliente piloto)
-- ============================================================
-- Tenant: Vanesa Lobo (fotografía)
-- Idempotente: se puede re-ejecutar; limpia y vuelve a insertar
-- el tenant piloto por slug.
--
-- Disponibilidad del estudio (igual en todos los servicios):
--   Lun–Vie: 10:00–14:00 y 16:00–20:00
--   Sábado:  10:00–14:00
--   Domingo: cerrado
-- Citas de 1 hora → duration_minutes = 60
-- ============================================================

begin;

-- Limpiar seed previo del mismo tenant (cascade borra services,
-- availability y bookings ligados).
delete from tenants where slug = 'vanesa-lobo';

insert into tenants (id, slug, name, booking_note)
values (
  'a1000000-0000-4000-8000-000000000001',
  'vanesa-lobo',
  'Vanesa Lobo',
  'Estudio de fotografía. Reserva tu sesión y te confirmaremos por email.'
);

insert into services (
  id,
  tenant_id,
  name,
  price,
  description,
  image_url,
  tags,
  duration_minutes,
  active
)
values
  (
    'a1000000-0000-4000-8000-000000000010',
    'a1000000-0000-4000-8000-000000000001',
    'Set de fotos navideñas',
    100.00,
    'Crear un hermoso recuerdo familiar navideño para toda la vida',
    null,
    array['navidad', 'familia'],
    60,
    true
  ),
  (
    'a1000000-0000-4000-8000-000000000011',
    'a1000000-0000-4000-8000-000000000001',
    'Set de fotos de embarazada',
    90.00,
    '9 meses para toda una vida',
    null,
    array['embarazo', 'familia'],
    60,
    true
  );

-- Ventanas semanales por servicio (day_of_week: 0=dom … 6=sáb)
insert into service_availability (service_id, day_of_week, start_time, end_time)
select
  s.id,
  v.day_of_week,
  v.start_time::time,
  v.end_time::time
from services s
cross join (
  values
    -- Lunes a viernes: mañana y tarde
    (1, '10:00', '14:00'),
    (1, '16:00', '20:00'),
    (2, '10:00', '14:00'),
    (2, '16:00', '20:00'),
    (3, '10:00', '14:00'),
    (3, '16:00', '20:00'),
    (4, '10:00', '14:00'),
    (4, '16:00', '20:00'),
    (5, '10:00', '14:00'),
    (5, '16:00', '20:00'),
    -- Sábado: solo mañana
    (6, '10:00', '14:00')
) as v(day_of_week, start_time, end_time)
where s.tenant_id = 'a1000000-0000-4000-8000-000000000001';

commit;
