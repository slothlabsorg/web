// HTTP Basic Auth for /stats — credentials: sloth / slothlabsorg123
// Runs on Netlify's edge before serving the static page.

// deno-lint-ignore-file no-explicit-any
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

  if (user !== 'sloth' || pass !== 'slothlabsorg123') return deny()

  // Authorised — fall through to the static file
  return
}

export const config = {
  path: ['/stats', '/stats/', '/stats/*'],
}
