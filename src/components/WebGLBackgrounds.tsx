'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

// Lazy-load HeroParallaxBg so it's only bundled when selected
const HeroParallaxBg = dynamic(() => import('@/components/HeroParallaxBg'), { ssr: false })

// ── Constants ─────────────────────────────────────────────────────────────────

const BLUE = '#4DA6FF'
const CYAN = '#00D4FF'
const GOLD = '#F5A623'

// ── Utility: check prefers-reduced-motion ─────────────────────────────────────

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// ── ToolsBackground ───────────────────────────────────────────────────────────

interface Shape {
  x: number
  y: number
  size: number
  rotation: number
  rotationSpeed: number
  floatOffset: number
  floatSpeed: number
  type: 'gear' | 'wrench' | 'bracket' | 'hexagon'
  color: string
  opacity: number
}

function drawGear(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number) {
  const teeth = 8
  const innerR = size * 0.5
  const outerR = size * 0.75
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.beginPath()
  for (let i = 0; i < teeth * 2; i++) {
    const angle = (i * Math.PI) / teeth
    const r = i % 2 === 0 ? outerR : innerR
    const px = Math.cos(angle) * r
    const py = Math.sin(angle) * r
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function drawWrench(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  const len = size * 0.8
  ctx.beginPath()
  ctx.moveTo(-len * 0.5, 0)
  ctx.lineTo(len * 0.3, 0)
  ctx.moveTo(len * 0.3, -size * 0.2)
  ctx.arc(len * 0.3, 0, size * 0.2, -Math.PI * 0.5, Math.PI * 0.5, false)
  ctx.moveTo(len * 0.3, -size * 0.2)
  ctx.lineTo(len * 0.5, -size * 0.15)
  ctx.lineTo(len * 0.5, size * 0.15)
  ctx.lineTo(len * 0.3, size * 0.2)
  ctx.stroke()
  ctx.restore()
}

function drawBracket(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  const h = size * 0.6
  const w = size * 0.3
  ctx.beginPath()
  ctx.moveTo(w, -h)
  ctx.lineTo(0, -h)
  ctx.lineTo(0, h)
  ctx.lineTo(w, h)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(size * 0.4, -h)
  ctx.lineTo(size * 0.4 + w, -h)
  ctx.lineTo(size * 0.4 + w, h)
  ctx.lineTo(size * 0.4, h)
  ctx.stroke()
  ctx.restore()
}

function drawHexagon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3
    const px = Math.cos(angle) * size * 0.5
    const py = Math.sin(angle) * size * 0.5
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.stroke()
  ctx.restore()
}

export function ToolsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    if (prefersReducedMotion()) return

    let animId: number
    let w = 0
    let h = 0
    const shapes: Shape[] = []
    const shapeCount = 22

    function resize() {
      const dpr = window.devicePixelRatio || 1
      w = canvas!.clientWidth
      h = canvas!.clientHeight
      canvas!.width = w * dpr
      canvas!.height = h * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function initShapes() {
      shapes.length = 0
      const types: Shape['type'][] = ['gear', 'wrench', 'bracket', 'hexagon']
      const colors = [BLUE, CYAN]
      for (let i = 0; i < shapeCount; i++) {
        shapes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: 24 + Math.random() * 44,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.004,
          floatOffset: Math.random() * Math.PI * 2,
          floatSpeed: 0.3 + Math.random() * 0.5,
          type: types[i % types.length],
          color: colors[i % colors.length],
          opacity: 0.1 + Math.random() * 0.1,
        })
      }
    }

    function draw(time: number) {
      ctx!.clearRect(0, 0, w, h)
      for (const shape of shapes) {
        shape.rotation += shape.rotationSpeed
        const floatY = Math.sin(time * 0.001 * shape.floatSpeed + shape.floatOffset) * 8
        ctx!.strokeStyle = shape.color
        ctx!.globalAlpha = shape.opacity
        ctx!.lineWidth = 1.2
        const drawY = shape.y + floatY
        switch (shape.type) {
          case 'gear': drawGear(ctx!, shape.x, drawY, shape.size, shape.rotation); break
          case 'wrench': drawWrench(ctx!, shape.x, drawY, shape.size, shape.rotation); break
          case 'bracket': drawBracket(ctx!, shape.x, drawY, shape.size, shape.rotation); break
          case 'hexagon': drawHexagon(ctx!, shape.x, drawY, shape.size, shape.rotation); break
        }
      }
      ctx!.globalAlpha = 1
      animId = requestAnimationFrame(draw)
    }

    resize()
    initShapes()
    animId = requestAnimationFrame(draw)
    const handleResize = () => { resize(); initShapes() }
    window.addEventListener('resize', handleResize)
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', handleResize) }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" />
}

