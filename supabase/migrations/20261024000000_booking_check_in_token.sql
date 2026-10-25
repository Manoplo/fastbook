-- Token opaco para QR / check-in (no usar solo bookings.id)
alter table bookings
  add column if not exists check_in_token text;

update bookings
set check_in_token = replace(gen_random_uuid()::text, '-', '')
where check_in_token is null;

alter table bookings
  alter column check_in_token set default replace(gen_random_uuid()::text, '-', ''),
  alter column check_in_token set not null;

create unique index if not exists bookings_check_in_token_key
  on bookings (check_in_token);
