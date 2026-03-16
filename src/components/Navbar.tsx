'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobile] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const showBackToSlothLabs = pathname === '/about' || pathname === '/pricing'
  const links = [
    { label: showBackToSlothLabs ? '← SlothLabs' : 'Home', href: '/' },
    { label: 'Products', href: '/#products' },
    { label: 'Pricing', href: '/pricing' },
  ]

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

        <div className="hidden md:flex items-center gap-8">
          {links.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-base font-medium text-[#8BA3C7] hover:text-white transition-colors"
            >
              {label}
            </Link>
          ))}
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

      {mobileOpen && (
        <div className="md:hidden drawer-open bg-[#0d1b3e]/95 backdrop-blur-md border-b border-[#1a3060] px-6 py-6 flex flex-col gap-4">
          {links.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-base font-medium text-[#8BA3C7] hover:text-white transition-colors py-1"
              onClick={() => setMobile(false)}
            >
              {label}
            </Link>
          ))}
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
