'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import DownloadModal from './DownloadModal'

export default function CloudOrbitNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobile] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'backdrop-blur-md bg-[#050d1f]/80 border-b border-[#1a3060]' : ''
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo + brand */}
        <div className="flex items-center gap-3">
          <div
            className="h-[50px] w-[70px] flex-shrink-0 rounded-lg bg-no-repeat bg-center bg-contain"
            style={{
              backgroundImage: 'url(/images/cloudorbit-icon.png)',
              backgroundSize: 'contain',
              backgroundPosition: 'center',
            }}
            role="img"
            aria-label="CloudOrbit"
            title="CloudOrbit app icon"
          />
          <Link href="/" className="text-xs text-[#4A6080] hover:text-[#8BA3C7] transition-colors ml-1">
            by SlothLabs
          </Link>
        </div>

        {/* Right */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/" className="text-sm text-[#8BA3C7] hover:text-white transition-colors">
            ← SlothLabs
          </Link>
          <Link href="/cloudorbit/docs" className="text-sm text-[#8BA3C7] hover:text-white transition-colors">
            Docs
          </Link>
          <DownloadModal
            launchingSoon
            buttonLabel="Download"
            className="text-sm px-4 py-2 rounded-btn bg-[#00D4FF] text-[#050d1f] font-semibold hover:brightness-110 transition-all"
          />
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-[#8BA3C7] hover:text-white p-2"
          onClick={() => setMobile(!mobileOpen)}
          aria-label="Menu"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            {mobileOpen
              ? <><path d="M4 4l14 14M18 4L4 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></>
              : <><path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></>
            }
          </svg>
        </button>
      </nav>

      {mobileOpen && (
        <div className="md:hidden drawer-open bg-[#0d1b3e]/95 backdrop-blur-md border-b border-[#1a3060] px-6 py-6 flex flex-col gap-4">
          <Link href="/"     className="text-sm text-[#8BA3C7] hover:text-white py-1" onClick={() => setMobile(false)}>← SlothLabs</Link>
          <Link href="/cloudorbit/docs" className="text-sm text-[#8BA3C7] hover:text-white py-1" onClick={() => setMobile(false)}>Docs</Link>
          <DownloadModal
            launchingSoon
            buttonLabel="Download"
            className="mt-2 w-full text-sm px-4 py-3 rounded-btn bg-[#00D4FF] text-[#050d1f] font-semibold"
          />
        </div>
      )}
    </header>
  )
}
