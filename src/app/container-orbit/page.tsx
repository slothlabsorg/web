import type { Metadata } from 'next'
import ProductNavbar from '@/components/ProductNavbar'
import Footer from '@/components/Footer'
import ScrollReveal from '@/components/ScrollReveal'
import CustomCursor from '@/components/CustomCursor'
import SubscribeModal from '@/components/SubscribeModal'
import ContainerOrbitCanvas from '@/components/ContainerOrbitCanvas'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.org'
const ACCENT = '#4F8CFF'
const ACCENT2 = '#22D3EE'
const REPO = 'https://github.com/slothlabsorg/container-orbit'

export const metadata: Metadata = {
  title: 'container-orbit — Run Docker on a beefier machine, transparently',
  description:
    'container-orbit (orbit) delegates your local Docker to a beefier machine on your LAN over SSH — heavy builds and containers run there while published ports are forwarded straight back to your localhost. One command per machine. Works with Docker Desktop, OrbStack, Rancher, and colima.',
  keywords: [
    'remote docker',
    'docker over ssh',
    'DOCKER_HOST ssh',
    'docker context remote',
    'offload docker builds',
    'docker on another machine',
    'docker port forwarding ssh',
    'remote docker daemon mac',
    'free up laptop ram docker',
    'orbit docker',
    'container-orbit',
    'SlothLabs',
  ],
  openGraph: {
    title: 'container-orbit — Run Docker on a beefier machine, transparently',
    description:
      'Delegate Docker to a beefier machine on your LAN over SSH. Builds and containers run there; published ports come back to your localhost automatically. One command per side.',
    url: `${SITE_URL}/container-orbit`,
    siteName: 'SlothLabs',
    type: 'website',
    images: [{ url: '/images/slothlabs-hero.png', width: 1200, height: 630, alt: 'container-orbit — remote Docker, transparently' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'container-orbit — Run Docker on a beefier machine, transparently',
    description: 'Delegate Docker to a beefier LAN machine over SSH. Ports forwarded back to localhost automatically. One command per side.',
  },
  alternates: { canonical: `${SITE_URL}/container-orbit` },
}

// ── Terminal helper ─────────────────────────────────────────────────────────
function TerminalChrome({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-[#071020] border-b border-[#1a3060]">
      <span className="w-3 h-3 rounded-full bg-red-500/80" />
      <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
      <span className="w-3 h-3 rounded-full bg-green-500/80" />
      <span className="text-xs text-[#4A6080] font-mono ml-2">{label}</span>
    </div>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* WebGL background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[#050d1f]" />
        <ContainerOrbitCanvas accent={ACCENT} accent2={ACCENT2} className="opacity-90" />
        {/* readability gradient over the canvas, left-weighted */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#050d1f] via-[#050d1f]/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050d1f] to-transparent" />
      </div>

      <div className="relative z-10 site-container w-full" style={{ paddingTop: '72px', paddingBottom: '4rem' }}>
        <div className="max-w-2xl space-y-7 py-[52px]">
          <div className="fade-up" style={{ animationDelay: '0s' }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-[#0d1b3e] border" style={{ borderColor: `${ACCENT}40`, color: ACCENT }}>
              🛰️ Remote Docker · Zero-config port forwarding · Rust CLI
            </span>
          </div>

          <h1
            className="fade-up break-words text-[2.75rem] sm:text-5xl lg:text-[3.5rem] xl:text-[68px] font-bold leading-[1.08] tracking-tight"
            style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em', animationDelay: '0.1s' }}
          >
            <span className="block text-white">Your laptop stops</span>
            <span className="block" style={{ color: ACCENT }}>choking on Docker.</span>
          </h1>

          <p className="fade-up text-lg xl:text-xl text-[#8BA3C7] leading-relaxed max-w-xl" style={{ animationDelay: '0.2s' }}>
            <span className="text-white font-semibold">container-orbit</span> sends your Docker builds and
            containers to a beefier machine on your LAN — over plain SSH — while published ports come
            straight back to <code className="text-sm px-1 rounded bg-[#0d1b3e]" style={{ color: ACCENT2 }}>localhost</code>.
            You keep working. Your fans stop spinning.
          </p>

          {/* Terminal preview */}
          <div className="fade-up rounded-xl border border-[#1a3060] overflow-hidden bg-[#0a1628]/90 backdrop-blur-sm max-w-xl" style={{ animationDelay: '0.25s' }}>
            <TerminalChrome label="terminal" />
            <pre className="p-4 text-sm font-mono leading-relaxed overflow-x-auto">
              <code>
                <span className="text-[#4A6080]"># install (macOS / Linux)</span>{'\n'}
                <span style={{ color: ACCENT }}>$</span> <span className="text-white">brew install slothlabsorg/tap/container-orbit</span>{'\n\n'}
                <span className="text-[#4A6080]"># one guided command — ~2 min, done</span>{'\n'}
                <span style={{ color: ACCENT }}>$</span> <span className="text-white">orbit setup</span>{'\n'}
                <span className="text-green-400">✓</span> <span className="text-[#8BA3C7]">found host on your LAN · key authorized</span>{'\n'}
                <span className="text-green-400">✓</span> <span className="text-[#8BA3C7]">docker → the beefy machine</span>{'\n'}
                <span className="text-green-400">✓</span> <span className="text-[#8BA3C7]">self-test passed — localhost works</span>{'\n'}
                <span style={{ color: ACCENT2 }} className="font-bold">✦ builds & RAM on the host · ports on your localhost</span>
              </code>
            </pre>
          </div>

          <div className="fade-up flex flex-col sm:flex-row gap-3 items-start" style={{ animationDelay: '0.3s' }}>
            <SubscribeModal
              accent={ACCENT}
              source="container-orbit"
              buttonLabel="Get early access"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-bold text-sm hover:brightness-110 transition-all hover:-translate-y-0.5"
              style={{ background: ACCENT, color: '#050d1f' }}
            />
            <a
              href={REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-full border text-sm font-medium hover:opacity-80 transition-all"
              style={{ borderColor: `${ACCENT}50`, color: ACCENT }}
            >
              View on GitHub →
            </a>
          </div>

          <p className="fade-up text-xs text-[#4A6080]" style={{ animationDelay: '0.35s' }}>
            Open source · Docker Desktop · OrbStack · Rancher · colima · Rust CLI · MIT
          </p>
        </div>
      </div>
    </section>
  )
}

// ── Problem ───────────────────────────────────────────────────────────────────
const PAIN_POINTS = [
  {
    icon: '🔥',
    title: 'Docker melts your laptop',
    body: 'A big image build pins every core, drains the battery, and turns the fans into a jet engine. Meanwhile you can\'t type in your editor without lag.',
  },
  {
    icon: '💤',
    title: 'That 64 GB tower sits idle',
    body: 'The gaming PC, the old Mac, the Linux box under the desk — all of them have RAM and cores to spare while your laptop suffocates. They\'re doing nothing.',
  },
  {
    icon: '🧩',
    title: 'Remote Docker leaks your ports',
    body: 'Set DOCKER_HOST=ssh:// and the build runs remotely — but -p 8080:80 now binds on the remote box. curl localhost:8080 hits nothing. The transparency breaks.',
  },
]

function ProblemSection() {
  return (
    <section className="py-24 bg-[#050d1f]">
      <div className="site-container">
        <ScrollReveal className="text-center mb-16 space-y-4">
          <span className="text-xs font-semibold tracking-widest uppercase text-[#4A6080]">The problem</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Docker runs where you type.{' '}
            <span style={{ color: ACCENT }}>That&apos;s the bug.</span>
          </h2>
          <p className="text-[#8BA3C7] max-w-xl mx-auto">
            Your laptop is the worst machine you own for running Docker — it&apos;s the one you also need for
            everything else. The compute should live somewhere else. Getting there usually means fragile SSH
            hacks and broken port mapping.
          </p>
        </ScrollReveal>
        <div className="grid md:grid-cols-3 gap-6">
          {PAIN_POINTS.map((p, i) => (
            <ScrollReveal key={p.title} delay={i * 80}>
              <div className="rounded-2xl p-7 bg-[#0d1b3e] border border-[#1a3060] h-full space-y-3">
                <div className="text-3xl">{p.icon}</div>
                <h3 className="font-bold text-white text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>{p.title}</h3>
                <p className="text-[#8BA3C7] text-sm leading-relaxed">{p.body}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── How it works ────────────────────────────────────────────────────────────
function HowItWorks() {
  return (
    <section className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#050d1f] via-[#0d1b3e]/40 to-[#050d1f]" />
      <div className="relative z-10 site-container">
        <ScrollReveal className="text-center mb-16 space-y-4">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: ACCENT }}>How it works</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Standard Docker contexts.<br />
            <span style={{ color: ACCENT }}>Ports that follow you home.</span>
          </h2>
          <p className="text-[#8BA3C7] text-lg max-w-2xl mx-auto">
            Docker already speaks to remote daemons over SSH. orbit does the two things that make it
            actually usable every day: it sets everything up with one command per side, and it keeps your
            published ports reachable on your own <code className="text-sm px-1 rounded bg-[#0d1b3e]" style={{ color: ACCENT2 }}>localhost</code>.
          </p>
        </ScrollReveal>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Diagram */}
          <ScrollReveal>
            <div className="rounded-2xl border border-[#1a3060] bg-[#0a1628] p-6 sm:p-8">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center">
                {/* laptop */}
                <div className="space-y-2">
                  <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border" style={{ background: `${ACCENT}12`, borderColor: `${ACCENT}30` }}>💻</div>
                  <p className="text-sm font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Your laptop</p>
                  <p className="text-[11px] text-[#4A6080] font-mono">docker CLI · localhost</p>
                </div>
                {/* link */}
                <div className="flex flex-col items-center gap-1 px-1">
                  <span className="text-[10px] font-mono" style={{ color: ACCENT2 }}>ssh -L</span>
                  <div className="w-16 sm:w-24 h-px" style={{ background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT2})` }} />
                  <span className="text-[10px] text-[#4A6080] font-mono">multiplexed</span>
                </div>
                {/* host */}
                <div className="space-y-2">
                  <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border" style={{ background: `${ACCENT2}12`, borderColor: `${ACCENT2}30` }}>🖥️</div>
                  <p className="text-sm font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>The beefy host</p>
                  <p className="text-[11px] text-[#4A6080] font-mono">dockerd · RAM · disk</p>
                </div>
              </div>
              <div className="mt-8 space-y-3">
                {[
                  { c: ACCENT, t: 'docker context orbit → forwarded daemon socket. Build & run happen on the host.' },
                  { c: ACCENT2, t: 'orbit watches the remote daemon\'s events and opens an SSH tunnel for every published port.' },
                  { c: ACCENT, t: 'Container stops → its tunnel is torn down. The set of forwards always matches reality.' },
                ].map((row, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-[#8BA3C7]">
                    <span className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.c }} />
                    {row.t}
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Mechanism copy */}
          <ScrollReveal delay={100} className="space-y-6">
            {[
              {
                n: '1',
                title: 'One command per machine',
                body: 'orbit host init on the host prints a join string. orbit link <user@host> on your laptop installs an SSH key, detects the remote socket (Docker Desktop, OrbStack, Rancher, colima), and creates a standard orbit docker context. Idempotent — safe to re-run.',
              },
              {
                n: '2',
                title: 'A real docker context — not a wrapper',
                body: 'orbit forwards the remote daemon socket to a local unix socket and points the context at it. Because it\'s a stock context, docker, docker compose, and every tool that respects DOCKER_HOST just work. Nothing wraps or shadows your docker binary.',
              },
              {
                n: '3',
                title: 'Ports reconciled on every event',
                body: 'orbit up opens one multiplexed SSH master and starts a reconciler. It subscribes to the daemon\'s event stream and keeps ssh -L tunnels in sync with the published ports — so -p 8080:80 on the host is curl localhost:8080 on your laptop, automatically.',
              },
            ].map(step => (
              <div key={step.n} className="flex gap-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}30` }}>
                  {step.n}
                </div>
                <div>
                  <p className="font-semibold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{step.title}</p>
                  <p className="text-sm text-[#8BA3C7] mt-1 leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

// ── Features ──────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: '🔌',
    title: 'Automatic port forwarding',
    desc: 'The core trick. orbit watches the remote daemon and opens/closes SSH tunnels as containers start and stop. Published ports are always live on your localhost — no manual -L juggling.',
    badge: 'The magic',
  },
  {
    icon: '🧭',
    title: 'Standard docker context',
    desc: 'orbit manages a normal docker context. No shim over the docker binary — full native compatibility with docker, compose, and anything that reads DOCKER_HOST.',
    badge: null,
  },
  {
    icon: '🐳',
    title: 'Engine-agnostic',
    desc: 'Auto-detects the remote socket for Docker Desktop, OrbStack, Rancher Desktop, or colima. Whatever the host runs, orbit finds it.',
    badge: null,
  },
  {
    icon: '⚡',
    title: 'One multiplexed connection',
    desc: 'A single SSH ControlMaster carries the daemon socket and every port tunnel. Low overhead, fast reconnects, clean teardown on orbit down.',
    badge: null,
  },
  {
    icon: '🩺',
    title: 'orbit doctor',
    desc: 'Actionable diagnostics: SSH reachability, remote daemon socket, the forwarded socket, docker context state — each with the exact fix when something is off.',
    badge: null,
  },
  {
    icon: '↩️',
    title: 'Reversible by design',
    desc: 'orbit up remembers your previous context; orbit down restores it and drops every tunnel. Your local Docker is exactly where you left it.',
    badge: null,
  },
]

function Features() {
  return (
    <section className="py-24 bg-[#050d1f]">
      <div className="site-container">
        <ScrollReveal className="text-center mb-16 space-y-4">
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white"
            style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}
          >
            Transparent, or it&apos;s{' '}
            <span style={{ color: ACCENT }}>not worth it.</span>
          </h2>
          <p className="text-[#8BA3C7] text-lg max-w-lg mx-auto">
            The whole point is that Docker feels local while running somewhere else. Every feature exists to protect that illusion.
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map((item) => (
            <ScrollReveal key={item.title}>
              <div className="group rounded-2xl p-6 bg-[#0d1b3e] border border-[#1a3060] hover:border-[#4F8CFF]/40 transition-all duration-200 hover:-translate-y-1 relative overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-b from-[#4F8CFF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-200" style={{ background: `${ACCENT}12` }}>
                    {item.icon}
                  </div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-white text-base" style={{ fontFamily: 'Syne, sans-serif' }}>
                      {item.title}
                    </h3>
                    {item.badge && (
                      <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border" style={{ color: ACCENT, borderColor: `${ACCENT}40`, background: `${ACCENT}12` }}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#8BA3C7] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── CLI reference ─────────────────────────────────────────────────────────────
const COMMANDS = [
  { cmd: 'orbit host init', where: 'host', what: 'Verify Docker + SSH, detect the socket adapter, print the join string. Idempotent.' },
  { cmd: 'orbit link <user@host>', where: 'client', what: 'Install the SSH key, detect the remote socket, create the orbit docker context.' },
  { cmd: 'orbit up', where: 'client', what: 'Switch to the host, open the multiplexed SSH master + socket forward, start the port reconciler.' },
  { cmd: 'orbit down', where: 'client', what: 'Restore your previous context, close every forward and the master connection.' },
  { cmd: 'orbit status', where: 'client', what: 'Linked host, connection state, forwarded ports, and remote CPU / RAM / image counts.' },
  { cmd: 'orbit ports [add|rm]', where: 'client', what: 'List active forwards; manually add or remove a TCP forward for non-Docker services.' },
  { cmd: 'orbit doctor', where: 'both', what: 'Diagnose SSH, remote daemon, forwarded socket and context — with the fix for each.' },
]

function CliReference() {
  return (
    <section className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#050d1f] via-[#0d1b3e]/30 to-[#050d1f]" />
      <div className="relative z-10 site-container">
        <ScrollReveal className="text-center mb-14 space-y-4">
          <span className="text-xs font-semibold tracking-widest uppercase text-[#4A6080]">The whole CLI</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Seven commands. That&apos;s the manual.
          </h2>
          <p className="text-[#8BA3C7] max-w-xl mx-auto">
            No daemon to babysit, no config file to learn. Two commands set it up; the rest are there when you need them.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <div className="overflow-x-auto">
            <div className="min-w-[640px] overflow-hidden rounded-xl border border-[#1a3060]">
              <div className="grid grid-cols-[minmax(180px,1fr)_90px_2fr] bg-[#0d1b3e]">
                <div className="px-5 py-4 text-xs font-semibold text-[#4A6080] uppercase tracking-wider">Command</div>
                <div className="px-3 py-4 text-xs font-semibold text-[#4A6080] uppercase tracking-wider text-center border-x border-[#1a3060]">Where</div>
                <div className="px-5 py-4 text-xs font-semibold text-[#4A6080] uppercase tracking-wider">What it does</div>
              </div>
              {COMMANDS.map((row, i) => (
                <div key={row.cmd} className={`grid grid-cols-[minmax(180px,1fr)_90px_2fr] border-t border-[#1a3060] ${i % 2 === 0 ? 'bg-[#071020]' : 'bg-[#050d1f]'}`}>
                  <div className="px-5 py-4 text-sm font-mono" style={{ color: ACCENT }}>{row.cmd}</div>
                  <div className="px-3 py-4 text-center border-x border-[#1a3060]">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono border" style={{
                      color: row.where === 'host' ? ACCENT2 : row.where === 'both' ? '#B4FF3C' : ACCENT,
                      borderColor: `${row.where === 'host' ? ACCENT2 : row.where === 'both' ? '#B4FF3C' : ACCENT}40`,
                      background: `${row.where === 'host' ? ACCENT2 : row.where === 'both' ? '#B4FF3C' : ACCENT}10`,
                    }}>{row.where}</span>
                  </div>
                  <div className="px-5 py-4 text-sm text-[#8BA3C7]">{row.what}</div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// ── Comparison ────────────────────────────────────────────────────────────────
const COMPARISON_ROWS = [
  { feature: 'Runs builds/containers on a remote machine', orbit: '✅', ctx: '✅', dm: '✅', local: '❌' },
  { feature: 'Published ports on your localhost, automatically', orbit: '✅', ctx: '❌ Manual -L', dm: '❌', local: '✅' },
  { feature: 'One-command setup per machine', orbit: '✅', ctx: '⚠️ Manual', dm: '⚠️ Provisioner', local: '✅' },
  { feature: 'Works with existing engine (OrbStack, colima…)', orbit: '✅', ctx: '✅', dm: '❌ VM only', local: '✅' },
  { feature: 'No wrapper around the docker binary', orbit: '✅', ctx: '✅', dm: '✅', local: '✅' },
  { feature: 'Auto-reconnect + clean teardown', orbit: '✅', ctx: '❌', dm: '⚠️', local: 'n/a' },
  { feature: 'Built-in diagnostics', orbit: '✅ doctor', ctx: '❌', dm: '⚠️', local: 'n/a' },
]

function Comparison() {
  const cellClass = (val: string) => {
    if (val.startsWith('✅')) return ''
    if (val.startsWith('❌')) return 'text-red-400'
    if (val === 'n/a') return 'text-[#4A6080]'
    return 'text-yellow-400'
  }
  return (
    <section className="py-24 bg-[#050d1f]">
      <div className="site-container">
        <ScrollReveal className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white" style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}>
            docker context gets you halfway.
          </h2>
          <p className="text-[#8BA3C7] text-lg max-w-2xl mx-auto">
            A raw <code className="text-sm px-1 rounded bg-[#0d1b3e]" style={{ color: ACCENT }}>DOCKER_HOST=ssh://</code> runs
            the build remotely — then leaves your ports stranded on the wrong machine and the setup to you.
            orbit closes that last, most annoying gap.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <div className="overflow-x-auto">
            <div className="min-w-[680px] overflow-hidden rounded-xl border border-[#1a3060]">
              <div className="grid grid-cols-5 bg-[#0d1b3e]">
                <div className="px-5 py-4 text-xs font-semibold text-[#4A6080] uppercase tracking-wider">Capability</div>
                <div className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-center border-x border-[#1a3060]" style={{ color: ACCENT }}>orbit</div>
                <div className="px-4 py-4 text-xs font-semibold text-[#4A6080] uppercase tracking-wider text-center">docker context</div>
                <div className="px-4 py-4 text-xs font-semibold text-[#4A6080] uppercase tracking-wider text-center border-x border-[#1a3060]">docker-machine</div>
                <div className="px-4 py-4 text-xs font-semibold text-[#4A6080] uppercase tracking-wider text-center">Local only</div>
              </div>
              {COMPARISON_ROWS.map((row, i) => (
                <div key={row.feature} className={`grid grid-cols-5 border-t border-[#1a3060] ${i % 2 === 0 ? 'bg-[#071020]' : 'bg-[#050d1f]'}`}>
                  <div className="px-5 py-4 text-sm text-[#8BA3C7]">{row.feature}</div>
                  <div className={`px-4 py-4 text-center text-xs font-semibold border-x border-[#1a3060] ${cellClass(row.orbit)}`} style={row.orbit.startsWith('✅') ? { color: ACCENT } : {}}>{row.orbit}</div>
                  <div className={`px-4 py-4 text-center text-xs ${cellClass(row.ctx)}`}>{row.ctx}</div>
                  <div className={`px-4 py-4 text-center text-xs border-x border-[#1a3060] ${cellClass(row.dm)}`}>{row.dm}</div>
                  <div className={`px-4 py-4 text-center text-xs ${cellClass(row.local)}`}>{row.local}</div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// ── Roadmap ─────────────────────────────────────────────────────────────────
const ROADMAP = [
  { tag: 'v1 · shipping', color: ACCENT, title: 'Mac → Mac', body: 'The unix socket adapter. Full auto port-forwarding between two macOS machines on the same LAN. Linux hosts work the same way.', done: true },
  { tag: 'v1.1', color: ACCENT2, title: 'Mac → Windows (WSL2)', body: 'Reach the Docker socket inside a WSL2 distro through an SSH bridge, so your Windows gaming rig can be the host.', done: false },
  { tag: 'future', color: '#8B5CF6', title: 'Windows-native + code sync', body: 'Named-pipe relay for Docker Desktop on Windows without WSL, plus optional source sync so bind-mounts and hot-reload work across machines.', done: false },
]

function Roadmap() {
  return (
    <section className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#050d1f] via-[#0d1b3e]/40 to-[#050d1f]" />
      <div className="relative z-10 site-container">
        <ScrollReveal className="text-center mb-16 space-y-4">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: ACCENT }}>Roadmap</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Mac first. Every host next.
          </h2>
          <p className="text-[#8BA3C7] max-w-xl mx-auto">
            The host adapter is a trait — new platforms plug in without touching the core. Mac→Mac is done today.
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6">
          {ROADMAP.map((r, i) => (
            <ScrollReveal key={r.title} delay={i * 80}>
              <div className="rounded-2xl p-7 bg-[#0d1b3e] border h-full space-y-3" style={{ borderColor: r.done ? `${r.color}40` : '#1a3060' }}>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border" style={{ color: r.color, borderColor: `${r.color}50`, background: `${r.color}12` }}>
                  {r.done && <span className="w-1.5 h-1.5 rounded-full" style={{ background: r.color }} />}
                  {r.tag}
                </span>
                <h3 className="font-bold text-white text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>{r.title}</h3>
                <p className="text-[#8BA3C7] text-sm leading-relaxed">{r.body}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── CTA ─────────────────────────────────────────────────────────────────────
function CtaSection() {
  return (
    <section className="py-28 relative overflow-hidden border-t border-[#0e1f3a]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#050d1f] via-[#0a142f]/40 to-[#050d1f]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full blur-[120px] opacity-10 pointer-events-none" style={{ background: ACCENT }} />

      <div className="relative z-10 site-container text-center space-y-8">
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border mb-4" style={{ color: ACCENT, borderColor: `${ACCENT}40`, background: `${ACCENT}10` }}>
            🛰️ Coming soon
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Give Docker back<br />
            <span style={{ color: ACCENT }}>to the machine that can take it.</span>
          </h2>
          <p className="text-[#8BA3C7] text-lg mt-4 max-w-xl mx-auto">
            Get early access when container-orbit launches. Free and open source — always.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <SubscribeModal
              accent={ACCENT}
              source="container-orbit-cta"
              buttonLabel="Get early access"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-bold text-sm hover:brightness-110 transition-all hover:-translate-y-0.5"
              style={{ background: ACCENT, color: '#050d1f' }}
            />
            <a
              href={REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-full border text-sm font-medium hover:opacity-80 transition-all"
              style={{ borderColor: `${ACCENT}50`, color: ACCENT }}
            >
              Star on GitHub →
            </a>
          </div>
          <p className="text-xs text-[#4A6080] mt-4">
            SSH transport · Docker Desktop · OrbStack · Rancher · colima · Rust CLI · MIT license
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ContainerOrbitPage() {
  return (
    <main className="bg-[#050d1f]">
      <CustomCursor />
      <ProductNavbar
        icon="🛰️"
        name="container-orbit"
        accent={ACCENT}
        ctaKind="subscribe"
        ctaLabel="Get early access"
        docsHref="/container-orbit/docs"
      />
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <Features />
      <CliReference />
      <Comparison />
      <Roadmap />
      <CtaSection />
      <Footer accent={ACCENT} />
    </main>
  )
}
