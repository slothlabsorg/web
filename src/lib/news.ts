// News feed types — mirror the schema each Orbit app expects.
// Source of truth lives in public/news/*.json; build-news-feed.mjs merges
// them into public/news/feed.json on every build.

export type NewsItemType = 'news' | 'announcement' | 'tip' | 'changelog' | 'ad'
export type BadgeTone    = 'primary' | 'success' | 'warning' | 'danger' | 'neutral'

export interface NewsAction { label: string; url: string }
export interface NewsImage  { url: string; alt: string }

export interface NewsItem {
  id: string
  type: NewsItemType
  priority: number
  publishedAt: string
  expiresAt?: string

  badge?: string
  badgeTone?: BadgeTone

  title: string
  body: string
  collapsed?: boolean

  image?: NewsImage
  action?: NewsAction

  targetApps: string[]
  sponsored?: boolean
}

export interface NewsFeed {
  version: number
  generatedAt?: string
  items: NewsItem[]
}

// Friendly app metadata for rendering.
export const APP_META: Record<string, { label: string; icon: string; accent: string; href: string }> = {
  all:               { label: 'General',         icon: '🌐', accent: '#94A3B8', href: '/'                    },
  cloudorbit:        { label: 'CloudOrbit',      icon: '☁️', accent: '#00D4FF', href: '/cloudorbit'          },
  dataorbit:         { label: 'DataOrbit',       icon: '🗄️', accent: '#8B5CF6', href: '/dataorbit'           },
  proxyorbit:        { label: 'ProxyOrbit',      icon: '🔍', accent: '#94A3B8', href: '/proxyorbit'          },
  bastionorbit:      { label: 'BastionOrbit',    icon: '🔐', accent: '#10B981', href: '/bastionorbit'        },
  wattsorbit:        { label: 'WattsOrbit',      icon: '⚡', accent: '#F59E0B', href: '/wattsorbit'          },
  'mermaid-preview': { label: 'Mermaid Preview', icon: '🧜', accent: '#FF3670', href: '/mermaid-preview'     },
}

export function appMeta(slug: string) {
  return APP_META[slug] ?? { label: slug, icon: '✨', accent: '#94A3B8', href: '/' }
}

// Lightweight markdown — only **bold**, ## h2, - bullets, and inline `code`.
// Returns HTML safe for dangerouslySetInnerHTML (escapes raw input first).
export function renderMarkdown(src: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const lines = src.split('\n')
  const out: string[] = []
  let inList = false

  for (const raw of lines) {
    const line = raw.trimEnd()

    if (line.startsWith('## ')) {
      if (inList) { out.push('</ul>'); inList = false }
      out.push(`<h3 class="news-h3">${escape(line.slice(3))}</h3>`)
      continue
    }
    if (line.startsWith('- ')) {
      if (!inList) { out.push('<ul class="news-ul">'); inList = true }
      out.push(`<li>${inline(escape(line.slice(2)))}</li>`)
      continue
    }
    if (!line) {
      if (inList) { out.push('</ul>'); inList = false }
      out.push('')
      continue
    }
    if (inList) { out.push('</ul>'); inList = false }
    out.push(`<p class="news-p">${inline(escape(line))}</p>`)
  }
  if (inList) out.push('</ul>')

  return out.join('\n')
}

function inline(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="news-code">$1</code>')
}
