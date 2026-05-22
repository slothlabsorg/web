'use client'
import { useEffect, useState } from 'react'
import { appMeta } from '@/lib/news'

interface Props {
  scopes: string[]
}

export default function NewsFilter({ scopes }: Props) {
  const [active, setActive] = useState<string>('all')

  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>('.news-card')
    cards.forEach(card => {
      const scope = card.dataset.scope ?? ''
      const visible = active === 'all' || scope === active
      card.style.display = visible ? '' : 'none'
    })
  }, [active])

  return (
    <div className="flex flex-wrap gap-2 mb-8 max-w-3xl mx-auto">
      <button
        type="button"
        onClick={() => setActive('all')}
        className="px-3 py-1.5 rounded-full text-xs font-semibold border transition"
        style={{
          background: active === 'all' ? '#00D4FF20' : 'transparent',
          borderColor: active === 'all' ? '#00D4FF50' : '#1a2040',
          color:       active === 'all' ? '#00D4FF'   : '#8BA3C7',
        }}
      >
        All news
      </button>
      {scopes.filter(s => s !== 'all').map(scope => {
        const meta = appMeta(scope)
        const isOn = active === scope
        return (
          <button
            type="button"
            key={scope}
            onClick={() => setActive(scope)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border transition flex items-center gap-1.5"
            style={{
              background: isOn ? `${meta.accent}20` : 'transparent',
              borderColor: isOn ? `${meta.accent}50` : '#1a2040',
              color: isOn ? meta.accent : '#8BA3C7',
            }}
          >
            <span aria-hidden>{meta.icon}</span> {meta.label}
          </button>
        )
      })}
    </div>
  )
}
