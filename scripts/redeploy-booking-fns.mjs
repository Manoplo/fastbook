
import fs from 'node:fs'
import path from 'node:path'

const projectId = 'ptgltexbfxjqmyozcavt'
const token = process.env.SUPABASE_ACCESS_TOKEN
if (!token) {
  console.error('Missing SUPABASE_ACCESS_TOKEN')
  process.exit(1)
}

async function deploy(name, dir) {
  const files = ['index.ts', 'email.ts', 'utils.ts'].map((n) => ({
    name: n,
    content: fs.readFileSync(path.join(dir, n), 'utf8'),
  }))
  const body = {
    name,
    entrpoint_path: 'index.ts',
    entrypoint_path: 'index.ts',
    verify_jwt: false,
    files,
  }
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectId}/functions/deploy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  console.log(name, res.status, text.slice(0, 500))
  if (!res.ok) process.exit(1)
}

await deploy('send-booking-confirmation', 'supabase/functions/send-booking-confirmation')
await deploy('send-booking-reminders', 'supabase/functions/send-booking-reminders')
