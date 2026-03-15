'use client'
import { useMemo } from 'react'

interface Star {
  top: string; left: string; duration: string; delay: string; size: string;
}

export default function StarField({ count = 60 }: { count?: number }) {
  const stars: Star[] = useMemo(() => (
    Array.from({ length: count }, (_, i) => ({
      top:      `${Math.random() * 100}%`,
      left:     `${Math.random() * 100}%`,
      duration: `${2 + Math.random() * 4}s`,
      delay:    `${Math.random() * 4}s`,
      size:     `${1 + Math.random() * 2}px`,
    }))
  ), [count])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((s, i) => (
        <div
          key={i}
          className="star"
          style={{
            top:      s.top,
            left:     s.left,
            '--duration': s.duration,
            '--delay':    s.delay,
            width:        s.size,
            height:       s.size,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
