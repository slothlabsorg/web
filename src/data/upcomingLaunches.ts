// Single source of truth for the "Next Big Release" hero, /next/, and /next/[slug] permalinks.
// A launch with launchDate set to a real date drives a live countdown.
// A launch with launchDate: null is shown as TBD (no countdown, "later in 2026" copy).

export interface UpcomingLaunch {
  slug: string
  appName: string
  icon: string
  accent: string
  /** ISO date or null for TBD. When set, anchors at noon UTC. */
  launchDate: string | null
  /** Human-friendly version of the date (or "Later in 2026" / "TBD" for null). */
  dateLabel: string
  /** One-line headline for the hero. */
  headline: string
  /** Two-or-three sentence pitch, plain text. */
  pitch: string
  /** Link to the product page. */
  productUrl: string
  /** Subscribe CTA href — defaults to product page anchor. */
  subscribeUrl: string
  /** Hero image used in the share / permalink page. */
  previewImage: string
}

export const UPCOMING_LAUNCHES: UpcomingLaunch[] = [
  {
    slug: 'cloudorbit',
    appName: 'CloudOrbit',
    icon: '☁️',
    accent: '#00D4FF',
    launchDate: '2026-08-24',
    dateLabel: 'Monday August 24, 2026',
    headline: 'AWS sessions, accounts, and EKS — without the terminal',
    pitch: 'CloudOrbit is the AWS session manager you wish Leapp was. Switch SSO accounts, auto-update kubeconfig, detect EKS clusters from your active session, and work behind Cloudflare Zero Trust without ever opening a config file. Native Rust, no Electron.',
    productUrl: '/cloudorbit',
    subscribeUrl: '/cloudorbit',
    previewImage: '/images/cloudorbit-hero-badge.png',
  },
  {
    slug: 'wattsorbit',
    appName: 'WattsOrbit',
    icon: '⚡',
    accent: '#F59E0B',
    launchDate: '2026-08-24',
    dateLabel: 'Monday August 24, 2026',
    headline: 'Real watts in, real watts out — straight from macOS power APIs',
    pitch: 'WattsOrbit lives in your menu bar and tells you exactly where every watt is going — per-USB-device wattage, real-time charger draw, battery health and cycle count, smart notifications when a cable is delivering less than your Mac consumes.',
    productUrl: '/wattsorbit',
    subscribeUrl: '/wattsorbit',
    previewImage: '/images/wattsorbit-landing.png',
  },
  {
    slug: 'dataorbit',
    appName: 'DataOrbit',
    icon: '🗄️',
    accent: '#8B5CF6',
    launchDate: '2026-08-24',
    dateLabel: 'Monday August 24, 2026',
    headline: 'The DynamoDB GUI you wished existed',
    pitch: 'DataOrbit is a native DynamoDB client with the ergonomics of TablePlus and the intelligence of a real query tool — live streaming, cross-table joins (inner / left / left-anti / right / right-anti), full query history. Plus CouchDB and time-series.',
    productUrl: '/dataorbit',
    subscribeUrl: '/dataorbit',
    previewImage: '/images/dataorbit-landing.png',
  },
  {
    slug: 'droporbit',
    appName: 'DropOrbit',
    icon: '📡',
    accent: '#06B6D4',
    launchDate: '2026-09-28',
    dateLabel: 'Monday September 28, 2026',
    headline: 'AirDrop for every device — iPhone, Android, Mac, Windows',
    pitch: 'DropOrbit is local-first, E2E encrypted file sharing that works across every platform. No cloud relay, no accounts, no size limits. Tap to send from your iPhone to a Windows PC on the same network as fast as AirDrop — without being Apple.',
    productUrl: '/droporbit',
    subscribeUrl: '/droporbit',
    previewImage: '/images/cloudorbit-hero.png',
  },
  {
    slug: 'klight',
    appName: 'klight',
    icon: '🚀',
    accent: '#B4FF3C',
    launchDate: '2026-09-21',
    dateLabel: 'Monday September 21, 2026',
    headline: 'Full-stack Kubernetes envs in two commands',
    pitch: 'klight is Kraken-Light: env-per-namespace Kubernetes for startups. Solo dev on minikube, team sync, or remote EKS / GKE / AKS — same CLI. Postgres, Kafka, Redis spin up in dependency order. Each developer gets their own isolated namespace.',
    productUrl: '/klight',
    subscribeUrl: '/klight',
    previewImage: '/images/klight-landing.png',
  },
  {
    slug: 'proxyorbit',
    appName: 'ProxyOrbit',
    icon: '🔍',
    accent: '#94A3B8',
    launchDate: '2026-09-07',
    dateLabel: 'Monday September 7, 2026',
    headline: 'A free Charles Proxy alternative — native Rust, no Java',
    pitch: 'ProxyOrbit is a local HTTP/HTTPS proxy inspector. Capture every API call from any Mac app, decrypt HTTPS, replay or intercept requests, set as system proxy in one click. Under 30 MB at idle. No $50 license, no Electron.',
    productUrl: '/proxyorbit',
    subscribeUrl: '/proxyorbit',
    previewImage: '/images/proxyorbit-landing.png',
  },
  {
    slug: 'bastionorbit',
    appName: 'BastionOrbit',
    icon: '🔐',
    accent: '#10B981',
    launchDate: '2026-09-14',
    dateLabel: 'Monday September 14, 2026',
    headline: 'SSH tunnels in one click — never left open',
    pitch: 'BastionOrbit is the SSH tunnel manager for macOS. One-click port forwarding through bastion hosts with auto-expiry TTL so you never leave a tunnel open overnight. Multi-bastion management with connectivity probing. Real ssh -N -L processes.',
    productUrl: '/bastionorbit',
    subscribeUrl: '/bastionorbit',
    previewImage: '/images/bastionorbit-landing.png',
  },
]

/** UTC noon timestamp for an ISO date string, or null for TBD. */
export function launchTsUtcNoon(launchDate: string | null): number | null {
  if (!launchDate) return null
  const [y, m, d] = launchDate.split('-').map(Number)
  return Date.UTC(y, m - 1, d, 12, 0, 0)
}

/**
 * Returns the soonest upcoming launch (closest dated launch in the future).
 * If none has a future date, returns the next TBD entry. If nothing matches,
 * returns the first list entry as a safe fallback.
 */
export function nextUpcomingLaunch(now: number = Date.now()): UpcomingLaunch {
  const dated = UPCOMING_LAUNCHES
    .map(l => ({ l, ts: launchTsUtcNoon(l.launchDate) }))
    .filter(x => x.ts !== null && (x.ts as number) >= now) as { l: UpcomingLaunch; ts: number }[]
  if (dated.length > 0) {
    dated.sort((a, b) => a.ts - b.ts)
    return dated[0].l
  }
  const tbd = UPCOMING_LAUNCHES.find(l => l.launchDate === null)
  return tbd ?? UPCOMING_LAUNCHES[0]
}

export function findLaunch(slug: string): UpcomingLaunch | undefined {
  return UPCOMING_LAUNCHES.find(l => l.slug === slug)
}
