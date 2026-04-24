'use client'
import { useState, useEffect } from 'react'

const IMAGES = [
  { src: '/images/sloth-mascot.png',    alt: 'SlothLabs mascot' },
  { src: '/images/opensourceslothy.png', alt: 'Slothy — open source forever' },
]

export default function HeroMascotRotator() {
  const [idx, setIdx]       = useState(0)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const t = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setIdx(i => (i + 1) % IMAGES.length)
        setFading(false)
      }, 400)
    }, 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="relative flex justify-center md:justify-end order-2 md:order-1 w-fit max-w-full md:justify-self-end">
      <div className="absolute inset-0 flex items-center justify-center md:justify-end">
        <div className="w-80 h-80 lg:w-96 lg:h-96 rounded-full bg-[#4DA6FF]/12 blur-3xl" />
      </div>
      <div
        className="hero-mascot-entrance relative z-10 flex flex-wrap w-[400px] h-[400px] max-w-[min(400px,calc(100vw-2rem))] bg-no-repeat bg-center select-none drop-shadow-2xl"
        style={{
          backgroundImage: `url(${IMAGES[idx].src})`,
          backgroundSize: '100%',
          backgroundPosition: '50% 50%',
          opacity: fading ? 0 : 1,
          transition: 'opacity 0.4s ease',
        }}
        role="img"
        aria-label={IMAGES[idx].alt}
      />
    </div>
  )
}
