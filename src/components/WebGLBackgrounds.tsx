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
  // Inner circle
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
  // Handle
  ctx.moveTo(-len * 0.5, 0)
  ctx.lineTo(len * 0.3, 0)
  // Head
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
  // Closing bracket
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
    const shapeCount = 18

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
          size: 20 + Math.random() * 40,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.003,
          floatOffset: Math.random() * Math.PI * 2,
          floatSpeed: 0.3 + Math.random() * 0.5,
          type: types[i % types.length],
          color: colors[i % colors.length],
          opacity: 0.08 + Math.random() * 0.07, // 0.08 - 0.15
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
        ctx!.lineWidth = 1

        const drawY = shape.y + floatY
        switch (shape.type) {
          case 'gear':
            drawGear(ctx!, shape.x, drawY, shape.size, shape.rotation)
            break
          case 'wrench':
            drawWrench(ctx!, shape.x, drawY, shape.size, shape.rotation)
            break
          case 'bracket':
            drawBracket(ctx!, shape.x, drawY, shape.size, shape.rotation)
            break
          case 'hexagon':
            drawHexagon(ctx!, shape.x, drawY, shape.size, shape.rotation)
            break
        }
      }
      ctx!.globalAlpha = 1
      animId = requestAnimationFrame(draw)
    }

    resize()
    initShapes()
    animId = requestAnimationFrame(draw)

    window.addEventListener('resize', () => { resize(); initShapes() })
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', () => { resize(); initShapes() })
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  )
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
      const colCount = Math.floor(w / 28) // Sparse columns
      for (let i = 0; i < colCount; i++) {
        const fontSize = 10 + Math.random() * 4
        const charCount = Math.floor(h / fontSize)
        const chars: string[] = []
        for (let j = 0; j < charCount; j++) {
          chars.push(MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)])
        }
        columns.push({
          x: (i / colCount) * w + Math.random() * 14,
          chars,
          y: Math.random() * h * 2 - h, // Start at random positions
          speed: 0.3 + Math.random() * 0.7,
          opacity: 0.04 + Math.random() * 0.08, // 0.04 - 0.12
          fontSize,
        })
      }
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h)
      ctx!.font = '12px monospace'

      for (const col of columns) {
        col.y += col.speed

        // Draw visible characters with fade
        const visibleChars = 12 + Math.floor(Math.random() * 6)
        for (let i = 0; i < visibleChars; i++) {
          const charY = col.y - i * col.fontSize
          if (charY < -col.fontSize || charY > h + col.fontSize) continue

          const fadeProgress = i / visibleChars
          const alpha = col.opacity * (1 - fadeProgress * 0.8)

          ctx!.globalAlpha = alpha
          ctx!.fillStyle = i === 0 ? CYAN : BLUE
          ctx!.font = `${col.fontSize}px monospace`

          const charIdx = (Math.floor(col.y / col.fontSize) + i) % col.chars.length
          ctx!.fillText(col.chars[Math.abs(charIdx)], col.x, charY)
        }

        // Reset column when it scrolls past bottom
        if (col.y - visibleChars * col.fontSize > h) {
          col.y = -visibleChars * col.fontSize
          // Randomize chars
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
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  )
}

// ── SlothAbstractBackground ───────────────────────────────────────────────────

// Sloth silhouette as normalized points (0-1 range) forming a recognizable outline
// Includes body, head, limbs, and branch
const SLOTH_POINTS: [number, number][] = [
  // Branch (top)
  [0.15, 0.18], [0.25, 0.16], [0.35, 0.15], [0.45, 0.14], [0.55, 0.13],
  [0.65, 0.14], [0.75, 0.16], [0.85, 0.19],
  // Arms hanging from branch
  [0.35, 0.15], [0.33, 0.22], [0.32, 0.28],
  [0.55, 0.13], [0.54, 0.20], [0.53, 0.26],
  // Body (hanging below)
  [0.32, 0.28], [0.34, 0.34], [0.36, 0.40], [0.38, 0.46], [0.40, 0.50],
  [0.53, 0.26], [0.52, 0.32], [0.50, 0.38], [0.48, 0.44], [0.46, 0.50],
  // Body outline (rounded belly)
  [0.40, 0.50], [0.39, 0.54], [0.40, 0.58], [0.42, 0.61], [0.44, 0.62],
  [0.46, 0.50], [0.47, 0.54], [0.46, 0.58], [0.44, 0.61], [0.44, 0.62],
  // Head
  [0.38, 0.46], [0.36, 0.44], [0.34, 0.43], [0.33, 0.45], [0.33, 0.48],
  [0.34, 0.50], [0.36, 0.51], [0.38, 0.50],
  // Eyes (two dots)
  [0.345, 0.46], [0.365, 0.46],
  // Tail
  [0.44, 0.62], [0.46, 0.64], [0.48, 0.65], [0.50, 0.64],
  // Claws on branch
  [0.33, 0.22], [0.31, 0.18], [0.34, 0.16],
  [0.54, 0.20], [0.56, 0.15], [0.53, 0.13],
  // Extra body particles
  [0.41, 0.42], [0.43, 0.38], [0.45, 0.35], [0.42, 0.55], [0.44, 0.57],
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
      // Center the sloth and scale to fit
      const scale = Math.min(w, h) * 0.8
      const offsetX = (w - scale) / 2
      const offsetY = (h - scale) / 2

      particles = SLOTH_POINTS.map(([nx, ny]) => ({
        baseX: nx * scale + offsetX,
        baseY: ny * scale + offsetY,
        x: nx * scale + offsetX,
        y: ny * scale + offsetY,
        phase: Math.random() * Math.PI * 2,
        amplitude: 1.5 + Math.random() * 3,
        speed: 0.5 + Math.random() * 0.8,
      }))
    }

    const connectionDistance = 60

    function draw(time: number) {
      ctx!.clearRect(0, 0, w, h)
      const t = time * 0.001

      // Breathing effect — scale oscillation
      const breathe = 1 + Math.sin(t * 0.4) * 0.015

      // Update particle positions
      for (const p of particles) {
        const cx = w / 2
        const cy = h / 2
        // Apply breathing from center
        const dx = p.baseX - cx
        const dy = p.baseY - cy
        p.x = cx + dx * breathe + Math.sin(t * p.speed + p.phase) * p.amplitude
        p.y = cy + dy * breathe + Math.cos(t * p.speed * 0.7 + p.phase) * p.amplitude
      }

      // Draw connections (constellation lines)
      ctx!.strokeStyle = CYAN
      ctx!.lineWidth = 0.5
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance) * 0.15
            ctx!.globalAlpha = alpha
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
        ctx!.globalAlpha = 0.2 + Math.sin(t + i) * 0.05
        ctx!.fillStyle = i % 3 === 0 ? GOLD : (i % 2 === 0 ? CYAN : BLUE)
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, 1.5 + Math.sin(t * 0.5 + p.phase) * 0.5, 0, Math.PI * 2)
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
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  )
}

// ── BackgroundSelector ────────────────────────────────────────────────────────

const backgrounds = [
  { id: 'parallax', Component: HeroParallaxBg },
  { id: 'tools', Component: ToolsBackground },
  { id: 'matrix', Component: MatrixBackground },
  { id: 'sloth', Component: SlothAbstractBackground },
] as const

export function BackgroundSelector() {
  const [selectedIdx] = useState(() => Math.floor(Math.random() * backgrounds.length))
  const { Component } = backgrounds[selectedIdx]

  return <Component />
}

export default BackgroundSelector
