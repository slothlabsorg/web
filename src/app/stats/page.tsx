'use client'
import { useEffect, useState } from 'react'

// Protected at the edge by netlify/edge-functions/stats-auth.ts (HTTP Basic Auth).
// Not linked from nav/footer/sitemap on purpose — internal admin page.

const REPOS = [
  { slug: 'mermaid-preview-plugin', name: 'Mermaid Preview', accent: '#FF3670', icon: '🧜' },
  { slug: 'cloudorbit',             name: 'CloudOrbit',      accent: '#00D4FF', icon: '☁️' },
  { slug: 'wattsorbit',             name: 'WattsOrbit',      accent: '#F59E0B', icon: '⚡' },
  { slug: 'dataorbit',              name: 'DataOrbit',       accent: '#8B5CF6', icon: '🗄️' },
  { slug: 'proxyorbit',             name: 'ProxyOrbit',      accent: '#94A3B8', icon: '🔍' },
  { slug: 'bastionorbit',           name: 'BastionOrbit',    accent: '#10B981', icon: '🔐' },
]

interface Asset {
  name: string
  download_count: number
  size: number
  updated_at: string
}

interface Release {
  tag_name: string
  name: string
  published_at: string
  html_url: string
  assets: Asset[]
}

interface RepoData {
  slug: string
  releases: Release[]
  totalDownloads: number
  error?: string
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function StatsPage() {
  const [data, setData]         = useState<RepoData[]>([])
  const [loading, setLoading]   = useState(true)
  const [fetchedAt, setFetched] = useState<Date | null>(null)

  const fetchAll = async () => {
    setLoading(true)
    const results: RepoData[] = await Promise.all(
      REPOS.map(async (r) => {
        try {
          const res = await fetch(`https://api.github.com/repos/slothlabsorg/${r.slug}/releases?per_page=30`, {
            headers: { Accept: 'application/vnd.github+json' },
          })
          if (!res.ok) {
            if (res.status === 404) return { slug: r.slug, releases: [], totalDownloads: 0 }
            throw new Error(`HTTP ${res.status}`)
          }
          const releases: Release[] = await res.json()
          const totalDownloads = releases.reduce(
            (sum, rel) => sum + rel.assets.reduce((s, a) => s + a.download_count, 0),
            0,
          )
          return { slug: r.slug, releases, totalDownloads }
        } catch (e) {
          return { slug: r.slug, releases: [], totalDownloads: 0, error: (e as Error).message }
        }
      }),
    )
    setData(results)
    setFetched(new Date())
    setLoading(false)
  }

  useEffect(() => { void fetchAll() }, [])

  const grandTotal = data.reduce((sum, d) => sum + d.totalDownloads, 0)
  const reposWithReleases = data.filter(d => d.releases.length > 0).length

  return (
    <main className="bg-[#050d1f] min-h-screen text-white">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[140px] opacity-[0.05] bg-[#10F5B0]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-14">

        {/* Header */}
        <header className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#4A6080] font-semibold flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#10F5B0] animate-pulse" />
              Internal · Private
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold mt-2 tracking-tight" style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}>
              Release download stats
            </h1>
            <p className="text-sm text-[#8BA3C7] mt-2">
              Live from the GitHub API. Public releases only.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchAll()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#1a3060] text-sm text-[#8BA3C7] hover:text-white hover:border-[#4DA6FF]/40 transition-all disabled:opacity-50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? 'animate-spin' : ''}>
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Refresh
          </button>
        </header>

        {/* Grand total card */}
        <div
          className="relative rounded-2xl p-6 sm:p-8 mb-8 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #10F5B018 0%, #0a1430 100%)', border: '1px solid #10F5B040' }}
        >
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl opacity-20 bg-[#10F5B0]" />
          <div className="relative">
            <p className="text-xs uppercase tracking-widest font-bold text-[#10F5B0]">Grand total</p>
            <p className="text-5xl sm:text-6xl font-bold mt-1 tabular-nums" style={{ fontFamily: 'Syne, sans-serif' }}>
              {loading ? '—' : grandTotal.toLocaleString()}
            </p>
            <p className="text-sm text-[#8BA3C7] mt-1">
              downloads across {reposWithReleases} repo{reposWithReleases !== 1 ? 's' : ''} with releases
              {fetchedAt && <> · Updated {fetchedAt.toLocaleTimeString()}</>}
            </p>
          </div>
        </div>

        {/* Summary grid */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {data.map((d) => {
              const meta = REPOS.find(r => r.slug === d.slug)!
              return (
                <div
                  key={d.slug}
                  className="rounded-xl p-3 border text-center"
                  style={{ borderColor: `${meta.accent}30`, background: `${meta.accent}08` }}
                >
                  <div className="text-xl mb-1">{meta.icon}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8BA3C7]">{meta.name}</div>
                  <div className="text-2xl font-bold mt-1 tabular-nums" style={{ color: meta.accent }}>
                    {d.totalDownloads.toLocaleString()}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Per-repo details */}
        {loading ? (
          <div className="text-center py-20 text-[#4A6080]">
            <div className="inline-block w-8 h-8 border-2 border-[#4A6080] border-t-[#10F5B0] rounded-full animate-spin mb-4" />
            <p className="text-sm">Fetching from GitHub API…</p>
          </div>
        ) : (
          <div className="space-y-5">
            {data.map((repoData) => {
              const meta = REPOS.find(r => r.slug === repoData.slug)!
              return (
                <div key={repoData.slug} className="rounded-2xl border border-[#1a3060] bg-[#0a1430] p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{meta.icon}</span>
                      <div>
                        <h2 className="font-bold text-lg" style={{ color: meta.accent, fontFamily: 'Syne, sans-serif' }}>
                          {meta.name}
                        </h2>
                        <a
                          href={`https://github.com/slothlabsorg/${repoData.slug}/releases`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[#4A6080] hover:text-[#8BA3C7] transition-colors font-mono"
                        >
                          slothlabsorg/{repoData.slug}
                        </a>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-3xl font-bold tabular-nums" style={{ color: meta.accent }}>
                        {repoData.totalDownloads.toLocaleString()}
                      </p>
                      <p className="text-[10px] uppercase tracking-widest text-[#4A6080]">total downloads</p>
                    </div>
                  </div>

                  {repoData.error ? (
                    <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">
                      Error: {repoData.error}
                    </p>
                  ) : repoData.releases.length === 0 ? (
                    <p className="text-sm text-[#4A6080] italic py-2">No releases yet</p>
                  ) : (
                    <div className="space-y-2">
                      {repoData.releases.map((rel) => {
                        const relTotal = rel.assets.reduce((s, a) => s + a.download_count, 0)
                        return (
                          <div key={rel.tag_name} className="rounded-lg bg-[#050d1f] p-3 text-sm border border-[#1a3060]/50">
                            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <a
                                  href={rel.html_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-bold hover:underline"
                                  style={{ color: meta.accent }}
                                >
                                  {rel.tag_name}
                                </a>
                                <span className="text-xs text-[#4A6080]">· {fmtDate(rel.published_at)}</span>
                              </div>
                              <span className="text-xs font-semibold tabular-nums" style={{ color: meta.accent }}>
                                {relTotal.toLocaleString()} downloads
                              </span>
                            </div>
                            {rel.assets.length > 0 && (
                              <div className="space-y-0.5">
                                {rel.assets.map((a) => (
                                  <div key={a.name} className="flex justify-between text-xs text-[#8BA3C7] pl-2">
                                    <span className="font-mono truncate mr-2">{a.name}</span>
                                    <span className="flex-shrink-0 tabular-nums">
                                      <span className="text-[#4A6080] mr-2">{fmtSize(a.size)}</span>
                                      {a.download_count.toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <footer className="mt-12 text-center text-xs text-[#4A6080] space-y-1">
          <p>Data from <span className="font-mono">api.github.com</span> · Rate limit: 60 req/hour (unauthenticated)</p>
          <p className="text-[#2a3a54]">Protected by HTTP Basic Auth at the edge. Internal use only.</p>
        </footer>
      </div>
    </main>
  )
}
