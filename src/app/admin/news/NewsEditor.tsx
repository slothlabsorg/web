'use client'
import { useEffect, useMemo, useState } from 'react'
import { renderMarkdown, appMeta, type NewsFeed, type NewsItem, type NewsItemType, type BadgeTone } from '@/lib/news'

const FILES: { file: string; label: string; scope: string }[] = [
  { file: 'general.json',           label: '🌐 General',         scope: 'all'              },
  { file: 'cloudorbitnews.json',    label: '☁️ CloudOrbit',      scope: 'cloudorbit'       },
  { file: 'dataorbitnews.json',     label: '🗄️ DataOrbit',       scope: 'dataorbit'        },
  { file: 'proxyorbitnews.json',    label: '🔍 ProxyOrbit',      scope: 'proxyorbit'       },
  { file: 'bastionorbitnews.json',  label: '🔐 BastionOrbit',    scope: 'bastionorbit'     },
  { file: 'wattsorbitnews.json',    label: '⚡ WattsOrbit',      scope: 'wattsorbit'       },
  { file: 'mermaidpreviewnews.json',label: '🧜 Mermaid Preview', scope: 'mermaid-preview'  },
  { file: 'klightnews.json',        label: '🚀 klight',          scope: 'klight'           },
]

const ITEM_TYPES: NewsItemType[]   = ['news', 'announcement', 'tip', 'changelog', 'ad']
const BADGE_TONES: BadgeTone[]     = ['primary', 'success', 'warning', 'danger', 'neutral']

const TONE_BG: Record<string, string> = {
  primary: '#00D4FF20', success: '#10B98120', warning: '#F59E0B20', danger: '#F8717120', neutral: '#94A3B820',
}
const TONE_FG: Record<string, string> = {
  primary: '#7DD9FF', success: '#34D399', warning: '#FBBF24', danger: '#F87171', neutral: '#CBD5E1',
}

const EMPTY_FEED: NewsFeed = { version: 1, items: [] }

function blankItem(scope: string): NewsItem {
  return {
    id: `new-${Date.now()}`,
    type: 'news',
    priority: 5,
    publishedAt: new Date().toISOString(),
    badge: 'NEW',
    badgeTone: 'primary',
    title: 'New item title',
    body: 'Write some **markdown** here.\n\n- bullet one\n- bullet two',
    targetApps: scope === 'all' ? ['all'] : [scope],
  }
}