// ── MatrixBackground ──────────────────────────────────────────────────────────

interface MatrixColumn {
  x: number
  chars: string[]
  y: number
  speed: number
  opacity: number
  fontSize: number
}

const MATRIX_CHARS = '01{}[]();:<>/=+-*&|~^%#@!?.,'

export function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    if (prefersReducedMotion()) return

    let animId: number
    let w = 0
    let h = 0
    const columns: MatrixColumn[] = []

    function resize() {
      const dpr = window.devicePixelRatio || 1
      w = canvas!.clientWidth
      h = canvas!.clientHeight
      canvas!.width = w * dpr
      canvas!.height = h * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function initColumns() {
      columns.length = 0
      const colCount = Math.floor(w / 22)
      for (let i = 0; i < colCount; i++) {
        const fontSize = 11 + Math.random() * 3
        const charCount = Math.floor(h / fontSize)
        const chars: string[] = []
        for (let j = 0; j < charCount; j++) {
          chars.push(MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)])
        }
        columns.push({
          x: (i / colCount) * w + Math.random() * 10,
          chars,
          y: Math.random() * h * 2 - h,
          speed: 0.4 + Math.random() * 1.0,
          opacity: 0.12 + Math.random() * 0.14, // 0.12 - 0.26
          fontSize,
        })
      }
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h)

      for (const col of columns) {
        col.y += col.speed
        const visibleChars = 14 + Math.floor(Math.random() * 8)

        for (let i = 0; i < visibleChars; i++) {
          const charY = col.y - i * col.fontSize
          if (charY < -col.fontSize || charY > h + col.fontSize) continue

          const fadeProgress = i / visibleChars
          const alpha = col.opacity * (1 - fadeProgress * 0.7)

          ctx!.globalAlpha = alpha
          ctx!.fillStyle = i === 0 ? CYAN : BLUE
          ctx!.font = `${col.fontSize}px monospace`

          const charIdx = (Math.floor(col.y / col.fontSize) + i) % col.chars.length
          ctx!.fillText(col.chars[Math.abs(charIdx)], col.x, charY)
        }

        if (col.y - visibleChars * col.fontSize > h) {
          col.y = -visibleChars * col.fontSize
          for (let j = 0; j < col.chars.length; j++) {
            if (Math.random() < 0.3) {
              col.chars[j] = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
            }
          }
        }
      }

      ctx!.globalAlpha = 1
      animId = requestAnimationFrame(draw)
    }

    resize()
    initColumns()
    animId = requestAnimationFrame(draw)
    const handleResize = () => { resize(); initColumns() }
    window.addEventListener('resize', handleResize)
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', handleResize) }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" />
}

// ── SlothAbstractBackground ───────────────────────────────────────────────────
// Constellation pattern that tiles across the full width

const SLOTH_POINTS: [number, number][] = [
  // Branch
  [0.1, 0.15], [0.2, 0.13], [0.3, 0.12], [0.4, 0.11], [0.5, 0.10],
  [0.6, 0.11], [0.7, 0.13], [0.8, 0.15], [0.9, 0.18],
  // Arms
  [0.3, 0.12], [0.28, 0.20], [0.27, 0.27],
  [0.5, 0.10], [0.49, 0.18], [0.48, 0.25],
  // Body
  [0.27, 0.27], [0.29, 0.34], [0.31, 0.40], [0.33, 0.46], [0.35, 0.52],
  [0.48, 0.25], [0.47, 0.32], [0.45, 0.38], [0.43, 0.44], [0.41, 0.52],
  // Belly
  [0.35, 0.52], [0.34, 0.57], [0.35, 0.61], [0.37, 0.64], [0.39, 0.65],
  [0.41, 0.52], [0.42, 0.57], [0.41, 0.61], [0.39, 0.64], [0.39, 0.65],
  // Head
  [0.33, 0.46], [0.30, 0.44], [0.28, 0.43], [0.27, 0.46], [0.27, 0.49],
  [0.28, 0.52], [0.30, 0.53], [0.33, 0.51],
  // Eyes
  [0.29, 0.47], [0.31, 0.47],
  // Tail
  [0.39, 0.65], [0.42, 0.68], [0.44, 0.69], [0.46, 0.67],
  // Claws
  [0.28, 0.20], [0.26, 0.14], [0.29, 0.12],
  [0.49, 0.18], [0.51, 0.12], [0.48, 0.10],
  // Extra fill particles
  [0.36, 0.42], [0.38, 0.38], [0.40, 0.35], [0.37, 0.56], [0.39, 0.58],
  [0.32, 0.30], [0.44, 0.30], [0.36, 0.48], [0.40, 0.48],
]

