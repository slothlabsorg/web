'use client'

import { useState } from 'react'
import Link from 'next/link'
import ProductNavbar from '@/components/ProductNavbar'
import Footer from '@/components/Footer'
import CustomCursor from '@/components/CustomCursor'

const ACCENT = '#4F8CFF'
const ACCENT2 = '#22D3EE'
const BG_BASE = '#050d1f'
const BG_CARD = '#0d1b3e'
const BORDER = '#1a3060'
const REPO = 'https://github.com/slothlabsorg/runtime-orbit'

// ── Sidebar ───────────────────────────────────────────────────────────────────
const SIDEBAR: { group: string; items: { slug: string; label: string }[] }[] = [
  {
    group: 'Getting started',
    items: [
      { slug: 'overview', label: 'Overview' },
      { slug: 'install', label: 'Install' },
      { slug: 'quick-start', label: 'Quick start' },
    ],
  },
  {
    group: 'The two roles',
    items: [
      { slug: 'donor', label: 'Donor setup' },
      { slug: 'borrower', label: 'Borrower setup' },
      { slug: 'authorization', label: 'Authorization & pairing' },
      { slug: 'engines', label: 'Supported runtimes' },
    ],
  },
  {
    group: 'Everyday use',
    items: [
      { slug: 'delegate', label: 'up / down' },
      { slug: 'dashboard', label: 'Dashboard' },
      { slug: 'ports', label: 'Port forwarding' },
      { slug: 'doctor', label: 'doctor & status' },
      { slug: 'service', label: 'Run as a service' },
      { slug: 'logs', label: 'Logs & verbose' },
    ],
  },
  {
    group: 'Routing',
    items: [
      { slug: 'limits', label: 'RAM budgets' },
      { slug: 'routes', label: 'Routing table' },
    ],
  },
  {
    group: 'Reference',
    items: [
      { slug: 'cli', label: 'CLI reference' },
      { slug: 'config', label: 'Config & files' },
      { slug: 'how', label: 'How it works' },
    ],
  },
  {
    group: 'AI / MCP',
    items: [{ slug: 'mcp', label: 'MCP server' }],
  },
  {
    group: 'Project',
    items: [
      { slug: 'upgrading', label: 'Upgrading from container-orbit' },
      { slug: 'troubleshooting', label: 'Troubleshooting' },
      { slug: 'roadmap', label: 'Roadmap' },
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
      <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ background: '#071020', borderColor: BORDER }}>
        <span className="text-xs font-mono text-[#4A6080]">{filename}</span>
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

/** A monospace diagram. Rendered as-is, so it reads the same here as in a terminal. */
function Diagram({ children, caption }: { children: string; caption?: string }) {
  return (
    <figure className="my-6">
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: BORDER, background: '#060d1e' }}>
        <pre className="px-4 py-5 overflow-x-auto text-[12.5px] leading-[1.55] font-mono" style={{ color: '#8BA3C7' }}>
          <code>{children}</code>
        </pre>
      </div>
      {caption && <figcaption className="text-xs text-[#4A6080] mt-2 px-1">{caption}</figcaption>}
    </figure>
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

// A small flag/arg table.
function FlagTable({ rows }: { rows: [string, string][] }) {
  return (
    <div className="my-5 overflow-x-auto rounded-xl border" style={{ borderColor: BORDER }}>
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([flag, desc], i) => (
            <tr key={flag} style={{ background: i % 2 === 0 ? '#071020' : BG_BASE }}>
              <td className="px-4 py-2.5 font-mono text-[13px] whitespace-nowrap align-top" style={{ color: ACCENT }}>{flag}</td>
              <td className="px-4 py-2.5 text-[#8BA3C7]">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Two-column "which machine am I on" badge. */
function Role({ kind }: { kind: 'borrower' | 'donor' | 'both' }) {
  const color = kind === 'donor' ? ACCENT2 : kind === 'both' ? '#B4FF3C' : ACCENT
  const label = kind === 'borrower' ? 'run on the borrower' : kind === 'donor' ? 'run on the donor' : 'either machine'
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border mb-4" style={{ color, borderColor: `${color}45`, background: `${color}12` }}>
      {label}
    </span>
  )
}

// ── Sections ──────────────────────────────────────────────────────────────────
function buildSections(): Record<string, React.ReactNode> {
  return {
    overview: (
      <>
        <H>runtime-orbit</H>
        <P>
          Docker on a laptop is expensive. A Linux VM, a few containers, a build cache, and
          you&apos;ve spent 8 GB and half your CPU before your editor opens. Meanwhile there&apos;s a
          machine two metres away with 64 GB doing nothing.
        </P>
        <P>
          <strong className="text-white">runtime-orbit</strong> points this machine&apos;s{' '}
          <C>docker</C> at that machine&apos;s container runtime over SSH. Heavy{' '}
          <C>docker build</C>, <C>docker run</C> and <C>docker compose</C> execute over there —
          using its RAM, CPU and disk — while published container ports are forwarded straight back
          to your <C>localhost</C>, so it feels like Docker never left.
        </P>

        <Diagram caption="Your workflow doesn't change. The compute moves.">{`┌─ borrower — your laptop (16 GB) ─┐        ┌─ donor — the beefy one (64 GB) ─┐
│  docker CLI                     │        │  Docker / OrbStack / Podman     │
│  localhost:8080  ◄──────────────┼─ ssh ──┼─►  nginx container :8080        │
│  mostly yours again             │        │  doing the actual work          │
└─────────────────────────────────┘        └─────────────────────────────────┘`}</Diagram>

        <H3>Two roles</H3>
        <ul className="mb-4">
          <Li><strong className="text-white">borrower</strong> — the machine that&apos;s low on RAM. Your laptop. It needs the <C>docker</C> CLI and nothing else. All the unprefixed commands run here.</Li>
          <Li><strong className="text-white">donor</strong> — the machine lending its runtime: another Mac, a gaming PC, a Linux box. Its commands live under <C>runtime-orbit donor …</C> (<C>donator</C> and <C>lender</C> also work).</Li>
        </ul>

        <Callout type="info">
          runtime-orbit manages a standard <C>docker context</C> — it does <em>not</em> wrap the{' '}
          <C>docker</C> binary — so <C>docker</C>, <C>docker compose</C>, Testcontainers, IDE
          integrations and everything else that respects <C>DOCKER_HOST</C> work unchanged.
        </Callout>

        <H3>What it isn&apos;t</H3>
        <P>
          Not a code-sync tool, not a Kubernetes replacement, not a <C>docker</C> wrapper. Your
          source stays where it is — bind-mount paths resolve on the donor, which is worth
          knowing (see <em>Troubleshooting</em>).
        </P>
      </>
    ),

    install: (
      <>
        <H>Install</H>
        <Role kind="both" />
        <P>
          Install on <strong className="text-white">both</strong> machines — it&apos;s the same
          binary for both roles.
        </P>

        <H3>macOS &amp; Linux</H3>
        <CodeBlock code={`curl -fsSL https://slothlabs.org/install/runtime-orbit | sh`} />

        <H3>Homebrew</H3>
        <CodeBlock code={`brew install slothlabsorg/tap/runtime-orbit`} />

        <H3>Windows (PowerShell)</H3>
        <CodeBlock filename="powershell" code={`irm https://slothlabs.org/install/runtime-orbit.ps1 | iex`} />

        <H3>From source</H3>
        <P>Needs Rust 1.75 or newer.</P>
        <CodeBlock code={`git clone ${REPO}
cd runtime-orbit && cargo install --path .`} />

        <H3>Prebuilt binaries</H3>
        <P>
          Every release ships archives for macOS (Apple Silicon + Intel), Linux (x86_64 + arm64)
          and Windows, each with a <C>.sha256</C>. Grab them from the{' '}
          <a href={`${REPO}/releases/latest`} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: ACCENT }}>releases page</a>.
        </P>

        <Callout type="success">
          Every install route also creates <C>r-orbit</C> and <C>orbit</C> as shortcuts, so{' '}
          <C>r-orbit dashboard</C> works and anyone upgrading from container-orbit keeps their
          muscle memory.
        </Callout>

        <H3>Verify</H3>
        <CodeBlock code={`runtime-orbit --version
runtime-orbit --help`} />
      </>
    ),

    'quick-start': (
      <>
        <H>Quick start</H>
        <P>Two commands, one per machine. About two minutes.</P>

        <H3>1. On the donor — the machine with the RAM</H3>
        <Role kind="donor" />
        <CodeBlock code={`runtime-orbit donor setup`} />
        <P>
          It finds the container runtime, offers to switch on the SSH server and stop the machine
          sleeping (both ask for your admin password right there), and prints the exact command for
          the other machine with this one&apos;s IP already filled in.
        </P>

        <H3>2. On the borrower — the machine that needs help</H3>
        <Role kind="borrower" />
        <CodeBlock code={`runtime-orbit setup --ip 192.168.1.20`} />
        <P>
          Omit <C>--ip</C> to scan the LAN and pick from a list. Either way it authorizes this
          machine on the donor, detects the donor&apos;s runtime socket, creates the docker context,
          brings the connection up, and proves it works by running nginx on the donor and curling it
          through your own localhost.
        </P>

        <Diagram caption="What `runtime-orbit setup` does, in order.">{`  authorize ──► link ──► up ──► self-test
      │            │        │         │
      │            │        │         └─ nginx on the donor, curl on localhost
      │            │        └─ docker context + SSH master + port forwarder
      │            └─ detect the donor's runtime socket, save config
      └─ password once, or a 6-digit pairing code — all in-app`}</Diagram>

        <H3>3. Use docker normally</H3>
        <CodeBlock code={`docker compose up -d
docker build -t api:dev .
curl localhost:8080

runtime-orbit dashboard    # watch both machines
runtime-orbit down         # back to local docker`} />

        <Callout type="info">
          You can set your RAM budgets in the same breath:{' '}
          <C>runtime-orbit setup --ip 192.168.1.20 --max-ram 32 --local-ram-threshold 5</C>. See{' '}
          <em>RAM budgets</em>.
        </Callout>
      </>
    ),

    donor: (
      <>
        <H>Donor setup</H>
        <Role kind="donor" />
        <P>
          The donor is the machine lending its container runtime. It needs three things and nothing
          else: a runtime that&apos;s running, an SSH server that accepts the borrower&apos;s key,
          and the discipline not to fall asleep mid-build.
        </P>

        <CodeBlock code={`runtime-orbit donor setup`} />
        <P>Which will:</P>
        <ul className="mb-4">
          <Li>find the container runtime and its socket;</Li>
          <Li>check the SSH server, and <strong className="text-white">offer to turn it on</strong> — it asks for your admin password there and then, no separate terminal and no trip through System Settings;</Li>
          <Li>check whether the machine sleeps, and <strong className="text-white">offer to stop it</strong>;</Li>
          <Li>show any pairing requests waiting for approval;</Li>
          <Li>print the borrower&apos;s command with this machine&apos;s IP already in it.</Li>
        </ul>

        <Callout type="warn">
          A sleeping donor is the single most common way an overnight build dies. If you skip the
          offer, the manual form on macOS is{' '}
          <C>sudo pmset -a sleep 0 disablesleep 1</C>.
        </Callout>

        <H3>Checking on it</H3>
        <CodeBlock code={`runtime-orbit donor doctor` } />
        <CodeBlock filename="output" code={`runtime-orbit donor doctor
  [✓] Runtime: OrbStack (/var/run/docker.sock)
  [✓] Runtime API answers (engine 27.4.0)
  [✓] SSH server is listening on port 22
  [✓] 1 runtime-orbit key(s) authorized in ~/.ssh/authorized_keys
  [✓] LAN address: 192.168.1.20
  [✓] Resources: 16 cores · 64.0 GiB RAM (52.1 GiB free) — plenty to lend
  [✓] Sleep settings won't interrupt a borrow

• No issues found! This machine is ready to lend.`} />

        <H3>What it&apos;s lending right now</H3>
        <CodeBlock code={`runtime-orbit donor status`} />
        <P>
          Shows this machine&apos;s vitals, the runtime in use, how many borrowers are authorized,
          which are <em>connected</em> right now, and the containers currently running here — which
          is the RAM somebody else isn&apos;t spending.
        </P>

        <H3>Flags</H3>
        <FlagTable rows={[
          ['--iphost <IP>', "The borrower's IP. Used to tailor the printed instructions and to pin an authorized key to that address."],
          ['--allow <PUBKEY>', 'Authorize a public key while setting up, equivalent to `donor allow`.'],
          ['--yes, -y', 'Accept every offer without prompting (enable SSH, stop sleep, approve pending keys).'],
        ]} />
      </>
    ),

    borrower: (
      <>
        <H>Borrower setup</H>
        <Role kind="borrower" />
        <P>
          The borrower is the machine that&apos;s short on RAM. It needs the <C>docker</C> CLI, and
          no engine at all — that&apos;s the point.
        </P>

        <CodeBlock code={`# with the donor's address
runtime-orbit setup --ip 192.168.1.20

# or scan the LAN and pick from a list
runtime-orbit setup

# positional form works too
runtime-orbit setup 192.168.1.20`} />

        <H3>Flags</H3>
        <FlagTable rows={[
          ['--ip <ADDRESS>', "The donor's IP or hostname. Also accepted as a positional argument. Omit to scan the LAN."],
          ['--user <USER>', 'SSH user on the donor. Defaults to your current username.'],
          ['--port <PORT>', 'SSH port on the donor. Default 22.'],
          ['--max-ram <GB>', "Cap how much of the donor's RAM you'll lean on. Same as `limits set --max-ram`."],
          ['--local-ram-threshold <GB>', 'Keep work local until this much local RAM is in use, then route to the donor.'],
          ['--yes, -y', "Don't prompt; accept detected defaults. Needs --ip, and uses the pairing route since a password prompt needs a human."],
          ['--no-test', 'Skip the end-to-end nginx self-test at the end.'],
        ]} />

        <H3>What gets created</H3>
        <ul className="mb-4">
          <Li>an ed25519 key pair at <C>~/.runtime-orbit/keys/</C>, on first run only;</Li>
          <Li>a docker context named <C>runtime-orbit</C>, pointing at the forwarded socket;</Li>
          <Li><C>~/.runtime-orbit/config.toml</C> with the link, your budgets and the routing table.</Li>
        </ul>
        <P>
          Everything is idempotent. Re-running <C>setup</C> after the donor changes IP, or after you
          switch its runtime, is the intended way to fix it.
        </P>

        <H3>Low-level linking</H3>
        <P>
          <C>setup</C> is <C>link</C> plus authorization, <C>up</C> and a self-test. When you only
          need to re-point at a moved socket:
        </P>
        <CodeBlock code={`runtime-orbit link dany@192.168.1.20
runtime-orbit link dany@192.168.1.20 --socket /var/run/docker.sock`} />
      </>
    ),

    authorization: (
      <>
        <H>Authorization &amp; pairing</H>
        <P>
          Everything happens inside runtime-orbit. You never edit <C>authorized_keys</C>, and you
          never run <C>ssh-copy-id</C>.
        </P>
        <P>
          The borrower generates an ed25519 key on first run, then takes one of two routes —{' '}
          <C>setup</C> asks which.
        </P>

        <Diagram caption="Both routes are in-app. Neither needs you to copy anything by hand.">{`  BORROWER                                        DONOR
  runtime-orbit setup --ip 192.168.1.20

  ┌─ Route 1 · password once ──────────────────────────────────────────┐
  │  ssh with your terminal attached                                   │
  │  ──────────────────────────────────────►  password prompt appears  │
  │                                           inside setup             │
  │  we append the key + fix permissions ──►  ~/.ssh/authorized_keys   │
  │  and record the request           ──────►  ~/.runtime-orbit/inbox/ │
  └────────────────────────────────────────────────────────────────────┘

  ┌─ Route 2 · pairing, no password ───────────────────────────────────┐
  │  open a one-shot listener                                         │
  │  show code:  4 8 2 9 1 3                                          │
  │                                    runtime-orbit donor pair <ip>  │
  │  ◄──────────────────────────────── connect + present the code     │
  │  public key ─────────────────────►  appended, pinned to           │
  │                                     from="borrower-ip"            │
  └────────────────────────────────────────────────────────────────────┘

  verify key auth works ──────────────────────────────────────────────►`}</Diagram>

        <H3>Route 1 — the donor&apos;s password, once</H3>
        <P>
          runtime-orbit opens the SSH session with your terminal attached, so OpenSSH&apos;s password
          prompt appears inside the running command. It then does the <C>authorized_keys</C> edit
          itself, fixes the directory permissions, and drops a copy of the key in{' '}
          <C>~/.runtime-orbit/inbox/</C> on the donor as a record of who asked.
        </P>

        <H3>Route 2 — pairing, no password at all</H3>
        <P>For donors with password login disabled.</P>
        <CodeBlock code={`# on the borrower (or just pick this route inside setup)
runtime-orbit pair

# on the donor
runtime-orbit donor pair 192.168.1.8`} />
        <P>
          The borrower shows a 6-digit code; the donor is prompted for it, pulls the key over the
          LAN, and authorizes it with a <C>from=&quot;&lt;borrower-ip&gt;&quot;</C> restriction, so
          the key is useless from anywhere else.
        </P>
        <Callout type="info">
          The code is a pairing nonce, not a long-lived secret: it&apos;s accepted once, the port is
          only open while you&apos;re pairing (10 minutes by default), and wrong codes are refused
          and reported on screen.
        </Callout>

        <H3>Reviewing requests later</H3>
        <CodeBlock code={`runtime-orbit donor pending        # list, marking which are already authorized
runtime-orbit donor pending --yes  # approve everything waiting`} />

        <H3>Authorizing a key directly</H3>
        <CodeBlock code={`runtime-orbit donor allow "ssh-ed25519 AAAA… runtime-orbit"
runtime-orbit donor allow "ssh-ed25519 AAAA… runtime-orbit" --iphost 192.168.1.8`} />
        <P>
          Idempotent, and re-running with a different <C>--iphost</C> replaces the entry rather than
          stacking duplicates.
        </P>

        <H3>Where sudo comes in</H3>
        <P>
          Authorizing a key never needs it — <C>authorized_keys</C> is in your own home directory.
          Turning <em>on</em> the SSH server and disabling sleep do, and{' '}
          <C>runtime-orbit donor setup</C> asks for your admin password at that moment, for those two
          actions only.
        </P>
      </>
    ),

    engines: (
      <>
        <H>Supported runtimes</H>
        <Role kind="both" />
        <P>
          Anything that speaks the Docker Engine API over a unix socket works, on either side.
          runtime-orbit probes for all of these and tells you which one it picked.
        </P>

        <div className="my-5 overflow-x-auto rounded-xl border" style={{ borderColor: BORDER }}>
          <table className="w-full text-sm">
            <tbody>
              {[
                ['Docker Desktop', '/var/run/docker.sock, ~/.docker/run/docker.sock'],
                ['OrbStack', '~/.orbstack/run/docker.sock'],
                ['Rancher Desktop', '~/.rd/docker.sock'],
                ['colima', '~/.colima/default/docker.sock'],
                ['Lima', '~/.lima/default/sock/docker.sock'],
                ['Podman', '~/.local/share/containers/podman/machine/podman.sock, /run/podman/podman.sock'],
                ['containerd', '/run/containerd/containerd.sock'],
                ['dockerd (Linux)', '/var/run/docker.sock, /run/docker.sock'],
              ].map(([name, path], i) => (
                <tr key={name} style={{ background: i % 2 === 0 ? '#071020' : BG_BASE }}>
                  <td className="px-4 py-2.5 whitespace-nowrap align-top font-semibold text-white">{name}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-[#8BA3C7]">{path}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <CodeBlock code={`runtime-orbit engines`} />
        <CodeBlock filename="output" code={`runtime-orbit engines
  THIS MACHINE
  → Docker Desktop                 /var/run/docker.sock
  CLIs found:     docker, kubectl, minikube

  DONOR dany@192.168.1.20
  → OrbStack                       /var/run/docker.sock (in use)
    Podman                         /run/podman/podman.sock
  CLIs found:     docker, orb, podman`} />

        <P>
          <C>/var/run/docker.sock</C> is preferred when present, because most engines symlink it and
          it&apos;s the most portable choice. Symlinks are resolved, so one engine is never listed
          twice, and the generic path is labelled with the product actually behind it.
        </P>

        <Callout type="info">
          Kubernetes is a different layer and out of scope: runtime-orbit moves your{' '}
          <em>container runtime</em>, so a local cluster&apos;s containers land on the donor if its
          runtime is the one you borrowed.
        </Callout>
      </>
    ),

    delegate: (
      <>
        <H>up / down</H>
        <Role kind="borrower" />
        <CodeBlock code={`runtime-orbit up          # route docker to the donor (detached)
runtime-orbit up --foreground   # stay attached, with a live header + logs
runtime-orbit down        # back to this machine's engine`} />
        <P>
          <C>up</C> switches the docker context, opens the multiplexed SSH connection, and starts the
          port forwarder in the background. <C>down</C> reverses all three and restores whichever
          context you were on before.
        </P>
        <Callout type="info">
          <C>down</C> refuses to restore into a context runtime-orbit manages — its socket is the
          tunnel that was just torn down — and falls back to <C>default</C> if the saved one is gone.
        </Callout>

        <H3>Is it working?</H3>
        <CodeBlock code={`docker context show        # → runtime-orbit
docker info | head          # the donor's engine
runtime-orbit status`} />
      </>
    ),

    dashboard: (
      <>
        <H>Dashboard</H>
        <Role kind="borrower" />
        <CodeBlock code={`runtime-orbit dashboard          # live, refreshing every 2s
runtime-orbit dashboard -n 5     # every 5s
runtime-orbit dashboard --once   # one frame and exit
runtime-orbit dashboard --json   # machine-readable snapshot`} />

        <CodeBlock filename="runtime-orbit dashboard" code={`runtime-orbit  borrowing   14:32:07

  THIS MACHINE                          DONOR
  macbook-dany                          dany@192.168.1.20
  macOS 26.2 · arm64                    macOS 15.4 · arm64
  192.168.1.8 · 10 cores                192.168.1.20 · 16 cores
  RAM ███░░░░░░░  31%  7.4/24.0 GB      RAM ██░░░░░░░░  18%  11.8/64.0 GB
  load 1.82 · up 3 days                 load 0.44 · up 12 days
  engine Docker Desktop                 engine OrbStack · 27.4.0

  ROUTING
  docker context     runtime-orbit → donor
  ssh                dany@192.168.1.20:22 · master up · forwarder up
  ports              localhost:8080  localhost:5432

  BORROWED RIGHT NOW
  carried by donor   8.4 GiB · 212% CPU · 6 container(s)
  on this machine    0 container(s)

  CONTAINER              IMAGE                          CPU        MEM     PORTS
  api                    acme/api:dev                 42.1%    1.2 GiB      8080
  postgres               postgres:16                   3.4%    0.8 GiB      5432
  redis                  redis:7                       0.9%    0.1 GiB          —

  TRAFFIC
  containers         ↓ 1.2 MB/s   ↑ 340 kB/s   (1.4 GB in / 220 MB out total)
  donor network      ↓ 4.1 MB/s   ↑ 900 kB/s

  BUDGETS
  borrow ceiling     ████░░░░░░░░░░░░  26%  8.4 / 32.0 GB
  local RAM budget   ███████████████░  94%  4.7 / 5.0 GB  new work stays here
  prefer             auto

  → 8.4 GiB of RAM and 212% CPU are on 192.168.1.20 instead of here ♥

  Ctrl-C to exit · refreshing every 2s`} />

        <H3>What&apos;s on screen</H3>
        <ul className="mb-4">
          <Li><strong className="text-white">Both machines</strong> — hostname, OS and architecture, LAN IP, cores, a RAM meter, load average, uptime, and the runtime each is using.</Li>
          <Li><strong className="text-white">Routing</strong> — the active docker context and whether it points at the donor, the SSH master and forwarder state, every forwarded port.</Li>
          <Li><strong className="text-white">Borrowed right now</strong> — RAM and CPU the donor is carrying for you, and containers on each machine.</Li>
          <Li><strong className="text-white">Containers on the donor</strong> — name, image, CPU%, memory, published ports.</Li>
          <Li><strong className="text-white">Traffic</strong> — container network rates and totals, plus the donor&apos;s own NIC throughput, computed as deltas between refreshes.</Li>
          <Li><strong className="text-white">Budgets</strong> — meters for your borrow ceiling and local budget, and whether new work would stay here or go over.</Li>
        </ul>

        <Callout type="success">
          <C>--json</C> returns all of it structured — both machines&apos; vitals, the connection,
          every container with its stats, the forwarded ports and your limits. It&apos;s what the MCP
          server uses, and what you should script against.
        </Callout>
      </>
    ),

    ports: (
      <>
        <H>Port forwarding</H>
        <Role kind="borrower" />
        <P>
          This is the part that makes a remote runtime feel local. Published ports are forwarded
          automatically as containers come and go — no manual <C>-L</C> juggling.
        </P>
        <CodeBlock code={`docker run -d -p 8080:80 nginx    # localhost:8080 works immediately
curl localhost:8080
runtime-orbit ports               # list what's forwarded`} />

        <Diagram caption="The reconciler keeps SSH tunnels in sync with reality.">{`  docker run -d -p 8080:80 nginx
        │
        ▼
  donor runtime  ──── event: start ───►  port forwarder
                                              │
                                              ├─ list published ports
                                              └─ ssh -O forward -L 8080:127.0.0.1:8080
                                                       │
  curl localhost:8080  ◄───────────────────────────────┘

  docker rm -f nginx
        │
  donor runtime  ──── event: die  ────►  ssh -O cancel -L 8080`}</Diagram>

        <H3>Ports that aren&apos;t docker&apos;s</H3>
        <P>For a dev server running natively on the donor:</P>
        <CodeBlock code={`runtime-orbit ports add 3000
runtime-orbit ports rm 3000`} />

        <Callout type="warn">
          If a port is already in use here, the tunnel can&apos;t bind. The forwarder logs it rather
          than failing silently — check <C>runtime-orbit logs</C>.
        </Callout>
      </>
    ),

    doctor: (
      <>
        <H>doctor &amp; status</H>
        <P>
          There are two doctors, one per role, and between them they check every link in the chain.
          Every line comes with the fix.
        </P>

        <H3>On the borrower</H3>
        <Role kind="borrower" />
        <CodeBlock code={`runtime-orbit doctor`} />
        <CodeBlock filename="output" code={`runtime-orbit doctor
  Checking this machine's ability to borrow a runtime.

  [✓] Docker CLI (28.5.0)
  [✓] Linked to donor dany@192.168.1.20
  [✓] SSH to the donor works
  [✓] Donor runtime reachable — OrbStack (/var/run/docker.sock)
  [✓] Connection up — the forwarded socket responds
  [✓] Docker is routed to the donor

  ◇ donor has 16 cores · 64.0 GiB · 84 images · 6 running

• No issues found! runtime-orbit is ready — docker runs on dany@192.168.1.20`} />
        <P>
          When the donor&apos;s socket has moved, it doesn&apos;t just say &quot;not found&quot; — it
          names the socket the donor <em>does</em> have now and gives you the command to adopt it.
        </P>

        <H3>On the donor</H3>
        <Role kind="donor" />
        <CodeBlock code={`runtime-orbit donor doctor`} />
        <P>
          Checks the runtime, the API, the SSH listener, authorized borrowers, whether the machine is
          actually worth lending from, and whether it will fall asleep.
        </P>

        <H3>status</H3>
        <CodeBlock code={`runtime-orbit status`} />
        <P>
          A one-shot summary: the link, the docker context, SSH master and forwarder state, the
          donor&apos;s engine details, and the forwarded ports. For anything live, use{' '}
          <C>dashboard</C>.
        </P>
      </>
    ),

    service: (
      <>
        <H>Run as a service</H>
        <Role kind="borrower" />
        <P>So a reboot doesn&apos;t cost you your setup.</P>
        <CodeBlock code={`runtime-orbit service install
runtime-orbit service status
runtime-orbit service uninstall`} />
        <FlagTable rows={[
          ['macOS', 'A launchd LaunchAgent at ~/Library/LaunchAgents/org.slothlabs.runtime-orbit.plist'],
          ['Linux', 'A systemd --user unit at ~/.config/systemd/user/runtime-orbit.service'],
          ['Windows', 'Prints the schtasks one-liner to run at logon'],
        ]} />
        <P>
          The service keeps <C>up</C> running and reconnects if the donor reboots or the network
          drops. Worth pairing with the donor&apos;s sleep fix on the other side.
        </P>
        <Callout type="info">
          Login services get a minimal <C>PATH</C>, so the generated unit sets one that includes
          Homebrew, OrbStack and Docker&apos;s own bin directories — runtime-orbit shells out to{' '}
          <C>docker</C> and <C>ssh</C>.
        </Callout>
      </>
    ),

    logs: (
      <>
        <H>Logs &amp; verbose</H>
        <Role kind="borrower" />
        <CodeBlock code={`runtime-orbit logs           # last 200 lines
runtime-orbit logs -f        # follow
runtime-orbit logs -n 1000   # more history`} />
        <P>The detached forwarder writes to <C>~/.runtime-orbit/run/runtime-orbit.log</C>.</P>

        <H3>Verbose mode</H3>
        <P>Any command takes <C>-v</C>, and it&apos;s the fastest way to see what&apos;s really happening:</P>
        <FlagTable rows={[
          ['-v', 'info — the significant steps'],
          ['-vv', 'debug — every ssh invocation and context switch'],
          ['-vvv', 'trace — full argument vectors and every forward decision'],
          ['--log-file <PATH>', 'also append logs to a file'],
        ]} />
        <CodeBlock code={`runtime-orbit -vv up
runtime-orbit -vvv doctor --log-file /tmp/orbit.log`} />
      </>
    ),

    limits: (
      <>
        <H>RAM budgets</H>
        <Role kind="borrower" />
        <P>
          By default <C>up</C> delegates everything, which is usually what you want. Budgets exist
          for when it isn&apos;t: a 20 MB alpine container isn&apos;t worth a network hop, and you
          may not want to lean on the whole donor.
        </P>

        <CodeBlock code={`runtime-orbit limits show
runtime-orbit limits set --max-ram 32 --local-ram-threshold 5
runtime-orbit limits set --local-load-threshold 4 --prefer auto
runtime-orbit limits set --max-ram off      # remove a limit`} />

        <FlagTable rows={[
          ['--max-ram <GB>', "Never lean on more than this much donor RAM. Past it, work stays local — a ceiling you can't exceed is the only kind worth having."],
          ['--local-ram-threshold <GB>', 'Use this machine until this much of its RAM is in use, then send new work to the donor.'],
          ['--local-load-threshold <LOAD>', 'The same idea for CPU load average.'],
          ['--prefer auto|local|donor', 'The tiebreak when nothing else decides. auto delegates when no budget is set, and keeps work local when a budget is set but untripped.'],
        ]} />

        <CodeBlock filename="runtime-orbit limits show" code={`runtime-orbit limits
  max borrowed RAM   ████░░░░░░░░░░░░░░  26%  8.4 / 32.0 GB
  local RAM budget   █████████████████░  94%  4.7 / 5.0 GB · under budget, new work stays here
  local load budget  not set
  prefer             auto
  routing rules      2 — \`runtime-orbit route list\`

Right now
  next container → local (under the local budget (4.7 GB in use) — no need to borrow yet)`} />

        <Callout type="warn">
          A budget above this machine&apos;s total RAM can never trip, so nothing would ever route
          away. <C>limits set</C> and <C>doctor</C> both call that out rather than leaving it looking
          active.
        </Callout>
      </>
    ),

    routes: (
      <>
        <H>Routing table</H>
        <Role kind="borrower" />
        <P>
          Rules that decide, per workload, whether something runs here or on the donor. For the
          database whose disk latency you care about, or the container that talks to a USB device.
        </P>

        <CodeBlock code={`runtime-orbit route add 'postgres:*' --target local --note 'disk latency'
runtime-orbit route add '*redis*'    --target local
runtime-orbit route add '*'          --target donor
runtime-orbit route list
runtime-orbit route rm 2`} />

        <CodeBlock filename="runtime-orbit route list" code={`routing table
  #    PATTERN                      TARGET   NOTE
  1    postgres:*                   local    disk latency
  2    *redis*                      local
  3    *                            donor

  First match wins. Anything unmatched falls through to \`runtime-orbit limits\`.`} />

        <P>
          Patterns are globs (<C>*</C>, <C>?</C>, case-insensitive) matched against the image
          reference and the container name. First match wins, so add specific rules first —{' '}
          <C>route add</C> warns you when a new rule is shadowed by an existing one and could never
          fire.
        </P>

        <H3>The order of decisions</H3>
        <Diagram caption="First thing that decides, wins.">{`  docker run postgres:16
        │
        ▼
  ┌─────────────────────┐  matched
  │  1. routing table   ├──────────►  that rule's target
  └──────────┬──────────┘
             │ no rule
             ▼
  ┌─────────────────────┐  under budget
  │  2. local budget    ├──────────►  local  (not worth a hop yet)
  └──────────┬──────────┘
             │ tripped
             ▼
  ┌─────────────────────┐  ceiling hit
  │  3. borrow ceiling  ├──────────►  local  (a cap is a cap)
  └──────────┬──────────┘
             │ room to borrow
             ▼
  ┌─────────────────────┐
  │  4. prefer          ├──────────►  donor
  └─────────────────────┘`}</Diagram>

        <H3>Using it</H3>
        <CodeBlock code={`runtime-orbit route explain postgres:16
runtime-orbit docker run -d postgres:16     # → local
runtime-orbit docker build -t api:dev .     # → donor`} />
        <CodeBlock filename="output" code={`runtime-orbit route explain
  workload   postgres:16
  runs on    local (this machine)
  because    rule #1 \`postgres:*\` → local (disk latency)
  matched rule #1 — see \`runtime-orbit route list\``} />

        <P>
          <C>runtime-orbit docker …</C> picks the context and execs the real <C>docker</C>, passing
          its exit code straight through so <C>&amp;&amp;</C> chains and CI behave. Plain{' '}
          <C>docker</C> is untouched and always follows whatever context is active.
        </P>
      </>
    ),

    cli: (
      <>
        <H>CLI reference</H>

        <H3>Borrower</H3>
        <CodeBlock filename="borrower" code={`runtime-orbit setup [ADDRESS] [--ip ADDRESS] [--user U] [--port 22]
                    [--max-ram GB] [--local-ram-threshold GB] [--yes] [--no-test]
runtime-orbit doctor
runtime-orbit up [--foreground]
runtime-orbit down
runtime-orbit status
runtime-orbit dashboard [-n SECS] [--once] [--json]
runtime-orbit ports [add PORT | rm PORT]
runtime-orbit engines
runtime-orbit logs [-f] [-n LINES]
runtime-orbit service install | uninstall | status
runtime-orbit pair [--port PORT] [--minutes N]
runtime-orbit link USER@HOST [--port 22] [--socket PATH]`} />

        <H3>Donor</H3>
        <P><C>donator</C> and <C>lender</C> are accepted as aliases for <C>donor</C>.</P>
        <CodeBlock filename="donor" code={`runtime-orbit donor setup [--iphost IP] [--allow PUBKEY] [--yes]
runtime-orbit donor doctor
runtime-orbit donor status
runtime-orbit donor pair BORROWER_IP [--code CODE] [--port PORT]
runtime-orbit donor pending [--yes]
runtime-orbit donor allow PUBKEY [--iphost IP]`} />

        <H3>Routing</H3>
        <CodeBlock filename="routing" code={`runtime-orbit limits show
runtime-orbit limits set [--max-ram GB|off] [--local-ram-threshold GB|off]
                         [--local-load-threshold LOAD|off] [--prefer auto|local|donor]
runtime-orbit route list
runtime-orbit route add PATTERN --target local|donor [--note TEXT]
runtime-orbit route rm N
runtime-orbit route explain IMAGE
runtime-orbit docker ARGS...`} />

        <H3>Other</H3>
        <CodeBlock filename="other" code={`runtime-orbit mcp        # MCP server over stdio
runtime-orbit funding    # it's free; here's where to chip in`} />

        <H3>Global flags</H3>
        <FlagTable rows={[
          ['-v, -vv, -vvv', 'Verbosity: info / debug / trace'],
          ['--log-file <PATH>', 'Also write logs to a file'],
          ['-h, --help', 'Help for any command or subcommand'],
          ['-V, --version', 'Version'],
        ]} />

        <Callout type="info">
          <C>r-orbit</C> and <C>orbit</C> are installed as shortcuts for <C>runtime-orbit</C>, so
          every command above works with either.
        </Callout>
      </>
    ),

    config: (
      <>
        <H>Config &amp; files</H>
        <P>Everything lives in <C>~/.runtime-orbit</C>.</P>
        <CodeBlock filename="~/.runtime-orbit" code={`~/.runtime-orbit/
├── config.toml                    # the link, budgets, routing table
├── keys/
│   ├── id_orbit_ed25519           # this machine's key
│   └── id_orbit_ed25519.pub
├── inbox/                         # (donor) pairing requests received
└── run/
    ├── docker.sock                # the forwarded socket
    ├── control.sock               # SSH ControlMaster
    ├── runtime-orbit.pid
    └── runtime-orbit.log`} />

        <CodeBlock filename="config.toml" code={`donor_user = "dany"
donor_addr = "192.168.1.20"
ssh_port = 22
adapter = "unix"
remote_socket = "/var/run/docker.sock"
context_name = "runtime-orbit"
previous_context = "desktop-linux"

[limits]
max_borrow_ram_gb = 32.0
local_ram_threshold_gb = 5.0
prefer = "auto"

[[routes]]
pattern = "postgres:*"
target = "local"
note = "disk latency"`} />

        <Callout type="info">
          We use <C>~/.runtime-orbit</C> rather than the platform config directory on purpose:
          macOS&apos;s <C>~/Library/Application Support</C> contains a space, which is hostile to
          unix socket paths in <C>unix://</C> endpoints and <C>ssh -L</C> specs.
        </Callout>

        <H3>Nothing else is touched</H3>
        <P>
          On the borrower: one docker context named <C>runtime-orbit</C>. On the donor: lines
          appended to <C>~/.ssh/authorized_keys</C>, and files in{' '}
          <C>~/.runtime-orbit/inbox/</C>. <C>service install</C> adds one launchd or systemd unit.
          That&apos;s the complete footprint.
        </P>
      </>
    ),

    how: (
      <>
        <H>How it works</H>
        <P>Three moving parts, and nothing else.</P>

        <Diagram caption="One SSH connection carries the runtime socket and every port tunnel.">{`  BORROWER                          │          DONOR
                                    │
  docker CLI                        │
      │                             │
      ▼                             │
  docker context "runtime-orbit"    │
  unix://~/.runtime-orbit/run/…     │
      │                             │
      ▼                             │
  forwarded socket ═══════════════ ssh ════════► /var/run/docker.sock
      ▲            ControlMaster (multiplexed)         │
      │                             │                  ▼
  port forwarder                    │          container runtime
  reads /events                     │            ├─ api      :8080
      │                             │            └─ postgres :5432
      ├─► localhost:8080 ◄══════════╪══════════════════┘
      └─► localhost:5432 ◄══════════╪══════════════════┘`}</Diagram>

        <H3>1. A docker context</H3>
        <P>
          <C>up</C> creates and activates a context whose endpoint is a local unix socket. Because
          it&apos;s a standard context, <C>docker</C>, <C>docker compose</C>, Testcontainers, IDE
          integrations and anything else honouring <C>DOCKER_HOST</C> follow along with no
          configuration.
        </P>
        <Callout type="info">
          We deliberately don&apos;t use <C>ssh://user@host</C> as the endpoint. That makes docker run{' '}
          <C>docker system dial-stdio</C> on the donor, which needs the <C>docker</C> binary on the
          donor&apos;s non-interactive SSH <C>PATH</C> — a common and confusing breakage. Forwarding
          the socket avoids the whole class of problem.
        </Callout>

        <H3>2. One multiplexed SSH connection</H3>
        <P>
          A single <C>ControlMaster</C> connection carries the socket forward and every port tunnel,
          so there&apos;s one authentication and one TCP connection no matter how many ports you
          publish. Keepalives detect a dead donor; teardown closes everything at once.
        </P>

        <H3>3. The port forwarder</H3>
        <P>
          It connects to the donor&apos;s runtime through the forwarded socket, subscribes to the
          container event stream, and reconciles the set of SSH <C>-L</C> tunnels against the set of
          published ports. If the event stream drops — an idle timeout, a socket blip — it
          reconnects with backoff and keeps existing tunnels in place, so a hiccup never interrupts a
          container you&apos;re using.
        </P>

        <H3>Runtime detection</H3>
        <P>
          One POSIX probe, reused verbatim locally and over SSH so the two can&apos;t drift. It emits
          the sockets that exist along with their symlink targets, which is how a generic{' '}
          <C>/var/run/docker.sock</C> gets labelled &quot;OrbStack&quot; and why one engine is never
          listed twice.
        </P>
      </>
    ),

    mcp: (
      <>
        <H>MCP server</H>
        <Role kind="both" />
        <P>
          runtime-orbit ships an MCP (Model Context Protocol) server over stdio, so an AI assistant
          can read the state of both machines and drive the CLI in plain language.
        </P>
        <CodeBlock code={`runtime-orbit mcp`} />

        <H3>Claude Code / Claude Desktop</H3>
        <CodeBlock filename=".mcp.json" code={`{
  "mcpServers": {
    "runtime-orbit": {
      "command": "runtime-orbit",
      "args": ["mcp"]
    }
  }
}`} />

        <H3>The tools</H3>
        <FlagTable rows={[
          ['dashboard', 'The full JSON snapshot: both machines, connection, containers with stats, ports, budgets'],
          ['status / doctor', 'Summary and diagnosis, with fixes'],
          ['up / down', 'Start and stop routing docker to the donor'],
          ['engines', 'Runtimes on each machine and the socket in use'],
          ['list_forwards / add_forward / remove_forward', 'Port tunnels'],
          ['limits_show / limits_set', 'RAM budgets'],
          ['route_list / route_add / route_explain', 'The routing table'],
          ['donor_status / donor_doctor', 'When running on a donor'],
          ['link', 'Link to a donor that already trusts this machine'],
          ['setup_hint', 'The exact command for interactive first-time setup'],
        ]} />

        <Callout type="warn">
          First-time setup isn&apos;t proxied: it may need a password or show a pairing code, so{' '}
          <C>setup_hint</C> returns the command for you to run in a terminal instead. Trying to
          drive an interactive prompt through a tool call is how assistants get stuck.
        </Callout>
      </>
    ),

    upgrading: (
      <>
        <H>Upgrading from container-orbit</H>
        <P>
          container-orbit became runtime-orbit in 0.2. The rename reflects what it actually does:
          it&apos;s not only Docker on the other side, and the machine lending its engine was
          confusingly called the &quot;host&quot;.
        </P>

        <H3>What to run</H3>
        <CodeBlock code={`brew upgrade slothlabsorg/tap/runtime-orbit
# or
curl -fsSL https://slothlabs.org/install/runtime-orbit | sh`} />
        <P>
          Your existing <C>~/.orbit</C> directory is adopted as <C>~/.runtime-orbit</C> on first run,
          so the link and key survive. The <C>orbit</C> command still exists — it&apos;s installed as
          a shortcut.
        </P>

        <H3>What changed</H3>
        <div className="my-5 overflow-x-auto rounded-xl border" style={{ borderColor: BORDER }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: BG_CARD }}>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#4A6080]">Before</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#4A6080]">Now</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['orbit setup', 'runtime-orbit setup --ip <donor-ip>'],
                ['orbit host init / host setup', 'runtime-orbit donor setup'],
                ['orbit host add-key <key>', 'runtime-orbit donor allow <key>'],
                ['(no donor-side check)', 'runtime-orbit donor doctor / donor status'],
                ['(foreground dashboard only)', 'runtime-orbit dashboard'],
                ['~/.orbit', '~/.runtime-orbit (migrated for you)'],
                ['docker context "orbit"', 'docker context "runtime-orbit"'],
              ].map(([before, now], i) => (
                <tr key={before} style={{ background: i % 2 === 0 ? '#071020' : BG_BASE }}>
                  <td className="px-4 py-2.5 font-mono text-[12.5px] text-[#8BA3C7]">{before}</td>
                  <td className="px-4 py-2.5 font-mono text-[12.5px]" style={{ color: ACCENT }}>{now}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <P>
          The old <C>host</C> subcommand still works as a hidden alias for <C>donor</C>, so scripts
          don&apos;t break. New in 0.2: the dashboard, in-app authorization and pairing, RAM budgets
          and the routing table, and runtime detection covering Podman, Lima and containerd.
        </P>
      </>
    ),

    troubleshooting: (
      <>
        <H>Troubleshooting</H>
        <P>
          Start with <C>runtime-orbit doctor</C> on the borrower and{' '}
          <C>runtime-orbit donor doctor</C> on the donor. Add <C>-v</C>, <C>-vv</C> or <C>-vvv</C> to
          any command to see every SSH and forwarding action.
        </P>

        <H3>&quot;Cannot SSH to the donor&quot;</H3>
        <P>
          Is the donor awake, and is its SSH server on? Run <C>runtime-orbit donor doctor</C> there.
          Then re-run <C>runtime-orbit setup --ip &lt;ip&gt;</C> here — re-authorizing is safe and
          idempotent.
        </P>

        <H3>The borrow dies overnight</H3>
        <P>
          The donor slept. <C>runtime-orbit donor setup</C> offers to fix it, or on macOS:{' '}
          <C>sudo pmset -a sleep 0 disablesleep 1</C>.
        </P>

        <H3>&quot;No runtime running on the donor&quot;</H3>
        <P>
          Its engine isn&apos;t started, or it moved sockets — switching from Docker Desktop to
          OrbStack does this. <C>runtime-orbit engines</C> shows what&apos;s actually there, and{' '}
          <C>runtime-orbit link &lt;user@donor&gt;</C> adopts the new socket.
        </P>

        <H3>A published port doesn&apos;t answer</H3>
        <P>
          Check <C>runtime-orbit ports</C>. If the port is already in use on this machine the tunnel
          can&apos;t bind; the forwarder logs it, so check <C>runtime-orbit logs</C>.
        </P>

        <H3>Bind mounts point at the wrong place</H3>
        <P>
          Paths in <C>-v /host/path:/in/container</C> resolve on the <em>donor</em>, since that&apos;s
          where the container runs. Build contexts are uploaded, so those work as expected. If you
          need your source tree inside a container, share the directory to the donor (SMB, NFS,
          Syncthing) and mount the donor-side path.
        </P>

        <H3>A Windows donor doesn&apos;t forward ports</H3>
        <P>
          Automatic forwarding needs the runtime&apos;s socket reachable over SSH; on Windows it
          lives inside WSL2. Run <C>runtime-orbit donor setup</C> <em>inside</em> the WSL distro and
          it looks like a normal unix donor. <C>doctor</C> flags this case explicitly.
        </P>

        <H3>docker still points at the donor after down</H3>
        <P>
          <C>down</C> restores the context that was active before <C>up</C>. If that context is gone
          it falls back to <C>default</C>; <C>docker context use &lt;name&gt;</C> sets it explicitly.
        </P>

        <Callout type="info">
          Still stuck? Open an issue with the output of <C>runtime-orbit -vv doctor</C> —{' '}
          <a href={`${REPO}/issues`} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: ACCENT }}>github.com/slothlabsorg/runtime-orbit/issues</a>.
        </Callout>
      </>
    ),

    roadmap: (
      <>
        <H>Roadmap</H>
        <P>
          Runtime detection is one probe and the transport is one thin layer, so new platforms plug
          in without touching the core.
        </P>

        <H3>v0.2 — shipping</H3>
        <ul className="mb-4">
          <Li>macOS and Linux on either side, with automatic port forwarding</Li>
          <Li>In-app authorization: password-once, or passwordless LAN pairing</Li>
          <Li>The live dashboard, plus <C>--json</C> for scripting</Li>
          <Li>RAM budgets and the routing table</Li>
          <Li>Runtime detection across Docker Desktop, OrbStack, Rancher, colima, Lima, Podman, containerd</Li>
          <Li>MCP server, and a login service on launchd/systemd</Li>
        </ul>

        <H3>Next</H3>
        <ul className="mb-4">
          <Li><strong className="text-white">Windows donors without WSL gymnastics.</strong> A Windows machine lends fine from inside a WSL2 distro today; next is reaching Docker Desktop&apos;s socket from Windows itself.</Li>
        </ul>

        <H3>Later</H3>
        <ul className="mb-4">
          <Li><strong className="text-white">Source sync</strong>, so bind-mounts and hot-reload work across machines without setting up file sharing yourself.</Li>
          <Li><strong className="text-white">More than one donor.</strong> The routing table already has the right shape for choosing between them.</Li>
          <Li><strong className="text-white">A native SSH backend</strong> (russh) instead of shelling out to OpenSSH, for tighter control over reconnects.</Li>
        </ul>

        <Callout type="success">
          runtime-orbit is free and open source, from SlothLabs — no company, no VC, just developers
          fixing their own friction. If it saved your laptop,{' '}
          <Link href="/pricing" className="underline" style={{ color: ACCENT }}>supporting the work</Link>{' '}
          keeps the tools coming. ♥
        </Callout>
      </>
    ),
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RuntimeOrbitDocsPage() {
  const [active, setActive] = useState('overview')
  const sections = buildSections()

  return (
    <main style={{ background: BG_BASE, minHeight: '100vh' }}>
      <CustomCursor />
      <ProductNavbar
        icon="🛰️"
        name="runtime-orbit"
        accent={ACCENT}
        ctaKind="link"
        ctaLabel="Install"
        ctaHref="/runtime-orbit/docs#install"
        docsHref="/runtime-orbit/docs"
      />

      <div className="pt-16 flex min-h-screen">
        {/* Sidebar — desktop */}
        <aside
          className="hidden md:flex flex-col flex-shrink-0 w-56 lg:w-64 sticky top-16 self-start overflow-y-auto py-8 pl-6 pr-4 border-r"
          style={{ borderColor: BORDER, maxHeight: 'calc(100vh - 64px)' }}
        >
          <Link href="/runtime-orbit" className="text-xs font-medium mb-6 flex items-center gap-1.5 hover:opacity-80 transition-opacity" style={{ color: ACCENT }}>
            ← runtime-orbit
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
                      style={active === item.slug ? { background: `${ACCENT}18`, color: ACCENT, fontWeight: 600 } : { color: '#8BA3C7' }}
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

          {/* Content */}
          <article className="flex-1 min-w-0 px-6 md:px-10 lg:px-16 py-10 max-w-3xl">
            {sections[active] ?? <p className="text-[#4A6080]">Section not found.</p>}

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
                      <Link href="/runtime-orbit" className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: ACCENT }}>
                        Back to runtime-orbit →
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