export default function NewsEditor() {
  const [activeFile, setActiveFile] = useState(FILES[0].file)
  const [feed, setFeed]             = useState<NewsFeed>(EMPTY_FEED)
  const [loading, setLoading]       = useState(false)
  const [saving, setSaving]         = useState(false)
  const [status, setStatus]         = useState<{ kind: 'idle' | 'ok' | 'err'; msg: string }>({ kind: 'idle', msg: '' })
  const [editingIdx, setEditingIdx] = useState<number | null>(null)

  const activeMeta = FILES.find(f => f.file === activeFile)!

  // Load active file from /news/* (live JSON in public/)
  useEffect(() => {
    setLoading(true)
    setStatus({ kind: 'idle', msg: '' })
    fetch(`/news/${activeFile}?t=${Date.now()}`)
      .then(r => r.ok ? r.json() : EMPTY_FEED)
      .then((j: NewsFeed) => {
        setFeed(j && Array.isArray(j.items) ? j : EMPTY_FEED)
        setEditingIdx(null)
      })
      .catch(() => setFeed(EMPTY_FEED))
      .finally(() => setLoading(false))
  }, [activeFile])

  const sortedItems = useMemo(() => {
    return [...feed.items].sort((a, b) => {
      const p = (b.priority ?? 0) - (a.priority ?? 0)
      if (p !== 0) return p
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    })
  }, [feed])

  function updateItem(idx: number, patch: Partial<NewsItem>) {
    setFeed(prev => ({ ...prev, items: prev.items.map((it, i) => i === idx ? { ...it, ...patch } : it) }))
  }
  function deleteItem(idx: number) {
    if (!confirm('Delete this item?')) return
    setFeed(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }))
    setEditingIdx(null)
  }
  function addItem() {
    const item = blankItem(activeMeta.scope)
    setFeed(prev => ({ ...prev, items: [item, ...prev.items] }))
    setEditingIdx(0)
  }

  async function save() {
    setSaving(true)
    setStatus({ kind: 'idle', msg: '' })
    try {
      const res = await fetch('/api/news/save', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ file: activeFile, content: { version: 1, items: feed.items } }),
        credentials: 'include',
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus({ kind: 'err', msg: body.error || `Save failed: ${res.status}` })
      } else {
        setStatus({ kind: 'ok', msg: body.message || 'Saved.' })
      }
    } catch (err) {
      setStatus({ kind: 'err', msg: (err as Error).message })
    } finally {
      setSaving(false)
    }
  }

  function downloadJson() {
    const formatted = JSON.stringify({ version: 1, items: feed.items }, null, 2)
    const blob = new Blob([formatted], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = activeFile; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen text-white" style={{ background: '#050818' }}>
      {/* Header */}
      <header className="border-b sticky top-0 z-20 backdrop-blur" style={{ background: '#050818cc', borderColor: '#1a2040' }}>
        <div className="site-container py-4 flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
            🦥 News CMS
          </h1>
          <span className="text-xs px-2 py-0.5 rounded-full border" style={{ background: '#F59E0B15', borderColor: '#F59E0B40', color: '#F59E0B' }}>
            Private · noindex
          </span>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              onClick={downloadJson}
              className="px-3 py-1.5 rounded-md text-xs font-semibold border hover:opacity-80 transition"
              style={{ borderColor: '#1a2040', color: '#8BA3C7' }}
            >
              ⬇ Download JSON
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="px-4 py-1.5 rounded-md text-xs font-bold transition disabled:opacity-50"
              style={{ background: '#00D4FF', color: '#050818' }}
            >
              {saving ? 'Saving…' : 'Commit & deploy'}
            </button>
          </div>
        </div>
      </header>

      {/* File tabs */}
      <div className="border-b overflow-x-auto" style={{ borderColor: '#1a2040' }}>
        <div className="site-container flex gap-1 py-2 min-w-max">
          {FILES.map(f => {
            const active = f.file === activeFile
            return (
              <button
                key={f.file}
                onClick={() => setActiveFile(f.file)}
                className="px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition"
                style={{
                  background: active ? '#00D4FF20' : 'transparent',
                  color: active ? '#7DD9FF' : '#8BA3C7',
                  border: active ? '1px solid #00D4FF40' : '1px solid transparent',
                }}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      {status.msg && (
        <div className="site-container pt-4">
          <div
            className="rounded-lg px-4 py-3 text-sm border"
            style={{
              background: status.kind === 'ok' ? '#10B98115' : '#F8717115',
              borderColor: status.kind === 'ok' ? '#10B98140' : '#F8717140',
              color: status.kind === 'ok' ? '#34D399' : '#F87171',
            }}
          >
            {status.msg}
          </div>
        </div>
      )}

      <main className="site-container py-8 grid lg:grid-cols-2 gap-6">
        {/* Left — list + editor */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-[#8BA3C7]">Items ({feed.items.length})</h2>
            <button
              onClick={addItem}
              className="px-3 py-1.5 rounded-md text-xs font-semibold border hover:opacity-80 transition"
              style={{ background: '#00D4FF15', borderColor: '#00D4FF40', color: '#7DD9FF' }}
            >
              + New item
            </button>
          </div>

          {loading ? (
            <p className="text-[#4A6080] text-sm">Loading…</p>
          ) : feed.items.length === 0 ? (
            <p className="text-[#4A6080] text-sm">No items. Click <strong>+ New item</strong> to add one.</p>
          ) : (
            <ul className="space-y-2">
              {feed.items.map((item, idx) => (
                <li
                  key={`${item.id}-${idx}`}
                  className="rounded-lg border"
                  style={{ background: '#0d1124', borderColor: editingIdx === idx ? '#00D4FF60' : '#1a2040' }}
                >
                  <button
                    type="button"
                    onClick={() => setEditingIdx(editingIdx === idx ? null : idx)}
                    className="w-full text-left p-3 flex items-center gap-3"
                  >
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: TONE_BG[item.badgeTone ?? 'neutral'], color: TONE_FG[item.badgeTone ?? 'neutral'] }}>
                      {item.badge ?? item.type}
                    </span>
                    <span className="font-semibold text-sm flex-1 truncate">{item.title}</span>
                    <span className="text-[10px] text-[#4A6080] tabular-nums">p{item.priority}</span>
                    <span className="text-[10px] text-[#4A6080]">{editingIdx === idx ? '▾' : '▸'}</span>
                  </button>

                  {editingIdx === idx && (
                    <ItemForm item={item} onChange={p => updateItem(idx, p)} onDelete={() => deleteItem(idx)} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Right — preview */}
        <section>
          <div className="sticky top-24 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-[#8BA3C7]">Preview</h2>
            <div className="space-y-3 max-h-[calc(100vh-180px)] overflow-y-auto pr-2">
              {sortedItems.length === 0 ? (
                <div className="rounded-2xl border p-6 text-center text-sm text-[#4A6080]" style={{ background: '#0d1124', borderColor: '#1a2040' }}>
                  Add items to see the live preview.
                </div>
              ) : sortedItems.map(item => <PreviewCard key={item.id} item={item} scope={activeMeta.scope} />)}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

// ── Item form ────────────────────────────────────────────────────────────────

function ItemForm({ item, onChange, onDelete }: { item: NewsItem; onChange: (p: Partial<NewsItem>) => void; onDelete: () => void }) {
  const setAction = (key: 'label' | 'url', val: string) => {
    const action = { label: '', url: '', ...(item.action || {}), [key]: val }
    if (!action.label && !action.url) onChange({ action: undefined })
    else onChange({ action })
  }
  const targetAppsStr = item.targetApps.join(', ')

  return (
    <div className="border-t p-3 space-y-2.5 text-xs" style={{ borderColor: '#1a2040' }}>
      <Field label="ID">
        <input value={item.id} onChange={e => onChange({ id: e.target.value })} className={inputCls} />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Type">
          <select value={item.type} onChange={e => onChange({ type: e.target.value as NewsItemType })} className={inputCls}>
            {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Priority (1-10)">
          <input type="number" min={1} max={10} value={item.priority} onChange={e => onChange({ priority: Number(e.target.value) })} className={inputCls} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Badge">
          <input value={item.badge ?? ''} onChange={e => onChange({ badge: e.target.value || undefined })} className={inputCls} />
        </Field>
        <Field label="Tone">
          <select value={item.badgeTone ?? 'neutral'} onChange={e => onChange({ badgeTone: e.target.value as BadgeTone })} className={inputCls}>
            {BADGE_TONES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Title">
        <input value={item.title} onChange={e => onChange({ title: e.target.value })} className={inputCls} />
      </Field>

      <Field label="Body (markdown — **bold**, ## h2, - bullets, `code`)">
        <textarea
          value={item.body}
          onChange={e => onChange({ body: e.target.value })}
          rows={7}
          className={`${inputCls} font-mono text-xs leading-relaxed`}
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Published (ISO)">
          <input value={item.publishedAt} onChange={e => onChange({ publishedAt: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Expires (optional ISO)">
          <input value={item.expiresAt ?? ''} onChange={e => onChange({ expiresAt: e.target.value || undefined })} className={inputCls} placeholder="(none)" />
        </Field>
      </div>

      <Field label="Target apps (comma-separated, or 'all')">
        <input
          value={targetAppsStr}
          onChange={e => onChange({ targetApps: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
          className={inputCls}
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Action label">
          <input value={item.action?.label ?? ''} onChange={e => setAction('label', e.target.value)} className={inputCls} />
        </Field>
        <Field label="Action URL">
          <input value={item.action?.url ?? ''} onChange={e => setAction('url', e.target.value)} className={inputCls} placeholder="https://…" />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-1">
        <label className="flex items-center gap-2 text-[#8BA3C7]">
          <input type="checkbox" checked={!!item.collapsed} onChange={e => onChange({ collapsed: e.target.checked || undefined })} />
          Collapsed
        </label>
        <label className="flex items-center gap-2 text-[#8BA3C7]">
          <input type="checkbox" checked={!!item.sponsored} onChange={e => onChange({ sponsored: e.target.checked || undefined })} />
          Sponsored
        </label>
        <button
          type="button"
          onClick={onDelete}
          className="px-2 py-1 rounded-md text-[11px] font-semibold border hover:opacity-80 transition justify-self-end"
          style={{ background: '#F8717115', borderColor: '#F8717140', color: '#F87171' }}
        >
          Delete item
        </button>
      </div>
    </div>
  )
}

const inputCls = 'w-full px-2.5 py-1.5 rounded-md bg-[#050818] border border-[#1a2040] text-white text-xs focus:outline-none focus:border-[#00D4FF60]'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block mb-1 text-[#4A6080] uppercase tracking-wider text-[10px] font-semibold">{label}</span>
      {children}
    </label>
  )
}

// ── Preview card ─────────────────────────────────────────────────────────────

function PreviewCard({ item, scope }: { item: NewsItem; scope: string }) {
  const meta = appMeta(scope)
  const isAd = item.type === 'ad' || item.sponsored
  const accent = meta.accent
  const bodyHtml = renderMarkdown(item.body)

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ background: '#0d1124', borderColor: isAd ? '#3a2a10' : '#1a2040' }}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border font-semibold" style={{ background: `${accent}15`, borderColor: `${accent}40`, color: accent }}>
          {meta.icon} {meta.label}
        </span>
        {item.badge && (
          <span className="px-2 py-0.5 rounded-full font-bold tracking-wider" style={{ background: TONE_BG[item.badgeTone ?? 'neutral'], color: TONE_FG[item.badgeTone ?? 'neutral'] }}>
            {item.badge}
          </span>
        )}
        {isAd && <span className="px-2 py-0.5 rounded-full font-semibold uppercase" style={{ background: '#F59E0B15', color: '#F59E0B' }}>Sponsored</span>}
        <span className="ml-auto text-[#4A6080] tabular-nums">p{item.priority}</span>
      </div>
      <h3 className="text-base font-bold tracking-tight text-white mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>{item.title}</h3>
      <div className="news-body text-[#8BA3C7] text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      {item.action?.url && (
        <div className="mt-3">
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold border" style={{ background: `${accent}15`, borderColor: `${accent}50`, color: accent }}>
            {item.action.label} →
          </span>
        </div>
      )}
    </div>
  )
}
