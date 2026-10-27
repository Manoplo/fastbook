# Split de dominios: marketing vs app

| Dominio | Proyecto | Rol |
| --- | --- | --- |
| `https://fastbook.es` | `fastbook-landing` (Astro) | Landing SEO |
| `https://app.fastbook.es` | `fastbook` (Vite/React) | Login, dashboard, `/:tenantSlug` |

## Vercel

1. **Landing:** conectar repo `fastbook-landing`, dominio apex + `www` → 301 a apex.
2. **App:** conectar repo `fastbook`, dominio `app.fastbook.es`.
3. Tras el cutover, quitar el dominio apex del proyecto de la SPA (si lo tenía).

El `vercel.json` de la landing redirige `/enterprise/*` y `/:slug` a `app.fastbook.es` para bookmarks antiguos.

## Supabase Auth (manual)

En Authentication → URL Configuration del proyecto `ptgltexbfxjqmyozcavt`:

- **Site URL:** `https://app.fastbook.es`
- **Redirect URLs** (añadir, no sustituir localhost en dev):
  - `https://app.fastbook.es/**`
  - `https://app.fastbook.es/enterprise/login`
  - `http://localhost:5173/**` (dev)

## SEO

- Landing: `robots.txt` Allow + `sitemap.xml`
- App: `robots.txt` Disallow, meta `noindex` y header `X-Robots-Tag`
