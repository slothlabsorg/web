import Link from 'next/link'
import Image from 'next/image'
import type { AppReleases } from '@/data/releases'

export default function ReleasesPageContent({ app }: { app: AppReleases }) {
  const { appName, accent, icon, releases } = app
  const accentDim    = `${accent}18`
  const accentBorder = `${accent}30`

  return (
    <div className="site-container py-16 md:py-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-14">
        <Image src={icon} alt={appName} width={48} height={48} className="rounded-xl" />
        <div>
          <h1
            className="text-3xl md:text-4xl font-bold text-white"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            {appName} Releases
          </h1>
          <Link
            href={`/${app.slug}`}
            className="text-sm hover:opacity-80 transition-opacity"
            style={{ color: accent }}
          >
            ← Back to {appName}
          </Link>
        </div>
      </div>

      {releases.length === 0 ? (
        <div
          className="rounded-2xl border p-12 text-center"
          style={{ borderColor: accentBorder, background: accentDim }}
        >
          <p className="text-[#8BA3C7] text-lg">No releases yet.</p>
          <p className="text-[#4A6080] text-sm mt-2">Check back soon — launching soon.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {releases.map((rel, i) => (
            <article
              key={rel.version}
              className="rounded-2xl border p-8 space-y-5"
              style={{ borderColor: accentBorder, background: i === 0 ? accentDim : 'transparent' }}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="text-xl font-bold font-mono"
                  style={{ color: accent }}
                >
                  v{rel.version}
                </span>
                {i === 0 && (
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                    style={{ borderColor: accentBorder, color: accent, background: accentDim }}
                  >
                    Latest
                  </span>
                )}
                <span className="text-sm text-[#4A6080]">{rel.date}</span>
                {rel.downloadUrl && (
                  <a
                    href={rel.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-sm font-medium hover:opacity-80 transition-opacity flex items-center gap-1"
                    style={{ color: accent }}
                  >
                    Download ↗
                  </a>
                )}
              </div>

              {rel.highlights && rel.highlights.length > 0 && (
                <ul className="space-y-2">
                  {rel.highlights.map(h => (
                    <li key={h} className="flex items-start gap-2 text-sm text-[#8BA3C7]">
                      <span style={{ color: accent }} className="mt-0.5 flex-shrink-0">+</span>
                      {h}
                    </li>
                  ))}
                </ul>
              )}

              {rel.notes && rel.notes !== 'Initial release.' && (
                <p className="text-sm text-[#6A8AA8] leading-relaxed">{rel.notes}</p>
              )}
            </article>
          ))}
        </div>
      )}

      {/* GitHub link */}
      <div className="mt-14 pt-10 border-t" style={{ borderColor: accentBorder }}>
        <a
          href={`https://github.com/slothlabsorg/${app.slug}/releases`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm hover:opacity-80 transition-opacity flex items-center gap-2"
          style={{ color: accent }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          All releases on GitHub →
        </a>
      </div>
    </div>
  )
}
