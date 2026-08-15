import type { MetadataRoute } from 'next'
import { UPCOMING_LAUNCHES } from '@/data/upcomingLaunches'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.org'

// Use real dates — Google uses lastModified to decide recrawl priority.
// Update these when the page content actually changes significantly.
export default function sitemap(): MetadataRoute.Sitemap {
  const nextPermalinks: MetadataRoute.Sitemap = UPCOMING_LAUNCHES.map(l => ({
    url: `${BASE}/next/${l.slug}/`,
    lastModified: new Date('2026-05-27'),
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }))

  return [
    { url: BASE,                             lastModified: new Date('2026-04-24'), changeFrequency: 'weekly',  priority: 1   },
    { url: `${BASE}/about`,                  lastModified: new Date('2026-04-24'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/pricing`,                lastModified: new Date('2026-04-24'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/cloudorbit`,             lastModified: new Date('2026-07-26'), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE}/cloudorbit/docs`,        lastModified: new Date('2026-04-24'), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/wattsorbit`,             lastModified: new Date('2026-04-25'), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/wattsorbit/releases`,    lastModified: new Date('2026-04-25'), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE}/dataorbit`,              lastModified: new Date('2026-07-26'), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE}/dataorbit/releases`,     lastModified: new Date('2026-04-24'), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/bastionorbit`,           lastModified: new Date('2026-04-24'), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE}/bastionorbit/releases`,  lastModified: new Date('2026-04-24'), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/proxyorbit`,               lastModified: new Date('2026-05-12'), changeFrequency: 'weekly',  priority: 0.95 },
    { url: `${BASE}/proxyorbit/docs`,          lastModified: new Date('2026-05-12'), changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${BASE}/proxyorbit/releases`,      lastModified: new Date('2026-05-12'), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/mermaid-preview`,          lastModified: new Date('2026-05-07'), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE}/mermaid-preview/releases`, lastModified: new Date('2026-05-07'), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/tools`,                    lastModified: new Date('2026-06-17'), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/envlint`,                  lastModified: new Date('2026-06-17'), changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${BASE}/envlint/docs`,             lastModified: new Date('2026-06-22'), changeFrequency: 'weekly',  priority: 0.8  },
    { url: `${BASE}/shx`,                       lastModified: new Date('2026-06-17'), changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${BASE}/shx/docs`,                  lastModified: new Date('2026-06-22'), changeFrequency: 'weekly',  priority: 0.8  },
    { url: `${BASE}/health-dsl`,                lastModified: new Date('2026-06-17'), changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${BASE}/health-dsl/docs`,           lastModified: new Date('2026-06-22'), changeFrequency: 'weekly',  priority: 0.8  },
    { url: `${BASE}/runtime-orbit`,            lastModified: new Date('2026-08-15'), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE}/runtime-orbit/docs`,       lastModified: new Date('2026-08-15'), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/advertise`,                lastModified: new Date('2026-07-26'), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/droporbit`,                lastModified: new Date('2026-07-26'), changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${BASE}/news`,                     lastModified: new Date('2026-07-26'), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/next/`,                    lastModified: new Date('2026-05-27'), changeFrequency: 'daily',   priority: 0.95 },
    ...nextPermalinks,
  ]
}
