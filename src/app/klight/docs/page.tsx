'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ProductNavbar from '@/components/ProductNavbar'
import Footer from '@/components/Footer'
import CustomCursor from '@/components/CustomCursor'

const ACCENT   = '#B4FF3C'
const BG_BASE  = '#050d1f'
const BG_CARD  = '#0d1b3e'
const BORDER   = '#1a3060'

// ── Sidebar definition ────────────────────────────────────────────────────────
const SIDEBAR: { group: string; items: { slug: string; label: string }[] }[] = [
  {
    group: 'Getting started',
    items: [
      { slug: 'overview',     label: 'Overview' },
      { slug: 'install',      label: 'Install' },
      { slug: 'quick-start',  label: 'Quick start' },
    ],
  },
  {
    group: 'World 1 — Local dev',
    items: [
      { slug: 'local-setup',     label: 'Cluster setup' },
      { slug: 'build-load',      label: 'Build & load images' },
      { slug: 'from-repos',      label: 'Deploy with from-repos' },
      { slug: 'hot-swap',        label: 'Hot-swap a service' },
      { slug: 'sizing',          label: 'Sizing & resize' },
    ],
  },
  {
    group: 'World 2 — Team sync',
    items: [
      { slug: 'team-yaml',       label: 'klight-team.yaml' },
      { slug: 'sync-deploy',     label: 'Sync & deploy' },
      { slug: 'multi-env',       label: 'Multiple environments' },
    ],
  },
  {
    group: 'World 3 — Remote cluster',
    items: [
      { slug: 'setup-remote',    label: 'Setup remote (DevOps)' },
      { slug: 'connect',         label: 'Connect as dev' },
      { slug: 'switch-targets',  label: 'Switch targets' },
    ],
  },
  {
    group: 'Reference',
    items: [
      { slug: 'klight-yaml',     label: 'klight.yaml fields' },
      { slug: 'cli',             label: 'CLI reference' },
      { slug: 'catalog',         label: 'Infrastructure catalog' },
      { slug: 'ui',              label: 'UI dashboard' },
    ],
  },
  {
    group: 'AI / MCP',
    items: [
      { slug: 'mcp', label: 'Claude & LLM integration' },
    ],
  },
]

// ── Reusable doc components ───────────────────────────────────────────────────
function CodeBlock({ code, lang = 'bash', filename }: { code: string; lang?: string; filename?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <div className="relative rounded-xl border overflow-hidden my-5" style={{ borderColor: BORDER }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ background: '#071020', borderColor: BORDER }}>
        <span className="text-xs font-mono text-[#4A6080]">{filename ?? lang}</span>
        <button onClick={copy} className="text-xs transition-colors" style={{ color: copied ? ACCENT : '#4A6080' }}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="px-4 py-4 overflow-x-auto text-[13px] leading-relaxed font-mono" style={{ background: '#060d1e', color: '#c9d1d9' }}>
        <code>{code}</code>
      </pre>
    </div>
  )
}

function Callout({ type, children }: { type: 'info' | 'warn' | 'success'; children: React.ReactNode }) {
  const color = type === 'warn' ? '#fbbf24' : type === 'success' ? '#34d399' : ACCENT
  return (
    <div className="my-5 px-4 py-3 rounded-r-lg border-l-4 text-sm leading-relaxed" style={{ borderColor: color, background: `${color}10`, color: '#8BA3C7' }}>
      {children}
    </div>
  )
}

function Screenshot({ src, caption }: { src: string; caption: string }) {
  return (
    <figure className="my-6">
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: `${ACCENT}30` }}>
        <Image src={src} alt={caption} width={1440} height={900} className="w-full h-auto" style={{ display: 'block' }} />
      </div>
      <figcaption className="text-xs text-[#4A6080] text-center mt-2">{caption}</figcaption>
    </figure>
  )
}

function H(props: { children: React.ReactNode }) {
  return <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{props.children}</h2>
}
function H3(props: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold mt-8 mb-2 text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{props.children}</h3>
}
function P(props: { children: React.ReactNode }) {
  return <p className="text-[15px] leading-relaxed mb-3 text-[#8BA3C7]">{props.children}</p>
}
function C(props: { children: React.ReactNode }) {
  return <code className="px-1.5 py-0.5 rounded text-[13px] font-mono" style={{ background: BG_CARD, color: ACCENT, border: `1px solid ${BORDER}` }}>{props.children}</code>
}
function Li(props: { children: React.ReactNode }) {
  return <li className="flex items-start gap-2 text-[15px] text-[#8BA3C7] mb-1"><span style={{ color: ACCENT }} className="mt-1 flex-shrink-0 text-xs">▸</span>{props.children}</li>
}

