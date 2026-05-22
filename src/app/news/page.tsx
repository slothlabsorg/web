import type { Metadata } from 'next'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import StarField from '@/components/StarField'
import CustomCursor from '@/components/CustomCursor'
import NewsFilter from '@/components/NewsFilter'
import { renderMarkdown, appMeta, type NewsFeed, type NewsItem } from '@/lib/news'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.org'

export const metadata: Metadata = {
  title: 'News — SlothLabs · Orbit suite updates, tips & releases',
  description: 'Release notes, tips, and announcements for every SlothLabs Orbit app — CloudOrbit, DataOrbit, ProxyOrbit, BastionOrbit, WattsOrbit, and Mermaid Preview.',
  alternates: { canonical: `${SITE_URL}/news` },
  openGraph: {
    title: 'News — SlothLabs Orbit suite',
    description: 'Latest updates from every SlothLabs Orbit app, in one feed.',
    url: `${SITE_URL}/news`,
    siteName: 'SlothLabs',
  },
}

interface FeedSource {
  scope: string                     // 'all' for general, otherwise the app slug
  items: NewsItem[]
}

function readSource(file: string, scope: string): FeedSource {
  try {
    const raw = readFileSync(join(process.cwd(), 'public', 'news', file), 'utf8')
    const json: NewsFeed = JSON.parse(raw)
    return { scope, items: Array.isArray(json.items) ? json.items : [] }
  } catch {
    return { scope, items: [] }
  }
}

// Map *orbitnews.json → slug. mermaidpreviewnews.json → mermaid-preview
function fileToSlug(file: string): string {
  const base = file.replace(/news\.json$/, '')
  if (base === 'mermaidpreview') return 'mermaid-preview'
  return base
}

function loadAll(): { item: NewsItem; scope: string }[] {
  const sources: FeedSource[] = []
  sources.push(readSource('general.json', 'all'))
  for (const f of ['cloudorbit', 'dataorbit', 'proxyorbit', 'bastionorbit', 'wattsorbit', 'mermaidpreview']) {
    sources.push(readSource(`${f}news.json`, fileToSlug(`${f}news.json`)))
  }

  const seen = new Set<string>()
  const flat: { item: NewsItem; scope: string }[] = []
  for (const src of sources) {
    for (const item of src.items) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      flat.push({ item, scope: src.scope })
    }
  }
  flat.sort((a, b) => {
    const p = (b.item.priority ?? 0) - (a.item.priority ?? 0)
    if (p !== 0) return p
    return new Date(b.item.publishedAt).getTime() - new Date(a.item.publishedAt).getTime()
  })
  return flat
}

const TONE_BG: Record<string, string> = {
  primary: '#00D4FF20',
  success: '#10B98120',
  warning: '#F59E0B20',
  danger:  '#F8717120',
  neutral: '#94A3B820',
}
const TONE_FG: Record<string, string> = {
  primary: '#7DD9FF',
  success: '#34D399',
  warning: '#FBBF24',
  danger:  '#F87171',
  neutral: '#CBD5E1',
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return iso
  }
}

function NewsCard({ item, scope }: { item: NewsItem; scope: string }) {
  const meta = appMeta(scope)
  const isAd = item.type === 'ad' || item.sponsored
  const accent = meta.accent
  const bodyHtml = renderMarkdown(item.body)

  return (
    <article
      data-scope={scope}
      data-type={item.type}
      className="news-card group rounded-2xl border p-6 md:p-7 transition-colors duration-200"
      style={{
        background: '#0d1124',
        borderColor: isAd ? '#3a2a10' : '#1a2040',
      }}
    >
      <header className="flex flex-wrap items-center gap-2 text-xs mb-3">
        <Link
          href={meta.href}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-semibold tracking-wide hover:brightness-125 transition"
          style={{ background: `${accent}15`, borderColor: `${accent}40`, color: accent }}
        >
          <span aria-hidden>{meta.icon}</span>{meta.label}
        </Link>
        {item.badge && (
          <span
            className="px-2 py-0.5 rounded-full font-bold tracking-wider"
            style={{ background: TONE_BG[item.badgeTone ?? 'neutral'], color: TONE_FG[item.badgeTone ?? 'neutral'] }}
          >
            {item.badge}
          </span>
        )}
        {isAd && (
          <span className="px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider" style={{ background: '#F59E0B15', color: '#F59E0B' }}>
            Sponsored
          </span>
        )}
        <span className="ml-auto text-[#4A6080] tabular-nums">{formatDate(item.publishedAt)}</span>
      </header>

      <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
        {item.title}
      </h2>

      {item.image?.url && (
        <div className="rounded-xl overflow-hidden border mb-4" style={{ borderColor: '#1a2040' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.image.url} alt={item.image.alt} className="w-full" loading="lazy" />
        </div>
      )}

      <div className="news-body text-[#8BA3C7] leading-relaxed text-sm md:text-base" dangerouslySetInnerHTML={{ __html: bodyHtml }} />

      {item.action?.url && (
        <div className="mt-4">
          <a
            href={item.action.url}
            target={item.action.url.startsWith('http') ? '_blank' : undefined}
            rel={item.action.url.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border hover:-translate-y-0.5 transition"
            style={{ background: `${accent}15`, borderColor: `${accent}50`, color: accent }}
          >
            {item.action.label} <span aria-hidden>→</span>
          </a>
        </div>
      )}
    </article>
  )
}

export default function NewsPage() {
  const items = loadAll()

  // Build chip list — only include scopes that actually have items
  const scopesPresent = new Set(items.map(i => i.scope))
  const chipScopes = ['all', 'cloudorbit', 'dataorbit', 'proxyorbit', 'bastionorbit', 'wattsorbit', 'mermaid-preview']
    .filter(s => scopesPresent.has(s))

  return (
    <main style={{ background: '#050818' }}>
      <CustomCursor />
      <Navbar />

      <section className="relative pt-32 pb-12" style={{ background: 'linear-gradient(180deg, #050818 0%, #0a0f24 100%)' }}>
        <StarField count={45} />
        <div className="relative z-10 site-container">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-semibold tracking-widest uppercase text-[#00D4FF]">SlothLabs News</span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
              Every Orbit update,<br /><span style={{ color: '#00D4FF' }}>in one feed</span>
            </h1>
            <p className="text-lg text-[#8BA3C7] max-w-xl">
              Release notes, tips, and announcements from every SlothLabs app. The same feed that ships inside each Orbit&apos;s News tab.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12" style={{ background: '#050818' }}>
        <div className="site-container">
          <NewsFilter scopes={chipScopes} />

          <div className="news-grid grid gap-4 md:gap-5 max-w-3xl mx-auto">
            {items.length === 0 ? (
              <div className="rounded-2xl border p-10 text-center" style={{ background: '#0d1124', borderColor: '#1a2040' }}>
                <p className="text-[#8BA3C7]">No news yet — check back soon.</p>
              </div>
            ) : (
              items.map(({ item, scope }) => <NewsCard key={item.id} item={item} scope={scope} />)
            )}
          </div>
        </div>
      </section>

      <Footer accent="#00D4FF" />
    </main>
  )
}
