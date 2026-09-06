'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import CodePlayground from './CodePlayground'
import { DOC_TABS, UI, REPO_URL, type DocType, type Lang } from '@/data/ragCourse'

interface LabData {
  scratch: string | null
  expectedHtml: string | null
  solutionHtml: string | null
  dataFiles: { path: string; content: string }[]
}

interface Props {
  lang: Lang
  slug: string
  n: number
  icon: string
  accent: string
  title: string
  available: DocType[]
  html: Partial<Record<DocType, string>>
  lab: LabData
}

const LABELS = {
  es: { expected: 'Resultado esperado', walkthrough: 'Solución explicada', show: 'Mostrar', hide: 'Ocultar', lab: 'Taller práctico' },
  en: { expected: 'Expected result', walkthrough: 'Explained solution', show: 'Show', hide: 'Hide', lab: 'Hands-on lab' },
}

function Collapsible({ title, children, lang }: { title: string; children: React.ReactNode; lang: Lang }) {
  const [open, setOpen] = useState(false)
  const l = LABELS[lang]
  return (
    <div className="rounded-2xl border border-[#1a3060] bg-[#060d1e] overflow-hidden my-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-[#0a1530] transition-colors"
      >
        <span className="font-semibold text-white text-sm">{title}</span>
        <span className="text-xs px-3 py-1 rounded-full border border-[#1a3060] text-[#8BA3C7]">
          {open ? l.hide : l.show}
        </span>
      </button>
      {open && <div className="px-5 pb-5 border-t border-[#1a3060] pt-4">{children}</div>}
    </div>
  )
}

export default function ModuleView({ lang, slug, n, icon, accent, title, available, html, lab }: Props) {
  const otherLang: Lang = lang === 'es' ? 'en' : 'es'
  const tabs = DOC_TABS.filter((t) => available.includes(t.type))
  const [active, setActive] = useState<DocType>(tabs[0]?.type ?? 'guia')
  const l = LABELS[lang]
  const contentRef = useRef<HTMLDivElement>(null)
  // Anchor to scroll to once the tab that contains it has rendered.
  const pendingAnchor = useRef<string | null>(null)

  const isAvailable = useCallback(
    (tab: string): tab is DocType => available.includes(tab as DocType),
    [available],
  )

  /** Open a tab, then scroll to the anchor after React has painted it. */
  const goToTab = useCallback((tab: DocType, anchor?: string | null) => {
    setActive(tab)
    pendingAnchor.current = anchor ?? null
  }, [])

  // Cross-module links arrive as ?tab=<type>#<anchor>. Read from location rather
  // than useSearchParams: this is a static export, and reading it here avoids
  // needing a Suspense boundary for something purely client-side.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    if (tab && isAvailable(tab)) {
      goToTab(tab, window.location.hash || null)
    } else if (window.location.hash) {
      pendingAnchor.current = window.location.hash
    }
  }, [isAvailable, goToTab])

  // Same-module links are rewritten with data-course-tab: switch tab in place
  // instead of navigating, so the reader keeps their position in the module.
  useEffect(() => {
    const root = contentRef.current
    if (!root) return
    const onClick = (event: MouseEvent) => {
      const anchorEl = (event.target as HTMLElement | null)?.closest?.('a[data-course-tab]')
      if (!(anchorEl instanceof HTMLAnchorElement)) return
      const tab = anchorEl.dataset.courseTab
      if (!tab || !isAvailable(tab)) return
      event.preventDefault()
      const href = anchorEl.getAttribute('href') || ''
      const hash = href.startsWith('#') && href !== '#' ? href : null
      goToTab(tab, hash)
    }
    root.addEventListener('click', onClick)
    return () => root.removeEventListener('click', onClick)
  }, [isAvailable, goToTab])

  // Scroll after the newly-activated tab is in the DOM; the element does not
  // exist until then, so this cannot be done in the click handler.
  useEffect(() => {
    const hash = pendingAnchor.current
    if (!hash) return
    pendingAnchor.current = null
    const id = decodeURIComponent(hash.slice(1))
    const target = document.getElementById(id)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [active])

  return (
    <div>
      {/* Module header */}
      <div className="border-b border-[#0e1f3a] bg-[#060d1e]/60">
        <div className="site-container py-6">
          <div className="flex items-center justify-between gap-4 mb-4 text-sm">
            <Link href="/rag-course/" className="text-[#8BA3C7] hover:text-white transition-colors">
              {UI.backToCourse[lang]}
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href={`/rag-course/${otherLang}/${slug}/`}
                className="px-3 py-1.5 rounded-full border border-[#1a3060] text-[#8BA3C7] hover:text-white hover:border-[#4DA6FF]/50 transition-colors text-xs font-semibold"
              >
                {otherLang === 'en' ? '🇬🇧 English' : '🇪🇸 Español'}
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border flex-shrink-0"
              style={{ background: `${accent}14`, borderColor: `${accent}40` }}
            >
              {icon}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold" style={{ color: accent }}>
                {`M${n}`}
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                {title}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="sticky top-[72px] z-30 border-b border-[#0e1f3a] bg-[#050d1f]/90 backdrop-blur-md">
        <div className="site-container">
          <div className="flex gap-1 overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.type}
                type="button"
                onClick={() => setActive(tab.type)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  active === tab.type
                    ? 'text-white'
                    : 'text-[#8BA3C7] border-transparent hover:text-white'
                }`}
                style={active === tab.type ? { borderColor: accent } : undefined}
              >
                <span className="mr-1.5">{tab.icon}</span>
                {tab.label[lang]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {/* ref here so one delegated listener covers every tab's rendered markdown */}
      <div className="site-container py-8 max-w-4xl" ref={contentRef}>
        {active !== 'lab' && html[active] && (
          <div className="course-md" dangerouslySetInnerHTML={{ __html: html[active] as string }} />
        )}

        {active === 'lab' && (
          <div>
            {html.lab && <div className="course-md" dangerouslySetInnerHTML={{ __html: html.lab }} />}

            {lab.scratch && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
                  🧪 {l.lab}
                </h2>
                <p className="text-[#8BA3C7] text-sm mb-3">{UI.runnable[lang]} · Pyodide</p>
                <CodePlayground starterCode={lab.scratch} dataFiles={lab.dataFiles} lang={lang} />
              </div>
            )}

            {lab.expectedHtml && (
              <Collapsible title={`✅ ${l.expected}`} lang={lang}>
                <div className="course-md" dangerouslySetInnerHTML={{ __html: lab.expectedHtml }} />
              </Collapsible>
            )}
            {lab.solutionHtml && (
              <Collapsible title={`📖 ${l.walkthrough}`} lang={lang}>
                <div className="course-md" dangerouslySetInnerHTML={{ __html: lab.solutionHtml }} />
              </Collapsible>
            )}
          </div>
        )}

        {/* View on GitHub */}
        <div className="mt-12 pt-6 border-t border-[#0e1f3a] flex items-center justify-between text-sm">
          <Link href="/rag-course/" className="text-[#8BA3C7] hover:text-white transition-colors">
            {UI.backToCourse[lang]}
          </Link>
          <a
            href={`${REPO_URL}/tree/main/${lang}/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#4DA6FF] hover:text-white transition-colors font-semibold"
          >
            {UI.viewRepo[lang]} →
          </a>
        </div>
      </div>
    </div>
  )
}
