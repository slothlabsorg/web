'use client'
import { useEffect, useRef } from 'react'

/**
 * WebGL hero for container-orbit.
 *
 * A fragment-shader scene: a bright "host" core (the beefy LAN machine) with a
 * swarm of container bodies orbiting it, faint orbit rings, a drifting starfield,
 * and a stream of packets flowing down to the bottom-left corner — the published
 * ports being forwarded back to your laptop's localhost.
 *
 * No three.js, no deps — raw WebGL. DPR-capped, pauses off-screen and on hidden
 * tabs, and renders a single still frame when prefers-reduced-motion is set.
 */

const FRAG = `
precision highp float;

uniform vec2  u_res;
uniform float u_time;
uniform vec3  u_accent;   // electric blue
uniform vec3  u_accent2;  // teal / cyan

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

// cheap 2D value noise
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i+vec2(0,0)), hash(i+vec2(1,0)), u.x),
             mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}

void main(){
  vec2 res = u_res;
  vec2 uv  = (gl_FragCoord.xy - 0.5 * res) / res.y;   // aspect-correct, centered
  float t  = u_time;

  vec3 col = vec3(0.0);

  // --- drifting starfield -------------------------------------------------
  vec2 sp = gl_FragCoord.xy / res.y;
  for (float k = 0.0; k < 3.0; k += 1.0) {
    vec2 gp = sp * (36.0 + k * 22.0) + vec2(t * (0.6 + k * 0.4), t * 0.15);
    vec2 id = floor(gp);
    float h = hash(id + k * 13.7);
    if (h > 0.972) {
      vec2 c = fract(gp) - 0.5;
      float tw = 0.4 + 0.6 * sin(t * 2.0 + h * 40.0);
      float s = smoothstep(0.09, 0.0, length(c)) * tw;
      col += vec3(0.55, 0.68, 0.9) * s * 0.5;
    }
  }

  // --- soft nebula wash ---------------------------------------------------
  float neb = noise(uv * 1.6 + vec2(t * 0.05, -t * 0.03));
  col += mix(u_accent, u_accent2, neb) * 0.020 * smoothstep(1.25, 0.1, length(uv));

  float d = length(uv);

  // --- orbit rings --------------------------------------------------------
  for (float r = 0.0; r < 5.0; r += 1.0) {
    float radius = 0.30 + r * 0.14;
    // elliptical projection
    vec2 e = vec2(uv.x / 1.35, uv.y / 0.62);
    float ring = abs(length(e) - radius);
    float line = smoothstep(0.010, 0.0, ring);
    col += mix(u_accent, u_accent2, r / 5.0) * line * 0.06;
  }

  // --- host core (the beefy machine) --------------------------------------
  float pulse = 0.85 + 0.15 * sin(t * 1.6);
  col += u_accent2 * (0.024 / (d + 0.02)) * pulse;                 // halo
  col += vec3(0.85, 0.92, 1.0) * smoothstep(0.055, 0.0, d);        // bright center
  col += u_accent * smoothstep(0.11, 0.03, d) * 0.5;               // inner glow

  // --- orbiting container bodies -----------------------------------------
  const int N = 16;
  for (int i = 0; i < N; i++) {
    float fi = float(i);
    float seed = hash(vec2(fi, 3.0));
    float radius = 0.30 + mod(fi, 5.0) * 0.14;
    float speed = (0.18 + seed * 0.45) * (mod(fi, 2.0) < 0.5 ? 1.0 : -1.0);
    float ang = t * speed + fi * 2.39996;                          // golden angle spread
    vec2 p = vec2(cos(ang) * radius * 1.35, sin(ang) * radius * 0.62);
    float pd = length(uv - p);
    vec3 c = mix(u_accent, u_accent2, seed);
    col += c * (0.0016 / (pd * pd + 0.0007));                      // glowing dot
    // little motion trail behind the body
    float ta = ang - 0.16;
    vec2 tp = vec2(cos(ta) * radius * 1.35, sin(ta) * radius * 0.62);
    col += c * (0.0004 / (length(uv - tp) * 2.0 + 0.02)) * 0.5;
  }

  // --- port-forward stream: packets flowing to the laptop (bottom-left) ---
  vec2 dst = vec2(-1.05, -0.62);              // "localhost" corner
  for (float j = 0.0; j < 7.0; j += 1.0) {
    float ph = fract(t * 0.35 + j / 7.0);
    vec2 pos = mix(vec2(0.0), dst, ph);
    // gentle sag so the stream arcs instead of being a straight ruler
    pos.y += sin(ph * 3.14159) * 0.10;
    float pd = length(uv - pos);
    float fade = smoothstep(1.0, 0.15, ph);   // dim as it arrives
    col += u_accent2 * (0.0009 / (pd * pd + 0.0006)) * fade;
  }

  // --- grade + vignette ---------------------------------------------------
  col = pow(col, vec3(0.86));                 // lift midtones
  col *= smoothstep(1.55, 0.25, length(uv));  // vignette
  col += vec3(0.02, 0.05, 0.11) * 0.6;        // deep-space floor (#050d1f-ish)

  gl_FragColor = vec4(col, 1.0);
}
`

const VERT = `
attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ]
}

interface Props {
  accent?: string
  accent2?: string
  className?: string
}

export default function ContainerOrbitCanvas({
  accent = '#4F8CFF',
  accent2 = '#22D3EE',
  className = '',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = (canvas.getContext('webgl', { antialias: true, alpha: false, powerPreference: 'low-power' }) ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
    if (!gl) return // graceful: the CSS gradient behind the canvas shows instead

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)

    // fullscreen triangle
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'a_pos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(prog, 'u_res')
    const uTime = gl.getUniformLocation(prog, 'u_time')
    const uAccent = gl.getUniformLocation(prog, 'u_accent')
    const uAccent2 = gl.getUniformLocation(prog, 'u_accent2')
    gl.uniform3fv(uAccent, hexToRgb(accent))
    gl.uniform3fv(uAccent2, hexToRgb(accent2))

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let running = true
    const start = performance.now()

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.floor(canvas.clientWidth * dpr)
      const h = Math.floor(canvas.clientHeight * dpr)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(uRes, canvas.width, canvas.height)
    }

    const draw = (now: number) => {
      resize()
      gl.uniform1f(uTime, (now - start) / 1000)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      if (running && !reduced) raf = requestAnimationFrame(draw)
    }

    // pause when the canvas scrolls out of view
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (!running) {
            running = true
            if (!reduced) raf = requestAnimationFrame(draw)
          }
        } else {
          running = false
          cancelAnimationFrame(raf)
        }
      },
      { threshold: 0 }
    )
    io.observe(canvas)

    const onVisibility = () => {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(raf)
      } else if (!running) {
        running = true
        if (!reduced) raf = requestAnimationFrame(draw)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('resize', resize)

    if (reduced) {
      resize()
      gl.uniform1f(uTime, 8.0) // one pleasant static frame
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    } else {
      raf = requestAnimationFrame(draw)
    }

    return () => {
      running = false
      cancelAnimationFrame(raf)
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('resize', resize)
      const ext = gl.getExtension('WEBGL_lose_context')
      if (ext) ext.loseContext()
    }
  }, [accent, accent2])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  )
}
