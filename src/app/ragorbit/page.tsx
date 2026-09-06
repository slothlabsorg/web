import type { Metadata } from 'next'
import Link from 'next/link'
import ProductNavbar from '@/components/ProductNavbar'
import Footer from '@/components/Footer'
import ScrollReveal from '@/components/ScrollReveal'
import CustomCursor from '@/components/CustomCursor'
import RagOrbitCanvas from '@/components/RagOrbitCanvas'
import DownloadModal from '@/components/DownloadModal'
import { LiveVersion } from '@/lib/useLatestRelease'
import { appMeta } from '@/data/apps'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.org'
const ACCENT = '#D946EF'
const ACCENT2 = '#6366F1'
const BG = '#0B0620'
const BG_CARD = '#170C33'
const BORDER = '#2A1A4D'
const TEXT = '#B8A6D9'
const DIM = '#7C6A9C'
const REPO = 'https://github.com/slothlabsorg/ragorbit'
const DOCS = '/ragorbit/docs'
const COURSE = '/rag-course'
const APP = appMeta('ragorbit')!

export const metadata: Metadata = {
  title: 'RAGorbit — Visual builder for RAG & agentic strategies that generates deployable Python',
  description:
    'Draw a RAG or agentic flow on a canvas, and RAGorbit generates a real Python project — LangGraph and LangChain, with mock services and tests so it runs on day one. The artifact is ordinary code that runs without RAGorbit. Zero-dependency engine, 53 node types, 10 industry templates.',
  keywords: [
    'visual rag builder',
    'rag pipeline builder',
    'langgraph code generator',
    'langchain visual builder',
    'agentic workflow builder',
    'rag without lock-in',
    'flowise alternative',
    'langflow alternative',
    'rag templates',
    'generate langgraph project',
    'rag node catalog',
    'rag guardrails idempotency',
    'ragorbit',
    'SlothLabs',
  ],
  openGraph: {
    title: 'RAGorbit — Draw the flow, get a deployable Python project',
    description:
      'A canvas for RAG and agentic strategies that generates real LangGraph/LangChain code, with mocks and tests included. No lock-in: the artifact runs without the tool.',
    url: `${SITE_URL}/ragorbit`,
    siteName: 'SlothLabs',
    type: 'website',
    images: [{ url: '/images/slothlabs-hero.png', width: 1200, height: 630, alt: 'RAGorbit — visual RAG builder with deployable codegen' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RAGorbit — Draw the flow, get a deployable Python project',
    description:
      'Visual RAG & agentic builder that generates real LangGraph code with mocks and tests. The generated project runs without the tool.',
    images: ['/images/slothlabs-hero.png'],
  },
  alternates: { canonical: `${SITE_URL}/ragorbit` },
}

// ── Terminal helper ─────────────────────────────────────────────────────────
function TerminalChrome({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ background: '#0F0726', borderColor: BORDER }}>
      <span className="w-3 h-3 rounded-full bg-red-500/80" />
      <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
      <span className="w-3 h-3 rounded-full bg-green-500/80" />
      <span className="text-xs font-mono ml-2" style={{ color: DIM }}>{label}</span>
    </div>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ background: BG }} />
        <RagOrbitCanvas accent={ACCENT} accent2={ACCENT2} className="opacity-90" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${BG} 0%, ${BG}b3 55%, transparent 100%)` }} />
        <div className="absolute inset-x-0 bottom-0 h-40" style={{ background: `linear-gradient(to top, ${BG}, transparent)` }} />
      </div>

      <div className="relative z-10 site-container w-full" style={{ paddingTop: '72px', paddingBottom: '4rem' }}>
        <div className="max-w-2xl space-y-7 py-[52px]">
          <div className="fade-up" style={{ animationDelay: '0s' }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border" style={{ background: BG_CARD, borderColor: `${ACCENT}40`, color: ACCENT }}>
              🛰️ <LiveVersion slug="ragorbit" fallback="1.0.1" /> out now · Python 3.10+ · zero dependencies
            </span>
          </div>

          <h1
            className="fade-up break-words text-[2.75rem] sm:text-5xl lg:text-[3.5rem] xl:text-[64px] font-bold leading-[1.08] tracking-tight"
            style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em', animationDelay: '0.1s' }}
          >
            <span className="block text-white">Draw the flow.</span>
            <span className="block" style={{ color: ACCENT }}>Get the code.</span>
          </h1>

          <p className="fade-up text-lg xl:text-xl leading-relaxed max-w-xl" style={{ color: TEXT, animationDelay: '0.2s' }}>
            <span className="text-white font-semibold">RAGorbit</span> is a canvas for RAG and
            agentic strategies. Connect blocks — loaders, a vector store, your services, guardrails —
            and it generates a <span className="text-white font-semibold">real Python project</span>:
            LangGraph and LangChain, with mock services and tests so it runs the first day.
          </p>

          <p className="fade-up text-base max-w-xl" style={{ color: DIM, animationDelay: '0.24s' }}>
            The generated project is ordinary code. It runs <em>without</em> RAGorbit, and you own it
            the moment it lands on disk.
          </p>

          {/* Terminal preview */}
          <div className="fade-up rounded-xl border overflow-hidden backdrop-blur-sm max-w-xl" style={{ borderColor: BORDER, background: '#12082Be6', animationDelay: '0.28s' }}>
            <TerminalChrome label="terminal" />
            <pre className="p-4 text-sm font-mono leading-relaxed overflow-x-auto">
              <code>
                <span style={{ color: DIM }}># one file, any python3 — no pip, no venv</span>{'\n'}
                <span style={{ color: ACCENT }}>$</span> <span className="text-white">curl -fsSL https://slothlabs.org/install/ragorbit | sh</span>{'\n\n'}
                <span style={{ color: ACCENT }}>$</span> <span className="text-white">ragorbit generate flow.json --out ./my-bot</span>{'\n'}
                <span className="text-green-400">✓</span> <span style={{ color: TEXT }}>app/ · nodes.py + graph.py (LangGraph)</span>{'\n'}
                <span className="text-green-400">✓</span> <span style={{ color: TEXT }}>mocks/ · fixtures and mock services</span>{'\n'}
                <span className="text-green-400">✓</span> <span style={{ color: TEXT }}>tests/ · end-to-end, already green</span>{'\n\n'}
                <span style={{ color: ACCENT }}>$</span> <span className="text-white">cd my-bot && python3 -m unittest discover -s tests</span>{'\n'}
                <span style={{ color: ACCENT2 }} className="font-bold">OK — it works before you write a line</span>
              </code>
            </pre>
          </div>

          <div className="fade-up flex flex-col sm:flex-row gap-3 items-start" style={{ animationDelay: '0.32s' }}>
            <DownloadModal
              app={APP}
              buttonLabel="Download RAGorbit"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-bold text-sm hover:brightness-110 transition-all hover:-translate-y-0.5"
              style={{ background: ACCENT, color: '#0B0620' }}
            />
            <Link
              href={DOCS}
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-full border text-sm font-medium hover:opacity-80 transition-all"
              style={{ borderColor: `${ACCENT}50`, color: ACCENT }}
            >
              Read the docs →
            </Link>
          </div>

          <p className="fade-up text-xs" style={{ color: DIM, animationDelay: '0.36s' }}>
            Open source · MIT · 53 node types · 10 industry templates · LangGraph · LangChain
          </p>
        </div>
      </div>
    </section>
  )
}

// ── Problem ───────────────────────────────────────────────────────────────────
const PAIN_POINTS = [
  {
    icon: '🧊',
    title: 'Visual builders trap your work',
    body: 'You wire up a flow in a low-code tool and the result only runs inside that tool. To go to production you rewrite it by hand — so the prototype was a drawing, not a head start.',
  },
  {
    icon: '📄',
    title: 'A blank repo is a bad brief',
    body: 'Starting from scratch means a week of plumbing — loaders, a store, retries, a test harness — before anyone can see whether the idea works at all.',
  },
  {
    icon: '🔌',
    title: 'Nothing runs until everything runs',
    body: 'No API key, no database, no access to that internal service — so the whole pipeline sits dead. The demo waits on credentials instead of on the design.',
  },
]

function ProblemSection() {
  return (
    <section className="py-24" style={{ background: BG }}>
      <div className="site-container">
        <ScrollReveal className="text-center mb-16 space-y-4">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: DIM }}>The problem</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            A prototype you have to rewrite{' '}
            <span style={{ color: ACCENT }}>wasn&apos;t a prototype.</span>
          </h2>
          <p className="max-w-xl mx-auto" style={{ color: TEXT }}>
            Designing a RAG or agentic system is mostly deciding: which store, which retrieval, where
            the rules live, what a human has to approve. The tooling should make those decisions cheap
            to try — not make them expensive to keep.
          </p>
        </ScrollReveal>
        <div className="grid md:grid-cols-3 gap-6">
          {PAIN_POINTS.map((p, i) => (
            <ScrollReveal key={p.title} delay={i * 80}>
              <div className="rounded-2xl p-7 border h-full space-y-3" style={{ background: BG_CARD, borderColor: BORDER }}>
                <div className="text-3xl">{p.icon}</div>
                <h3 className="font-bold text-white text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>{p.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: TEXT }}>{p.body}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── How it works ────────────────────────────────────────────────────────────
const STEPS = [
  {
    n: '1',
    title: 'Draw it, or start from a template',
    body: 'Drag blocks onto the canvas and connect them. Ports are typed, so a store cannot be wired to a prompt and the mistake is visible as you make it. Ten industry templates give you a working flow to modify instead of a blank page.',
  },
  {
    n: '2',
    title: 'It saves as one portable JSON',
    body: 'The Flow IR is the source of truth — nodes, edges, config, the names of the secrets (never the values). It is plain JSON: diff it, review it in a PR, generate from it in CI. Nothing about it is proprietary.',
  },
  {
    n: '3',
    title: 'Codegen produces a project you own',
    body: 'One function per node in app/nodes.py, the LangGraph wiring in app/graph.py, mock services, fixtures and end-to-end tests. Run it with mocks immediately; flip one environment variable to go real.',
  },
]

function HowItWorks() {
  return (
    <section className="py-28 relative overflow-hidden">
      <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${BG}, ${BG_CARD}66, ${BG})` }} />
      <div className="relative z-10 site-container">
        <ScrollReveal className="text-center mb-16 space-y-4">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: ACCENT }}>How it works</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            A canvas, a JSON,<br />
            <span style={{ color: ACCENT }}>and a repo you keep.</span>
          </h2>
        </ScrollReveal>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Pipeline diagram */}
          <ScrollReveal>
            <div className="rounded-2xl border p-6 sm:p-8" style={{ background: '#0F0726', borderColor: BORDER }}>
              <div className="space-y-4">
                {[
                  { label: 'Canvas', sub: 'drag & drop, typed ports', icon: '🎛️', c: ACCENT2 },
                  { label: 'Flow IR', sub: 'portable JSON · the source of truth', icon: '📋', c: ACCENT2 },
                  { label: 'Codegen', sub: 'one emitter per node type', icon: '⚙️', c: ACCENT },
                  { label: 'Artifact', sub: 'app/ · mocks/ · tests/ · Dockerfile', icon: '📦', c: ACCENT },
                ].map((row, i, arr) => (
                  <div key={row.label}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl border flex-shrink-0" style={{ background: `${row.c}14`, borderColor: `${row.c}40` }}>
                        {row.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>{row.label}</p>
                        <p className="text-xs font-mono" style={{ color: DIM }}>{row.sub}</p>
                      </div>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="ml-6 h-6 w-px my-1" style={{ background: `linear-gradient(to bottom, ${row.c}, ${arr[i + 1].c})` }} />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-7 pt-5 border-t text-sm" style={{ borderColor: BORDER, color: TEXT }}>
                The artifact has no import of RAGorbit anywhere in it. Delete the tool and your
                project keeps building, testing and deploying.
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100} className="space-y-6">
            {STEPS.map((step) => (
              <div key={step.n} className="flex gap-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}30` }}>
                  {step.n}
                </div>
                <div>
                  <p className="font-semibold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{step.title}</p>
                  <p className="text-sm mt-1 leading-relaxed" style={{ color: TEXT }}>{step.body}</p>
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
    icon: '📦',
    title: 'The artifact is yours, not a runtime',
    desc: 'Standard Python: LangGraph and LangChain, one function per node, readable wiring. No SDK to install, no service to call home to, no format only the tool understands. Delete RAGorbit and nothing breaks.',
    badge: 'No lock-in',
  },
  {
    icon: '🧪',
    title: 'It runs before it has credentials',
    desc: 'Every artifact ships mock services, fixtures and end-to-end tests. `python -m unittest` is green on a laptop with no network, no API key and no database. You demo the design, then wire the real thing.',
    badge: 'Day one',
  },
  {
    icon: '🛑',
    title: 'It refuses to generate nonsense',
    desc: 'Contract checks run before codegen: an agent with no tools, a store with no embeddings, a guardrail wrapping nothing, a missing secret. You get told what to connect instead of a project that fails at runtime.',
    badge: null,
  },
  {
    icon: '🧩',
    title: '53 node types, 13 categories',
    desc: 'Loaders, chunkers, embeddings, vector stores and graph stores, hybrid retrieval and rerankers, agents, tools, guardrails, HITL, observability, multimodal, and the IO shapes for chat, batch and event workers.',
    badge: null,
  },
  {
    icon: '⚖️',
    title: 'Rules the model cannot overrule',
    desc: 'Deterministic decisions stay deterministic: rule conditions are compiled to Python at generation time, so there is no eval in your artifact — and a rule whose inputs are missing raises instead of quietly deciding.',
    badge: null,
  },
  {
    icon: '🔁',
    title: 'Mock and real, same shape',
    desc: 'Each node has a mock behaviour and a real implementation with the same signature, so you can read them side by side. Promoting from mock to production is an environment variable, not a rewrite.',
    badge: null,
  },
  {
    icon: '🪶',
    title: 'Zero dependencies, one file',
    desc: 'The engine is pure standard library — catalog, validator, contracts, codegen, mock runtime. It ships as an 80 KB zipapp that runs on any python3. No install, no venv, nothing to resolve.',
    badge: null,
  },
  {
    icon: '🔧',
    title: 'Extensible without touching the core',
    desc: 'Adding a technology is three small pieces: a manifest, a code emitter and a mock behaviour. The registry discovers it, the palette shows it, the form builds itself from your JSON Schema.',
    badge: null,
  },
  {
    icon: '🎓',
    title: 'A free course that teaches all of it',
    desc: 'Twelve modules, bilingual, every topic in three layers: the concept, the mechanism built from scratch in pure Python, then the production framework. Each topic anchored to a node and a template.',
    badge: 'Free',
  },
]

function Features() {
  return (
    <section className="py-24" style={{ background: BG }}>
      <div className="site-container">
        <ScrollReveal className="text-center mb-16 space-y-4">
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white"
            style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}
          >
            Generated code you&apos;d have{' '}
            <span style={{ color: ACCENT }}>written anyway.</span>
          </h2>
          <p className="text-lg max-w-lg mx-auto" style={{ color: TEXT }}>
            The test of a generator is whether you keep its output. Every feature here exists to make
            the answer yes.
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map((item) => (
            <ScrollReveal key={item.title}>
              <div className="group rounded-2xl p-6 border transition-all duration-200 hover:-translate-y-1 relative overflow-hidden h-full" style={{ background: BG_CARD, borderColor: BORDER }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" style={{ background: `linear-gradient(to bottom, ${ACCENT}0d, transparent)` }} />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-200" style={{ background: `${ACCENT}14` }}>
                    {item.icon}
                  </div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-white text-base" style={{ fontFamily: 'Syne, sans-serif' }}>
                      {item.title}
                    </h3>
                    {item.badge && (
                      <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border" style={{ color: ACCENT, borderColor: `${ACCENT}40`, background: `${ACCENT}14` }}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: TEXT }}>{item.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Templates ─────────────────────────────────────────────────────────────────
const TEMPLATES = [
  { n: '01', industry: 'Airlines', name: 'Flight-change agent', target: 'chat', concepts: 'tools, idempotency, confirm-gate, audit', dir: '01-airline-flight-change' },
  { n: '02', industry: 'Banking', name: 'Credit potential scoring', target: 'batch', concepts: 'PDF + tabular ingest, structured output', dir: '02-banking-credit-scoring' },
  { n: '03', industry: 'Health', name: 'Prior-authorization assistant', target: 'chat', concepts: 'hard filters, HITL, citations', dir: '03-healthcare-prior-auth' },
  { n: '04', industry: 'Insurance', name: 'Claims adjudication', target: 'batch', concepts: 'multimodal vision, rules + citations', dir: '04-insurance-claims' },
  { n: '05', industry: 'Legal', name: 'Contract review', target: 'chat', concepts: 'multi-index, risks with citations', dir: '05-legal-contract-review' },
  { n: '06', industry: 'Retail', name: 'Post-sale bot', target: 'chat', concepts: 'order/return tools, amount guardrail', dir: '06-retail-postsale-bot' },
  { n: '07', industry: 'Telecom', name: 'Call-center copilot', target: 'chat', concepts: 'STT, intent, multi-index, feedback', dir: '07-telecom-callcenter-copilot' },
  { n: '08', industry: 'Manufacturing', name: 'Maintenance RAG', target: 'chat', concepts: 'multimodal, mandatory citations, HITL', dir: '08-manufacturing-maintenance-rag' },
  { n: '09', industry: 'HR', name: 'Policy & benefits assistant', target: 'chat', concepts: 'the simplest — start here', dir: '09-hr-policy-assistant' },
  { n: '10', industry: 'Logistics', name: 'Disruption rebooking', target: 'worker', concepts: 'Kafka, stateless fan-out, auto-confirm', dir: '10-logistics-disruption-rebooking' },
]

const TARGET_COLOR: Record<string, string> = { chat: ACCENT, batch: ACCENT2, worker: '#22D3EE' }

function Templates() {
  return (
    <section className="py-28 relative overflow-hidden">
      <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${BG}, ${BG_CARD}4d, ${BG})` }} />
      <div className="relative z-10 site-container">
        <ScrollReveal className="text-center mb-14 space-y-4">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: DIM }}>Ten templates</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Start from a real system,<br />not an empty canvas.
          </h2>
          <p className="max-w-xl mx-auto" style={{ color: TEXT }}>
            Each template is a complete flow from a different industry, with a walkthrough of every
            block and why it is there. All ten validate, generate and pass their tests on every
            commit — so what you open is what runs.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <div className="overflow-x-auto">
            <div className="min-w-[820px] overflow-hidden rounded-xl border" style={{ borderColor: BORDER }}>
              <div className="grid grid-cols-[52px_130px_1fr_92px_1.2fr] " style={{ background: BG_CARD }}>
                {['#', 'Industry', 'Use case', 'Target', 'Concepts it teaches'].map((h, i) => (
                  <div key={h} className={`px-4 py-4 text-xs font-semibold uppercase tracking-wider ${i === 3 ? 'text-center' : ''}`} style={{ color: DIM }}>{h}</div>
                ))}
              </div>
              {TEMPLATES.map((row, i) => (
                <a
                  key={row.n}
                  href={`${REPO}/tree/main/examples/${row.dir}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid grid-cols-[52px_130px_1fr_92px_1.2fr] border-t hover:brightness-125 transition-all"
                  style={{ borderColor: BORDER, background: i % 2 === 0 ? '#0F0726' : BG }}
                >
                  <div className="px-4 py-4 text-sm font-mono" style={{ color: DIM }}>{row.n}</div>
                  <div className="px-4 py-4 text-sm" style={{ color: TEXT }}>{row.industry}</div>
                  <div className="px-4 py-4 text-sm text-white font-medium">{row.name}</div>
                  <div className="px-4 py-4 text-center">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono border" style={{
                      color: TARGET_COLOR[row.target],
                      borderColor: `${TARGET_COLOR[row.target]}40`,
                      background: `${TARGET_COLOR[row.target]}12`,
                    }}>{row.target}</span>
                  </div>
                  <div className="px-4 py-4 text-sm" style={{ color: TEXT }}>{row.concepts}</div>
                </a>
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
  { feature: 'Visual canvas for the flow', orbit: '✅', flowise: '✅', langflow: '✅', hand: '❌' },
  { feature: 'Output is a standalone project you own', orbit: '✅', flowise: '❌ Runs in-tool', langflow: '⚠️ Export only', hand: '✅' },
  { feature: 'Mock services + tests generated with it', orbit: '✅', flowise: '❌', langflow: '❌', hand: '⚠️ You write them' },
  { feature: 'Runs with no API key or database', orbit: '✅', flowise: '❌', langflow: '❌', hand: '⚠️ If you built it' },
  { feature: 'Rejects a flow that cannot work', orbit: '✅ Contracts', flowise: '❌ Fails at runtime', langflow: '❌', hand: 'n/a' },
  { feature: 'No runtime dependency on the tool', orbit: '✅', flowise: '❌', langflow: '⚠️', hand: '✅' },
  { feature: 'Deterministic rules the model cannot override', orbit: '✅', flowise: '⚠️', langflow: '⚠️', hand: '✅' },
  { feature: 'Time to a working first version', orbit: '✅ Minutes', flowise: '✅ Minutes', langflow: '✅ Minutes', hand: '❌ Days' },
  { feature: 'Install footprint', orbit: '✅ One 80 KB file', flowise: '❌ Node + DB', langflow: '❌ Heavy', hand: 'n/a' },
]

function Comparison() {
  const cellClass = (val: string) => {
    if (val.startsWith('✅')) return ''
    if (val.startsWith('❌')) return 'text-red-400'
    if (val === 'n/a') return ''
    return 'text-yellow-400'
  }
  return (
    <section className="py-24" style={{ background: BG }}>
      <div className="site-container">
        <ScrollReveal className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white" style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}>
            Low-code gets you the demo.
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: TEXT }}>
            The question is what happens next. If going to production means rewriting the flow by
            hand, the visual step was documentation. RAGorbit is built so the thing you drew is the
            thing you ship.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <div className="overflow-x-auto">
            <div className="min-w-[760px] overflow-hidden rounded-xl border" style={{ borderColor: BORDER }}>
              <div className="grid grid-cols-5" style={{ background: BG_CARD }}>
                <div className="px-5 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: DIM }}>Capability</div>
                <div className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-center border-x" style={{ color: ACCENT, borderColor: BORDER }}>RAGorbit</div>
                <div className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: DIM }}>Flowise</div>
                <div className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-center border-x" style={{ color: DIM, borderColor: BORDER }}>LangFlow</div>
                <div className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: DIM }}>By hand</div>
              </div>
              {COMPARISON_ROWS.map((row, i) => (
                <div key={row.feature} className="grid grid-cols-5 border-t" style={{ borderColor: BORDER, background: i % 2 === 0 ? '#0F0726' : BG }}>
                  <div className="px-5 py-4 text-sm" style={{ color: TEXT }}>{row.feature}</div>
                  <div className={`px-4 py-4 text-center text-xs font-semibold border-x ${cellClass(row.orbit)}`} style={{ borderColor: BORDER, ...(row.orbit.startsWith('✅') ? { color: ACCENT } : {}) }}>{row.orbit}</div>
                  <div className={`px-4 py-4 text-center text-xs ${cellClass(row.flowise)}`} style={row.flowise === 'n/a' ? { color: DIM } : {}}>{row.flowise}</div>
                  <div className={`px-4 py-4 text-center text-xs border-x ${cellClass(row.langflow)}`} style={{ borderColor: BORDER, ...(row.langflow === 'n/a' ? { color: DIM } : {}) }}>{row.langflow}</div>
                  <div className={`px-4 py-4 text-center text-xs ${cellClass(row.hand)}`} style={row.hand === 'n/a' ? { color: DIM } : {}}>{row.hand}</div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// ── Course CTA ────────────────────────────────────────────────────────────────
function CourseSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${BG}, ${BG_CARD}80, ${BG})` }} />
      <div className="relative z-10 site-container">
        <ScrollReveal>
          <div className="rounded-3xl border p-8 sm:p-12 max-w-4xl mx-auto" style={{ background: BG_CARD, borderColor: `${ACCENT2}40` }}>
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="text-5xl flex-shrink-0">🎓</div>
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border" style={{ color: ACCENT2, borderColor: `${ACCENT2}50`, background: `${ACCENT2}14` }}>
                  Free · open source · ES + EN
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                  Learn the whole stack, not just this tool
                </h2>
                <p className="leading-relaxed" style={{ color: TEXT }}>
                  RAGorbit has a full course behind it: twelve modules from zero to RAG, agents, MCP,
                  multimodal, guardrails and deployment. Every topic in three layers — the concept,
                  then the mechanism built by hand in pure Python, then the production framework.
                  The from-scratch layer is the point: understand the mechanism and you can use any
                  stack, including none of these.
                </p>
                <p className="text-sm" style={{ color: DIM }}>
                  Labs run in the browser. The from-scratch solutions need only the standard library,
                  so you can do the entire course offline.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link
                    href={COURSE}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-full font-bold text-sm hover:brightness-110 transition-all hover:-translate-y-0.5"
                    style={{ background: ACCENT2, color: '#fff' }}
                  >
                    Start the course →
                  </Link>
                  <a
                    href="https://github.com/slothlabsorg/rag-course"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-full border text-sm font-medium hover:opacity-80 transition-all"
                    style={{ borderColor: BORDER, color: TEXT }}
                  >
                    Course repo
                  </a>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// ── Roadmap ─────────────────────────────────────────────────────────────────
const ROADMAP = [
  {
    tag: 'v1.0 · shipping', color: ACCENT, done: true,
    title: 'The three deployment targets, generated for real',
    body: 'chat-service, batch and event-worker all produce a working artifact: 53 node types, contract checks, mocks and tests, Docker, and a Cloud Run path for the chat target.',
  },
  {
    tag: 'next', color: ACCENT2, done: false,
    title: 'More stores and rerankers in the catalog',
    body: 'Qdrant, Weaviate and Neo4j as first-class nodes, plus hosted rerankers. Each is a manifest, an emitter and a mock behaviour — the extension path is the same one you would use.',
  },
  {
    tag: 'future', color: '#22D3EE', done: false,
    title: 'Round-trip: import an existing project back to a flow',
    body: 'Read a generated artifact and recover its Flow IR, so a project that drifted from its diagram can be edited on the canvas again instead of being frozen at generation time.',
  },
]

function Roadmap() {
  return (
    <section className="py-28" style={{ background: BG }}>
      <div className="site-container">
        <ScrollReveal className="text-center mb-16 space-y-4">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: ACCENT }}>Roadmap</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            The catalog grows.<br />The contract does not change.
          </h2>
          <p className="max-w-xl mx-auto" style={{ color: TEXT }}>
            Adding a technology never touches the core, so new blocks land without breaking the flows
            you already drew.
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6">
          {ROADMAP.map((r, i) => (
            <ScrollReveal key={r.title} delay={i * 80}>
              <div className="rounded-2xl p-7 border h-full space-y-3" style={{ background: BG_CARD, borderColor: r.done ? `${r.color}40` : BORDER }}>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border" style={{ color: r.color, borderColor: `${r.color}50`, background: `${r.color}14` }}>
                  {r.done && <span className="w-1.5 h-1.5 rounded-full" style={{ background: r.color }} />}
                  {r.tag}
                </span>
                <h3 className="font-bold text-white text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>{r.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: TEXT }}>{r.body}</p>
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
    <section className="py-28 relative overflow-hidden border-t" style={{ borderColor: BORDER }}>
      <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${BG}, ${BG_CARD}66, ${BG})` }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full blur-[120px] opacity-20 pointer-events-none" style={{ background: ACCENT }} />

      <div className="relative z-10 site-container text-center space-y-8">
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border mb-4" style={{ color: ACCENT, borderColor: `${ACCENT}40`, background: `${ACCENT}14` }}>
            🛰️ <LiveVersion slug="ragorbit" fallback="1.0.1" /> available now
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Draw the system.<br />
            <span style={{ color: ACCENT }}>Keep the code.</span>
          </h2>
          <p className="text-lg mt-4 max-w-xl mx-auto" style={{ color: TEXT }}>
            One file, any Python 3.10+. Free and open source — always.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={60}>
          <div className="max-w-2xl mx-auto text-left rounded-xl border overflow-hidden" style={{ borderColor: BORDER, background: '#0F0726' }}>
            <TerminalChrome label="install" />
            <pre className="p-5 text-sm font-mono leading-relaxed overflow-x-auto">
              <code>
                <span style={{ color: DIM }}># one file, no install</span>{'\n'}
                <span style={{ color: ACCENT }}>$</span> <span className="text-white">curl -fsSL https://slothlabs.org/install/ragorbit | sh</span>{'\n\n'}
                <span style={{ color: DIM }}># or with Homebrew</span>{'\n'}
                <span style={{ color: ACCENT }}>$</span> <span className="text-white">brew install slothlabsorg/tap/ragorbit</span>{'\n\n'}
                <span style={{ color: DIM }}># or with pipx</span>{'\n'}
                <span style={{ color: ACCENT }}>$</span> <span className="text-white">pipx install ragorbit</span>
              </code>
            </pre>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <DownloadModal
              app={APP}
              buttonLabel="Download RAGorbit"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-bold text-sm hover:brightness-110 transition-all hover:-translate-y-0.5"
              style={{ background: ACCENT, color: '#0B0620' }}
            />
            <Link
              href={DOCS}
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-full border text-sm font-medium hover:opacity-80 transition-all"
              style={{ borderColor: `${ACCENT}50`, color: ACCENT }}
            >
              Read the docs →
            </Link>
            <a
              href={REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-full border text-sm font-medium hover:opacity-80 transition-all"
              style={{ borderColor: BORDER, color: TEXT }}
            >
              Star on GitHub
            </a>
          </div>
          <p className="text-xs mt-4" style={{ color: DIM }}>
            Python 3.10+ · zero dependencies · LangGraph · LangChain · 53 node types · MIT license
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RagOrbitPage() {
  return (
    <main style={{ background: BG }}>
      <CustomCursor />
      <ProductNavbar
        icon="🛰️"
        name="RAGorbit"
        accent={ACCENT}
        ctaKind="download"
        ctaLabel="Download"
        appSlug="ragorbit"
        docsHref={DOCS}
      />
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <Features />
      <Templates />
      <Comparison />
      <CourseSection />
      <Roadmap />
      <CtaSection />
      <Footer accent={ACCENT} />
    </main>
  )
}
