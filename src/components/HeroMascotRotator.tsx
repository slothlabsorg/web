'use client'
import { useState, useEffect } from 'react'

const IMAGES = [
  { src: '/images/sloth-mascot.png',     alt: 'SlothLabs mascot' },
  { src: '/images/opensourceslothy.png', alt: 'Slothy — open source forever' },
]

export default function HeroMascotRotator() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % IMAGES.length), 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="relative flex justify-center md:justify-end order-2 md:order-1 w-fit max-w-full md:justify-self-end">
      <div className="absolute inset-0 flex items-center justify-center md:justify-end">
        <div className="w-80 h-80 lg:w-96 lg:h-96 rounded-full bg-[#4DA6FF]/12 blur-3xl" />
      </div>
      {/* Both images always rendered and stacked — crossfade via opacity only */}
      <div className="hero-mascot-entrance relative z-10 w-[400px] h-[400px] max-w-[min(400px,calc(100vw-2rem))] select-none">
        {IMAGES.map((img, i) => (
          <div
            key={img.src}
            className="absolute inset-0 bg-no-repeat bg-center drop-shadow-2xl"
            style={{
              backgroundImage: `url(${img.src})`,
              backgroundSize: '100%',
              backgroundPosition: '50% 50%',
              opacity: i === active ? 1 : 0,
              transition: 'opacity 1s ease-in-out',
            }}
            role={i === active ? 'img' : 'presentation'}
            aria-label={i === active ? img.alt : undefined}
          />
        ))}
      </div>
    </div>
  )
}
