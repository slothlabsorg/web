// HTTP Basic Auth for /stats — credentials default to sloth / slothlabsorg123,
// overridable via the ADMIN_AUTH_USER / ADMIN_AUTH_PASS env vars (shared with
// /admin edge auth and the news-save CMS function). Runs on Netlify's edge
// before serving the static page.

// deno-lint-ignore-file no-explicit-any
// Netlify global is injected by the edge runtime; cast through any to read env.
const env = (k: string): string | undefined => (globalThis as any).Netlify?.env?.get(k)

export default async (request: Request): Promise<Response | void> => {
  const auth = request.headers.get('authorization') ?? ''

  const deny = () =>
    new Response('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="SlothLabs Stats", charset="UTF-8"',
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })

  if (!auth.startsWith('Basic ')) return deny()

  const encoded = auth.slice(6).trim()
  let decoded: string
  try {
    decoded = atob(encoded)
  } catch {
    return deny()
  }

  const idx = decoded.indexOf(':')
  if (idx < 0) return deny()
  const user = decoded.slice(0, idx)
  const pass = decoded.slice(idx + 1)

  if (user !== (env('ADMIN_AUTH_USER') || 'sloth') || pass !== (env('ADMIN_AUTH_PASS') || 'slothlabsorg123')) return deny()

  // Authorised — fall through to the static file
  return
}

export const config = {
  path: ['/stats', '/stats/', '/stats/*'],
}
