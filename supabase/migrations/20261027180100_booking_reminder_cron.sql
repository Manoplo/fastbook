-- Vault + pg_cron para send-booking-reminders (cada 15 min).
-- Idempotente: regenera secret y reprograma el job.

do $$
declare
  cron_secret text := encode(gen_random_bytes(32), 'hex');
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0Z2x0ZXhiZnhqcW15b3pjYXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NzI0OTEsImV4cCI6MjEwNjA0ODQ5MX0.edApcX77On4sGDNej9t1AcyHsp94rjKQ1TRZagqj2ZA';
  project_url text := 'https://ptgltexbfxjqmyozcavt.supabase.co';
  existing_jobid bigint;
begin
  insert into private.edge_cron_secrets as s (name, secret_hash)
  values (
    'booking_reminder',
    encode(extensions.digest(cron_secret, 'sha256'), 'hex')
  )
  on conflict (name) do update
    set secret_hash = excluded.secret_hash,
        created_at = now();

  delete from vault.secrets
  where name in ('project_url', 'booking_reminder_cron_secret', 'anon_key');

  perform vault.create_secret(project_url, 'project_url', 'Fastbook project URL for cron');
  perform vault.create_secret(
    cron_secret,
    'booking_reminder_cron_secret',
    'Bearer secret for send-booking-reminders cron'
  );
  perform vault.create_secret(anon_key, 'anon_key', 'Anon key for pg_net Edge Function calls');

  select j.jobid into existing_jobid
  from cron.job j
  where j.jobname = 'send-booking-reminders';

  if existing_jobid is not null then
    perform cron.unschedule(existing_jobid);
  end if;

  perform cron.schedule(
    'send-booking-reminders',
    '*/15 * * * *',
    $cron$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
        || '/functions/v1/send-booking-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'booking_reminder_cron_secret'
        ),
        'apikey', (
          select decrypted_secret from vault.decrypted_secrets where name = 'anon_key'
        )
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 15000
    ) as request_id;
    $cron$
  );
end $$;
