'use client'

import { useRef, useState, useCallback, useMemo } from 'react'

interface DotStar {
  top: string
  left: string
  duration: string
  delay: string
  size: string
  type: 'small' | 'medium'
}

interface FourPointStar {
  top: string
  left: string
  duration: string
  delay: string
  size: 'sm' | 'md' | 'lg'
  accent?: boolean
  rotate?: number
}

/** Estrellas pequeñas dispersas en todo el fondo (pocas, no densas) */
function genSparseDots(count: number, seed: number): DotStar[] {
  const list: DotStar[] = []
  for (let i = 0; i < count; i++) {
    const type: 'small' | 'medium' = (i + seed) % 4 === 0 ? 'medium' : 'small'
    list.push({
      top: `${(i * 17 + seed * 11) % 100}%`,
      left: `${(i * 23 + seed * 7) % 100}%`,
      duration: `${2.2 + (i % 5) * 0.6}s`,
      delay: `${(i % 7) * 0.5}s`,
      size: type === 'small' ? `${1.5 + (i % 2) * 0.5}px` : '3px',
      type,
    })
  }
  return list
}

/** Estrellas de 4 puntas rodeando al personaje (izquierda-centro) */
function genFourPointAroundCharacter(): FourPointStar[] {
  const positions = [
    { top: '34%', left: '22%' },
    { top: '42%', left: '18%' },
    { top: '38%', left: '28%' },
    { top: '48%', left: '24%' },
    { top: '52%', left: '32%' },
    { top: '36%', left: '36%' },
    { top: '44%', left: '38%' },
  ]
  const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'md', 'sm', 'lg', 'sm', 'md']
  return positions.map((p, i) => ({
    ...p,
    duration: `${2.5 + (i % 4) * 0.5}s`,
    delay: `${i * 0.4}s`,
    size: sizes[i],
    accent: i === 2,
    rotate: (i % 4) * 45,
  }))
}

/** Estrellas de 4 puntas en esquina inferior derecha */
function genFourPointLowerRight(): FourPointStar[] {
  const positions = [
    { top: '72%', left: '78%' },
    { top: '78%', left: '82%' },
    { top: '82%', left: '75%' },
    { top: '88%', left: '88%' },
    { top: '75%', left: '90%' },
    { top: '85%', left: '72%' },
    { top: '70%', left: '85%' },
  ]
  const sizes: Array<'sm' | 'md' | 'lg'> = ['md', 'sm', 'lg', 'sm', 'md', 'md', 'sm']
  return positions.map((p, i) => ({
    ...p,
    duration: `${2.8 + (i % 3) * 0.6}s`,
    delay: `${(i + 2) * 0.5}s`,
    size: sizes[i],
    rotate: (i % 4) * 45,
  }))
}

const SPARKLE_PATH =
  'M 143.21 131.761 C 143.21 131.761 144.398 125.559 145.453 131.761 C 145.453 131.761 151.391 132.816 145.453 133.872 C 145.453 133.872 144.398 140.206 143.21 133.872 C 139.647 133.212 139.911 132.553 143.21 131.761 Z'
/* viewBox recortado al path para que la estrella de 4 puntas llene el SVG y se vea */
const SPARKLE_VIEWBOX = '138 124 16 18'

function SparkleSvg({
  size,
  accent,
  top,
  left,
  duration,
  delay,
  rotate,
}: {
  size: 'sm' | 'md' | 'lg'
  accent?: boolean
  top: string
  left: string
  duration: string
  delay: string
  rotate?: number
}) {
  const w = size === 'sm' ? 12 : size === 'md' ? 16 : 22
  return (
    <div
      className="absolute"
      style={{
        top,
        left,
        transform: rotate != null ? 'translate(-50%,-50%) rotate(' + rotate + 'deg)' : 'translate(-50%,-50%)',
        width: w,
        height: w,
      }}
    >
      <svg
        className={`sparkle ${accent ? 'sparkle--accent' : ''}`}
        viewBox={SPARKLE_VIEWBOX}
        width={w}
        height={w}
        style={{ ['--duration' as string]: duration, ['--delay' as string]: delay } as React.CSSProperties}
        aria-hidden
      >
        <path fill={accent ? '#F5A623' : 'rgba(255,255,255,0.95)'} d={SPARKLE_PATH} />
      </svg>
    </div>
  )
}

/** Cúmulo denso de estrellas chiquitas = efecto nebulosa */
function genNebulaCluster(count: number, seed: number, centerX: number, centerY: number, radiusX: number, radiusY: number): DotStar[] {
  const list: DotStar[] = []
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + seed
    const r = 0.3 + (Math.sin(i * 0.7) * 0.5 + 0.5) * 0.7
    const x = centerX + Math.cos(angle) * radiusX * r
    const y = centerY + Math.sin(angle) * radiusY * r
    list.push({
      top: `${y}%`,
      left: `${x}%`,
      duration: `${1.8 + (i % 6) * 0.4}s`,
      delay: `${(i % 9) * 0.15}s`,
      size: `${1 + (i % 3) * 0.5}px`,
      type: (i % 5 === 0 ? 'medium' : 'small') as 'small' | 'medium',
    })
  }
  return list
}

