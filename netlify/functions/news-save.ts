// News CMS save endpoint.
// POST /api/news/save  with Basic auth header (sloth/slothlabsorg123) and
// JSON body { file: 'general.json', content: <NewsFeed> }.
//
// Commits the new content to public/news/<file> on slothlabsorg/web@main
// using a GitHub PAT stored in env var GITHUB_TOKEN.
//
// Required Netlify env vars:
//   GITHUB_TOKEN      — fine-grained PAT with Contents: write on slothlabsorg/web
//   ADMIN_AUTH_USER   — defaults to 'sloth'   (shared with /admin + /stats edge auth)
//   ADMIN_AUTH_PASS   — defaults to 'slothlabsorg123'

// Netlify functions are bundled with esbuild; no @netlify/functions dep needed.
// Type the event minimally to avoid pulling another package.
interface NetlifyEvent {
  httpMethod: string
  headers: Record<string, string | undefined>
  body: string | null
}
interface NetlifyResponse {
  statusCode: number
  headers?: Record<string, string>
  body: string
}

const REPO   = 'slothlabsorg/web'
const BRANCH = 'main'

const ALLOWED_FILES = new Set([
  'general.json',
  'cloudorbitnews.json',
  'dataorbitnews.json',
  'proxyorbitnews.json',
  'bastionorbitnews.json',
  'wattsorbitnews.json',
  'mermaidpreviewnews.json',
  'klightnews.json',
])

interface SavePayload {
  file: string
  content: unknown
}

const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

function checkAuth(authHeader: string | undefined): boolean {
  const expectedUser = process.env.ADMIN_AUTH_USER || 'sloth'
  const expectedPass = process.env.ADMIN_AUTH_PASS || 'slothlabsorg123'

  if (!authHeader?.startsWith('Basic ')) return false
  let decoded: string
  try {
    decoded = Buffer.from(authHeader.slice(6).trim(), 'base64').toString('utf8')
  } catch {
    return false
  }
  const idx = decoded.indexOf(':')
  if (idx < 0) return false
  return decoded.slice(0, idx) === expectedUser && decoded.slice(idx + 1) === expectedPass
}

async function ghGetSha(path: string, token: string): Promise<string | undefined> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`,
    { headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'slothlabs-news-cms' } },
  )
  if (res.status === 404) return undefined
  if (!res.ok) throw new Error(`GitHub GET ${path}: ${res.status}`)
  const body = (await res.json()) as { sha?: string }
  return body.sha
}

async function ghPutFile(path: string, content: string, sha: string | undefined, message: string, token: string) {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'slothlabs-news-cms',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        content: Buffer.from(content, 'utf8').toString('base64'),
        branch: BRANCH,
        ...(sha ? { sha } : {}),
      }),
    },
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GitHub PUT ${path}: ${res.status} — ${text}`)
  }
  return res.json()
}

export const handler = async (event: NetlifyEvent): Promise<NetlifyResponse> => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })

  if (!checkAuth(event.headers['authorization'] || event.headers['Authorization'])) {
    return {
      statusCode: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="SlothLabs CMS"', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Authentication required' }),
    }
  }

  const token = process.env.GITHUB_TOKEN
  if (!token) return json(500, { error: 'GITHUB_TOKEN not configured' })

  let payload: SavePayload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { error: 'Invalid JSON body' })
  }

  if (typeof payload.file !== 'string' || !ALLOWED_FILES.has(payload.file)) {
    return json(400, { error: `Invalid file. Allowed: ${Array.from(ALLOWED_FILES).join(', ')}` })
  }
  if (!payload.content || typeof payload.content !== 'object') {
    return json(400, { error: 'content must be an object' })
  }

  const path = `public/news/${payload.file}`
  const formatted = JSON.stringify(payload.content, null, 2) + '\n'

  try {
    const sha = await ghGetSha(path, token)
    await ghPutFile(path, formatted, sha, `chore(news): update ${payload.file} via CMS`, token)
    return json(200, { ok: true, file: payload.file, message: 'Committed. Netlify will redeploy in ~60s.' })
  } catch (err) {
    return json(502, { error: (err as Error).message })
  }
}