// ── Section content ───────────────────────────────────────────────────────────
function buildSections(setActive: (slug: string) => void): Record<string, React.ReactNode> {
  return {

  // ── GETTING STARTED ──────────────────────────────────────────────────────────

  overview: (
    <>
      <div className="flex items-start gap-5 mb-6">
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 drop-shadow-[0_0_24px_rgba(180,255,60,0.25)]">
          <Image src="/images/klight-sloth2.png" alt="klight mascot" fill sizes="112px" className="object-contain select-none" />
        </div>
        <div className="pt-1">
          <H>klight documentation</H>
          <p className="text-sm text-[#4A6080] -mt-2">Welcome — your full-stack K8s sloth is here to help.</p>
        </div>
      </div>
      <P>klight is a Kubernetes dev-environment manager. One command brings up databases, message brokers, and all your services in the right order. Another tears everything down. Every developer gets their own isolated namespace — without writing a single line of K8s YAML.</P>
      <P>There are three ways to use klight:</P>
      <ul className="space-y-1 mb-5">
        <Li><strong className="text-white">World 1 — Local dev:</strong> you have the code, no CI pipeline, you want a real K8s stack locally.</Li>
        <Li><strong className="text-white">World 2 — Team sync:</strong> new dev, no local clones needed — one URL gets the full stack running from CI images.</Li>
        <Li><strong className="text-white">World 3 — Remote cluster:</strong> team outgrew local minikube; DevOps sets up EKS/GKE/AKS once, devs connect with a token.</Li>
      </ul>
      <Callout type="info">
        First time? Go to <strong className="text-white">Install</strong> then <strong className="text-white">Quick start</strong> — you&apos;ll have a full stack running in under 5 minutes.
      </Callout>

      <H3>Pick your world</H3>
      <div className="grid sm:grid-cols-3 gap-3 mb-6 not-prose">
        {[
          { id: 'World 1', label: 'Solo dev', desc: 'You have the code locally. No CI. minikube on your laptop.', target: 'local-setup' },
          { id: 'World 2', label: 'Startup team', desc: 'New dev. No clones. One sync URL → full stack from CI images.', target: 'team-yaml' },
          { id: 'World 3', label: 'Remote cluster', desc: 'EKS / GKE / AKS. DevOps sets up once. Devs connect with a token.', target: 'setup-remote' },
        ].map(w => (
          <button
            key={w.id}
            onClick={() => setActive(w.target)}
            className="text-left rounded-xl border p-4 transition-colors hover:border-opacity-100 group"
            style={{ background: '#071020', borderColor: BORDER }}
          >
            <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: ACCENT }}>{w.id}</div>
            <div className="font-semibold text-white text-sm mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>{w.label}</div>
            <p className="text-xs text-[#8BA3C7] leading-relaxed">{w.desc}</p>
            <div className="text-[11px] mt-2 transition-colors" style={{ color: ACCENT }}>Open guide →</div>
          </button>
        ))}
      </div>

      <Screenshot src="/images/klight-screen-w2-03-tienda-running.png" caption="klight UI — 5-service environment running, all green (World 2 team sync with ghcr.io images)" />
    </>
  ),

  install: (
    <>
      <H>Install</H>
      <H3>Python CLI</H3>
      <P>klight is a Python CLI. Install it with pip — Python 3.9+ required.</P>
      <CodeBlock code={`pip install klight

# Verify
klight --version`} />
      <H3>minikube (for local dev)</H3>
      <P>World 1 requires minikube with the Docker driver. Install via the official installer:</P>
      <CodeBlock code={`# macOS
brew install minikube

# Linux
curl -Lo minikube https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube /usr/local/bin/

# Windows (winget)
winget install Kubernetes.minikube`} />
      <H3>kubectl</H3>
      <CodeBlock code={`# macOS
brew install kubectl

# Linux
sudo apt-get install -y kubectl

# Windows
winget install Kubernetes.kubectl`} />
      <Callout type="info">
        For World 2 and 3 (team sync, remote cluster), kubectl is the only local requirement — no minikube needed.
      </Callout>
    </>
  ),

  'quick-start': (
    <>
      <H>Quick start</H>
      <P>Pick the path that matches your situation:</P>
      <H3>Option A — Local dev (you have the code)</H3>
      <CodeBlock code={`klight local setup                           # start minikube klight-demo
klight local build-load my-api --path ./my-api
klight from-repos ./my-api --env dev         # reads klight.yaml, deploys
klight ui                                    # open dashboard`} />
      <H3>Option B — Team sync (no local repos)</H3>
      <CodeBlock code={`klight sync https://infra.company.com/klight-team.yaml
klight up store --env dev
klight ui`} />
      <H3>Option C — Remote cluster</H3>
      <CodeBlock code={`klight connect --url https://cluster.company.com --token eyJ...
klight use klight-remote
klight up store --env dev`} />
      <Callout type="success">
        The same <strong className="text-white">klight up</strong>, <strong className="text-white">klight ps</strong>, and <strong className="text-white">klight logs</strong> commands work identically across all three scenarios.
      </Callout>
    </>
  ),

  // ── WORLD 1 ──────────────────────────────────────────────────────────────────

  'local-setup': (
    <>
      <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: ACCENT }}>World 1 · Solo dev (local code)</div>
      <H>Local cluster setup</H>
      <P>You have repos checked out locally and you don&apos;t want to set up a CI pipeline. klight uses minikube under the hood — one command boots an isolated profile <C>klight-demo</C> sized for a typical micro-stack (postgres + kafka + 3 services).</P>
      <CodeBlock code={`# Default: 2 CPUs, 3 GB RAM
klight local setup

# Larger cluster for heavy profiles
klight local setup --cpus 4 --memory 6144`} />
      <P>This creates a minikube profile <C>klight-demo</C>, exports its kubeconfig to <C>/tmp/klight-demo-kubeconfig.yaml</C>, and sets it as the active cluster target. From here, every klight command targets that profile.</P>
      <H3>Check status</H3>
      <CodeBlock code={`klight local status`} />
      <Screenshot src="/images/klight-screen-w1-02-cluster-status-bar.png" caption="World 1 — cluster status bar shows klight-demo · 2 CPUs · 3.0GB · OK" />
      <H3>Resize without destroying data</H3>
      <CodeBlock code={`klight local resize --memory 4096
klight local resize --cpus 4 --memory 8192`} />
      <Screenshot src="/images/klight-screen-w1-06-new-env-sizing-banner.png" caption="Sizing banner — klight estimates memory needs before you deploy and warns if the cluster is too small" />
      <Callout type="warn">
        Run <strong className="text-white">klight local setup</strong> once per machine. If a <C>klight-demo</C> profile already exists, klight will start it instead of recreating it — your data persists.
      </Callout>
    </>
  ),

  'build-load': (
    <>
      <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: ACCENT }}>World 1 · Solo dev (local code)</div>
      <H>Build &amp; load images</H>
      <P>For local dev, klight uses <C>imagePullPolicy: Never</C> — K8s loads the image from the local Docker daemon instead of pulling from a registry. The <C>build-load</C> command does both steps:</P>
      <CodeBlock code={`# Build Docker image and load it into minikube
klight local build-load inventory-api --path ./inventory-api
klight local build-load store-api     --path ./store-api
klight local build-load store-web     --path ./store-web`} />
      <P>Under the hood this runs <C>docker build -t {'{name}'}:local {'{path}'}</C> then <C>minikube image load {'{name}'}:local --profile klight-demo</C>.</P>
      <H3>Check loaded images</H3>
      <CodeBlock code={`klight local status`} />
      <Callout type="info">
        Each service repo needs a <C>klight.yaml</C> at its root. See the <strong className="text-white">klight.yaml fields</strong> reference for the full format.
      </Callout>
    </>
  ),

  'from-repos': (
    <>
      <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: ACCENT }}>World 1 · Solo dev (local code)</div>
      <H>Deploy with from-repos</H>
      <P><C>klight from-repos</C> is the World 1 deploy command. It reads the <C>klight.yaml</C> in each directory, builds the dependency graph, starts infrastructure (postgres, kafka, etc.), and deploys each service with the local <C>:local</C> image you just loaded.</P>
      <CodeBlock code={`klight from-repos ./inventory-api ./store-api ./store-web --env dev`} />
      <P>klight will:</P>
      <ul className="space-y-1 mb-5">
        <Li>Create namespace <C>env-dev</C> if it doesn&apos;t exist.</Li>
        <Li>Deploy all required infrastructure (postgres, kafka, redis…) and wait for readiness.</Li>
        <Li>Run any <C>migration.command</C> as a K8s Job before the service starts.</Li>
        <Li>Deploy each service with a <C>sentinel</C> init container that blocks until dependencies are healthy.</Li>
        <Li>Set <C>imagePullPolicy: Never</C> for <C>:local</C> images — your code never leaves your laptop.</Li>
      </ul>
      <Screenshot src="/images/klight-screen-w1-03-env-dev-running-local.png" caption="World 1 — env-dev running with locally built :local images on minikube" />
      <H3>Watch progress</H3>
      <CodeBlock code={`klight ps --env dev`} />
      <Screenshot src="/images/klight-screen-w1-04-service-detail-inventory-api.png" caption="Click any service card to see the pod, image, and env vars — World 1 inventory-api on local cluster" />
      <Screenshot src="/images/klight-screen-w1-05-logs-inventory-api.png" caption="Live log streaming — no kubectl required" />
    </>
  ),

  'hot-swap': (
    <>
      <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: ACCENT }}>World 1 · Solo dev (local code)</div>
      <H>Hot-swap a service</H>
      <P>During active development, use <C>klight replace</C> to update one service without redeploying the whole environment. Edit your code, rebuild the image, and replace in-place:</P>
      <CodeBlock code={`# Edit code…
klight local build-load store-api --path ./store-api
klight replace store-api --with ./store-api --env dev`} />
      <P><C>klight replace</C> reloads the image into minikube, patches the deployment with a new image tag (using the build timestamp), and triggers a rolling update. The rest of the environment keeps running.</P>
      <Callout type="success">
        Total round-trip: <strong className="text-white">edit → rebuild → replace</strong> typically takes 15–30 seconds for a Go or Python service.
      </Callout>

      <H3>Auto-reload with klight watch</H3>
      <P>For continuous development, <C>klight watch</C> auto-detects file changes, rebuilds the image, and replaces the service — no manual build-load needed:</P>
      <CodeBlock code={`klight watch store-api --env dev              # watches current dir
klight watch store-api --env dev --path ./src # watch specific dir`} />
    </>
  ),

  sizing: (
    <>
      <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: ACCENT }}>World 1 · Solo dev (local code)</div>
      <H>Sizing &amp; resize</H>
      <P>Before you hit OOMKilled pods, klight can estimate how much memory a profile needs and warn you in advance — both from the CLI and in the UI.</P>
      <H3>Check sizing estimate</H3>
      <CodeBlock code={`# API call (when UI is running):
curl http://localhost:7700/api/local/sizing/store

# Response:
# { "estimated_mb": 2048, "fits": true, "recommended_mb": 2560 }`} />
      <H3>Resize the cluster</H3>
      <CodeBlock code={`klight local resize --memory 4096
klight local resize --cpus 4 --memory 8192`} />
      <Screenshot src="/images/klight-screen-resize-dialog.png" caption="Resize dialog in the UI — resize without destroying running environments" />
      <P>The resize command stops the minikube profile, restarts it with the new specs, and re-exports the kubeconfig. Running environments are lost — deploy them again with <C>klight up</C> or <C>klight from-repos</C> after the resize.</P>
    </>
  ),

  // ── WORLD 2 ──────────────────────────────────────────────────────────────────

  'team-yaml': (
    <>
      <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: ACCENT }}>World 2 · Startup team (sync) — DevOps</div>
      <H>klight-team.yaml</H>
      <P>The team configuration lives in your central infra or platform repo. It lists every service, its CI-built image, the source repo URL, and how services are grouped into profiles.</P>
      <CodeBlock code={`version: "1"
team: my-company

source:
  type: git
  url: https://github.com/my-company/infra
  branch: main

services:
  - name: store-api
    image: ghcr.io/my-company/store-api:main
    repo: https://github.com/my-company/store-api
  - name: inventory-api
    image: ghcr.io/my-company/inventory-api:main
    repo: https://github.com/my-company/inventory-api
  - name: store-web
    image: ghcr.io/my-company/store-web:main
    repo: https://github.com/my-company/store-web

profiles:
  store: [inventory-api, store-api, store-web]
  full:  [inventory-api, store-api, store-web, sales-recorder]`} filename="klight-team.yaml" lang="yaml" />
      <P>Commit this file to your infra repo. Devs sync it with a single URL — they never need to clone the service repos.</P>
      <H3>Using the Setup Wizard</H3>
      <P>The <C>klight ui</C> Setup Wizard tab can generate this file by scanning your GitHub org — without cloning anything. Connect a GitHub token, scan, and generate.</P>
      <Screenshot src="/images/klight-screen-wizard-02-repo-list-catalog-warnings.png" caption="Setup Wizard Step 2 — repo list flagging services with custom infra entries not in the built-in catalog" />
      <Callout type="info">
        <strong className="text-white">Catalog detection</strong> — when the wizard scans repos, it reads existing <C>klight.yaml</C> files and flags any <C>needs:</C> entry not found in the built-in catalog (e.g. <C>postgres-store</C>). It shows exactly what to add to <C>klight-catalog.yaml</C> so DevOps knows before committing.
      </Callout>
    </>
  ),

  'sync-deploy': (
    <>
      <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: ACCENT }}>World 2 · Startup team (sync)</div>
      <H>Sync &amp; deploy</H>
      <P>Once DevOps publishes the team YAML, any developer can get the full stack running in two commands. No git clones of the service repos. No <C>npm install</C>. No fighting Docker Compose.</P>
      <CodeBlock code={`# Run once — caches the team config locally
klight sync https://raw.githubusercontent.com/my-company/infra/main/klight-team.yaml

# Run any time — spins up a named profile in an isolated namespace
klight up store --env tienda`} />
      <P>klight pulls CI images from the registry (ghcr.io, ECR, GCR — any registry your machine can reach), creates namespace <C>env-tienda</C>, and deploys all services in the <C>store</C> profile with proper dependency ordering.</P>
      <Screenshot src="/images/klight-screen-w2-03-tienda-running.png" caption="World 2 — env-tienda running with ghcr.io CI images, 5/5 services ready" />
      <Screenshot src="/images/klight-screen-w2-04-service-detail-inventory-api.png" caption="Click any card to inspect the running CI image — same UI you used in World 1" />
      <H3>Re-sync after team config changes</H3>
      <CodeBlock code={`klight sync https://raw.githubusercontent.com/my-company/infra/main/klight-team.yaml`} />
      <Callout type="info">
        klight caches the team config locally. Re-run <C>klight sync</C> any time the team YAML changes (new service, updated image tag, new profile).
      </Callout>
    </>
  ),

  'multi-env': (
    <>
      <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: ACCENT }}>World 2 · Startup team (sync)</div>
      <H>Multiple environments</H>
      <P>Every developer gets their own namespace. Alice and Bob can both run the <C>store</C> profile simultaneously — no port conflicts, no shared state. Same pattern works for CI / PR-preview environments.</P>
      <CodeBlock code={`klight up store --env alice    # creates env-alice namespace
klight up store --env bob      # creates env-bob namespace
klight up store --env pr-123   # for CI / PR environments`} />
      <H3>List all running environments</H3>
      <Screenshot src="/images/klight-screen-w2-01-environments-tab.png" caption="Environments tab — every running env is an isolated K8s namespace" />
      <Screenshot src="/images/klight-screen-w2-02-cluster-status-bar.png" caption="Cluster status bar — total RAM and active context, always visible at the top" />
      <H3>Resize the cluster mid-flight</H3>
      <P>Need a bigger cluster as more devs join? klight can resize without losing already-running envs.</P>
      <Screenshot src="/images/klight-screen-w2-07-resize-cluster-dialog.png" caption="Resize dialog — change CPUs/memory without destroying running envs (local) or coordinate with DevOps (remote)" />
      <H3>Destroy when done</H3>
      <CodeBlock code={`klight destroy alice           # deletes namespace env-alice + all resources
klight destroy bob`} />
      <H3>Pod status</H3>
      <CodeBlock code={`klight ps --env alice`} />
    </>
  ),

  // ── WORLD 3 ──────────────────────────────────────────────────────────────────

  'setup-remote': (
    <>
      <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: ACCENT }}>World 3 · Remote cluster — DevOps</div>
      <H>Setup remote cluster (DevOps)</H>
      <P>Run this once on the remote cluster (EKS, GKE, AKS, or any K8s cluster). You need <C>cluster-admin</C> access.</P>
      <CodeBlock code={`kubectl config use-context your-eks-context
klight cluster setup-remote`} />
      <P>This command creates:</P>
      <ul className="space-y-1 mb-5">
        <Li>Namespace <C>klight-system</C></Li>
        <Li>ServiceAccount <C>klight-dev</C> in <C>klight-system</C></Li>
        <Li>ClusterRole <C>klight-dev</C> — can create/delete <C>env-*</C> namespaces and has full access inside them</Li>
        <Li>ClusterRoleBinding linking the SA to the role</Li>
        <Li>A token valid for 1 year</Li>
      </ul>
      <CodeBlock code={`# Example output:
✓ ServiceAccount klight-dev created in klight-system
✓ ClusterRole klight-dev (manage env-* namespaces)
✓ ClusterRoleBinding klight-dev

Token (valid 1 year):
  eyJhbGciOiJSUzI1NiIsImtpZCI6...

Share this with your devs:
  klight connect --url https://k8s.company.com --token eyJhbGci...`} />
      <Callout type="success">
        Share the <strong className="text-white">klight connect …</strong> one-liner with every developer. That&apos;s the entire remote-cluster onboarding doc.
      </Callout>
    </>
  ),

  connect: (
    <>
      <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: ACCENT }}>World 3 · Remote cluster — Dev</div>
      <H>Connect as dev</H>
      <P>Run the connect command your DevOps sent you once per laptop:</P>
      <CodeBlock code={`klight connect --url https://k8s.company.com --token eyJhbGci...
klight use klight-remote`} />
      <P>This writes a kubeconfig context named <C>klight-remote</C> and sets it as the active target. Now <C>klight up store --env alice</C> runs on the remote cluster.</P>
      <H3>Import from kubeconfig (alternative)</H3>
      <CodeBlock code={`klight connect --kubeconfig /path/to/kubeconfig.yaml`} />
      <H3>Deploy your env on the remote cluster</H3>
      <P>The exact same <C>klight up</C> / <C>klight ps</C> / <C>klight logs</C> commands you used in World 2 work here — the only difference is the active target.</P>
      <CodeBlock code={`klight sync https://raw.githubusercontent.com/my-company/infra/main/klight-team.yaml
klight up store --env alice
klight ps --env alice`} />
      <Screenshot src="/images/klight-screen-w3-03-alice-running-remote.png" caption="World 3 — env-alice running on remote EKS cluster with CI images from ghcr.io" />
      <Screenshot src="/images/klight-screen-w3-02-cluster-bar-remote.png" caption="Remote cluster status bar — shows the remote context, not klight-demo" />
      <Screenshot src="/images/klight-screen-w3-04-service-detail-store-api.png" caption="Service detail — store-api on the remote cluster" />
      <Screenshot src="/images/klight-screen-w3-05-logs-store-api-remote.png" caption="Live logs — streamed from a pod running on the remote cluster" />
    </>
  ),

  'switch-targets': (
    <>
      <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: ACCENT }}>World 3 · Remote cluster — Dev</div>
      <H>Switch targets</H>
      <P>klight supports multiple cluster targets. Switch between them with <C>klight use</C>:</P>
      <CodeBlock code={`klight use local           # switch to minikube klight-demo
klight use klight-remote   # switch to configured remote cluster
klight target              # show current active target`} />
      <P>All subsequent klight commands use the active target. The target is stored in <C>~/.klight/config.toml</C>.</P>
      <Callout type="info">
        You can have multiple remote targets — one per cluster or environment (staging, shared-dev). Register each with a different name using <C>--name</C>: <C>klight connect --url … --token … --name staging-cluster</C>
      </Callout>
      <Screenshot src="/images/klight-screen-w3-06-env-list-remote-cluster.png" caption="Same Environments tab — but now showing namespaces on the remote cluster" />
    </>
  ),

  // ── REFERENCE ─────────────────────────────────────────────────────────────────

  'klight-yaml': (
    <>
      <H>klight.yaml reference</H>
      <P>Add one <C>klight.yaml</C> at the root of each service repo. klight generates all K8s manifests from this file — you never write Kubernetes YAML.</P>
      <CodeBlock code={`# yaml-language-server: $schema=https://slothlabsorg.github.io/klight/schema/klight.yaml.json
name: inventory-api       # service name (used as K8s Deployment name)
port: 8081                # container port your app listens on
health: /health           # HTTP path for readiness probe

image: ghcr.io/my-org/inventory-api:main   # optional — for team sync
                                            # omit for local builds (:local)

needs: [postgres, kafka]  # infra dependencies — started first, env vars wired

migration:                # optional — runs as a K8s Job before the Deployment
  command: ["python", "-m", "app.migrate"]

env:                      # env vars injected into the container
  DB_HOST: postgres       # can reference infra names for DNS discovery
  DB_NAME: inventory_db
  KAFKA_BOOTSTRAP_SERVERS: kafka:9092
  LOG_LEVEL: info

manifest: ./deploy/overlays/dev   # optional — path to existing K8s manifests
                                   # klight applies these instead of generating`} filename="klight.yaml" lang="yaml" />

      <H3>Field reference</H3>
      <div className="overflow-x-auto mt-4 mb-6">
        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr className="border-b" style={{ borderColor: BORDER }}>
              <th className="px-4 py-3 text-left font-semibold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Field</th>
              <th className="px-4 py-3 text-left font-semibold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Required</th>
              <th className="px-4 py-3 text-left font-semibold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['name', 'Yes', 'Service name. Used as the K8s Deployment name and DNS hostname.'],
              ['port', 'Yes', 'Container port the service listens on.'],
              ['health', 'No', 'HTTP path for the readiness probe. Default: /health.'],
              ['image', 'No', 'Full image reference for team sync. Omit for local builds.'],
              ['needs', 'No', 'List of infra dependencies (postgres, kafka, redis…). klight starts these first.'],
              ['migration.command', 'No', 'Command run as a K8s Job before the Deployment starts.'],
              ['env', 'No', 'Key-value env vars injected into the container.'],
              ['manifest', 'No', 'Path to existing K8s manifest dir. klight applies these instead of generating.'],
            ].map(([field, req, desc]) => (
              <tr key={field as string} className="border-b" style={{ borderColor: BORDER }}>
                <td className="px-4 py-3 font-mono text-[12px]" style={{ color: ACCENT }}>{field}</td>
                <td className="px-4 py-3 text-[#4A6080]">{req}</td>
                <td className="px-4 py-3 text-[#8BA3C7]">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  ),

  cli: (
    <>
      <H>CLI reference</H>

      <H3>Local cluster</H3>
      <CodeBlock code={`klight local setup                               # start minikube klight-demo (2 CPUs, 3 GB)
klight local setup --cpus 4 --memory 6144        # larger cluster
klight local resize --memory 4096                # resize without destroying data
klight local build-load <svc> --path <dir>       # docker build + minikube image load
klight local status                              # cluster status + loaded images
klight local preload-infra [--only postgres,kafka]  # pre-pull infra images into minikube`} />

      <H3>Environments</H3>
      <CodeBlock code={`klight up <profile> --env <name>                 # create namespace + deploy full profile
klight from-repos <dir…> --env <name>            # deploy from local klight.yaml files
klight ps --env <name>                           # pod status table
klight logs <svc> --env <name>                   # tail logs
klight logs <svc> --env <name> -c sentinel       # init container logs
klight open <svc> --env <name>                   # port-forward + open browser
klight exec <svc> --env <name> -- sh             # shell into running pod
klight replace <svc> --with <dir> --env <name>   # hot-swap with local build
klight destroy <name>                            # delete namespace + everything in it
klight destroy <name> --yes                      # skip confirmation`} />

      <H3>Team sync</H3>
      <CodeBlock code={`klight sync <url>                                # download + cache klight-team.yaml`} />

      <H3>Hot reload</H3>
      <CodeBlock code={`klight watch <svc> --env <name>              # auto-rebuild + replace on file change
klight watch <svc> --env <name> --path <dir> # watch specific directory`} />

      <H3>Cluster targets</H3>
      <CodeBlock code={`klight use local                                 # switch to minikube klight-demo
klight use klight-remote                         # switch to configured remote cluster
klight target                                    # show current target
klight connect --url <u> --token <t>             # register remote cluster
klight connect --kubeconfig <path>               # import kubeconfig`} />

      <H3>Remote setup (DevOps)</H3>
      <CodeBlock code={`klight cluster setup-remote                      # create SA + RBAC + print token`} />

      <H3>UI</H3>
      <CodeBlock code={`klight ui                                        # http://localhost:7700`} />

      <H3>AI / MCP</H3>
      <CodeBlock code={`klight mcp                                   # start stdio MCP server for Claude/LLM integration`} />

      <H3>Diagnostics</H3>
      <CodeBlock code={`klight preflight [--env <name>]              # check image availability before deploy
klight unready [--env <name>]                # list pods not yet Ready with fix hints
klight init [<dir>]                          # scaffold klight.yaml for a service`} />
    </>
  ),

  catalog: (
    <>
      <H>Infrastructure catalog</H>
      <P>Add any of these names to <C>needs:</C> in your <C>klight.yaml</C>. klight starts them, waits for readiness, and injects the env vars listed below into every service that depends on them.</P>

      <div className="overflow-x-auto mt-4 mb-6">
        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr className="border-b" style={{ borderColor: BORDER }}>
              <th className="px-4 py-3 text-left font-semibold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Name</th>
              <th className="px-4 py-3 text-left font-semibold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Image</th>
              <th className="px-4 py-3 text-left font-semibold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Injected env vars</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['postgres',      'postgres:16-alpine',           'DB_HOST, DB_PORT, DB_USER, DB_PASSWORD'],
              ['kafka',         'apache/kafka:3.7.0',           'KAFKA_BOOTSTRAP_SERVERS'],
              ['redis',         'redis:7-alpine',               'REDIS_HOST, REDIS_PORT'],
              ['mongodb',       'mongo:7',                      'MONGODB_URI'],
              ['rabbitmq',      'rabbitmq:3-management',        'RABBITMQ_URL'],
              ['localstack',    'localstack/localstack:3',      'AWS_ENDPOINT_URL, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY'],
              ['elasticsearch', 'elasticsearch:8',              'ELASTICSEARCH_URL'],
            ].map(([name, image, vars]) => (
              <tr key={name as string} className="border-b" style={{ borderColor: BORDER }}>
                <td className="px-4 py-3 font-mono text-[12px]" style={{ color: ACCENT }}>{name}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-[#4A6080]">{image}</td>
                <td className="px-4 py-3 text-[#8BA3C7] font-mono text-[11px]">{vars}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H3>Custom catalog entries</H3>
      <P>Add your own infra in a <C>klight-catalog.yaml</C> at your infra repo root — no changes to klight needed. The top-level key is <C>infra:</C>, and each entry is a named dict. The optional <C>provides:</C> map injects env vars into every service that lists the entry under <C>needs:</C>.</P>
      <CodeBlock code={`# klight-catalog.yaml — in your infra repo root
infra:
  postgres-store:
    description: "PostgreSQL 15 for store-api"
    image: postgres:15-alpine
    port: 5432
    manifest: infrastructure/postgres-store/base
    provides:
      GLOBAL_POSTGRES_STORE_HOST: postgres-store
      GLOBAL_POSTGRES_STORE_PORT: "5432"
  postgres-inventory:
    description: "PostgreSQL 15 for inventory-api"
    image: postgres:15-alpine
    port: 5432
    manifest: infrastructure/postgres-inventory/base
    provides:
      GLOBAL_POSTGRES_INVENTORY_HOST: postgres-inventory
      GLOBAL_POSTGRES_INVENTORY_PORT: "5432"`} filename="klight-catalog.yaml" lang="yaml" />
      <Callout type="info">
        <strong className="text-white">Setup Wizard catalog detection</strong> — when the wizard scans repos and finds <C>needs:</C> entries not in the built-in catalog, it flags them with the exact catalog entry format needed. You don&apos;t need to write this by hand.
      </Callout>
    </>
  ),

  ui: (
    <>
      <H>UI dashboard</H>
      <P>Run <C>klight ui</C> to open the dashboard at <C>http://localhost:7700</C>. It connects to whatever cluster is currently active.</P>
      <CodeBlock code={`# With a specific kubeconfig
KUBECONFIG=/tmp/klight-demo-kubeconfig.yaml klight ui

# Or point the server directly
KUBECONFIG=/tmp/klight-demo-kubeconfig.yaml uvicorn klight_ui.server:app --port 7700`} />

      <Screenshot src="/images/klight-screen-cluster-status.png" caption="Cluster status bar — always visible, shows context name, CPUs, RAM, and cluster health" />

      <H3>Service cards &amp; logs</H3>
      <P>Click any service card to open the detail view. Click Logs to stream real-time output from the pod — no kubectl required.</P>
      <Screenshot src="/images/klight-screen-service-detail.png" caption="Service detail — click any service card to see pod status, image, and env vars" />
      <Screenshot src="/images/klight-screen-logs.png" caption="Live logs — real-time log streaming for any service, with timestamps" />

      <H3>New environment form &amp; sizing banner</H3>
      <P>The &quot;New environment&quot; form lets you deploy a profile without the CLI. klight estimates the memory requirements and shows a banner before you hit Deploy — so you know in advance if the cluster is too small.</P>
      <Screenshot src="/images/klight-screen-sizing-banner.png" caption="Sizing banner — memory estimate for the selected profile before deploying" />

      <H3>Setup Wizard</H3>
      <P>DevOps-only: the Setup Wizard tab lets you connect your GitHub org, scan repos for existing <C>klight.yaml</C> files, generate missing ones, and publish a <C>klight-team.yaml</C> without cloning any repos.</P>
      <Screenshot src="/images/klight-screen-wizard-01-platform-access.png" caption="Setup Wizard Step 1 — connect GitHub org, paste token, set registry prefix" />
      <Screenshot src="/images/klight-screen-wizard-03-review-catalog-warning.png" caption="Setup Wizard Step 3 — ⚠ custom infra panel flags postgres-store and postgres-inventory, shows exactly what to add to klight-catalog.yaml" />
    </>
  ),

  mcp: (
    <>
      <H>Claude &amp; LLM integration</H>
      <P>klight ships a stdio MCP server. Add it to Claude Desktop or Claude Code once — then control your cluster with natural language.</P>
      <CodeBlock code={`claude mcp add klight -- klight mcp`} filename="Claude Code (one-time)" />
      <CodeBlock code={`{
  "mcpServers": {
    "klight": {
      "command": "klight",
      "args": ["mcp"],
      "env": { "KUBECONFIG": "/tmp/klight-demo-kubeconfig.yaml" }
    }
  }
}`} filename="~/.claude/claude_desktop_config.json" lang="json" />

      <H3>Available tools (17)</H3>
      <P>The MCP server exposes all three worlds as tools Claude can call:</P>
      <div className="overflow-x-auto mt-4 mb-6">
        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr className="border-b" style={{ borderColor: BORDER }}>
              <th className="px-4 py-3 text-left font-semibold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Tool</th>
              <th className="px-4 py-3 text-left font-semibold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['local_setup',         'start minikube klight-demo cluster'],
              ['preload_infra',        'pre-pull infra images into minikube'],
              ['local_build_load',     'docker build + load into minikube'],
              ['deploy_environment',   'klight up <profile> --env <name>'],
              ['deploy_from_repos',    'klight from-repos (World 1)'],
              ['service_status',       'klight ps --env <name>'],
              ['get_logs',             'tail service logs'],
              ['get_unready',          'list broken pods + fix hints'],
              ['destroy_environment',  'klight destroy --yes'],
              ['replace_service',      'hot-swap with local build'],
              ['restore_service',      'back to original CI image'],
              ['init_service',         'scan repo → generate klight.yaml'],
              ['sync_team',            'download klight-team.yaml'],
              ['run_preflight',        'check image availability'],
              ['setup_remote_cluster', 'create SA + RBAC on remote'],
              ['connect_remote',       'register remote cluster'],
              ['switch_target',        'klight use local/remote'],
            ].map(([tool, desc]) => (
              <tr key={tool as string} className="border-b" style={{ borderColor: BORDER }}>
                <td className="px-4 py-3 font-mono text-[12px]" style={{ color: ACCENT }}>{tool}</td>
                <td className="px-4 py-3 text-[#8BA3C7]">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H3>Resources</H3>
      <P>Three resources Claude reads automatically before calling tools:</P>
      <ul className="space-y-1 mb-5">
        <Li><C>klight://cluster</C> — active target, CPUs, RAM, context</Li>
        <Li><C>klight://environments</C> — all env-* namespaces + pod status</Li>
        <Li><C>klight://team-yaml</C> — cached klight-team.yaml (if synced)</Li>
        <Li><C>klight://capabilities</C> — what the MCP can do vs what needs CLI/UI</Li>
      </ul>

      <Callout type="info">
        For streaming logs, <C>klight watch</C>, or the Setup Wizard — Claude will tell you to run <C>klight ui</C> or the CLI command directly. The MCP only exposes what the CLI can do non-interactively.
      </Callout>
    </>
  ),
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function KlightDocsPage() {
  const [active, setActive] = useState('overview')
  const sections = buildSections(setActive)

  return (
    <main style={{ background: BG_BASE, minHeight: '100vh' }}>
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

      <div className="pt-16 flex min-h-screen">
        {/* Sidebar */}
        <aside
          className="hidden md:flex flex-col flex-shrink-0 w-56 lg:w-64 sticky top-16 self-start overflow-y-auto py-8 pl-6 pr-4 border-r"
          style={{ borderColor: BORDER, maxHeight: 'calc(100vh - 64px)' }}
        >
          <Link href="/klight" className="text-xs font-medium mb-6 flex items-center gap-1.5 hover:opacity-80 transition-opacity" style={{ color: ACCENT }}>
            ← klight
          </Link>
          {SIDEBAR.map(group => (
            <div key={group.group} className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#4A6080] mb-2 px-2">{group.group}</p>
              <ul className="space-y-0.5">
                {group.items.map(item => (
                  <li key={item.slug}>
                    <button
                      onClick={() => setActive(item.slug)}
                      className="w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors"
                      style={
                        active === item.slug
                          ? { background: `${ACCENT}18`, color: ACCENT, fontWeight: 600 }
                          : { color: '#8BA3C7' }
                      }
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>

        {/* Mobile section picker */}
        <div className="md:hidden w-full px-4 pt-6">
          <select
            value={active}
            onChange={e => setActive(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm text-white border"
            style={{ background: BG_CARD, borderColor: BORDER }}
          >
            {SIDEBAR.map(group =>
              group.items.map(item => (
                <option key={item.slug} value={item.slug}>{group.group} — {item.label}</option>
              ))
            )}
          </select>
        </div>

        {/* Main content */}
        <article className="flex-1 min-w-0 px-6 md:px-10 lg:px-16 py-10 max-w-3xl">
          {sections[active] ?? (
            <p className="text-[#4A6080]">Section not found.</p>
          )}

          {/* Prev / Next navigation */}
          <div className="mt-16 pt-8 border-t flex justify-between gap-4" style={{ borderColor: BORDER }}>
            {(() => {
              const flat = SIDEBAR.flatMap(g => g.items)
              const idx = flat.findIndex(i => i.slug === active)
              const prev = flat[idx - 1]
              const next = flat[idx + 1]
              return (
                <>
                  {prev ? (
                    <button onClick={() => setActive(prev.slug)} className="text-sm text-[#8BA3C7] hover:text-white transition-colors flex items-center gap-1">
                      ← {prev.label}
                    </button>
                  ) : <span />}
                  {next ? (
                    <button onClick={() => setActive(next.slug)} className="text-sm font-medium transition-colors flex items-center gap-1 hover:opacity-80" style={{ color: ACCENT }}>
                      {next.label} →
                    </button>
                  ) : (
                    <Link href="/klight" className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: ACCENT }}>
                      Back to klight →
                    </Link>
                  )}
                </>
              )
            })()}
          </div>
        </article>
      </div>

      <Footer showSuiteLink accent={ACCENT} />
    </main>
  )
}
