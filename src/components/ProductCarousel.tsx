'use client'
import { useRef, useState, useCallback, useEffect } from 'react'
import Link from 'next/link'

type Product = {
  name: string
  slug: string
  logo: string | null
  by: string
  desc: string
  tags: string[]
  cta: string
  live: boolean
  accent: string
  comingSoonDate?: string
  previewImage: string | null
  iconSrc?: string | null
}

export default function ProductCarousel({ products }: { products: Product[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  // Recalculate active dot on scroll
  const onScroll = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const cards = track.querySelectorAll<HTMLElement>('[data-card]')
    const center = track.scrollLeft + track.clientWidth / 2
    let closest = 0
    let minDist = Infinity
    cards.forEach((card, i) => {
      const dist = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center)
      if (dist < minDist) { minDist = dist; closest = i }
    })
    setActive(closest)
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    track.addEventListener('scroll', onScroll, { passive: true })
    return () => track.removeEventListener('scroll', onScroll)
  }, [onScroll])

  const scrollTo = (index: number) => {
    const track = trackRef.current
    if (!track) return
    const card = track.querySelectorAll<HTMLElement>('[data-card]')[index]
    if (!card) return
    track.scrollTo({ left: card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2, behavior: 'smooth' })
    setActive(index)
  }

  const prev = () => scrollTo(Math.max(0, active - 1))
  const next = () => scrollTo(Math.min(products.length - 1, active + 1))

  return (
    <div className="relative">
      {/* Track */}
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth hide-scrollbar"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Leading spacer to center first card */}
        <div className="flex-shrink-0 w-[max(1rem,calc((100%-min(320px*3+2rem*2,100%))/2))]" />

        {products.map((product, i) => (
          <Link
            key={product.name}
            href={product.slug ?? '#'}
            data-card
            className="flex-shrink-0 w-[min(320px,80vw)] snap-center block group"
          >
            <div
              className="relative rounded-2xl p-6 bg-[#0d1b3e] border-2 transition-all duration-300 hover:-translate-y-1 overflow-hidden h-full flex flex-col"
              style={{ borderColor: `${product.accent}40` }}
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"
                style={{ background: `radial-gradient(circle at 50% 0%, ${product.accent}12 0%, transparent 70%)` }}
              />

              {/* Coming soon badge */}
              <div className="absolute top-3.5 right-3.5 z-10">
                <span
                  className="badge-shimmer px-2.5 py-1 rounded-full text-[10px] font-semibold border"
                  style={{ borderColor: `${product.accent}50`, color: product.accent, background: `${product.accent}12` }}
                >
                  {product.comingSoonDate ?? 'Coming soon'}
                </span>
              </div>

              {/* Preview image */}
              {product.previewImage ? (
                <div className="mb-4 h-[120px] relative overflow-hidden rounded-xl mt-1">
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity duration-300 scale-105"
                    style={{ backgroundImage: `url(${product.previewImage})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d1b3e] via-[#0d1b3e]/60 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center" style={{ color: product.accent }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" opacity="0.4">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="mb-4 h-[120px] rounded-xl mt-1 flex items-center justify-center overflow-hidden"
                  style={{ background: `${product.accent}10`, border: `1px solid ${product.accent}20` }}>
                  {product.iconSrc ? (
                    <img src={product.iconSrc} alt={product.name} className="w-16 h-16 object-contain" />
                  ) : (
                    <span className="text-4xl opacity-60">🔧</span>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="relative z-10 flex flex-col flex-1">
                <h3 className="text-xl font-bold mb-1 mt-1" style={{ fontFamily: 'Syne, sans-serif', color: product.accent }}>
                  {product.name}
                </h3>
                <p className="text-xs text-[#4A6080] mb-3">{product.by}</p>
                <p className="text-[#8BA3C7] text-sm leading-relaxed flex-1">{product.desc}</p>
                <div className="flex flex-wrap gap-1.5 mt-4 mb-4">
                  {product.tags.map((tag: string) => (
                    <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#112244] text-[#8BA3C7] border border-[#1a3060]">
                      {tag}
                    </span>
                  ))}
                </div>
                {product.cta && (
                  <span className="inline-flex items-center text-sm font-semibold mt-auto transition-colors" style={{ color: product.accent }}>
                    {product.cta}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}

        {/* Trailing spacer */}
        <div className="flex-shrink-0 w-[max(1rem,calc((100%-min(320px*3+2rem*2,100%))/2))]" />
      </div>

      {/* Prev / Next */}
      <button
        onClick={prev}
        disabled={active === 0}
        aria-label="Previous"
        className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-9 h-9 rounded-full items-center justify-center border border-[#1a3060] bg-[#050d1f] text-[#4DA6FF] disabled:opacity-20 hover:bg-[#0d1b3e] transition-all"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <button
        onClick={next}
        disabled={active === products.length - 1}
        aria-label="Next"
        className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-9 h-9 rounded-full items-center justify-center border border-[#1a3060] bg-[#050d1f] text-[#4DA6FF] disabled:opacity-20 hover:bg-[#0d1b3e] transition-all"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
      </button>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {products.map((p, i) => (
          <button
            key={p.name}
            onClick={() => scrollTo(i)}
            aria-label={p.name}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === active ? '20px' : '6px',
              height: '6px',
              background: i === active ? p.accent : '#1a3060',
            }}
          />
        ))}
      </div>
    </div>
  )
}
