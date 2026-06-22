'use client'

import { useState } from 'react'
import Link from 'next/link'
import ProductNavbar from '@/components/ProductNavbar'
import Footer from '@/components/Footer'
import CustomCursor from '@/components/CustomCursor'

// ── Shared palette (matches LibraryShowcase + the rest of the SlothLabs site) ──
const BG_BASE = '#050d1f'
const BG_CARD = '#0d1b3e'
const BG_CODE = '#060d1e'
const BORDER = '#1a3060'
const TEXT_MUTED = '#8BA3C7'
const TEXT_DIM = '#4A6080'

export interface DocsSidebarItem {
  slug: string
  label: string
}
export interface DocsSidebarGroup {
  group: string
  items: DocsSidebarItem[]
}

export interface LibraryDocsProps {
  /** URL slug (e.g. "envlint") — used for the docsHref + back link. */
  slug: string
  /** Display name. */
  name: string
  /** Emoji icon shown in the navbar. */
  icon: string
  /** Brand accent hex. */
  accent: string
  /** GitHub repo name under github.com/slothlabsorg/<repo>. */
  repo: string
  /** One-line lead shown under the page heading on the overview. */
  tagline: string
  /** Sidebar / table-of-contents structure. */
  sidebar: DocsSidebarGroup[]
  /** Rendered section content keyed by sidebar slug. */
  sections: Record<string, React.ReactNode>
}

// ── Reusable doc primitives (exported so each page composes its sections) ──────

export function H({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
      {children}
    </h2>
  )
}

export function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-lg font-semibold mt-8 mb-2 text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
      {children}
    </h3>
  )
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] leading-relaxed mb-3" style={{ color: TEXT_MUTED }}>{children}</p>
}

export function C({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <code className="px-1.5 py-0.5 rounded text-[13px] font-mono" style={{ background: BG_CARD, color: accent, border: `1px solid ${BORDER}` }}>
      {children}
    </code>
  )
}

export function Li({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <li className="flex items-start gap-2 text-[15px] mb-1" style={{ color: TEXT_MUTED }}>
      <span style={{ color: accent }} className="mt-1 flex-shrink-0 text-xs">▸</span>
      {children}
    </li>
  )
}

export function Callout({
  type,
  accent,
  children,
}: {
  type: 'info' | 'warn' | 'success'
  accent: string
  children: React.ReactNode
}) {
  const color = type === 'warn' ? '#fbbf24' : type === 'success' ? '#34d399' : accent
  return (
    <div className="my-5 px-4 py-3 rounded-r-lg border-l-4 text-sm leading-relaxed" style={{ borderColor: color, background: `${color}10`, color: TEXT_MUTED }}>
      {children}
    </div>
  )
}

export function CodeBlock({
  code,
  lang = 'bash',
  filename,
  accent,
}: {
  code: string
  lang?: string
  filename?: string
  accent: string
}) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <div className="relative rounded-xl border overflow-hidden my-5" style={{ borderColor: BORDER }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ background: '#030712', borderColor: BORDER }}>
        <span className="text-xs font-mono" style={{ color: TEXT_DIM }}>{filename ?? lang}</span>
        <button onClick={copy} className="text-xs transition-colors" style={{ color: copied ? accent : TEXT_DIM }}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="px-4 py-4 overflow-x-auto text-[13px] leading-relaxed font-mono" style={{ background: BG_CODE, color: '#c9d1d9' }}>
        <code>{code}</code>
      </pre>
    </div>
  )
}