interface Particle {
  baseX: number
  baseY: number
  x: number
  y: number
  phase: number
  amplitude: number
  speed: number
}

export function SlothAbstractBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    if (prefersReducedMotion()) return

    let animId: number
    let w = 0
    let h = 0
    let particles: Particle[] = []

    function resize() {
      const dpr = window.devicePixelRatio || 1
      w = canvas!.clientWidth
      h = canvas!.clientHeight
      canvas!.width = w * dpr
      canvas!.height = h * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function initParticles() {
      particles = []
      // Tile the sloth pattern across the full width
      // Determine how many copies fit side by side
      const unitH = h * 0.9
      const unitW = unitH * 0.7
      const copies = Math.ceil(w / unitW) + 1
      const totalW = copies * unitW
      const startX = (w - totalW) / 2

      for (let c = 0; c < copies; c++) {
        const offsetX = startX + c * unitW
        const offsetY = h * 0.05

        for (const [nx, ny] of SLOTH_POINTS) {
          const baseX = nx * unitW + offsetX
          const baseY = ny * unitH + offsetY
          particles.push({
            baseX,
            baseY,
            x: baseX,
            y: baseY,
            phase: Math.random() * Math.PI * 2,
            amplitude: 2 + Math.random() * 3,
            speed: 0.4 + Math.random() * 0.6,
          })
        }
      }
    }

    const connectionDistance = 55

    function draw(time: number) {
      ctx!.clearRect(0, 0, w, h)
      const t = time * 0.001
      const breathe = 1 + Math.sin(t * 0.35) * 0.012
      const centerY = h / 2

      for (const p of particles) {
        const dy = p.baseY - centerY
        p.x = p.baseX + Math.sin(t * p.speed + p.phase) * p.amplitude
        p.y = centerY + dy * breathe + Math.cos(t * p.speed * 0.7 + p.phase) * p.amplitude
      }

      // Draw connections
      ctx!.lineWidth = 0.6
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance) * 0.25
            ctx!.globalAlpha = alpha
            ctx!.strokeStyle = CYAN
            ctx!.beginPath()
            ctx!.moveTo(particles[i].x, particles[i].y)
            ctx!.lineTo(particles[j].x, particles[j].y)
            ctx!.stroke()
          }
        }
      }

      // Draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        ctx!.globalAlpha = 0.35 + Math.sin(t + i * 0.3) * 0.1
        ctx!.fillStyle = i % 5 === 0 ? GOLD : (i % 2 === 0 ? CYAN : BLUE)
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, 2 + Math.sin(t * 0.5 + p.phase) * 0.5, 0, Math.PI * 2)
        ctx!.fill()
      }

      ctx!.globalAlpha = 1
      animId = requestAnimationFrame(draw)
    }

    resize()
    initParticles()
    animId = requestAnimationFrame(draw)
    const handleResize = () => { resize(); initParticles() }
    window.addEventListener('resize', handleResize)
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', handleResize) }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" />
}

// ── LogoBackground ────────────────────────────────────────────────────────────
// SlothLabs logo formed by orbiting particles — represents the "orbit" brand
// Circular orbits with particles tracing paths, forming an abstract "S" + orbital rings

interface OrbitParticle {
  angle: number
  speed: number
  radius: number
  centerX: number
  centerY: number
  size: number
  color: string
  trail: [number, number][]
  trailLength: number
}

