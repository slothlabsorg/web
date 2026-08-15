'use client'
import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * The headline word that rotates like a venetian blind.
 *
 * It rests on the first word ("runtime") for a beat longer than the rest, then
 * cycles through every runtime runtime-orbit can borrow — Docker, OrbStack,
 * Kubernetes, Rancher, Podman, colima, Lima, containerd — which is the claim the
 * page is making, told by the animation instead of a feature list.
 *
 * The blind is real: each word is drawn as N horizontal slats (clip-path insets
 * over stacked copies), and on a change the outgoing slats rotate away on the X
 * axis while the incoming ones rotate in, staggered top to bottom.
 *
 * Width is reserved by an invisible copy of the longest word, so a 10-character
 * swing never reflows the headline. Under `prefers-reduced-motion` the same
 * rotation happens as a flat crossfade, with no 3D and no stagger.
 */

const SLATS = 7
/** Slat animation duration, and the gap between consecutive slats. */
const SLAT_MS = 420
const STAGGER_MS = 45
/** Total time for the last slat to finish — when the outgoing layer can go. */
const SWEEP_MS = SLAT_MS + STAGGER_MS * (SLATS - 1)

interface Props {
  words: string[]
  /** Colour for the rotating word. */
  accent: string
  /** How long to hold the first word. It's the one that names the product. */
  holdFirstMs?: number
  /** How long to hold each of the others. */
  holdMs?: number
  className?: string
}

export default function RuntimeWordRotator({
  words,
  accent,
  holdFirstMs = 4200,
  holdMs = 1750,
  className = '',
}: Props) {
  const [index, setIndex] = useState(0)
  const [outgoing, setOutgoing] = useState<number | null>(null)
  const [reduced, setReduced] = useState(false)
  // Bumped on every change so the CSS animations restart via `key`.
  const turn = useRef(0)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Advance on a timer whose length depends on which word is showing.
  useEffect(() => {
    if (words.length < 2) return
    const hold = index === 0 ? holdFirstMs : holdMs
    const t = window.setTimeout(() => {
      turn.current += 1
      setOutgoing(index)
      setIndex((i) => (i + 1) % words.length)
    }, hold)
    return () => window.clearTimeout(t)
  }, [index, words.length, holdFirstMs, holdMs])

  // Retire the outgoing layer once its last slat has finished, so we never keep
  // a stale copy in the DOM (it would sit under the live one and blur the text).
  useEffect(() => {
    if (outgoing === null) return
    const t = window.setTimeout(() => setOutgoing(null), SWEEP_MS + 60)
    return () => window.clearTimeout(t)
  }, [outgoing])

  const longest = useMemo(
    () => words.reduce((a, b) => (b.length > a.length ? b : a), ''),
    [words],
  )
  const slats = useMemo(() => Array.from({ length: SLATS }, (_, i) => i), [])

  const word = words[index]
  const leaving = outgoing === null ? null : words[outgoing]

  return (
    <span
      className={`relative inline-block align-baseline ${className}`}
      style={{ color: accent, perspective: reduced ? undefined : '600px' }}
    >
      <style>{`
        @keyframes ro-slat-in  {
          from { transform: rotateX(-92deg); opacity: 0 }
          to   { transform: rotateX(0deg);   opacity: 1 }
        }
        @keyframes ro-slat-out {
          from { transform: rotateX(0deg);   opacity: 1 }
          to   { transform: rotateX(88deg);  opacity: 0 }
        }
        @keyframes ro-fade-in  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes ro-fade-out { from { opacity: 1 } to { opacity: 0 } }
      `}</style>

      {/* Reserves the width of the longest word so the headline never reflows. */}
      <span aria-hidden className="invisible whitespace-pre">
        {longest}
      </span>

      {/* Announce the change once, not slat by slat. */}
      <span className="sr-only" aria-live="polite">
        {word}
      </span>

      {leaving !== null &&
        slats.map((s) => (
          <Slat
            key={`out-${turn.current}-${s}`}
            text={leaving}
            slat={s}
            reduced={reduced}
            direction="out"
          />
        ))}

      {slats.map((s) => (
        <Slat
          key={`in-${turn.current}-${s}`}
          text={word}
          slat={s}
          reduced={reduced}
          direction="in"
        />
      ))}
    </span>
  )
}

function Slat({
  text,
  slat,
  reduced,
  direction,
}: {
  text: string
  slat: number
  reduced: boolean
  direction: 'in' | 'out'
}) {
  // A horizontal band of the glyphs — the slat of the blind.
  const top = (slat / SLATS) * 100
  const bottom = 100 - ((slat + 1) / SLATS) * 100

  // Reduced motion collapses to one crossfade: only the first band paints, with
  // no clipping, so there's a single flat layer instead of seven moving parts.
  if (reduced && slat > 0) return null

  const animation = reduced
    ? `${direction === 'in' ? 'ro-fade-in' : 'ro-fade-out'} 260ms ease both`
    : `${direction === 'in' ? 'ro-slat-in' : 'ro-slat-out'} ${SLAT_MS}ms cubic-bezier(.22,.61,.36,1) both`

  return (
    <span
      aria-hidden
      className="absolute inset-0 whitespace-pre"
      style={{
        clipPath: reduced ? undefined : `inset(${top}% 0 ${bottom}% 0)`,
        transformOrigin: 'center center',
        backfaceVisibility: 'hidden',
        animation,
        animationDelay: reduced ? undefined : `${slat * STAGGER_MS}ms`,
      }}
    >
      {text}
    </span>
  )
}
