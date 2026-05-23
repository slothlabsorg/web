import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import ProductNavbar from '@/components/ProductNavbar'
import Footer from '@/components/Footer'
import ScrollReveal from '@/components/ScrollReveal'
import StarField from '@/components/StarField'
import CustomCursor from '@/components/CustomCursor'
import SubscribeModal from '@/components/SubscribeModal'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.org'
const ACCENT = '#B4FF3C'

export const metadata: Metadata = {
  title: 'klight — Kubernetes Dev Environments for Every Developer',
  description:
    'klight gives every developer an isolated, full-stack Kubernetes environment in two commands — without knowing K8s exists. Local, team sync, or remote cluster. Free and open source.',
  keywords: [
    'kubernetes dev environment',
    'local kubernetes',
    'docker compose alternative',
    'kubernetes for developers',
    'dev namespace kubernetes',
    'microservices local development',
    'kubernetes without yaml',
    'klight',
    'SlothLabs',
    'team kubernetes environments',
  ],
  openGraph: {
    title: 'klight — Kubernetes Dev Environments for Every Developer',
    description: 'Full-stack Kubernetes environments in two commands. No K8s knowledge required. Local dev, team sync, or remote cluster — all identical commands.',
    url: `${SITE_URL}/klight`,
    siteName: 'SlothLabs',
    type: 'website',
    images: [{ url: '/images/klight-landing.png', width: 1200, height: 630, alt: 'klight — Kubernetes dev environments' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'klight — Kubernetes Dev Environments for Every Developer',
    description: 'Full-stack Kubernetes environments in two commands. No K8s knowledge required.',
  },
  alternates: { canonical: `${SITE_URL}/klight` },
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center noise overflow-hidden">
      <div className="absolute inset-0">
        <Image src="/images/starfield-bg.png" alt="" fill priority className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050d1fF2] 55% to-[#051a0d99]" />
        <div className="absolute inset-0 bg-[#000013]/50" />
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-[#050d1f] to-transparent" />
        {/* Lime glow top-right */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full -translate-y-1/3 translate-x-1/4 blur-[140px]" style={{ background: `${ACCENT}08` }} />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full blur-[120px]" style={{ background: `${ACCENT}05` }} />
      </div>

      <StarField count={80} />

      <div className="relative z-10 site-container w-full" style={{ paddingTop: '72px', paddingBottom: '4rem' }}>
        <div className="w-full grid md:grid-cols-2 gap-10 lg:gap-14 items-center py-[52px]">
          {/* Left */}
          <div className="space-y-7 max-w-full sm:max-w-xl">
            <div className="fade-up" style={{ animationDelay: '0s' }}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-[#0d1b3e] border text-[#B4FF3C]" style={{ borderColor: `${ACCENT}40` }}>
                🚀 Kubernetes · Dev Environments · Zero YAML
              </span>
            </div>

            <h1
              className="fade-up break-words text-[2.75rem] sm:text-5xl lg:text-[3.5rem] xl:text-[70px] font-bold leading-[1.1] tracking-tight"
              style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em', animationDelay: '0.1s' }}
            >
              <span className="block text-white">Every dev gets</span>
              <span className="block" style={{ color: ACCENT }}>their own stack.</span>
              <span className="block text-white">Two commands.</span>
            </h1>

            <p className="fade-up text-lg xl:text-xl text-[#8BA3C7] leading-relaxed max-w-lg" style={{ animationDelay: '0.2s' }}>
              klight gives every developer an isolated, full-stack Kubernetes environment — without knowing Kubernetes exists. Postgres, Kafka, Redis, and all your services spin up in the right order, every time.
            </p>

            {/* Terminal preview inline */}
            <div className="fade-up rounded-xl border border-[#1a3060] overflow-hidden bg-[#0a1628] max-w-lg" style={{ animationDelay: '0.25s' }}>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[#071020] border-b border-[#1a3060]">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="text-xs text-[#4A6080] font-mono ml-2">terminal</span>
              </div>
              <pre className="p-4 text-sm font-mono leading-relaxed overflow-x-auto">
                <code>
                  <span className="text-[#4A6080]"># New team member — zero clones, zero config</span>{'\n'}
                  <span style={{ color: ACCENT }}>$</span> <span className="text-white">klight sync https://infra.company.com/klight-team.yaml</span>{'\n'}
                  <span style={{ color: ACCENT }}>$</span> <span className="text-white">klight up store --env alice</span>{'\n\n'}
                  <span className="text-green-400">✓</span> <span className="text-[#8BA3C7]">postgres ready</span>{'\n'}
                  <span className="text-green-400">✓</span> <span className="text-[#8BA3C7]">kafka ready</span>{'\n'}
                  <span className="text-green-400">✓</span> <span className="text-[#8BA3C7]">inventory-api ready</span>{'\n'}
                  <span className="text-green-400">✓</span> <span className="text-[#8BA3C7]">store-api ready</span>{'\n'}
                  <span className="text-green-400">✓</span> <span className="text-[#8BA3C7]">store-web ready</span>{'\n'}
                  <span style={{ color: ACCENT }} className="font-bold">✦ alice 5/5 ready — 1m 43s</span>
                </code>
              </pre>
            </div>

            <div className="fade-up flex flex-col sm:flex-row gap-3 items-start" style={{ animationDelay: '0.3s' }}>
              <SubscribeModal
                accent={ACCENT}
                source="klight"
                buttonLabel="Get early access"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-bold text-sm hover:brightness-110 transition-all hover:-translate-y-0.5"
                style={{ background: ACCENT, color: '#050d1f' }}
              />
              <a
                href="https://github.com/slothlabsorg/kraken-light"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-full border text-sm font-medium hover:opacity-80 transition-all"
                style={{ borderColor: `${ACCENT}50`, color: ACCENT }}
              >
                View on GitHub →
              </a>
            </div>

            <p className="fade-up text-xs text-[#4A6080]" style={{ animationDelay: '0.35s' }}>
              Open source · Works with minikube, EKS, GKE, AKS · Python CLI
            </p>
          </div>

          {/* Right — hero image */}
          <div className="relative flex justify-center md:justify-end min-h-[280px] sm:min-h-[360px] md:min-h-[440px]">
            <div className="absolute inset-0 rounded-full blur-[100px] opacity-20" style={{ background: ACCENT }} />
            <div className="relative z-10 w-full max-w-md md:max-w-lg lg:max-w-xl rounded-2xl overflow-hidden border shadow-2xl" style={{ borderColor: `${ACCENT}30`, boxShadow: `0 0 60px ${ACCENT}15` }}>
              <Image
                src="/images/klight-landing.png"
                alt="klight — meet your sloth-powered Kubernetes dev environments"
                width={1200}
                height={800}
                priority
                className="w-full h-auto block"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Problem ───────────────────────────────────────────────────────────────────
const PAIN_POINTS = [
  {
    icon: '😤',
    title: 'Docker Compose lies to you',
    body: 'Shared volumes, no namespaces, port conflicts when Alice and Bob both run the stack. And when you hit prod with real K8s, nothing matches.',
  },
  {
    icon: '⏳',
    title: 'New teammate takes 3 days',
    body: 'Clone 8 repos, configure 14 env vars, start services in the right order, debug why kafka isn\'t connecting. Three days. Every hire.',
  },
  {
    icon: '🔥',
    title: 'Production parity is a myth',
    body: 'Docker Compose doesn\'t have init containers, pod-level health checks, or namespace isolation. You find out in staging. Or worse — production.',
  },
]

function ProblemSection() {
  return (
    <section className="py-24 bg-[#050d1f]">
      <div className="site-container">
        <ScrollReveal className="text-center mb-16 space-y-4">
          <div className="flex justify-center mb-2">
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 drop-shadow-[0_0_30px_rgba(180,255,60,0.25)]">
              <Image
                src="/images/klight-sloth-break-paper.png"
                alt=""
                fill
                sizes="144px"
                className="object-contain select-none"
              />
            </div>
          </div>
          <span className="text-xs font-semibold tracking-widest uppercase text-[#4A6080]">The problem</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Local dev environments are{' '}
            <span style={{ color: ACCENT }}>broken.</span>
          </h2>
          <p className="text-[#8BA3C7] max-w-xl mx-auto">
            Docker Compose was a clever hack for 2014. The enterprise alternatives — Tilt, Signadot, DevSpace — solve it with complex YAML or an enterprise contract. Neither is right for a 5-person startup.
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

// ── Features ──────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: '🏠',
    title: 'Local dev — no cloud needed',
    desc: 'minikube under the hood. Build your service image, load it, deploy it. Edit, rebuild, hot-swap. The full loop runs on your laptop in under 2 minutes.',
    badge: null,
  },
  {
    icon: '🔄',
    title: 'Team sync — one URL, full stack',
    desc: 'DevOps publishes klight-team.yaml once. Every dev runs klight sync <url> and gets every service config, CI image reference, and profile definition. No cloning required.',
    badge: null,
  },
  {
    icon: '☁️',
    title: 'Remote cluster — same commands',
    desc: 'Outgrew local minikube? DevOps runs klight cluster setup-remote once. Devs connect with a token. klight up store --env alice works identically on EKS, GKE, or AKS.',
    badge: null,
  },
  {
    icon: '⚡',
    title: 'Zero Kubernetes knowledge required',
    desc: 'klight generates all the K8s YAML — deployments, services, configmaps, init containers. Developers write one klight.yaml per service. That\'s it.',
    badge: 'Zero config',
  },
  {
    icon: '🔀',
    title: 'Dependency ordering, done right',
    desc: 'Each service gets a sentinel init container that blocks startup until its dependencies are healthy. postgres, kafka, redis — all start in the right order, every time. Same as prod.',
    badge: null,
  },
  {
    icon: '🔁',
    title: 'Hot-swap with local build',
    desc: 'Edit → rebuild → klight replace store-api --with ./store-api --env dev. Your running env picks up the new image in seconds. No full redeploy needed.',
    badge: null,
  },
]

function Features() {
  return (
    <section className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#050d1f] via-[#0d1b3e]/40 to-[#050d1f]" />
      <div className="relative z-10 site-container">
        <ScrollReveal className="text-center mb-16 space-y-4">
          <h2
            className="text-4xl md:text-5xl font-bold tracking-tight text-white"
            style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}
          >
            Everything your team needs.{' '}
            <span style={{ color: ACCENT }}>Nothing else.</span>
          </h2>
          <p className="text-[#8BA3C7] text-lg max-w-lg mx-auto">
            One tool for every stage of development — from your first local build to a 30-person remote team.
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map((item, i) => (
            <ScrollReveal key={item.title} delay={i * 80}>
              <div
                className="group rounded-2xl p-6 bg-[#0d1b3e] border border-[#1a3060] hover:border-[#B4FF3C]/40 transition-all duration-200 hover:-translate-y-1 relative overflow-hidden h-full"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-[#B4FF3C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
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

// ── Three Worlds ─────────────────────────────────────────────────────────────
const WORLDS = [
  {
    number: '01',
    title: 'Solo dev, local code',
    subtitle: 'You have the repos. No CI pipeline. You want a real stack, not hacks.',
    code: `klight local setup
klight local build-load inventory-api --path ./inventory-api
klight local build-load store-api     --path ./store-api
klight from-repos ./inventory-api ./store-api --env dev
klight replace store-api --with ./store-api --env dev`,
    steps: [
      'Start minikube once',
      'Build and load your images',
      'klight reads your klight.yaml files',
      'Edit → rebuild → hot-swap in seconds',
    ],
  },
  {
    number: '02',
    title: 'Team sync, no clones',
    subtitle: 'New dev joins. They should be running the full stack in minutes, not days.',
    code: `klight sync https://infra.company.com/klight-team.yaml
klight up store --env alice
klight up store --env bob`,
    steps: [
      'DevOps publishes one team YAML',
      'Devs sync it with a single URL',
      'Each dev gets their own namespace',
      'CI images pulled automatically',
    ],
  },
  {
    number: '03',
    title: 'Remote cluster, one token',
    subtitle: 'Local minikube ran out of RAM. Move the whole team to EKS without changing a command.',
    code: `# DevOps (once):
klight cluster setup-remote   # creates SA + RBAC + prints token

# Dev (once per laptop):
klight connect --url https://cluster.company.com --token eyJ...
klight use klight-remote
klight up store --env alice   # same command, cloud cluster`,
    steps: [
      'DevOps runs one command on the cluster',
      'Gets a token valid for 1 year',
      'Devs connect with that token',
      'Same klight up commands work on EKS/GKE/AKS',
    ],
  },
]

function ThreeWorlds() {
  return (
    <section className="py-28 bg-[#050d1f] relative overflow-hidden">
      {/* Background decorative sloth — working at desk */}
      <div className="hidden lg:block absolute -right-16 top-20 w-72 xl:w-80 opacity-[0.18] pointer-events-none select-none">
        <Image
          src="/images/klight-sloth.png"
          alt=""
          width={500}
          height={500}
          className="w-full h-auto"
        />
      </div>

      <div className="relative z-10 site-container">
        <ScrollReveal className="text-center mb-20 space-y-4">
          <span className="text-xs font-semibold tracking-widest uppercase text-[#4A6080]">How it works</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Three scenarios.{' '}
            <span style={{ color: ACCENT }}>One tool.</span>
          </h2>
          <p className="text-[#8BA3C7] max-w-xl mx-auto text-lg">
            Whether you&apos;re a solo developer, a growing team, or running on a shared cloud cluster — the commands are identical.
          </p>
        </ScrollReveal>

        <div className="space-y-12">
          {WORLDS.map((w, i) => (
            <ScrollReveal key={w.number} delay={i * 60}>
              <div className={`grid md:grid-cols-2 gap-8 lg:gap-12 items-start ${i % 2 === 1 ? 'md:[&>:first-child]:order-2' : ''}`}>
                {/* Text */}
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <span className="text-5xl font-black opacity-10" style={{ color: ACCENT, fontFamily: 'Syne, sans-serif' }}>{w.number}</span>
                    <div>
                      <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{w.title}</h3>
                      <p className="text-sm text-[#8BA3C7] mt-1">{w.subtitle}</p>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {w.steps.map((step, si) => (
                      <li key={step} className="flex items-center gap-3 text-sm text-[#8BA3C7]">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}30` }}>
                          {si + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Code */}
                <div className="rounded-xl border border-[#1a3060] overflow-hidden bg-[#0a1628]">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-[#071020] border-b border-[#1a3060]">
                    <span className="w-3 h-3 rounded-full bg-red-500/80" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <span className="w-3 h-3 rounded-full bg-green-500/80" />
                    <span className="text-xs text-[#4A6080] font-mono ml-2">world {w.number}</span>
                  </div>
                  <pre className="p-5 text-sm font-mono leading-relaxed overflow-x-auto" style={{ color: '#c9d1d9' }}>
                    {w.code.split('\n').map((line, li) => (
                      <span key={li} className="block">
                        {line.startsWith('#') ? (
                          <span className="text-[#4A6080]">{line}</span>
                        ) : line.startsWith('klight') ? (
                          <>
                            <span style={{ color: ACCENT }}>$</span>{' '}
                            <span className="text-white">{line}</span>
                          </>
                        ) : line === '' ? (
                          <span>&nbsp;</span>
                        ) : (
                          <span className="text-[#4A6080]">{line}</span>
                        )}
                      </span>
                    ))}
                  </pre>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── klight.yaml ───────────────────────────────────────────────────────────────
function KlightYamlSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#050d1f] via-[#0d1b3e]/30 to-[#050d1f]" />
      {/* Background decorative meditating sloth — "zero K8s knowledge" zen */}
      <div className="hidden lg:block absolute -left-20 bottom-10 w-72 opacity-[0.15] pointer-events-none select-none">
        <Image src="/images/klight-sloth3.png" alt="" width={500} height={500} className="w-full h-auto" />
      </div>
      <div className="relative z-10 site-container">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left — copy */}
          <ScrollReveal className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 flex-shrink-0 drop-shadow-[0_0_20px_rgba(180,255,60,0.3)]">
                <Image src="/images/klight-sloth3.png" alt="" fill sizes="64px" className="object-contain" />
              </div>
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: ACCENT }}>The contract</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
              One YAML file.<br />Zero K8s knowledge.
            </h2>
            <p className="text-[#8BA3C7] leading-relaxed">
              Add a <code className="text-sm px-1.5 py-0.5 rounded bg-[#0d1b3e] text-[#c9d1d9]">klight.yaml</code> to each service repo. klight generates all the Kubernetes YAML — deployments, services, configmaps, init containers, migration jobs — without you writing a single line of K8s.
            </p>
            <ul className="space-y-3">
              {[
                'Declare what your service needs: postgres, kafka, redis',
                'Specify health check endpoint',
                'Set env vars your app already reads — unchanged',
                'Optional migration command runs before the service starts',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-sm text-[#8BA3C7]">
                  <span style={{ color: ACCENT }} className="mt-0.5 flex-shrink-0 font-bold">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-xs text-[#4A6080]">
              Zero changes to your application code. No Kubernetes YAML to write or maintain.
            </p>
          </ScrollReveal>

          {/* Right — YAML example */}
          <ScrollReveal delay={100}>
            <div className="rounded-xl border overflow-hidden bg-[#0a1628]" style={{ borderColor: `${ACCENT}25` }}>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[#071020] border-b border-[#1a3060]">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="text-xs text-[#4A6080] font-mono ml-2">klight.yaml</span>
              </div>
              <pre className="p-5 text-sm font-mono leading-relaxed overflow-x-auto">
                <code>
                  <span className="text-[#4A6080]"># yaml-language-server: $schema=https://klight.dev/schema/klight.yaml.json</span>{'\n'}
                  <span className="text-[#e5c07b]">name</span><span className="text-[#c9d1d9]">: </span><span className="text-[#98c379]">inventory-api</span>{'\n'}
                  <span className="text-[#e5c07b]">port</span><span className="text-[#c9d1d9]">: </span><span className="text-[#d19a66]">8081</span>{'\n'}
                  <span className="text-[#e5c07b]">health</span><span className="text-[#c9d1d9]">: </span><span className="text-[#98c379]">/health</span>{'\n'}
                  {'\n'}
                  <span className="text-[#e5c07b]">needs</span><span className="text-[#c9d1d9]">: </span><span className="text-[#c9d1d9]">[</span><span className="text-[#98c379]">postgres</span><span className="text-[#c9d1d9]">, </span><span className="text-[#98c379]">kafka</span><span className="text-[#c9d1d9]">]</span>{'\n'}
                  {'\n'}
                  <span className="text-[#e5c07b]">migration</span><span className="text-[#c9d1d9]">:</span>{'\n'}
                  <span className="text-[#c9d1d9]">  </span><span className="text-[#e5c07b]">command</span><span className="text-[#c9d1d9]">: [</span><span className="text-[#98c379]">&quot;python&quot;</span><span className="text-[#c9d1d9]">, </span><span className="text-[#98c379]">&quot;-m&quot;</span><span className="text-[#c9d1d9]">, </span><span className="text-[#98c379]">&quot;app.migrate&quot;</span><span className="text-[#c9d1d9]">]</span>{'\n'}
                  {'\n'}
                  <span className="text-[#e5c07b]">env</span><span className="text-[#c9d1d9]">:</span>{'\n'}
                  <span className="text-[#c9d1d9]">  </span><span className="text-[#e5c07b]">DB_HOST</span><span className="text-[#c9d1d9]">: </span><span className="text-[#98c379]">postgres</span>{'\n'}
                  <span className="text-[#c9d1d9]">  </span><span className="text-[#e5c07b]">DB_NAME</span><span className="text-[#c9d1d9]">: </span><span className="text-[#98c379]">inventory_db</span>{'\n'}
                  <span className="text-[#c9d1d9]">  </span><span className="text-[#e5c07b]">KAFKA_BOOTSTRAP_SERVERS</span><span className="text-[#c9d1d9]">: </span><span className="text-[#98c379]">kafka:9092</span>{'\n'}
                </code>
              </pre>
            </div>
            <p className="text-xs text-[#4A6080] text-center mt-3">
              That&apos;s the entire klight.yaml. That&apos;s it.
            </p>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

// ── Comparison ───────────────────────────────────────────────────────────────
const COMPARISON_ROWS = [
  { feature: 'Per-developer namespace isolation',     klight: '✅',            tilt: '❌',              signadot: '✅',              skaffold: '❌' },
  { feature: 'Zero K8s YAML to write',               klight: '✅',            tilt: '❌ Required',      signadot: '❌ Required',      skaffold: '❌ Required' },
  { feature: 'Built-in infra catalog (postgres, kafka…)', klight: '✅',        tilt: '❌',              signadot: '❌',              skaffold: '❌' },
  { feature: 'Team sync from a single URL',           klight: '✅',            tilt: '❌',              signadot: '⚠️ Admin UI',      skaffold: '❌' },
  { feature: 'New dev onboarded in < 5 min',          klight: '✅',            tilt: '⚠️ YAML first',   signadot: '⚠️ Operator req', skaffold: '⚠️ YAML first' },
  { feature: 'Local + remote cluster, same commands', klight: '✅',            tilt: '⚠️ Local only',   signadot: '✅',              skaffold: '⚠️ Manual' },
  { feature: 'Service dependency ordering',           klight: '✅ sentinel',   tilt: '⚠️ Basic',        signadot: '❌',              skaffold: '⚠️ Basic' },
  { feature: 'Pricing',                              klight: '✅ Free/OSS',   tilt: '⚠️ Paid tiers',   signadot: '❌ Enterprise',    skaffold: '✅ Free/OSS' },
]

function Comparison() {
  const cellClass = (val: string) => {
    if (val.startsWith('✅')) return ''
    if (val.startsWith('❌')) return 'text-red-400'
    return 'text-yellow-400'
  }

  return (
    <section className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#050d1f] via-[#0d1b3e]/50 to-[#050d1f]" />
      <div className="relative z-10 site-container">
        <ScrollReveal className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white" style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}>
            The alternatives cost you YAML,<br />money, or both.
          </h2>
          <p className="text-[#8BA3C7] text-lg max-w-2xl mx-auto">
            Tilt and Skaffold still require K8s expertise. Signadot requires an enterprise contract. klight is the only one that gets a new developer running in under 5 minutes — with zero Kubernetes knowledge.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="overflow-x-auto">
            <div className="min-w-[640px] overflow-hidden rounded-xl border border-[#1a3060]">
              <div className="grid grid-cols-5 bg-[#0d1b3e]">
                <div className="px-5 py-4 text-xs font-semibold text-[#4A6080] uppercase tracking-wider">Feature</div>
                <div className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-center border-x border-[#1a3060]" style={{ color: ACCENT }}>klight</div>
                <div className="px-5 py-4 text-xs font-semibold text-[#4A6080] uppercase tracking-wider text-center">Tilt</div>
                <div className="px-5 py-4 text-xs font-semibold text-[#4A6080] uppercase tracking-wider text-center border-x border-[#1a3060]">Signadot</div>
                <div className="px-5 py-4 text-xs font-semibold text-[#4A6080] uppercase tracking-wider text-center">Skaffold</div>
              </div>
              {COMPARISON_ROWS.map((row, i) => (
                <div key={row.feature} className={`grid grid-cols-5 border-t border-[#1a3060] ${i % 2 === 0 ? 'bg-[#071020]' : 'bg-[#050d1f]'}`}>
                  <div className="px-5 py-4 text-sm text-[#8BA3C7]">{row.feature}</div>
                  <div className={`px-5 py-4 text-center text-xs font-semibold border-x border-[#1a3060] ${cellClass(row.klight)}`} style={row.klight.startsWith('✅') ? { color: ACCENT } : {}}>
                    {row.klight}
                  </div>
                  <div className={`px-5 py-4 text-center text-xs ${cellClass(row.tilt)}`}>{row.tilt}</div>
                  <div className={`px-5 py-4 text-center text-xs border-x border-[#1a3060] ${cellClass(row.signadot)}`}>{row.signadot}</div>
                  <div className={`px-5 py-4 text-center text-xs ${cellClass(row.skaffold)}`}>{row.skaffold}</div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// ── Catalog ───────────────────────────────────────────────────────────────────
const CATALOG_ITEMS = [
  { name: 'postgres',      image: 'postgres:16-alpine',          vars: 'DB_HOST, DB_PORT',               icon: '🐘' },
  { name: 'kafka',         image: 'apache/kafka:3.7.0',          vars: 'KAFKA_BOOTSTRAP_SERVERS',        icon: '📨' },
  { name: 'redis',         image: 'redis:7-alpine',              vars: 'REDIS_HOST, REDIS_PORT',         icon: '🔴' },
  { name: 'mongodb',       image: 'mongo:7',                     vars: 'MONGODB_URI',                    icon: '🍃' },
  { name: 'rabbitmq',      image: 'rabbitmq:3-management',       vars: 'RABBITMQ_URL',                   icon: '🐇' },
  { name: 'localstack',    image: 'localstack/localstack:3',     vars: 'AWS_ENDPOINT_URL, AWS_*',        icon: '☁️' },
  { name: 'elasticsearch', image: 'elasticsearch:8',             vars: 'ELASTICSEARCH_URL',              icon: '🔍' },
]

function CatalogSection() {
  return (
    <section className="py-24 bg-[#050d1f]">
      <div className="site-container">
        <ScrollReveal className="text-center mb-14 space-y-4">
          <span className="text-xs font-semibold tracking-widest uppercase text-[#4A6080]">Built-in infrastructure</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Add to <code className="font-mono text-2xl px-2 py-0.5 rounded-lg bg-[#0d1b3e]" style={{ color: ACCENT }}>needs:</code> and you&apos;re done.
          </h2>
          <p className="text-[#8BA3C7] max-w-xl mx-auto">
            klight ships with a catalog of common infrastructure. Add any of these to your klight.yaml and klight starts them, waits for them, and wires up the env vars automatically.
          </p>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {CATALOG_ITEMS.map((item, i) => (
            <ScrollReveal key={item.name} delay={i * 40}>
              <div className="rounded-xl p-5 bg-[#0d1b3e] border border-[#1a3060] hover:border-[#B4FF3C]/30 transition-colors group">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="font-bold text-white font-mono" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{item.name}</span>
                </div>
                <p className="text-xs text-[#4A6080] mb-2 font-mono">{item.image}</p>
                <div className="flex flex-wrap gap-1">
                  {item.vars.split(', ').map(v => (
                    <span key={v} className="text-[10px] px-2 py-0.5 rounded font-mono" style={{ background: `${ACCENT}10`, color: ACCENT, border: `1px solid ${ACCENT}20` }}>
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          ))}
          <ScrollReveal delay={CATALOG_ITEMS.length * 40}>
            <div className="rounded-xl p-5 border border-dashed border-[#1a3060] bg-[#040810] flex flex-col items-center justify-center text-center gap-2 min-h-[120px]">
              <span className="text-2xl opacity-30">+</span>
              <p className="text-xs text-[#2a3a54]">Add your own in klight-catalog.yaml</p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

// ── UI Dashboard section ───────────────────────────────────────────────────────
function UISection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#050d1f] via-[#0d1b3e]/20 to-[#050d1f]" />
      <div className="relative z-10 site-container">
        <ScrollReveal className="text-center mb-16 space-y-4">
          <span className="text-xs font-semibold tracking-widest uppercase text-[#4A6080]">Dashboard</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            <code className="font-mono text-3xl px-2 py-1 rounded-lg bg-[#0d1b3e]" style={{ color: ACCENT }}>klight ui</code>
            {' '}— a real-time control plane.
          </h2>
          <p className="text-[#8BA3C7] max-w-xl mx-auto">
            One command opens a live dashboard at localhost:7700. See cluster status, environment health, live logs, and sizing warnings — before you get OOMKilled.
          </p>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: '📊', title: 'Cluster status bar', desc: 'Always shows where you\'re running and how much RAM is available — local or remote.' },
            { icon: '⚠️', title: 'Smart sizing warnings', desc: 'klight estimates memory needs for your profile before you deploy. No more surprise OOMKilled pods.' },
            { icon: '📋', title: 'Live logs per service', desc: 'Click any service card to see real-time logs. No kubectl required.' },
            { icon: '🧙', title: 'Setup Wizard for DevOps', desc: 'Connect your Git platform, scan repos, and generate klight.yaml files without cloning anything.' },
          ].map((card, i) => (
            <ScrollReveal key={card.title} delay={i * 60}>
              <div className="rounded-xl p-6 bg-[#0d1b3e] border border-[#1a3060] h-full hover:border-[#B4FF3C]/30 transition-colors">
                <div className="text-3xl mb-3">{card.icon}</div>
                <h3 className="font-semibold text-white text-sm mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>{card.title}</h3>
                <p className="text-xs text-[#8BA3C7] leading-relaxed">{card.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Three Worlds — screenshots by scenario */}
        <div className="mt-20 space-y-24">
          {WORLD_SCREENS.map((world, wi) => (
            <ScrollReveal key={world.id} delay={wi * 60}>
              <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 pb-4 border-b" style={{ borderColor: `${ACCENT}1a` }}>
                  <div>
                    <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: ACCENT }}>
                      <span className="px-2 py-0.5 rounded-md border" style={{ borderColor: `${ACCENT}40`, background: `${ACCENT}10` }}>{world.id}</span>
                      {world.persona}
                    </span>
                    <h3 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                      {world.title}
                    </h3>
                    <p className="text-[#8BA3C7] text-sm mt-2 max-w-2xl">{world.tagline}</p>
                  </div>
                  <code className="text-xs font-mono px-3 py-1.5 rounded-lg whitespace-nowrap self-start md:self-end" style={{ background: '#0d1b3e', color: ACCENT, border: `1px solid ${ACCENT}25` }}>
                    {world.cmd}
                  </code>
                </div>

                {/* Primary screenshot */}
                <div className="rounded-2xl border overflow-hidden shadow-2xl" style={{ borderColor: `${ACCENT}25` }}>
                  <div className="flex items-center gap-2 px-4 py-3 bg-[#071020] border-b border-[#1a3060]">
                    <span className="w-3 h-3 rounded-full bg-red-500/80" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <span className="w-3 h-3 rounded-full bg-green-500/80" />
                    <span className="text-xs text-[#4A6080] font-mono ml-2">{world.windowChrome}</span>
                  </div>
                  <Image
                    src={world.primary.src}
                    alt={world.primary.alt}
                    width={1400}
                    height={900}
                    className="w-full h-auto block"
                  />
                </div>

                {/* Supporting grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {world.grid.map(({ src, alt, label }) => (
                    <div key={src} className="rounded-xl overflow-hidden border border-[#1a3060] hover:border-[#B4FF3C]/30 transition-colors group">
                      <Image
                        src={src}
                        alt={alt}
                        width={700}
                        height={450}
                        className="w-full h-auto block group-hover:scale-[1.01] transition-transform duration-300"
                      />
                      <div className="px-3 py-2 bg-[#071020]">
                        <p className="text-[10px] text-[#4A6080] font-mono">{label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Worlds screenshot data ────────────────────────────────────────────────────
const WORLD_SCREENS: {
  id: string
  persona: string
  title: string
  tagline: string
  cmd: string
  windowChrome: string
  primary: { src: string; alt: string }
  grid: { src: string; alt: string; label: string }[]
}[] = [
  {
    id: 'World 1',
    persona: 'Solo dev · local code',
    title: 'Local code. No CI. Full stack on your laptop.',
    tagline: 'You have the repos checked out, you don\'t want to set up a pipeline. klight builds your images, loads them into minikube, and brings up the whole stack — postgres, kafka, three services — in the right order.',
    cmd: 'klight from-repos ./api ./web --env dev',
    windowChrome: 'klight ui — World 1 · local',
    primary: {
      src: '/images/klight-screen-w1-03-env-dev-running-local.png',
      alt: 'World 1 — env-dev running with locally built :local images on minikube',
    },
    grid: [
      { src: '/images/klight-screen-w1-01-environments-tab.png', alt: 'Environments tab showing local env-dev', label: 'Environments tab' },
      { src: '/images/klight-screen-w1-04-service-detail-inventory-api.png', alt: 'Service detail — inventory-api pod status', label: 'Service detail' },
      { src: '/images/klight-screen-w1-05-logs-inventory-api.png', alt: 'Live logs streaming for inventory-api', label: 'Live logs' },
      { src: '/images/klight-screen-w1-06-new-env-sizing-banner.png', alt: 'Sizing banner warning before deploy', label: 'Sizing banner' },
    ],
  },
  {
    id: 'World 2',
    persona: 'Startup team · DevOps setup → sync',
    title: 'DevOps sets it up once. Every dev gets it in two commands.',
    tagline: 'DevOps connects GitHub, scans repos, and the wizard generates all klight.yaml files — flagging custom infra that needs a catalog entry. A new dev joins, runs klight sync <url> and klight up, and has the full stack running from ghcr.io without cloning anything.',
    cmd: 'klight ui  # DevOps: Setup Wizard → generate & distribute\nklight sync <url> && klight up store --env alice  # dev: two commands',
    windowChrome: 'klight ui — Setup Wizard · DevOps',
    primary: {
      src: '/images/klight-screen-wizard-03-review-catalog-warning.png',
      alt: 'Setup Wizard Step 3 — reviewing generated klight.yaml files with custom infra catalog warning',
    },
    grid: [
      { src: '/images/klight-screen-wizard-01-platform-access.png', alt: 'Wizard Step 1 — connect GitHub org and Docker registry', label: 'Step 1 — Connect GitHub' },
      { src: '/images/klight-screen-wizard-02-repo-list-catalog-warnings.png', alt: 'Wizard Step 2 — repo list showing custom infra warnings on inventory-api and store-api', label: 'Step 2 — Scan repos' },
      { src: '/images/klight-screen-wizard-03-review-catalog-warning.png', alt: 'Wizard Step 3 — catalog warning panel for postgres-inventory, postgres-store', label: 'Step 3 — Catalog check' },
      { src: '/images/klight-screen-wizard-04-team-yaml-distribute.png', alt: 'Wizard Step 4 — generated klight-team.yaml ready to distribute', label: 'Step 4 — Distribute' },
    ],
  },
  {
    id: 'World 3',
    persona: 'Remote cluster · EKS / GKE / AKS',
    title: 'Same CLI. Same UI. Cloud cluster.',
    tagline: 'Your team outgrew local minikube. DevOps runs klight cluster setup-remote once on EKS, sends a one-line connect command. Each developer gets an isolated namespace on the shared cluster — but never sees production.',
    cmd: 'klight connect --url … --token … && klight up store --env alice',
    windowChrome: 'klight ui — World 3 · remote',
    primary: {
      src: '/images/klight-screen-w3-03-alice-running-remote.png',
      alt: 'World 3 — env-alice running on remote EKS cluster from ghcr.io images',
    },
    grid: [
      { src: '/images/klight-screen-w3-02-cluster-bar-remote.png', alt: 'Cluster status bar showing remote context', label: 'Remote cluster bar' },
      { src: '/images/klight-screen-w3-04-service-detail-store-api.png', alt: 'Service detail — store-api on remote cluster', label: 'Service detail' },
      { src: '/images/klight-screen-w3-05-logs-store-api-remote.png', alt: 'Logs streaming from a pod on the remote cluster', label: 'Live logs' },
      { src: '/images/klight-screen-w3-06-env-list-remote-cluster.png', alt: 'Environments list on the remote cluster', label: 'Env list (remote)' },
    ],
  },
]

// ── MCP / AI integration section ─────────────────────────────────────────────
const MCP_SCENARIOS = [
  {
    role: 'developer',
    label: 'Developer — World 1 (local)',
    conversation: [
      { who: 'user', text: 'I just cloned ./inventory-api and ./store-api, set everything up for me' },
      { who: 'claude', text: '📋 Reading klight://cluster — no cluster found.\n→ local_setup(cpus=4, memory=4096)\n✓ klight-demo started\n→ preload_infra()\n✓ postgres, kafka loaded\n→ local_build_load("inventory-api", "./inventory-api")\n→ local_build_load("store-api", "./store-api")\n→ deploy_from_repos(["./inventory-api","./store-api"], "dev")\n✓ All services Running. To hot-reload on save:\n  klight watch store-api --env dev --path ./store-api' },
    ],
    cmd: 'claude mcp add klight -- klight mcp',
  },
  {
    role: 'devops',
    label: 'DevOps — remote cluster + team setup',
    conversation: [
      { who: 'user', text: 'set up our staging EKS cluster for the team and give me a token' },
      { who: 'claude', text: '📋 Reading klight://cluster — context: staging-eks.\n→ setup_remote_cluster()\n✓ SA klight-dev + RBAC created\nToken (1 year): eyJhbGci...\n\nShare with devs:\n  klight connect --url https://staging.k8s.company.com --token eyJhbGci...' },
      { who: 'user', text: 'now scan our repos and generate klight.yaml for each one' },
      { who: 'claude', text: '→ init_service("./inventory-api") — FastAPI · port 8081 · needs postgres\n→ init_service("./store-api")  — FastAPI · port 8082 · needs postgres\n→ init_service("./store-web")  — Next.js · port 3000\n✓ 3 klight.yaml files generated.\nFor the full Setup Wizard (GitHub scan + team yaml): klight ui' },
    ],
    cmd: 'claude mcp add klight -- klight mcp',
  },
  {
    role: 'team lead',
    label: 'Team lead — daily ops',
    conversation: [
      { who: 'user', text: 'what\'s the state of all environments?' },
      { who: 'claude', text: '📊 Reading klight://environments…\nenv-alice  3/3 Running  ✓\nenv-bob    2/3 Running  ← store-web Pending\nenv-dev    3/3 Running  ✓' },
      { who: 'user', text: 'what\'s wrong with bob\'s env?' },
      { who: 'claude', text: '→ get_unready("bob")\nstore-web: ImagePullBackOff\nghcr.io/slothlabsorg/store-web:main not found\nFix: push a build to ghcr.io, or:\n  klight replace store-web --with ./store-web --env bob' },
    ],
    cmd: 'claude mcp add klight -- klight mcp',
  },
]

function MCPSection() {
  return (
    <section className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full blur-[160px]" style={{ background: `${ACCENT}06` }} />
      </div>
      <div className="site-container">
        {/* Header */}
        <ScrollReveal className="text-center mb-6 space-y-4">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: ACCENT }}>AI-native</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Talk to your cluster.<br />No kubectl required.
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={60} className="text-center mb-16">
          <p className="text-lg text-[#8BA3C7] max-w-2xl mx-auto">
            klight ships a built-in MCP server. Add it to Claude once — then manage
            any workflow in plain English. When something needs a terminal or the visual
            UI, Claude gives you the exact command instead of guessing.
          </p>
        </ScrollReveal>

        {/* Setup — one-liner */}
        <ScrollReveal delay={80} className="mb-16 flex justify-center">
          <div className="rounded-xl border border-[#1a3060] overflow-hidden bg-[#0a1628] w-full max-w-lg">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#071020] border-b border-[#1a3060]">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="text-xs text-[#4A6080] font-mono ml-2">setup — 30 seconds</span>
            </div>
            <pre className="p-5 text-sm font-mono leading-relaxed">
              <code>
                <span className="text-[#4A6080]"># Claude Code — one command, done:</span>{'\n'}
                <span style={{ color: ACCENT }}>$</span> <span className="text-white">claude mcp add klight -- klight mcp</span>{'\n\n'}
                <span className="text-[#4A6080]"># Claude Desktop — add to config.json:</span>{'\n'}
                <span className="text-[#8BA3C7]">{'{'}</span>{'\n'}
                <span className="text-[#8BA3C7]">{'  '}"mcpServers"</span><span className="text-[#8BA3C7]">: {'{'}</span>{'\n'}
                <span className="text-[#8BA3C7]">{'    '}"klight"</span><span className="text-[#8BA3C7]">: {'{'}</span>{'\n'}
                <span className="text-[#8BA3C7]">{'      '}"command"</span><span className="text-[#8BA3C7]">: </span><span style={{ color: ACCENT }}>"klight"</span><span className="text-[#8BA3C7]">,</span>{'\n'}
                <span className="text-[#8BA3C7]">{'      '}"args"</span><span className="text-[#8BA3C7]">: [</span><span style={{ color: ACCENT }}>"mcp"</span><span className="text-[#8BA3C7]">]</span>{'\n'}
                <span className="text-[#8BA3C7]">{'    }}'}</span>{'\n'}
                <span className="text-[#8BA3C7]">{'  }}'}</span>{'\n'}
                <span className="text-[#8BA3C7]">{'}'}</span>
              </code>
            </pre>
          </div>
        </ScrollReveal>

        {/* Conversation examples */}
        <div className="grid lg:grid-cols-3 gap-6">
          {MCP_SCENARIOS.map((scenario, si) => (
            <ScrollReveal key={scenario.role} delay={si * 80}>
              <div className="rounded-xl border border-[#1a3060] overflow-hidden bg-[#080f20] h-full flex flex-col">
                {/* Title bar */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-[#071020] border-b border-[#1a3060]">
                  <span className="w-2 h-2 rounded-full" style={{ background: ACCENT }} />
                  <span className="text-xs text-[#8BA3C7] font-medium">{scenario.label}</span>
                </div>
                {/* Chat */}
                <div className="p-4 space-y-3 flex-1">
                  {scenario.conversation.map((msg, mi) => (
                    <div key={mi} className={`flex gap-2.5 ${msg.who === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.who === 'claude' && (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                          style={{ background: `${ACCENT}20`, color: ACCENT, border: `1px solid ${ACCENT}30` }}>C</div>
                      )}
                      <div className={`rounded-lg px-3 py-2 text-xs leading-relaxed max-w-[80%] whitespace-pre-wrap ${
                        msg.who === 'user'
                          ? 'bg-[#0d1b3e] text-[#c9d1d9] border border-[#1a3060]'
                          : 'bg-[#0a1628] text-[#8BA3C7] border border-[#1a3060]'
                      }`}>
                        {msg.text}
                      </div>
                      {msg.who === 'user' && (
                        <div className="w-6 h-6 rounded-full bg-[#1a3060] flex items-center justify-center text-[10px] text-[#8BA3C7] flex-shrink-0 mt-0.5">U</div>
                      )}
                    </div>
                  ))}
                </div>
                {/* Footer command */}
                <div className="px-4 py-2.5 border-t border-[#1a3060] bg-[#071020]">
                  <code className="text-[10px] font-mono" style={{ color: ACCENT }}>{scenario.cmd}</code>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Tools grid */}
        <ScrollReveal delay={120} className="mt-16">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-[#4A6080] mb-6">17 tools · 4 resources · every workflow covered</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              'local_setup', 'preload_infra', 'local_build_load',
              'deploy_environment', 'deploy_from_repos', 'run_preflight',
              'service_status', 'get_logs', 'get_unready',
              'replace_service', 'restore_service', 'destroy_environment',
              'init_service', 'sync_team', 'switch_target',
              'connect_remote', 'setup_remote_cluster',
            ].map(tool => (
              <span key={tool} className="px-3 py-1 rounded-full text-xs font-mono border border-[#1a3060] text-[#8BA3C7] bg-[#080f20]">
                {tool}
              </span>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// ── Remote Setup section ──────────────────────────────────────────────────────
function RemoteSection() {
  return (
    <section className="py-24 bg-[#050d1f]">
      <div className="site-container">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          <ScrollReveal delay={80}>
            <div className="rounded-xl border border-[#1a3060] overflow-hidden bg-[#0a1628]">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[#071020] border-b border-[#1a3060]">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="text-xs text-[#4A6080] font-mono ml-2">remote setup</span>
              </div>
              <pre className="p-5 text-sm font-mono leading-relaxed overflow-x-auto" style={{ color: '#c9d1d9' }}>
                <code>
                  <span className="text-[#4A6080]"># DevOps — run once on your cluster:</span>{'\n'}
                  <span style={{ color: ACCENT }}>$</span> <span className="text-white">klight cluster setup-remote</span>{'\n\n'}
                  <span className="text-green-400">✓</span> <span className="text-[#8BA3C7]">ServiceAccount klight-dev created</span>{'\n'}
                  <span className="text-green-400">✓</span> <span className="text-[#8BA3C7]">ClusterRole klight-dev (env-* namespaces)</span>{'\n'}
                  <span className="text-green-400">✓</span> <span className="text-[#8BA3C7]">Token generated (valid 1 year)</span>{'\n\n'}
                  <span className="text-[#4A6080]"># Share this one command with devs:</span>{'\n'}
                  <span style={{ color: ACCENT }}>$</span> <span className="text-white">klight connect --url https://k8s.company.com</span>{'\n'}
                  {'           '}<span className="text-white">--token eyJhbGci...</span>{'\n\n'}
                  <span className="text-[#4A6080]"># That&apos;s the entire onboarding doc.</span>
                </code>
              </pre>
            </div>
          </ScrollReveal>

          <ScrollReveal className="space-y-6">
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: ACCENT }}>DevOps guide</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
              Set up a team in<br />four steps.
            </h2>
            <div className="space-y-4">
              {[
                { n: '1', title: 'Add klight.yaml to each service', body: 'One file per repo — name, port, health, needs, env vars. Use the Setup Wizard to generate them by scanning your GitHub org. If a service needs infra not in the built-in catalog (e.g. two separate postgres instances), the wizard flags it and tells you what to add to klight-catalog.yaml.' },
                { n: '2', title: 'Create klight-team.yaml', body: 'Central config in your infra repo. Lists services, CI images, and which profiles group them together. Add klight-catalog.yaml alongside it for any custom infra entries.' },
                { n: '3', title: 'Run klight cluster setup-remote', body: 'On your EKS/GKE cluster. Creates minimal RBAC, generates a 1-year token.' },
                { n: '4', title: 'Send devs one URL', body: 'klight sync <url> — that\'s the full onboarding document.' },
              ].map(step => (
                <div key={step.n} className="flex gap-4">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5" style={{ background: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}30` }}>
                    {step.n}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{step.title}</p>
                    <p className="text-sm text-[#8BA3C7] mt-0.5">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

// ── CTA ───────────────────────────────────────────────────────────────────────
function CtaSection() {
  return (
    <section className="py-28 relative overflow-hidden border-t border-[#0e1f3a]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#050d1f] via-[#0a1f0a]/20 to-[#050d1f]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full blur-[120px] opacity-10 pointer-events-none" style={{ background: ACCENT }} />

      <div className="relative z-10 site-container text-center space-y-8">
        <ScrollReveal>
          <div className="flex justify-center mb-6">
            <div className="relative w-36 h-36 sm:w-40 sm:h-40 drop-shadow-[0_0_40px_rgba(180,255,60,0.3)]">
              <Image
                src="/images/klight-sloth4.png"
                alt=""
                fill
                sizes="160px"
                className="object-contain select-none"
              />
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border mb-4" style={{ color: ACCENT, borderColor: `${ACCENT}40`, background: `${ACCENT}10` }}>
            🚀 Coming soon
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Ready to give your team<br />
            <span style={{ color: ACCENT }}>their own Kubernetes?</span>
          </h2>
          <p className="text-[#8BA3C7] text-lg mt-4 max-w-xl mx-auto">
            Get early access when klight launches. Free and open source — always.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <SubscribeModal
              accent={ACCENT}
              source="klight-cta"
              buttonLabel="Get early access"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-bold text-sm hover:brightness-110 transition-all hover:-translate-y-0.5"
              style={{ background: ACCENT, color: '#050d1f' }}
            />
            <a
              href="https://github.com/slothlabsorg/kraken-light"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-full border text-sm font-medium hover:opacity-80 transition-all"
              style={{ borderColor: `${ACCENT}50`, color: ACCENT }}
            >
              Star on GitHub →
            </a>
          </div>
          <p className="text-xs text-[#4A6080] mt-4">
            Works with minikube · EKS · GKE · AKS · Python CLI · MIT license
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function KlightPage() {
  return (
    <main className="bg-[#050d1f]">
      <CustomCursor />
      <ProductNavbar
        icon="🚀"
        iconSrc="/images/klight-logo.png"
        name="klight"
        accent={ACCENT}
        ctaKind="subscribe"
        ctaLabel="Get early access"
        docsHref="/klight/docs"
      />
      <Hero />
      <ProblemSection />
      <Features />
      <ThreeWorlds />
      <KlightYamlSection />
      <Comparison />
      <CatalogSection />
      <UISection />
      <MCPSection />
      <RemoteSection />
      <CtaSection />
      <Footer showSuiteLink accent={ACCENT} />
    </main>
  )
}