export function LogoBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    if (prefersReducedMotion()) return

    let animId: number
    let w = 0
    let h = 0
    let orbitParticles: OrbitParticle[] = []

    function resize() {
      const dpr = window.devicePixelRatio || 1
      w = canvas!.clientWidth
      h = canvas!.clientHeight
      canvas!.width = w * dpr
      canvas!.height = h * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function initOrbits() {
      orbitParticles = []
      // Create multiple orbital rings spread across the width
      const ringCount = Math.max(3, Math.floor(w / 300))
      const spacing = w / (ringCount + 1)

      for (let r = 0; r < ringCount; r++) {
        const cx = spacing * (r + 1)
        const cy = h * (0.35 + Math.sin(r * 1.2) * 0.15)
        const baseRadius = 60 + Math.random() * 80

        // Each ring has multiple particles orbiting
        const particlesPerRing = 4 + Math.floor(Math.random() * 4)
        for (let p = 0; p < particlesPerRing; p++) {
          const radiusVar = baseRadius * (0.6 + Math.random() * 0.8)
          orbitParticles.push({
            angle: (p / particlesPerRing) * Math.PI * 2 + Math.random() * 0.5,
            speed: (0.3 + Math.random() * 0.5) * (Math.random() > 0.5 ? 1 : -1),
            radius: radiusVar,
            centerX: cx + (Math.random() - 0.5) * 30,
            centerY: cy + (Math.random() - 0.5) * 30,
            size: 1.5 + Math.random() * 2,
            color: [BLUE, CYAN, GOLD][Math.floor(Math.random() * 3)],
            trail: [],
            trailLength: 12 + Math.floor(Math.random() * 10),
          })
        }
      }

      // Add connecting "S" curve particles — floating between rings
      const sParticles = 8
      for (let i = 0; i < sParticles; i++) {
        const t = i / sParticles
        orbitParticles.push({
          angle: t * Math.PI * 4,
          speed: 0.2 + Math.random() * 0.3,
          radius: 30 + Math.random() * 20,
          centerX: w * (0.2 + t * 0.6),
          centerY: h * (0.3 + Math.sin(t * Math.PI) * 0.2),
          size: 1.2 + Math.random() * 1.5,
          color: CYAN,
          trail: [],
          trailLength: 8,
        })
      }
    }

    function draw(time: number) {
      ctx!.clearRect(0, 0, w, h)
      const t = time * 0.001

      // Draw faint orbital ring outlines
      const ringCount = Math.max(3, Math.floor(w / 300))
      const spacing = w / (ringCount + 1)
      for (let r = 0; r < ringCount; r++) {
        const cx = spacing * (r + 1)
        const cy = h * (0.35 + Math.sin(r * 1.2) * 0.15)
        const radius = 60 + (r % 3) * 30
        ctx!.beginPath()
        ctx!.ellipse(cx, cy, radius, radius * 0.6, r * 0.3, 0, Math.PI * 2)
        ctx!.strokeStyle = BLUE
        ctx!.globalAlpha = 0.06
        ctx!.lineWidth = 1
        ctx!.stroke()
      }

      // Update and draw particles
      for (const p of orbitParticles) {
        p.angle += p.speed * 0.016

        // Elliptical orbit
        const x = p.centerX + Math.cos(p.angle) * p.radius
        const y = p.centerY + Math.sin(p.angle) * p.radius * 0.6

        // Update trail
        p.trail.unshift([x, y])
        if (p.trail.length > p.trailLength) p.trail.pop()

        // Draw trail
        if (p.trail.length > 1) {
          for (let i = 1; i < p.trail.length; i++) {
            const alpha = (1 - i / p.trail.length) * 0.2
            ctx!.globalAlpha = alpha
            ctx!.strokeStyle = p.color
            ctx!.lineWidth = p.size * 0.5
            ctx!.beginPath()
            ctx!.moveTo(p.trail[i - 1][0], p.trail[i - 1][1])
            ctx!.lineTo(p.trail[i][0], p.trail[i][1])
            ctx!.stroke()
          }
        }

        // Draw particle
        ctx!.globalAlpha = 0.4 + Math.sin(t * 2 + p.angle) * 0.15
        ctx!.fillStyle = p.color
        ctx!.beginPath()
        ctx!.arc(x, y, p.size, 0, Math.PI * 2)
        ctx!.fill()

        // Glow
        ctx!.globalAlpha = 0.1
        ctx!.beginPath()
        ctx!.arc(x, y, p.size * 3, 0, Math.PI * 2)
        ctx!.fillStyle = p.color
        ctx!.fill()
      }

      ctx!.globalAlpha = 1
      animId = requestAnimationFrame(draw)
    }

    resize()
    initOrbits()
    animId = requestAnimationFrame(draw)
    const handleResize = () => { resize(); initOrbits() }
    window.addEventListener('resize', handleResize)
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', handleResize) }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" />
}

// ── BackgroundSelector ────────────────────────────────────────────────────────

const backgrounds = [
  { id: 'parallax', Component: HeroParallaxBg },
  { id: 'tools', Component: ToolsBackground },
  { id: 'matrix', Component: MatrixBackground },
  { id: 'sloth', Component: SlothAbstractBackground },
  { id: 'logo', Component: LogoBackground },
] as const

export function BackgroundSelector() {
  const [selectedIdx] = useState(() => Math.floor(Math.random() * backgrounds.length))
  const { Component } = backgrounds[selectedIdx]
  return <Component />
}

export default BackgroundSelector