export default function HeroParallaxBg() {
  const ref = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)

  const sparseDots = useMemo(() => genSparseDots(42, 1), [])
  const fourPointAround = useMemo(() => genFourPointAroundCharacter(), [])
  const fourPointCorner = useMemo(() => genFourPointLowerRight(), [])
  const nebulaRight = useMemo(() => genNebulaCluster(120, 2, 72, 48, 52, 46), [])
  const nebulaLeft = useMemo(() => genNebulaCluster(100, 5, 28, 52, 42, 40), [])

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      setMousePos({ x, y })
    },
    []
  )

  const onMouseLeave = useCallback(() => setMousePos(null), [])

  return (
    <div
      ref={ref}
      className="absolute inset-0 overflow-hidden"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={
        mousePos
          ? { ['--mouse-x' as string]: `${mousePos.x}%`, ['--mouse-y' as string]: `${mousePos.y}%` }
          : undefined
      }
      aria-hidden
    >
      {/* Base: azul profundo con gradiente sutil */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(165deg, #050d1f 0%, #0a1635 35%, #050d1f 70%, #071428 100%)',
        }}
      />

      {/* Nebula texture difuminada */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/images/nebula-texture.png)',
          filter: 'blur(14px)',
          opacity: 0.45,
        }}
      />

      {/* Brillo sutil al pasar el mouse sobre las estrellas */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: 'radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.06) 0%, transparent 28%)',
          opacity: mousePos ? 1 : 0,
        }}
      />

      {/* Nebulosa derecha (más grande): cúmulo de estrellas chiquitas */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{ clipPath: 'ellipse(55% 48% at 72% 48%)' }}
        >
          {nebulaRight.map((s, i) => (
            <div
              key={`nebula-r-${i}`}
              className={`star ${s.type === 'medium' ? 'star--medium' : ''}`}
              style={{
                top: s.top,
                left: s.left,
                width: s.size,
                height: s.size,
                ['--duration' as string]: s.duration,
                ['--delay' as string]: s.delay,
                opacity: 0.7 + (i % 5) * 0.06,
              }}
            />
          ))}
        </div>
      </div>

      {/* Nebulosa izquierda: repetida para balance */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{ clipPath: 'ellipse(45% 42% at 28% 52%)' }}
        >
          {nebulaLeft.map((s, i) => (
            <div
              key={`nebula-l-${i}`}
              className={`star ${s.type === 'medium' ? 'star--medium' : ''}`}
              style={{
                top: s.top,
                left: s.left,
                width: s.size,
                height: s.size,
                ['--duration' as string]: s.duration,
                ['--delay' as string]: s.delay,
                opacity: 0.55 + (i % 5) * 0.08,
              }}
            />
          ))}
        </div>
      </div>

      {/* Estrellas dispersas (puntos pequeños en todo el fondo) */}
      <div className="absolute inset-0 pointer-events-none">
        {sparseDots.map((s, i) => (
          <div
            key={`sparse-${i}`}
            className={`star ${s.type === 'medium' ? 'star--medium' : ''}`}
            style={{
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              ['--duration' as string]: s.duration,
              ['--delay' as string]: s.delay,
            }}
          />
        ))}
      </div>

      {/* Sparkles SVG (4 puntas curvas) alrededor del personaje + acento dorada */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {fourPointAround.map((s, i) => (
          <SparkleSvg
            key={`char-${i}`}
            size={s.size}
            accent={s.accent}
            top={s.top}
            left={s.left}
            duration={s.duration}
            delay={s.delay}
            rotate={s.rotate}
          />
        ))}
      </div>

      {/* Sparkles en esquina inferior derecha */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {fourPointCorner.map((s, i) => (
          <SparkleSvg
            key={`corner-${i}`}
            size={s.size}
            top={s.top}
            left={s.left}
            duration={s.duration}
            delay={s.delay}
            rotate={s.rotate}
          />
        ))}
      </div>

      {/* Estrella fugaz tipo asteroid (cabeza + cola) — left to right only */}
      <div className="asteroid" style={{ animationDelay: '0s' }} />
      <div className="asteroid" style={{ animationDelay: '9s' }} />
      {/* UFO — right to left */}
      <div className="hero-ufo" style={{ animationDelay: '18s' }} aria-hidden>
        <svg viewBox="0 0 80 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Saucer body (ellipse) */}
          <ellipse cx="40" cy="26" rx="36" ry="8" fill="rgba(200,220,255,0.95)" stroke="rgba(0,212,255,0.5)" strokeWidth="1" />
          {/* Dome */}
          <ellipse cx="40" cy="18" rx="14" ry="10" fill="rgba(230,240,255,0.95)" stroke="rgba(0,212,255,0.4)" strokeWidth="0.8" />
          {/* Cabin highlight */}
          <ellipse cx="40" cy="16" rx="6" ry="4" fill="rgba(255,255,255,0.6)" />
        </svg>
      </div>
    </div>
  )
}
