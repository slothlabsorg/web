'use client'
import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

export interface Screenshot {
  src: string
  label: string
}

interface Props {
  screenshots: Screenshot[]
  accent: string
  cardBg: string
  border: string
  layout?: 'stack' | 'grid-4' | 'grid-2'
}

export default function ScreenshotGrid({ screenshots, accent, cardBg, border, layout = 'stack' }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const close = useCallback(() => setOpenIdx(null), [])
  const prev  = useCallback(() => setOpenIdx(i => i !== null ? (i - 1 + screenshots.length) % screenshots.length : null), [screenshots.length])
  const next  = useCallback(() => setOpenIdx(i => i !== null ? (i + 1) % screenshots.length : null), [screenshots.length])

  useEffect(() => {
    if (openIdx === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')    close()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [openIdx, close, prev, next])

  return (
    <>
      {/* Grid */}
      <div className={
        layout === 'grid-4' ? 'grid sm:grid-cols-2 md:grid-cols-4 gap-4'
        : layout === 'grid-2' ? 'grid sm:grid-cols-2 gap-4'
        : 'space-y-8'
      }>
        {screenshots.map((s, i) => (
          <button
            key={s.src}
            type="button"
            onClick={() => setOpenIdx(i)}
            className="block w-full rounded-2xl overflow-hidden text-left group cursor-zoom-in transition-all hover:-translate-y-0.5"
            style={{ boxShadow: `0 0 40px rgba(0,0,0,0.5), 0 0 0 1px ${border}40` }}
            aria-label={`View full screenshot: ${s.label}`}
          >
            <div className="relative">
              {layout === 'stack' ? (
                <img
                  src={s.src}
                  alt={s.label}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              ) : (
                <div
                  className="aspect-video bg-cover bg-top group-hover:scale-105 transition-transform duration-300"
                  style={{ backgroundImage: `url(${s.src})` }}
                  role="img"
                  aria-label={s.label}
                />
              )}
              {/* Hover overlay hint */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/40">
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: accent, color: '#fff' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                  </svg>
                  Zoom
                </span>
              </div>
            </div>
            <div className="px-4 py-2.5 text-xs font-medium" style={{ background: cardBg, color: accent }}>
              {s.label}
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {mounted && openIdx !== null && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" />

          {/* Close button */}
          <button
            type="button"
            onClick={close}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Prev/Next */}
          {screenshots.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                aria-label="Previous"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                aria-label="Next"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </>
          )}

          {/* Image */}
          <div
            className="relative z-[1] max-w-full max-h-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={screenshots[openIdx].src}
              alt={screenshots[openIdx].label}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              style={{ boxShadow: `0 0 40px ${accent}30` }}
            />
            <p className="mt-4 text-sm text-white/80 text-center max-w-2xl px-4">
              {screenshots[openIdx].label}
            </p>
            {screenshots.length > 1 && (
              <p className="mt-1 text-xs text-white/40">
                {openIdx + 1} / {screenshots.length} · ← → to navigate · Esc to close
              </p>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
