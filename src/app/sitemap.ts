import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.org'

// Use real dates — Google uses lastModified to decide recrawl priority.
// Update these when the page content actually changes significantly.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE,                             lastModified: new Date('2026-04-24'), changeFrequency: 'weekly',  priority: 1   },
    { url: `${BASE}/about`,                  lastModified: new Date('2026-04-24'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/pricing`,                lastModified: new Date('2026-04-24'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/cloudorbit`,             lastModified: new Date('2026-04-24'), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE}/cloudorbit/docs`,        lastModified: new Date('2026-04-24'), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/wattsorbit`,             lastModified: new Date('2026-04-26'), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/wattsorbit/releases`,    lastModified: new Date('2026-04-26'), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE}/dataorbit`,              lastModified: new Date('2026-04-24'), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE}/dataorbit/releases`,     lastModified: new Date('2026-04-24'), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/bastionorbit`,           lastModified: new Date('2026-04-24'), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE}/bastionorbit/releases`,  lastModified: new Date('2026-04-24'), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/proxyorbit`,             lastModified: new Date('2026-04-24'), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE}/proxyorbit/releases`,    lastModified: new Date('2026-04-24'), changeFrequency: 'weekly',  priority: 0.8 },
  ]
}
