'use client'

import { useState } from 'react'
import Link from 'next/link'
import ProductNavbar from '@/components/ProductNavbar'
import Footer from '@/components/Footer'
import CustomCursor from '@/components/CustomCursor'

const ACCENT = '#D946EF'
const ACCENT2 = '#6366F1'
const BG_BASE = '#0B0620'
const BG_CARD = '#170C33'
const BORDER = '#2A1A4D'
const TEXT = '#B8A6D9'
const DIM = '#7C6A9C'
const REPO = 'https://github.com/slothlabsorg/ragorbit'

// ── Sidebar ───────────────────────────────────────────────────────────────────
const SIDEBAR: { group: string; items: { slug: string; label: string }[] }[] = [
  {
    group: 'Getting started',
    items: [
      { slug: 'overview', label: 'Overview' },
      { slug: 'install', label: 'Install' },
      { slug: 'quick-start', label: 'Quick start' },
      { slug: 'canvas', label: 'The canvas' },
    ],
  },
  {
    group: 'The contract',
    items: [
      { slug: 'flow-ir', label: 'Flow IR' },
      { slug: 'ports', label: 'Ports & types' },
      { slug: 'catalog', label: 'Node catalog' },
      { slug: 'contracts', label: 'Contract validation' },
      { slug: 'secrets', label: 'Secrets' },
    ],
  },
  {
    group: 'Generating',
    items: [
      { slug: 'targets', label: 'Deployment targets' },
      { slug: 'artifact', label: 'What gets generated' },
      { slug: 'mock-vs-real', label: 'Mock vs real mode' },
      { slug: 'rules', label: 'Deterministic rules' },
      { slug: 'deploy', label: 'Deploy' },
    ],
  },
  {
    group: 'Reference',
    items: [
      { slug: 'templates', label: 'The 10 templates' },
      { slug: 'extending', label: 'Extending the catalog' },
      { slug: 'cli', label: 'CLI reference' },
      { slug: 'course', label: 'The course' },
    ],
  },
]

// ── Reusable doc bits ─────────────────────────────────────────────────────────
function CodeBlock({ code, filename = 'bash' }: { code: string; filename?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <div className="relative rounded-xl border overflow-hidden my-5" style={{ borderColor: BORDER }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ background: '#0F0726', borderColor: BORDER }}>
        <span className="text-xs font-mono" style={{ color: DIM }}>{filename}</span>
        <button onClick={copy} className="text-xs transition-colors" style={{ color: copied ? ACCENT : DIM }}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="px-4 py-4 overflow-x-auto text-[13px] leading-relaxed font-mono" style={{ background: '#0D0725', color: '#dcd3ee' }}>
        <code>{code}</code>
      </pre>
    </div>
  )
}

function Diagram({ children, caption }: { children: string; caption?: string }) {
  return (
    <figure className="my-6">
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: BORDER, background: '#0D0725' }}>
        <pre className="px-4 py-5 overflow-x-auto text-[12.5px] leading-[1.55] font-mono" style={{ color: TEXT }}>
          <code>{children}</code>
        </pre>
      </div>
      {caption && <figcaption className="text-xs mt-2 px-1" style={{ color: DIM }}>{caption}</figcaption>}
    </figure>
  )
}

function Callout({ type, children }: { type: 'info' | 'warn' | 'success'; children: React.ReactNode }) {
  const color = type === 'warn' ? '#fbbf24' : type === 'success' ? '#34d399' : ACCENT
  return (
    <div className="my-5 px-4 py-3 rounded-r-lg border-l-4 text-sm leading-relaxed" style={{ borderColor: color, background: `${color}12`, color: TEXT }}>
      {children}
    </div>
  )
}

