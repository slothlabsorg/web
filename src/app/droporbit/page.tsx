import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import StarField from '@/components/StarField'
import CustomCursor from '@/components/CustomCursor'
import SubscribeModal from '@/components/SubscribeModal'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.org'

const ACCENT = '#06B6D4'
const ACCENT_DIM = '#06B6D418'
const ACCENT_MID = '#06B6D450'
const BG_BASE = '#050d1f'

export const metadata: Metadata = {
  title: 'DropOrbit — Cross-Platform AirDrop · iOS, Android, macOS, Windows | SlothLabs',
  description:
    'DropOrbit is local-first, E2E encrypted file sharing that works across every platform. No cloud relay, no accounts, no size limits. Like AirDrop, but for every device.',
  keywords: [
    'AirDrop alternative',
    'cross-platform file sharing',
    'AirDrop for Android',
    'AirDrop for Windows',
    'local file transfer',
    'E2E encrypted file sharing',
    'DropOrbit',
    'SlothLabs',
  ],
  openGraph: {
    title: 'DropOrbit — Cross-Platform AirDrop | SlothLabs',
    description:
      'Local-first, E2E encrypted file sharing across every platform. No cloud relay, no accounts, no size limits.',
    url: `${SITE_URL}/droporbit`,
    siteName: 'SlothLabs',
  },
  alternates: { canonical: `${SITE_URL}/droporbit` },
}

export default function DropOrbitPage() {
  return (
    <main className="min-h-screen" style={{ background: BG_BASE }}>
      <CustomCursor />
      <StarField count={40} />
      <Navbar />

      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[140px] opacity-[0.12]"
            style={{ background: ACCENT }}
          />
        </div>

        <div className="relative z-10 site-container text-center max-w-2xl mx-auto space-y-8 py-32">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.18em] border"
            style={{ color: ACCENT, background: ACCENT_DIM, borderColor: ACCENT_MID }}
          >
            <span className="text-lg leading-none">📡</span>
            Launching Monday, October 12, 2026
          </div>

          <h1
            className="text-4xl md:text-6xl font-bold text-white tracking-tight"
            style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}
          >
            AirDrop for{' '}
            <span style={{ color: ACCENT }}>every device</span>
          </h1>

          <p className="text-[#8BA3C7] text-lg leading-relaxed max-w-xl mx-auto">
            DropOrbit is local-first, E2E encrypted file sharing that works across every platform.
            No cloud relay, no accounts, no size limits. Tap to send from your iPhone to a Windows PC
            on the same network — as fast as AirDrop, without being Apple.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 max-w-lg mx-auto pt-4">
            {[
              { icon: '🔒', label: 'E2E encrypted' },
              { icon: '📶', label: 'LAN-only, no cloud' },
              { icon: '♾️', label: 'No size limits' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border px-4 py-3 text-center"
                style={{ borderColor: ACCENT_MID, background: ACCENT_DIM }}
              >
                <div className="text-xl mb-1">{item.icon}</div>
                <div className="text-xs font-semibold" style={{ color: ACCENT }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
            <SubscribeModal
              accent={ACCENT}
              source="droporbit"
              buttonLabel="Get notified when it ships"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-bold text-sm hover:brightness-110 transition-all hover:-translate-y-0.5"
              style={{ background: ACCENT, color: BG_BASE }}
            />
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-full border text-sm font-medium transition-all hover:opacity-80"
              style={{ borderColor: ACCENT_MID, color: ACCENT }}
            >
              ← All SlothLabs tools
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
