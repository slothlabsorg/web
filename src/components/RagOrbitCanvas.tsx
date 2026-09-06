'use client'
import { useEffect, useRef } from 'react'

/**
 * WebGL hero for RAGorbit.
 *
 * The product in one image: a graph that assembles itself. Nodes sit on a soft
 * grid — the canvas — and edges draw themselves between them while packets travel
 * along each edge, left to right, the way a document flows through a RAG pipeline
 * and comes out as generated code. Nodes brighten as a packet passes through, so
 * the eye follows the dataflow rather than the layout.
 *
 * Raw WebGL, no three.js. DPR-capped at 2, pauses off-screen and on hidden tabs,
 * and renders a single still frame when prefers-reduced-motion is set.
 *
 * The node positions are baked into the shader as a fixed layout rather than
 * passed as uniforms: WebGL1 can't index a uniform array with a loop variable on
 * every driver, and a hardcoded layout keeps the scene identical everywhere.
 */

const FRAG = `
precision highp float;

uniform vec2  u_res;
uniform float u_time;
uniform vec3  u_accent;   // fuchsia
uniform vec3  u_accent2;  // indigo

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i+vec2(0,0)), hash(i+vec2(1,0)), u.x),
             mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}

// Distance from p to the segment ab — the edges of the graph.
float segDist(vec2 p, vec2 a, vec2 b){
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

// A node: bright core, soft halo, brighter while a packet is inside it.
// The halo falloff is deliberately gentle — a stronger one saturates to white
// blobs once several nodes sit near each other.
vec3 node(vec2 uv, vec2 c, vec3 tint, float energy){
  float d = length(uv - c);
  vec3 col = tint * (0.00022 / (d * d + 0.0012));           // halo
  col += vec3(0.95, 0.92, 1.0) * smoothstep(0.014, 0.002, d) * (0.45 + energy * 0.5);
  col += tint * smoothstep(0.032, 0.010, d) * (0.28 + energy * 0.6);
  return col;
}

// An edge plus the packets flowing along it. Returns colour; writes the
// activation each endpoint should get, so nodes can light up in time.
vec3 edge(vec2 uv, vec2 a, vec2 b, vec3 tint, float t, float phase,
          out float headGlow, out float tailGlow){
  float d = segDist(uv, a, b);
  vec3 col = tint * smoothstep(0.0045, 0.0, d) * 0.30;       // the wire

  headGlow = 0.0;
  tailGlow = 0.0;

  // Two packets per edge, offset half a cycle apart.
  for (float k = 0.0; k < 2.0; k += 1.0) {
    float p = fract(t * 0.30 + phase + k * 0.5);
    // Ease so packets slow slightly at each end, like a handoff.
    float e = p * p * (3.0 - 2.0 * p);
    vec2 pos = mix(a, b, e);
    float pd = length(uv - pos);
    col += mix(tint, vec3(1.0), 0.4) * (0.00010 / (pd * pd + 0.00012));
    tailGlow += smoothstep(0.22, 0.0, e) * 0.5;
    headGlow += smoothstep(0.78, 1.0, e) * 0.5;
  }
  return col;
}

void main(){
  vec2 res = u_res;
  vec2 uv  = (gl_FragCoord.xy - 0.5 * res) / res.y;
  float t  = u_time;

  vec3 col = vec3(0.0);

  // --- canvas grid: the lienzo the graph is drawn on ----------------------
  vec2 g = uv * 9.0;
  vec2 gf = abs(fract(g) - 0.5);
  float grid = smoothstep(0.48, 0.5, max(gf.x, gf.y));
  col += mix(u_accent2, u_accent, 0.3) * grid * 0.030
         * smoothstep(1.5, 0.2, length(uv));

  // --- nebula wash --------------------------------------------------------
  float neb = noise(uv * 1.5 + vec2(t * 0.04, -t * 0.025));
  col += mix(u_accent, u_accent2, neb) * 0.028 * smoothstep(1.3, 0.05, length(uv));

  // --- the flow: ingest -> chunk -> embed -> store -> retrieve -> generate -
  // Laid out left to right, with a branch that rejoins, because a real flow is
  // a graph and not a chain.
  //
  // Coordinates are authored on a wide -1.1..1.2 axis for readability, then
  // scaled to fit. uv.x only spans ±(aspect/2) — about ±0.8 on a 16:9 hero — so
  // the unscaled layout put the first and last nodes off-screen. The x bias
  // pushes the graph right, clear of the headline that sits over the left half.
  // fit 0.52 keeps x within -0.57..0.62; the +0.09 bias lands it at -0.48..0.71,
  // inside the ±0.8 that a 16:9 viewport shows, with margin to spare.
  float fit = 0.52;
  vec2 bias = vec2(0.09, 0.0);
  vec2 n0 = vec2(-1.10,  0.00) * fit + bias;   // source
  vec2 n1 = vec2(-0.70,  0.24) * fit + bias;   // loader
  vec2 n2 = vec2(-0.70, -0.24) * fit + bias;   // second loader (the branch)
  vec2 n3 = vec2(-0.28,  0.00) * fit + bias;   // chunker
  vec2 n4 = vec2( 0.08,  0.26) * fit + bias;   // embeddings
  vec2 n5 = vec2( 0.08, -0.26) * fit + bias;   // store
  vec2 n6 = vec2( 0.48,  0.00) * fit + bias;   // retriever
  vec2 n7 = vec2( 0.86,  0.22) * fit + bias;   // model
  vec2 n8 = vec2( 0.86, -0.22) * fit + bias;   // guardrail / rules
  vec2 n9 = vec2( 1.20,  0.00) * fit + bias;   // output — the generated artifact

  vec3 cA = u_accent;
  vec3 cB = u_accent2;
  vec3 cM = mix(u_accent, u_accent2, 0.5);

  float h, l;
  float e0=0.0, e1=0.0, e2=0.0, e3=0.0, e4=0.0, e5=0.0, e6=0.0, e7=0.0, e8=0.0, e9=0.0;

  col += edge(uv, n0, n1, cB, t, 0.00, h, l); e1 += h; e0 += l;
  col += edge(uv, n0, n2, cB, t, 0.12, h, l); e2 += h; e0 += l;
  col += edge(uv, n1, n3, cB, t, 0.22, h, l); e3 += h; e1 += l;
  col += edge(uv, n2, n3, cB, t, 0.34, h, l); e3 += h; e2 += l;
  col += edge(uv, n3, n4, cM, t, 0.45, h, l); e4 += h; e3 += l;
  col += edge(uv, n3, n5, cM, t, 0.52, h, l); e5 += h; e3 += l;
  col += edge(uv, n4, n5, cM, t, 0.60, h, l); e5 += h; e4 += l;
  col += edge(uv, n5, n6, cM, t, 0.66, h, l); e6 += h; e5 += l;
  col += edge(uv, n6, n7, cA, t, 0.74, h, l); e7 += h; e6 += l;
  col += edge(uv, n6, n8, cA, t, 0.80, h, l); e8 += h; e6 += l;
  col += edge(uv, n7, n9, cA, t, 0.88, h, l); e9 += h; e7 += l;
  col += edge(uv, n8, n9, cA, t, 0.94, h, l); e9 += h; e8 += l;

  col += node(uv, n0, cB, e0);
  col += node(uv, n1, cB, e1);
  col += node(uv, n2, cB, e2);
  col += node(uv, n3, cM, e3);
  col += node(uv, n4, cM, e4);
  col += node(uv, n5, cM, e5);
  col += node(uv, n6, cA, e6);
  col += node(uv, n7, cA, e7);
  col += node(uv, n8, cA, e8);

  // The output node is the artifact: brighter, with a slow confident pulse.
  float outPulse = 0.85 + 0.15 * sin(t * 1.3);
  col += node(uv, n9, mix(cA, vec3(1.0), 0.25), e9 + 0.30) * outPulse;
  col += cA * (0.00045 / (length(uv - n9) + 0.06)) * outPulse;

  // --- drifting motes -----------------------------------------------------
  vec2 sp = gl_FragCoord.xy / res.y;
  for (float k = 0.0; k < 2.0; k += 1.0) {
    vec2 gp = sp * (40.0 + k * 26.0) + vec2(t * (0.35 + k * 0.25), t * 0.10);
    vec2 id = floor(gp);
    float hh = hash(id + k * 7.3);
    if (hh > 0.978) {
      vec2 c = fract(gp) - 0.5;
      float tw = 0.4 + 0.6 * sin(t * 1.8 + hh * 40.0);
      col += mix(u_accent, u_accent2, hh) * smoothstep(0.10, 0.0, length(c)) * tw * 0.35;
    }
  }

  // --- grade + vignette ---------------------------------------------------
  col = pow(col, vec3(0.88));
  col *= smoothstep(1.65, 0.25, length(uv));
  col += vec3(0.043, 0.024, 0.125) * 0.55;   // deep indigo floor (#0B0620-ish)

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

export default function RagOrbitCanvas({
  accent = '#D946EF',
  accent2 = '#6366F1',
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

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'a_pos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(prog, 'u_res')
    const uTime = gl.getUniformLocation(prog, 'u_time')
    gl.uniform3fv(gl.getUniformLocation(prog, 'u_accent'), hexToRgb(accent))
    gl.uniform3fv(gl.getUniformLocation(prog, 'u_accent2'), hexToRgb(accent2))

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
      { threshold: 0 },
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
      gl.uniform1f(uTime, 6.0) // one frame with packets mid-flight
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