function H(props: { children: React.ReactNode }) {
  return <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{props.children}</h2>
}
function H3(props: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold mt-8 mb-2 text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{props.children}</h3>
}
function P(props: { children: React.ReactNode }) {
  return <p className="text-[15px] leading-relaxed mb-3" style={{ color: TEXT }}>{props.children}</p>
}
function C(props: { children: React.ReactNode }) {
  return <code className="px-1.5 py-0.5 rounded text-[13px] font-mono" style={{ background: BG_CARD, color: ACCENT, border: `1px solid ${BORDER}` }}>{props.children}</code>
}
function Li(props: { children: React.ReactNode }) {
  // The children go in one wrapper: without it, a bold lead-in becomes its own
  // flex item and collapses into a narrow column beside the rest of the sentence.
  return (
    <li className="flex items-start gap-2 text-[15px] mb-1" style={{ color: TEXT }}>
      <span style={{ color: ACCENT }} className="mt-1 flex-shrink-0 text-xs">▸</span>
      <span className="min-w-0 leading-relaxed">{props.children}</span>
    </li>
  )
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto my-5">
      <div className="min-w-[520px] rounded-xl border overflow-hidden" style={{ borderColor: BORDER }}>
        <div className="grid" style={{ background: BG_CARD, gridTemplateColumns: `repeat(${head.length}, minmax(0, 1fr))` }}>
          {head.map((h) => (
            <div key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: DIM }}>{h}</div>
          ))}
        </div>
        {rows.map((row, i) => (
          <div key={i} className="grid border-t" style={{ borderColor: BORDER, background: i % 2 === 0 ? '#0F0726' : BG_BASE, gridTemplateColumns: `repeat(${head.length}, minmax(0, 1fr))` }}>
            {row.map((cell, j) => (
              <div key={j} className="px-4 py-3 text-[13.5px]" style={{ color: TEXT }}>{cell}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Sections ──────────────────────────────────────────────────────────────────
/** `go` lets a section link to another one, keeping the sidebar in sync. */
function buildSections(go: (slug: string) => void): Record<string, React.ReactNode> {
  return {
    overview: (
      <>
        <H>RAGorbit in one page</H>
        <P>
          You draw a RAG or agentic flow on a canvas. It is saved as one portable JSON — the
          <strong className="text-white"> Flow IR</strong>. A generator turns that JSON into a real
          Python project with <C>app/</C>, <C>mocks/</C> and <C>tests/</C>. The project runs
          without RAGorbit, and you own it.
        </P>
        <Diagram caption="The tool is the middle step. What you keep is on the right.">{`   Canvas (drag & drop)        Flow IR (portable JSON)        Deployable artifact
 ┌───────────────────┐       ┌──────────────────────┐       ┌──────────────────────┐
 │   ◻── ◻── ◻       │  ──▶  │ { nodes, edges,      │  ──▶  │ app/ mocks/ tests/   │
 │    \\   │   /       │       │   secrets }          │       │ Dockerfile           │
 │       ◻           │       └──────────────────────┘       └──────────────────────┘
 └───────────────────┘          source of truth               \`docker compose up\``}</Diagram>
        <H3>Three properties that shape everything else</H3>
        <ul className="mb-4 space-y-1">
          <Li><strong className="text-white">No lock-in.</strong> The artifact is standard LangGraph/LangChain. Nothing in it imports RAGorbit.</Li>
          <Li><strong className="text-white">It runs on day one.</strong> Mocks, fixtures and end-to-end tests come with it, so the project is green before it has a single credential.</Li>
          <Li><strong className="text-white">Zero dependencies.</strong> The engine is pure standard library and ships as an 80 KB single file.</Li>
        </ul>
        <Callout type="info">
          New here? Read{' '}
          <button className="underline font-medium" style={{ color: ACCENT }} onClick={() => go('quick-start')}>Quick start</button>,
          then open the HR template — it is the shortest path to something working.
        </Callout>
      </>
    ),

    install: (
      <>
        <H>Install</H>
        <P>
          RAGorbit needs <strong className="text-white">Python 3.10 or newer</strong> and nothing
          else. The engine has no dependencies, which is why it can ship as one file.
        </P>
        <H3>One file, no install</H3>
        <CodeBlock code={`curl -fsSL https://slothlabs.org/install/ragorbit | sh`} />
        <P>
          Downloads <C>ragorbit.pyz</C> and drops a <C>ragorbit</C> launcher in <C>~/.local/bin</C>.
          The script verifies the download runs before replacing anything, so a half-published
          release leaves your existing install untouched.
        </P>
        <H3>Homebrew</H3>
        <CodeBlock code={`brew install slothlabsorg/tap/ragorbit`} />
        <H3>pipx or pip</H3>
        <CodeBlock code={`pipx install ragorbit
# or, inside a virtualenv:
pip install ragorbit`} />
        <H3>Or just download the file</H3>
        <P>
          Grab <C>ragorbit.pyz</C> from{' '}
          <a href={`${REPO}/releases/latest`} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: ACCENT }}>Releases</a>{' '}
          and run it directly — no install step at all:
        </P>
        <CodeBlock code={`python3 ragorbit.pyz list-nodes`} />
        <H3>From source</H3>
        <CodeBlock code={`git clone https://github.com/slothlabsorg/ragorbit
cd ragorbit
python3 -m ragorbit list-nodes      # works immediately, nothing to install`} />
        <Callout type="success">
          Verify any install with <C>ragorbit list-nodes</C>. It should end with
          <C>Total: 53 tipos de nodo en 13 categorías</C>.
        </Callout>
      </>
    ),

    'quick-start': (
      <>
        <H>Quick start</H>
        <P>From nothing to a tested project in four commands.</P>
        <CodeBlock code={`# 1. See the blocks you can use
ragorbit list-nodes

# 2. Validate a template (also checks the contracts)
ragorbit validate examples/09-hr-policy-assistant/flow.json

# 3. Generate the project
ragorbit generate examples/09-hr-policy-assistant/flow.json --out ./my-bot

# 4. Run it — no API key, no database, no network
cd my-bot
python3 -m unittest discover -s tests
python3 -m app.mockrun "How many vacation days do I get?"`} />
        <P>
          Step 4 passes on a fresh machine. That is the point: you see the flow behave before you
          decide which vector store to pay for.
        </P>
        <H3>Then go real</H3>
        <CodeBlock code={`pip install -e ".[real]"     # only the deps this flow actually needs
export MOCK=false
export ANTHROPIC_API_KEY=...
python3 -m app.main`} />
        <Callout type="info">
          Don&apos;t have the templates? They ship in <C>ragorbit-course-starter.zip</C> on every
          release, or clone the repo.
        </Callout>
      </>
    ),

    canvas: (
      <>
        <H>The canvas</H>
        <P>The visual builder is served by the engine itself:</P>
        <CodeBlock code={`ragorbit serve --port 8000
# open http://127.0.0.1:8000`} />
        <P>
          React and React Flow are <strong className="text-white">vendored</strong>, so the canvas
          works with no network and no <C>npm install</C>. Useful on a locked-down machine, and it
          means the UI cannot break because a CDN changed.
        </P>
        <H3>What you can do in it</H3>
        <ul className="mb-4 space-y-1">
          <Li>Pick one of the 10 templates from the gallery, or start empty.</Li>
          <Li>Drag blocks from the palette; each one&apos;s form is generated from its JSON Schema.</Li>
          <Li>Connect ports. Types are enforced as you draw, so an invalid wire is refused at the moment you attempt it.</Li>
          <Li><strong className="text-white">Validate</strong> — runs the same checks the CLI runs, including the contracts.</Li>
          <Li><strong className="text-white">Test with mocks</strong> — executes the flow and shows the response immediately.</Li>
          <Li><strong className="text-white">Export</strong> — downloads the generated project as a zip.</Li>
        </ul>
        <H3>A production stack, if you want one</H3>
        <P>
          There is also a FastAPI backend (<C>apps/api/</C>) and a Next.js + React Flow frontend
          (<C>apps/web/</C>) exposing the same endpoints. Both are optional; <C>ragorbit serve</C> is
          the stdlib path and is enough to use the product.
        </P>
      </>
    ),

    'flow-ir': (
      <>
        <H>Flow IR — the contract</H>
        <P>
          Everything hangs off one JSON document. It is the source of truth: the canvas edits it, the
          generator reads it, and you can diff it in a pull request.
        </P>
        <CodeBlock filename="flow.json" code={`{
  "flow": {
    "id": "hr-policy-assistant",
    "name": "Policy & benefits assistant",
    "deploymentTarget": "chat-service"
  },
  "nodes": [
    { "id": "policy_pdf", "type": "loader.pdf",
      "config": { "path": "data/policies/", "ocr": false } },
    { "id": "chunker", "type": "ingest.chunker",
      "config": { "strategy": "by-section", "chunkSize": 800, "overlap": 120 } }
  ],
  "edges": [
    { "source": "policy_pdf", "sourcePort": "Documents",
      "target": "chunker",    "targetPort": "Documents" }
  ],
  "secrets": [{ "name": "ANTHROPIC_API_KEY" }]
}`} />
        <H3>Why JSON and not a proprietary format</H3>
        <ul className="mb-4 space-y-1">
          <Li>It reviews like code. A change to a flow is a readable diff.</Li>
          <Li>It generates in CI. No GUI in the pipeline.</Li>
          <Li>It outlives the tool. Even with RAGorbit gone, the design is still legible.</Li>
        </ul>
        <Callout type="warn">
          <strong>Secrets are names, never values.</strong> The Flow IR records that a flow needs
          <C>ANTHROPIC_API_KEY</C>; the value lives in your environment. A flow file is safe to
          commit.
        </Callout>
      </>
    ),

    ports: (
      <>
        <H>Ports &amp; types</H>
        <P>
          Every node declares typed input and output ports. Connections are checked against those
          types, which is what makes the canvas hard to misuse: a store cannot be wired into a
          prompt, because those ports do not speak the same type.
        </P>
        <Table
          head={['Type', 'What travels on it']}
          rows={[
            [<C key="a">Documents</C>, 'Loaded or chunked documents, with metadata'],
            [<C key="b">Chunks</C>, 'Retrieved fragments, ready for a prompt'],
            [<C key="c">Retriever</C>, 'A queryable index'],
            [<C key="d">Embeddings</C>, 'An embedding model'],
            [<C key="e">Model</C>, 'A chat/vision model'],
            [<C key="f">Tool</C>, 'Something an agent can invoke'],
            [<C key="g">Message · Query</C>, 'Text in, text out'],
            [<C key="h">Decision</C>, 'A structured result (a dict)'],
            [<C key="i">Event</C>, 'An event from a broker'],
            [<C key="j">Any</C>, 'Connects to anything — the escape hatch'],
          ]}
        />
        <H3>Types are how mock and real stay aligned</H3>
        <P>
          Dataflow is routed <em>by port type</em>, in both modes. The mock executor and the
          generated LangGraph gather a node&apos;s inputs the same way, so a flow behaves the same
          whether it is running against fixtures or against production services.
        </P>
      </>
    ),

    catalog: (
      <>
        <H>Node catalog — 53 types, 13 categories</H>
        <P>Run <C>ragorbit list-nodes</C> for the live list. The shape of it:</P>
        <Table
          head={['Category', 'What lives there']}
          rows={[
            ['io', 'chat input, batch source, event source (Kafka), output, notify, panel, STT'],
            ['loader', 'PDF, tabular, multimodal, web, plain text'],
            ['ingest', 'chunkers (recursive, by-section, by-clause) and metadata tagging'],
            ['model', 'chat LLM, embeddings, vision'],
            ['store', 'pgvector, and graph stores for GraphRAG'],
            ['retrieval', 'vector, hybrid, rerankers, multi-index routing'],
            ['query', 'intent classification, query rewriting'],
            ['logic', 'structured output, deterministic rules, routers, citation enforcement'],
            ['tool', 'HTTP services, functions, retrievers-as-tools, MCP'],
            ['guardrail', 'idempotency, confirm-gate, pre-tool checks, resilience'],
            ['agent', 'ReAct loops and stateless fan-out'],
            ['hitl', 'human escalation'],
            ['observability', 'audit trail, metrics, feedback loops'],
          ]}
        />
        <P>
          Each entry is a manifest: ports, a JSON Schema for its config, the secrets it needs, its
          code emitter and its mock behaviour. The full reference is{' '}
          <a href={`${REPO}/blob/main/docs/02-node-catalog.md`} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: ACCENT }}>docs/02 · Node catalog</a>.
        </P>
      </>
    ),

    contracts: (
      <>
        <H>Contract validation</H>
        <P>
          A flow can be structurally valid and still be nonsense. RAGorbit checks the semantics
          before generating anything, so you get told what to connect instead of a project that
          fails at runtime.
        </P>
        <H3>What it refuses</H3>
        <ul className="mb-4 space-y-1">
          <Li>An agent with no tools connected — it would have nothing to do.</Li>
          <Li>A vector store with no embedding model — nothing to index with.</Li>
          <Li>A guardrail that does not wrap a tool — it would guard nothing.</Li>
          <Li>A node that needs a secret the flow never declares.</Li>
          <Li>A retriever with no store on its <C>Retriever</C> port.</Li>
        </ul>
        <CodeBlock code={`$ ragorbit validate broken-flow.json
❌ airline-flight-change: 2 errores, 0 warnings
     ERROR  Nodo 'agent' (agent.react): El agente necesita un Model conectado (model.llm).
     ERROR  Nodo 'agent' (agent.react): El agente no tiene herramientas: conecta al menos un tool.*`} />
        <Callout type="info">
          The generator runs the same validation, so <C>ragorbit generate</C> on an invalid flow
          refuses rather than emitting something broken.
        </Callout>
      </>
    ),

    secrets: (
      <>
        <H>Secrets</H>
        <P>
          Nodes declare the secrets they need by <strong className="text-white">name</strong>. The
          flow collects them, and the generated project ships a <C>.env.template</C> listing them
          with empty values.
        </P>
        <CodeBlock filename=".env.template" code={`# Fill these for real mode (MOCK=false). Not needed in mock mode.
MOCK=true
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
DATABASE_URL=`} />
        <H3>Real mode fails loudly</H3>
        <P>
          Each generated node checks its own credential and raises with the variable name if it is
          missing. A missing key is an immediate, specific error — not a confusing failure three
          nodes downstream.
        </P>
        <Callout type="warn">
          Values never enter the Flow IR, so flow files are safe to commit and safe to share in a
          bug report.
        </Callout>
      </>
    ),

    targets: (
      <>
        <H>Deployment targets</H>
        <P>
          The target is derived from how work enters the flow, and it decides the shape of the
          generated project.
        </P>
        <Table
          head={['Target', 'Entry', 'What you get']}
          rows={[
            [<C key="a">chat-service</C>, 'io.input', 'FastAPI server, /chat + SSE streaming, a web UI, a tool-calling agent with guardrails, mock services, Docker and a Cloud Run path'],
            [<C key="b">batch</C>, 'io.batch', 'A job that walks a corpus: nodes.py + graph.py, fixtures, tests, Docker'],
            [<C key="c">event-worker</C>, 'io.event-source', 'A Kafka consumer with stateless fan-out per event, bounded concurrency, audit and metrics'],
          ]}
        />
        <Callout type="info">
          <C>chat-service</C> deliberately has no <C>graph.py</C>. Its real path is an agent with
          tool-calling and guardrails (<C>app/engine.py</C> + <C>app/llm_agent.py</C>); an extra
          StateGraph there would look like the entry point without being it.
        </Callout>
      </>
    ),

    artifact: (
      <>
        <H>What gets generated</H>
        <Diagram caption="batch / event-worker layout. chat-service adds engine.py, llm_agent.py, a server, static/ and mocks/services/.">{`my-job/
  app/
    nodes.py            one function per node — the real implementation
    graph.py            the LangGraph wiring
    mockrun.py          runner for mock mode (stdlib)
    main.py             entry point for the target
    settings.py         reads env; MOCK=true switches modes
  runtime/              deterministic mock executor (copied in, no deps)
  mocks/
    fixtures.json       sample data per node
  tests/
    test_flow.py        end-to-end against the mocks
  .env.template         secret NAMES only
  pyproject.toml        [real] extra with only this flow's deps
  Dockerfile
  docker-compose.yml
  README.md`}</Diagram>
        <H3>Why nodes and wiring are separate files</H3>
        <P>
          <C>nodes.py</C> holds one function per node, with the{' '}
          <strong className="text-white">same signature as its mock counterpart</strong> in{' '}
          <C>runtime/behaviors.py</C> — you can read the two side by side and see the same logic
          twice, once for fixtures and once for production.
        </P>
        <P>
          <C>graph.py</C> only wires. State carries{' '}
          <C>outputs[node_id][port_type]</C>, and each node&apos;s inputs are gathered per edge and
          per port type, exactly as the mock executor does it. That symmetry is why behaviour matches
          across modes, and a reducer lets independent branches run in parallel without clashing.
        </P>
        <H3>Dependencies are per flow</H3>
        <P>
          The <C>[real]</C> extra is derived from the nodes you actually used. A flow with no
          pgvector node does not pull in psycopg; one with no multimodal loader does not ask for
          unstructured.
        </P>
      </>
    ),

    'mock-vs-real': (
      <>
        <H>Mock vs real mode</H>
        <P>One environment variable, two modes, same graph.</P>
        <Table
          head={['', 'MOCK=true', 'MOCK=false']}
          rows={[
            ['Runs on', 'runtime/ (stdlib)', 'LangGraph + LangChain'],
            ['LLM', 'Deterministic stub', 'Your provider'],
            ['Store', 'In-memory', 'pgvector / your store'],
            ['Tools', 'Fixtures', 'Real HTTP calls'],
            ['Needs network', 'No', 'Yes'],
            ['Needs credentials', 'No', 'Yes'],
            ['Deterministic', 'Yes — safe in CI', 'No'],
          ]}
        />
        <H3>Mock mode is not a toy</H3>
        <P>
          It exercises the real graph: the same nodes, the same edges, the same guardrail ordering.
          A confirm-gate still refuses to charge without confirmation; an idempotency guardrail still
          collapses a duplicate call. That is what makes the generated tests worth having.
        </P>
        <CodeBlock code={`# Mock — works anywhere, deterministic
python3 -m unittest discover -s tests
python3 -m app.mockrun "I want to change my flight"

# Real
pip install -e ".[real]"
MOCK=false ANTHROPIC_API_KEY=... python3 -m app.main`} />
      </>
    ),

    rules: (
      <>
        <H>Deterministic rules</H>
        <P>
          Some decisions must not be delegated to a model. A <C>logic.rules</C> node is the boundary
          where the LLM stops deciding.
        </P>
        <H3>Conditions are compiled, not interpreted</H3>
        <P>
          You write conditions in the canvas in a JS-like syntax. They are translated to Python{' '}
          <strong className="text-white">at generation time</strong>, so the artifact contains a plain
          <C>if/elif</C> chain and no <C>eval</C> anywhere.
        </P>
        <CodeBlock filename="app/nodes.py (generated)" code={`# score >= 70
if _ready(facts, ['score']) and _fact(facts, "score") >= 70:
    decision = {'decision': 'aprobar'}
# score >= 40 && score < 70
elif _ready(facts, ['score']) and _fact(facts, "score") >= 40 and _fact(facts, "score") < 70:
    decision = {'decision': 'revisar'}
else:
    _assert_decidable(facts, [['score'], ['score']], 'rules_engine')
    decision = {'decision': 'rechazar'}

return {"Decision": {**facts_summary(facts), **decision}}`} />
        <H3>The rules win</H3>
        <P>
          The decision is merged <em>over</em> the facts, so if the model proposed{' '}
          <C>&quot;rechazar&quot;</C> and the rules say the score is 85, the answer is{' '}
          <C>&quot;aprobar&quot;</C>. That is what makes the outcome auditable.
        </P>
        <Callout type="warn">
          <strong>A missing fact is not a &quot;no match&quot;.</strong> If a rule cannot be evaluated
          because its inputs are absent, falling through to <C>else</C> would mean deciding on data
          you do not have — so it raises instead. In credit scoring, that is the difference between a
          rejection and a bug.
        </Callout>
      </>
    ),

    deploy: (
      <>
        <H>Deploy</H>
        <H3>Docker</H3>
        <CodeBlock code={`cd my-bot
docker compose up --build          # starts in mock mode
# then set MOCK=false and your secrets in the environment`} />
        <H3>Chat service with real tool services</H3>
        <P>
          The chat target also emits <C>docker-compose.integration.yml</C>, which runs the mock
          services as real HTTP services alongside the bot. It is the honest rehearsal: the agent
          makes actual network calls, with idempotency and the confirm-gate in the path.
        </P>
        <CodeBlock code={`docker compose -f docker-compose.integration.yml up --build`} />
        <H3>Cloud Run</H3>
        <CodeBlock code={`cd my-bot/gcp
./deploy.sh          # Cloud Build + Cloud Run, reads your project from gcloud config`} />
        <H3>Event workers</H3>
        <P>
          Set <C>KAFKA_BROKER</C> and the worker consumes for real; leave it unset and it processes
          the fixture events instead, so the same image runs in a local smoke test.
        </P>
      </>
    ),

    templates: (
      <>
        <H>The 10 templates</H>
        <P>
          Each one is a complete flow from a different industry, with a README explaining every block
          and why it is there. All ten validate, generate and pass their tests on every commit.
        </P>
        <Table
          head={['#', 'Use case', 'Target']}
          rows={[
            ['01', 'Airline flight-change agent', <C key="a">chat</C>],
            ['02', 'Banking credit scoring', <C key="b">batch</C>],
            ['03', 'Healthcare prior authorization', <C key="c">chat</C>],
            ['04', 'Insurance claims adjudication', <C key="d">batch</C>],
            ['05', 'Legal contract review', <C key="e">chat</C>],
            ['06', 'Retail post-sale bot', <C key="f">chat</C>],
            ['07', 'Telecom call-center copilot', <C key="g">chat</C>],
            ['08', 'Manufacturing maintenance RAG', <C key="h">chat</C>],
            ['09', 'HR policy assistant', <C key="i">chat</C>],
            ['10', 'Logistics disruption rebooking', <C key="j">worker</C>],
          ]}
        />
        <Callout type="info">
          Start with <strong className="text-white">09 (HR)</strong> — it is the simplest complete
          RAG pipeline. Then <strong className="text-white">02 (banking)</strong> for batch and
          structured output, then <strong className="text-white">01 (airline)</strong> for agents and
          guardrails. That is the order the course uses.
        </Callout>
        <P>
          Browse them in{' '}
          <a href={`${REPO}/tree/main/examples`} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: ACCENT }}>examples/</a>.
        </P>
      </>
    ),

    extending: (
      <>
        <H>Extending the catalog</H>
        <P>
          Adding a technology is three small pieces and no changes to the core.
        </P>
        <Table
          head={['Piece', 'Where', 'For']}
          rows={[
            ['Manifest', <C key="a">catalog/nodes/&lt;category&gt;.json</C>, 'Ports, config schema, secrets'],
            ['Emitter', <C key="b">codegen_nodes.py → EMITTERS</C>, 'The real code it generates'],
            ['Mock behaviour', <C key="c">runtime/behaviors.py → BEHAVIORS</C>, 'What it does with no network'],
          ]}
        />
        <P>
          The manifest ties them together: its <C>emitter</C> field names the emitter and its{' '}
          <C>mock.behavior</C> names the behaviour. The registry discovers the node on startup, the
          palette shows it, and its form is generated from the JSON Schema.
        </P>
        <H3>The emitter contract</H3>
        <ul className="mb-4 space-y-1">
          <Li>Fixed signature: the generated function takes <C>inputs</C> (grouped by port type) and <C>state</C>, and returns <C>{'{port_type: value}'}</C>.</Li>
          <Li>Respect the port types — what you return on <C>Retriever</C> must be usable as one.</Li>
          <Li>Fail loudly. A missing input or secret should raise with the fix in the message.</Li>
        </ul>
        <CodeBlock code={`python3 -m ragorbit list-nodes | grep weaviate   # is it in the catalog?
python3 tools/verify.py                          # all 10 templates still green`} />
        <Callout type="success">
          <C>verify.py</C> audits the generated real code too: it fails if a node comes out empty, as
          a bare <C>return state</C>, or raising <C>NotImplementedError</C>. A node that does nothing
          is a CI failure, not something you discover in production.
        </Callout>
        <P>
          Full recipe:{' '}
          <a href={`${REPO}/blob/main/docs/05-extending.md`} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: ACCENT }}>docs/05 · Extending the catalog</a>.
        </P>
      </>
    ),

    cli: (
      <>
        <H>CLI reference</H>
        <Table
          head={['Command', 'What it does']}
          rows={[
            [<C key="a">ragorbit list-nodes</C>, 'The catalog, grouped by category. --json for the machine-readable palette.'],
            [<C key="b">ragorbit validate &lt;flow…&gt;</C>, 'Schema + contract checks. Exits non-zero on error, so it works in CI. -v also prints warnings.'],
            [<C key="c">ragorbit generate &lt;flow&gt; --out &lt;dir&gt;</C>, 'Validates, then writes the project. Refuses to generate from an invalid flow.'],
            [<C key="d">ragorbit serve [--port 8000]</C>, 'The canvas plus its API, on the stdlib server. Fully offline.'],
          ]}
        />
        <H3>In a generated project</H3>
        <Table
          head={['Command', 'What it does']}
          rows={[
            [<C key="e">python3 -m unittest discover -s tests</C>, 'End-to-end tests against the mocks'],
            [<C key="f">python3 -m app.mockrun &quot;…&quot;</C>, 'Run the flow once in mock mode and print the response'],
            [<C key="g">python3 -m app.main</C>, 'The real entry point for the target'],
          ]}
        />
        <H3>In the repo</H3>
        <Table
          head={['Command', 'What it does']}
          rows={[
            [<C key="h">python3 tools/verify.py</C>, 'All 10 templates: validate, generate, mock tests, and an audit of the generated real code'],
            [<C key="i">python3 tools/demo.py</C>, 'The above plus an e2e with real HTTP services and a contract rejection'],
            [<C key="j">python3 tools/build_pyz.py</C>, 'Build and smoke-test the single-file zipapp'],
          ]}
        />
      </>
    ),

    course: (
      <>
        <H>The course</H>
        <P>
          RAGorbit has a free, bilingual course that teaches everything the tool uses — twelve
          modules from zero to RAG, agents, MCP, multimodal, guardrails and deployment.
        </P>
        <H3>Three layers, every topic</H3>
        <Diagram>{`①  CONCEPT / DESIGN     →   ②  FROM SCRATCH          →   ③  REAL FRAMEWORK
   why, when,                 build the mechanism           how it is done in
   what replaces it           by hand in pure Python        production tools`}</Diagram>
        <P>
          Layer ② is the point. Implement the mechanism yourself and you can use{' '}
          <strong className="text-white">any</strong> stack — including none of these. The
          from-scratch solutions need only the standard library, so the whole course runs offline.
        </P>
        <P>
          Every topic is anchored to a node in the catalog and to one of the 10 templates, so by the
          end you can rebuild them and design new ones.
        </P>
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Link href="/rag-course" className="inline-flex items-center justify-center px-6 py-3 rounded-full font-bold text-sm hover:brightness-110 transition-all" style={{ background: ACCENT2, color: '#fff' }}>
            Start the course →
          </Link>
          <a href="https://github.com/slothlabsorg/rag-course" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-6 py-3 rounded-full border text-sm font-medium hover:opacity-80 transition-all" style={{ borderColor: BORDER, color: TEXT }}>
            Course repo
          </a>
        </div>
      </>
    ),
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RagOrbitDocsPage() {
  const [active, setActive] = useState('overview')
  const sections = buildSections(setActive)

  return (
    <main style={{ background: BG_BASE, minHeight: '100vh' }}>
      <CustomCursor />
      <ProductNavbar
        icon="🛰️"
        name="RAGorbit"
        accent={ACCENT}
        ctaKind="download"
        ctaLabel="Download"
        appSlug="ragorbit"
        docsHref="/ragorbit/docs"
      />

      <div className="pt-16 flex min-h-screen">
        {/* Sidebar — desktop */}
        <aside
          className="hidden md:flex flex-col flex-shrink-0 w-56 lg:w-64 sticky top-16 self-start overflow-y-auto py-8 pl-6 pr-4 border-r"
          style={{ borderColor: BORDER, maxHeight: 'calc(100vh - 64px)' }}
        >
          <Link href="/ragorbit" className="text-xs font-medium mb-6 flex items-center gap-1.5 hover:opacity-80 transition-opacity" style={{ color: ACCENT }}>
            ← RAGorbit
          </Link>
          {SIDEBAR.map((group) => (
            <div key={group.group} className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2 px-2" style={{ color: DIM }}>{group.group}</p>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.slug}>
                    <button
                      onClick={() => setActive(item.slug)}
                      className="w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors"
                      style={active === item.slug ? { background: `${ACCENT}1f`, color: ACCENT, fontWeight: 600 } : { color: TEXT }}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>

        {/* Right column */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Mobile picker */}
          <div className="md:hidden px-4 pt-6 pb-2">
            <select
              value={active}
              onChange={(e) => setActive(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-white border"
              style={{ background: BG_CARD, borderColor: BORDER }}
            >
              {SIDEBAR.map((group) =>
                group.items.map((item) => (
                  <option key={item.slug} value={item.slug}>{group.group} — {item.label}</option>
                )),
              )}
            </select>
          </div>

          {/* Content */}
          <article className="flex-1 min-w-0 px-6 md:px-10 lg:px-16 py-10 max-w-3xl">
            {sections[active] ?? <p style={{ color: DIM }}>Section not found.</p>}

            <div className="mt-16 pt-8 border-t flex justify-between gap-4" style={{ borderColor: BORDER }}>
              {(() => {
                const flat = SIDEBAR.flatMap((g) => g.items)
                const idx = flat.findIndex((i) => i.slug === active)
                const prev = flat[idx - 1]
                const next = flat[idx + 1]
                return (
                  <>
                    {prev ? (
                      <button onClick={() => setActive(prev.slug)} className="text-sm hover:text-white transition-colors flex items-center gap-1" style={{ color: TEXT }}>
                        ← {prev.label}
                      </button>
                    ) : <span />}
                    {next ? (
                      <button onClick={() => setActive(next.slug)} className="text-sm font-medium transition-colors flex items-center gap-1 hover:opacity-80" style={{ color: ACCENT }}>
                        {next.label} →
                      </button>
                    ) : (
                      <Link href="/ragorbit" className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: ACCENT }}>
                        Back to RAGorbit →
                      </Link>
                    )}
                  </>
                )
              })()}
            </div>
          </article>
        </div>
      </div>

      <Footer accent={ACCENT} />
    </main>
  )
}
