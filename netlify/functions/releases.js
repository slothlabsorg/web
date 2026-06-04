/**
 * Latest-release lookup for the product pages (Netlify Function).
 *
 *   GET /api/releases/<slug>
 *   e.g. GET /api/releases/wattsorbit
 *
 * Fetches the latest published GitHub release for the app's repo, classifies
 * its assets into OS/arch buckets, and returns a normalized JSON the client
 * (src/lib/useLatestRelease.ts) consumes to render version, date, and the
 * correct direct-download link per platform.
 *
 * Authenticated with GITHUB_TOKEN (same env var the news CMS uses) to avoid the
 * 60 req/hour unauthenticated rate limit. Cached ~5 min at the CDN edge.
 *
 * Apps with no published release yet (cloudorbit, dataorbit, bastionorbit,
 * kraken-light) return { available: false } so the UI shows "launching soon".
 */

// URL slug → GitHub repo name (slug != repo for klight and mermaid-preview).
const SLUG_TO_REPO = {
  cloudorbit: 'cloudorbit',
  wattsorbit: 'wattsorbit',
  dataorbit: 'dataorbit',
  proxyorbit: 'proxyorbit',
  bastionorbit: 'bastionorbit',
  klight: 'kraken-light',
  'mermaid-preview': 'mermaid-preview-plugin',
}

// Updater/signing artifacts that are never user downloads.
const IGNORE = [/\.sig$/i, /\.app\.tar\.gz$/i, /latest\.json$/i]

// Ordered classifiers: first asset matching each bucket wins.
const BUCKETS = [
  ['mac_arm64',           /(aarch64|arm64)\.dmg$/i],
  ['mac_x64',             /(x64|x86_64|intel)\.dmg$/i],
  ['mac_universal',       /universal\.dmg$/i],
  ['win_exe',             /\.exe$/i],
  ['win_msi',             /\.msi$/i],
  ['linux_appimage_x64',  /(amd64|x86_64)\.AppImage$/i],
  ['linux_appimage_arm64',/(aarch64|arm64)\.AppImage$/i],
  ['linux_deb_x64',       /(amd64|x86_64)\.deb$/i],
  ['linux_deb_arm64',     /(arm64|aarch64)\.deb$/i],
  ['linux_rpm_x64',       /(x86_64|amd64)\.rpm$/i],
  ['linux_rpm_arm64',     /(aarch64|arm64)\.rpm$/i],
  ['plugin_zip',          /\.zip$/i],
]

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
  },
  body: JSON.stringify(body),
})

function classify(assets) {
  const out = {}
  for (const [bucket, re] of BUCKETS) {
    if (out[bucket]) continue
    const a = assets.find(
      (x) => re.test(x.name) && !IGNORE.some((ig) => ig.test(x.name)),
    )
    if (a) out[bucket] = { url: a.browser_download_url, name: a.name, size: a.size }
  }
  return out
}

exports.handler = async (event) => {
  const parts = (event.path || '').replace(/^\//, '').split('/')
  // Supports /api/releases/<slug> and /releases/<slug>
  const slug = parts[parts.length - 1]
  const repo = SLUG_TO_REPO[slug]

  if (!repo) return json(404, { available: false, error: `Unknown app: ${slug}` })

  const headers = {
    'User-Agent': 'slothlabs-releases/1.0',
    Accept: 'application/vnd.github+json',
  }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

  try {
    const res = await fetch(
      `https://api.github.com/repos/slothlabsorg/${repo}/releases/latest`,
      { headers },
    )

    if (res.status === 404) {
      return json(200, { available: false, slug, repo })
    }
    if (!res.ok) {
      return json(200, { available: false, slug, repo, error: `GitHub ${res.status}` })
    }

    const rel = await res.json()
    const tag = rel.tag_name || ''

    return json(200, {
      available: true,
      slug,
      repo,
      tag,
      version: tag.replace(/^v/i, ''),
      date: rel.published_at || null,
      htmlUrl: rel.html_url,
      releasesUrl: `https://github.com/slothlabsorg/${repo}/releases`,
      assets: classify(rel.assets || []),
    })
  } catch (err) {
    return json(200, { available: false, slug, repo, error: String(err) })
  }
}
