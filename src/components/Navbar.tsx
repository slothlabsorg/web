'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const PRODUCTS = [
  { icon: '🧜', name: 'Mermaid Preview', href: '/mermaid-preview', badge: 'Released', accent: '#FF3670' },
  { icon: '☁️', name: 'CloudOrbit',      href: '/cloudorbit',      badge: 'May 8',    accent: '#00D4FF' },
  { icon: '⚡', name: 'WattsOrbit',      href: '/wattsorbit',      badge: 'May 8',    accent: '#F59E0B' },
  { icon: '🔍', name: 'ProxyOrbit',      href: '/proxyorbit',      badge: 'May 22',   accent: '#94A3B8' },
  { icon: '🗄️', name: 'DataOrbit',       href: '/dataorbit',       badge: 'June 5',   accent: '#8B5CF6' },
  { icon: '🔐', name: 'BastionOrbit',    href: '/bastionorbit',    badge: 'June 19',  accent: '#10B981' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [scrolled, setScrolled]         = useState(false)
  const [mobileOpen, setMobile]         = useState(false)
  const [productsOpen, setProducts]     = useState(false)
  const [mobileProducts, setMobileProds] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProducts(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close dropdown on route change
  useEffect(() => {
    setProducts(false)
    setMobile(false)
  }, [pathname])

  const showBackToSlothLabs = pathname === '/about' || pathname === '/pricing'

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'backdrop-blur-md bg-[#050d1f]/80 border-b border-[#1a3060]' : ''
      }`}
    >
      <nav className="site-container h-[72px] flex items-center justify-between">
        <Link
          href="/"
          className="flex-shrink-0 h-12 md:h-14 w-32 md:w-40 overflow-hidden bg-no-repeat"
          style={{
            backgroundImage: 'url(/images/slothlabs-logo-light.png)',
            backgroundSize: '135%',
            backgroundPosition: '50% 48%',
          }}
          aria-label="SlothLabs"
        />

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href={showBackToSlothLabs ? '/' : '/'}
            className="text-base font-medium text-[#8BA3C7] hover:text-white transition-colors"
          >
            {showBackToSlothLabs ? '← SlothLabs' : 'Home'}
          </Link>

          {/* Products dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setProducts(p => !p)}
              className="flex items-center gap-1.5 text-base font-medium text-[#8BA3C7] hover:text-white transition-colors"
            >
              Products
              <svg
                width="12" height="12" viewBox="0 0 12 12" fill="none"
                className={`transition-transform duration-200 ${productsOpen ? 'rotate-180' : ''}`}
              >
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {productsOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 rounded-2xl border border-[#1a3060] bg-[#0d1b3e]/95 backdrop-blur-md shadow-2xl overflow-hidden"
                style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
              >
                <div className="p-2">
                  {PRODUCTS.map(p => (
                    <Link
                      key={p.href}
                      href={p.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#112244] transition-colors group"
                    >
                      <span className="text-lg w-7 text-center">{p.icon}</span>
                      <span className="flex-1 text-sm font-medium text-[#8BA3C7] group-hover:text-white transition-colors">{p.name}</span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full border font-semibold"
                        style={{ color: p.accent, borderColor: `${p.accent}40`, background: `${p.accent}12` }}
                      >
                        {p.badge}
                      </span>
                    </Link>
                  ))}
                </div>
                <div className="border-t border-[#1a3060] px-3 py-2">
                  <Link href="/#products" className="text-xs text-[#4A6080] hover:text-[#8BA3C7] transition-colors">
                    View all products →
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/pricing"
            className="text-base font-medium text-[#8BA3C7] hover:text-white transition-colors"
          >
            Pricing
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button
            type="button"
            disabled
            title="Coming soon"
            className="text-base px-5 py-2 rounded-full border border-[#8BA3C7]/40 text-[#8BA3C7] opacity-70 cursor-not-allowed hover:text-[#8BA3C7] hover:border-[#8BA3C7]/40 transition-all duration-200"
          >
            Sign up
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-[#8BA3C7] hover:text-white p-2"
          onClick={() => setMobile(!mobileOpen)}
          aria-label="Menu"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            {mobileOpen
              ? <path d="M4 4l14 14M18 4L4 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              : <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            }
          </svg>
        </button>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden drawer-open bg-[#0d1b3e]/95 backdrop-blur-md border-b border-[#1a3060] px-6 py-6 flex flex-col gap-1">
          <Link
            href="/"
            className="text-base font-medium text-[#8BA3C7] hover:text-white transition-colors py-2"
            onClick={() => setMobile(false)}
          >
            {showBackToSlothLabs ? '← SlothLabs' : 'Home'}
          </Link>

          {/* Products expand */}
          <button
            type="button"
            onClick={() => setMobileProds(p => !p)}
            className="flex items-center justify-between text-base font-medium text-[#8BA3C7] hover:text-white transition-colors py-2 w-full text-left"
          >
            Products
            <svg
              width="12" height="12" viewBox="0 0 12 12" fill="none"
              className={`transition-transform duration-200 ${mobileProducts ? 'rotate-180' : ''}`}
            >
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {mobileProducts && (
            <div className="pl-3 flex flex-col gap-0.5 mb-1">
              {PRODUCTS.map(p => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="flex items-center gap-3 py-2 text-sm text-[#8BA3C7] hover:text-white transition-colors"
                  onClick={() => setMobile(false)}
                >
                  <span className="text-base">{p.icon}</span>
                  <span className="flex-1">{p.name}</span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full border font-semibold"
                    style={{ color: p.accent, borderColor: `${p.accent}40`, background: `${p.accent}12` }}
                  >
                    {p.badge}
                  </span>
                </Link>
              ))}
            </div>
          )}

          <Link
            href="/pricing"
            className="text-base font-medium text-[#8BA3C7] hover:text-white transition-colors py-2"
            onClick={() => setMobile(false)}
          >
            Pricing
          </Link>

          <span className="mt-2 relative inline-block w-full">
            <button
              type="button"
              disabled
              title="Coming soon"
              className="w-full text-sm px-4 py-3 rounded-full border border-[#8BA3C7]/40 text-[#8BA3C7] opacity-70 cursor-not-allowed hover:text-[#8BA3C7] hover:border-[#8BA3C7]/40 transition-all"
            >
              Sign up
            </button>
            <span className="absolute top-0 right-2 text-[10px] leading-tight px-1.5 py-0.5 rounded-md border border-[#4DA6FF]/50 text-[#4DA6FF] bg-[#050d1f] font-medium whitespace-nowrap">
              Coming soon
            </span>
          </span>
        </div>
      )}
    </header>
  )
}