export function Table({
  head,
  rows,
  accent,
}: {
  head: string[]
  rows: React.ReactNode[][]
  accent: string
}) {
  return (
    <div className="overflow-x-auto mt-4 mb-6">
      <table className="w-full text-[13px] border-collapse">
        <thead>
          <tr className="border-b" style={{ borderColor: BORDER }}>
            {head.map(h => (
              <th key={h} className="px-4 py-3 text-left font-semibold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b" style={{ borderColor: BORDER }}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3" style={j === 0 ? { color: accent, fontFamily: 'monospace', fontSize: '12px' } : { color: TEXT_MUTED }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Renders three clearly-labeled per-language subsections (Rust / TypeScript /
 * Kotlin) for a single topic. Keeps the three docs pages consistent.
 */
export function LangTabs({
  accent,
  rust,
  ts,
  kotlin,
}: {
  accent: string
  rust: React.ReactNode
  ts: React.ReactNode
  kotlin: React.ReactNode
}) {
  const TABS: { id: string; label: string }[] = [
    { id: 'rust', label: 'Rust' },
    { id: 'ts', label: 'TypeScript' },
    { id: 'kotlin', label: 'Kotlin' },
  ]
  const [active, setActive] = useState('rust')
  const body = active === 'rust' ? rust : active === 'ts' ? ts : kotlin
  return (
    <div className="my-5">
      <div className="flex gap-1 mb-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className="text-xs font-semibold px-3 py-1.5 rounded-t-lg transition-colors"
            style={
              active === t.id
                ? { background: `${accent}18`, color: accent, borderBottom: `2px solid ${accent}` }
                : { color: TEXT_DIM }
            }
          >
            {t.label}
          </button>
        ))}
      </div>
      {body}
    </div>
  )
}

// ── Docs chrome ────────────────────────────────────────────────────────────────

export default function LibraryDocs({ slug, name, icon, accent, repo, tagline, sidebar, sections }: LibraryDocsProps) {
  const [active, setActive] = useState(sidebar[0]?.items[0]?.slug ?? 'overview')
  const flat = sidebar.flatMap(g => g.items)
  const idx = flat.findIndex(i => i.slug === active)
  const prev = flat[idx - 1]
  const next = flat[idx + 1]

  return (
    <main style={{ background: BG_BASE, minHeight: '100vh' }}>
      <CustomCursor />
      <ProductNavbar
        icon={icon}
        name={name}
        accent={accent}
        ctaKind="link"
        ctaLabel="GitHub"
        ctaHref={`https://github.com/slothlabsorg/${repo}`}
        docsHref={`/${slug}/docs`}
      />

      <div className="pt-16 flex min-h-screen">
        {/* Sidebar — desktop only */}
        <aside
          className="hidden md:flex flex-col flex-shrink-0 w-56 lg:w-64 sticky top-16 self-start overflow-y-auto py-8 pl-6 pr-4 border-r"
          style={{ borderColor: BORDER, maxHeight: 'calc(100vh - 64px)' }}
        >
          <Link href={`/${slug}`} className="text-xs font-medium mb-6 flex items-center gap-1.5 hover:opacity-80 transition-opacity" style={{ color: accent }}>
            ← {name}
          </Link>
          {sidebar.map(group => (
            <div key={group.group} className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2 px-2" style={{ color: TEXT_DIM }}>{group.group}</p>
              <ul className="space-y-0.5">
                {group.items.map(item => (
                  <li key={item.slug}>
                    <button
                      onClick={() => setActive(item.slug)}
                      className="w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors"
                      style={active === item.slug ? { background: `${accent}18`, color: accent, fontWeight: 600 } : { color: TEXT_MUTED }}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>

        {/* Right column: mobile picker + content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="md:hidden px-4 pt-6 pb-2">
            <select
              value={active}
              onChange={e => setActive(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-white border"
              style={{ background: BG_CARD, borderColor: BORDER }}
            >
              {sidebar.map(group =>
                group.items.map(item => (
                  <option key={item.slug} value={item.slug}>{group.group} — {item.label}</option>
                )),
              )}
            </select>
          </div>

          <article className="flex-1 min-w-0 px-6 md:px-10 lg:px-16 py-10 max-w-3xl">
            {active === (sidebar[0]?.items[0]?.slug ?? 'overview') && (
              <p className="text-sm mb-2" style={{ color: TEXT_DIM }}>{tagline}</p>
            )}

            {sections[active] ?? <p style={{ color: TEXT_DIM }}>Section not found.</p>}

            {/* Prev / Next */}
            <div className="mt-16 pt-8 border-t flex justify-between gap-4" style={{ borderColor: BORDER }}>
              {prev ? (
                <button onClick={() => setActive(prev.slug)} className="text-sm transition-colors flex items-center gap-1 hover:text-white" style={{ color: TEXT_MUTED }}>
                  ← {prev.label}
                </button>
              ) : (
                <span />
              )}
              {next ? (
                <button onClick={() => setActive(next.slug)} className="text-sm font-medium transition-colors flex items-center gap-1 hover:opacity-80" style={{ color: accent }}>
                  {next.label} →
                </button>
              ) : (
                <Link href={`/${slug}`} className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: accent }}>
                  Back to {name} →
                </Link>
              )}
            </div>
          </article>
        </div>
      </div>

      <Footer showSuiteLink accent={accent} />
    </main>
  )
}
