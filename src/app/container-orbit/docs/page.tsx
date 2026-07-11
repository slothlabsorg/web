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
const REPO = 'https://github.com/slothlabsorg/container-orbit'

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
    group: 'Setup',
    items: [
      { slug: 'setup-wizard', label: 'orbit setup (wizard)' },
      { slug: 'host', label: 'Host setup' },
      { slug: 'engines', label: 'Docker engines' },
    ],
  },
  {
    group: 'Everyday use',
    items: [
      { slug: 'delegate', label: 'up / down' },
      { slug: 'ports', label: 'Port forwarding' },
      { slug: 'status', label: 'status & doctor' },
      { slug: 'service', label: 'Run as a service' },
      { slug: 'logs', label: 'Logs & verbose' },
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
    items: [{ slug: 'roadmap', label: 'Roadmap' }],
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

// ── Sections ──────────────────────────────────────────────────────────────────
function buildSections(): Record<string, React.ReactNode> {
  return {
    overview: (
      <>
        <H>container-orbit</H>
        <P>
          <strong className="text-white">orbit</strong> delegates your local Docker to a beefier
          machine on your LAN over SSH. Heavy <C>docker build</C>, <C>docker run</C>, and{' '}
          <C>docker compose</C> execute on that machine — using its RAM, CPU and disk — while
          published container ports are forwarded straight back to your{' '}
          <C>localhost</C>, so it feels like Docker is still running locally.
        </P>
        <P>Two roles:</P>
        <ul className="mb-4">
          <Li><strong className="text-white">Client</strong> — your laptop. Runs the <C>docker</C> CLI and receives forwarded ports.</Li>
          <Li><strong className="text-white">Host</strong> — the beefy machine (another Mac, a gaming PC, a Linux box). Runs the real Docker engine and exposes its socket over SSH.</Li>
        </ul>
        <Callout type="info">
          orbit manages a standard <C>docker context</C> — it does <em>not</em> wrap the{' '}
          <C>docker</C> binary — so every tool that respects <C>DOCKER_HOST</C> works unchanged.
        </Callout>
        <P>
          It works with any engine that speaks the Docker socket: Docker Desktop, OrbStack, Rancher
          Desktop, and colima. See the <Link href="/container-orbit" className="underline" style={{ color: ACCENT }}>product page</Link> for the overview.
        </P>
      </>
    ),

    install: (
      <>
        <H>Install</H>
        <P>orbit is a single self-contained binary called <C>orbit</C>.</P>

        <H3>macOS &amp; Linux — Homebrew</H3>
        <CodeBlock code={'brew install slothlabsorg/tap/container-orbit'} />

        <H3>macOS &amp; Linux — one-line script</H3>
        <CodeBlock code={'curl -fsSL https://raw.githubusercontent.com/slothlabsorg/container-orbit/main/dist/install.sh | sh'} />
        <P>The script auto-detects your OS/arch and installs the matching release binary. Tunables:</P>
        <FlagTable rows={[
          ['ORBIT_INSTALL_DIR', 'Where to install (default /usr/local/bin, or ~/.local/bin if not writable).'],
          ['ORBIT_VERSION', 'Version tag to install, e.g. v0.1.0 (default: latest).'],
        ]} />

        <H3>Windows — PowerShell</H3>
        <CodeBlock filename="powershell" code={'irm https://raw.githubusercontent.com/slothlabsorg/container-orbit/main/dist/install.ps1 | iex'} />
        <P>Installs <C>orbit.exe</C> to <C>%LOCALAPPDATA%\\orbit\\bin</C> and adds it to your user PATH.</P>

        <H3>From source</H3>
        <CodeBlock code={'git clone https://github.com/slothlabsorg/container-orbit\ncd container-orbit\ncargo build --release\n# binary at target/release/orbit'} />

        <H3>Verify</H3>
        <CodeBlock code={'orbit --version\norbit --help'} />
        <Callout type="info">
          Prerequisites on both machines: a Docker engine on the host, an SSH server on the host
          (Remote Login), and the <C>docker</C> CLI on the client. That&apos;s it.
        </Callout>
      </>
    ),

    'quick-start': (
      <>
        <H>Quick start</H>
        <P>The fastest path is the guided wizard. On your laptop:</P>
        <CodeBlock code={'orbit setup'} />
        <P>It discovers the host on your LAN, authorizes the SSH key, links, brings orbit up, and runs an end-to-end self-test — about two minutes. Then just use Docker normally:</P>
        <CodeBlock code={'docker run -d -p 8080:80 nginx     # runs on the host\ncurl localhost:8080                # …answers here, automatically\n\norbit status                       # what’s linked, connected, forwarded\norbit down                         # restore local docker when you’re done'} />
        <Callout type="success">
          The container&apos;s RAM/CPU live on the host; the published port shows up on your
          localhost. Stop the container and orbit tears the tunnel down for you.
        </Callout>
      </>
    ),

    'setup-wizard': (
      <>
        <H>orbit setup — the wizard</H>
        <P>Interactive, zero-flags. It walks through:</P>
        <ol className="mb-4">
          <Li><strong className="text-white">Discover host</strong> — scans your LAN&apos;s /24 subnets for machines with SSH open and lets you pick one (or type an address).</Li>
          <Li><strong className="text-white">User</strong> — asks the SSH username (defaults to your current login).</Li>
          <Li><strong className="text-white">Key &amp; authorization</strong> — generates the orbit key if needed; if it isn&apos;t authorized yet, runs <C>ssh-copy-id</C> (asking for the host password once). If password SSH is disabled, it prints the exact one-liner to add the key on the host and re-checks.</Li>
          <Li><strong className="text-white">Detect engine</strong> — finds the remote docker socket (Docker Desktop, OrbStack, Rancher, colima).</Li>
          <Li><strong className="text-white">Link, up &amp; self-test</strong> — creates the context, delegates Docker, then runs a throwaway container on the host and curls it via localhost to prove it works.</Li>
        </ol>
        <H3>Flags (for scripts / CI)</H3>
        <FlagTable rows={[
          ['--host <addr>', 'Skip discovery and use this IP/hostname.'],
          ['--user <name>', 'SSH user on the host (default: your current username).'],
          ['--port <n>', 'SSH port (default 22).'],
          ['--yes', 'Non-interactive: accept defaults. Requires --host.'],
          ['--no-test', 'Skip the end-to-end self-test container.'],
        ]} />
        <CodeBlock code={'# fully non-interactive (key must already be authorized)\norbit setup --host 192.168.1.42 --user dany --yes'} />
      </>
    ),

    host: (
      <>
        <H>Host setup</H>
        <P>On the machine that will lend its Docker engine, run:</P>
        <CodeBlock code={'orbit host setup'} />
        <P>It checks the Docker engine and SSH server, then prints a join string you can paste on the client. <C>orbit host init</C> is the same check without the extra guidance.</P>

        <H3>Enable the SSH server (Remote Login)</H3>
        <ul className="mb-2">
          <Li><strong className="text-white">macOS:</strong> System Settings → General → Sharing → Remote Login → on.</Li>
          <Li><strong className="text-white">Linux:</strong> <C>sudo systemctl enable --now ssh</C></Li>
        </ul>

        <H3>Authorize a key without a password</H3>
        <P>If the host has password SSH disabled, authorize the client&apos;s public key directly on the host:</P>
        <CodeBlock code={'orbit host add-key "ssh-ed25519 AAAA... orbit"'} />
        <P>The client&apos;s public key lives at <C>~/.orbit/keys/id_orbit_ed25519.pub</C>.</P>
        <Callout type="info">
          orbit never needs the <C>docker</C> CLI on the host&apos;s non-interactive SSH PATH — it
          talks to the socket directly. Just Docker running + SSH reachable is enough.
        </Callout>
      </>
    ),

    engines: (
      <>
        <H>Docker engines</H>
        <P>orbit auto-detects the remote socket, probing these paths in order:</P>
        <FlagTable rows={[
          ['/var/run/docker.sock', 'Docker Desktop (with the default socket enabled), or a symlink.'],
          ['/run/docker.sock', 'Linux dockerd.'],
          ['~/.docker/run/docker.sock', 'Docker Desktop (per-user socket).'],
          ['~/.orbstack/run/docker.sock', 'OrbStack.'],
          ['~/.colima/default/docker.sock', 'colima.'],
        ]} />
        <P>Override detection when linking:</P>
        <CodeBlock code={'orbit link user@host --socket /custom/path/docker.sock'} />
        <Callout type="warn">
          Running two engines at once (e.g. Docker Desktop <em>and</em> OrbStack) can make{' '}
          <C>/var/run/docker.sock</C> point at whichever grabbed it last. Keep one engine active,
          or pass <C>--socket</C> to be explicit.
        </Callout>
      </>
    ),

    delegate: (
      <>
        <H>Delegating Docker — up / down</H>
        <CodeBlock code={'orbit up                 # docker → host; start forwarding (detached)\norbit up --foreground    # run the forwarder in the foreground instead\norbit down               # restore your previous context; drop every forward'} />
        <P>
          <C>orbit up</C> switches your active docker context to <C>orbit</C>, opens one multiplexed
          SSH master connection, forwards the remote daemon socket to a local unix socket, and
          starts a background reconciler that keeps port tunnels in sync. It remembers whatever
          context you were on so <C>orbit down</C> can put it back exactly.
        </P>
        <Callout type="info">
          Detached by default — close the terminal and Docker stays delegated. Use{' '}
          <C>--foreground</C> when running under a supervisor (that&apos;s what the service uses).
        </Callout>
      </>
    ),

    ports: (
      <>
        <H>Port forwarding</H>
        <P>
          This is the core trick. orbit watches the remote daemon&apos;s event stream and opens an{' '}
          <C>ssh -L</C> tunnel for every published container port, tearing it down when the
          container stops. So <C>-p 8080:80</C> on the host is <C>curl localhost:8080</C> on your
          laptop — no manual work.
        </P>
        <CodeBlock code={'orbit ports              # list active forwards\norbit ports add 5432     # manually forward a non-docker service on the host\norbit ports rm 5432      # stop forwarding it'} />
        <P>Use <C>ports add</C> for things Docker doesn&apos;t publish — a database or dev server running directly on the host.</P>
      </>
    ),

    status: (
      <>
        <H>status &amp; doctor</H>
        <CodeBlock code={'orbit status'} />
        <P>Shows the linked host, docker context state, whether the SSH master and forwarder are running, the forwarded ports, and the remote engine&apos;s version / CPU / RAM / container &amp; image counts.</P>
        <CodeBlock code={'orbit doctor'} />
        <P>Runs through the whole setup and reports actionable problems — docker CLI present, config, SSH reachability, the remote daemon socket, the forwarded socket, and the active context — each with the exact fix.</P>
      </>
    ),

    service: (
      <>
        <H>Run as a service</H>
        <P>Keep Docker delegation + port forwarding alive across logins and reboots:</P>
        <CodeBlock code={'orbit service install     # install + start\norbit service status      # is it installed and running?\norbit service uninstall   # remove it'} />
        <ul className="mb-2">
          <Li><strong className="text-white">macOS:</strong> a launchd LaunchAgent at <C>~/Library/LaunchAgents/org.slothlabs.orbit.plist</C> that runs <C>orbit up --foreground</C> at login.</Li>
          <Li><strong className="text-white">Linux:</strong> a systemd <C>--user</C> unit (<C>orbit.service</C>). Logs: <C>journalctl --user -u orbit.service -f</C>.</Li>
          <Li><strong className="text-white">Windows:</strong> the command prints a ready-to-paste <C>schtasks</C> line (Task Scheduler at logon).</Li>
        </ul>
      </>
    ),

    logs: (
      <>
        <H>Logs &amp; verbose</H>
        <P>The detached forwarder logs to <C>~/.orbit/run/orbit.log</C>. Tail it:</P>
        <CodeBlock code={'orbit logs            # last 200 lines\norbit logs -f         # follow (like tail -f)\norbit logs -n 50      # last 50 lines'} />
        <H3>Verbose tracing</H3>
        <P>Add <C>-v</C> flags to any command to see exactly what orbit does — every ssh invocation, each forward added/removed, each docker event:</P>
        <FlagTable rows={[
          ['-v', 'info'],
          ['-vv', 'debug (shows ssh / context actions)'],
          ['-vvv', 'trace (shows raw ssh commands and every event)'],
          ['--log-file <path>', 'Also write logs to a file (any verbosity).'],
        ]} />
        <CodeBlock code={'orbit -vvv up --log-file ~/orbit-debug.log'} />
      </>
    ),

    cli: (
      <>
        <H>CLI reference</H>
        <div className="overflow-x-auto rounded-xl border my-4" style={{ borderColor: BORDER }}>
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr style={{ background: BG_CARD }}>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#4A6080]">Command</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-[#4A6080]">What it does</th>
              </tr>
            </thead>
            <tbody>
              {([
                ['orbit setup', 'Guided setup: discover host, authorize key, link, up, self-test.'],
                ['orbit host setup', 'Host side: check Docker + SSH, print the join string.'],
                ['orbit host init', 'Host side: detection + join string (no extra guidance).'],
                ['orbit host add-key "<pubkey>"', 'Authorize a client public key in ~/.ssh/authorized_keys.'],
                ['orbit link <user@host>', 'Install the key, detect the socket, create the orbit context. Flags: --port, --socket.'],
                ['orbit up [--foreground]', 'Delegate docker to the host; start the port reconciler.'],
                ['orbit down', 'Restore the previous context; close forwards + SSH master.'],
                ['orbit status', 'Link, connection, forwarded ports, remote resources.'],
                ['orbit ports [add|rm <port>]', 'List / add / remove TCP forwards.'],
                ['orbit logs [-f] [-n N]', 'Show / follow the forwarder log.'],
                ['orbit service <install|uninstall|status>', 'Run orbit at login (launchd / systemd).'],
                ['orbit mcp', 'Start the stdio MCP server for AI assistants.'],
                ['orbit doctor', 'Diagnose SSH, daemon, forwarded socket, and context.'],
              ] as [string, string][]).map(([cmd, desc], i) => (
                <tr key={cmd} style={{ background: i % 2 === 0 ? '#071020' : BG_BASE }}>
                  <td className="px-4 py-2.5 font-mono text-[12.5px] align-top whitespace-nowrap" style={{ color: ACCENT }}>{cmd}</td>
                  <td className="px-4 py-2.5 text-[#8BA3C7]">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <P>Global flags: <C>-v/-vv/-vvv</C> (verbosity) and <C>--log-file &lt;path&gt;</C> work on every command.</P>
      </>
    ),

    config: (
      <>
        <H>Config &amp; files</H>
        <P>Everything orbit stores lives under <C>~/.orbit/</C> (chosen over the platform config dir because macOS&apos;s has a space, which breaks unix socket paths):</P>
        <FlagTable rows={[
          ['~/.orbit/config.toml', 'Link config: host user/address, ssh port, adapter, remote socket, context name, previous context.'],
          ['~/.orbit/keys/id_orbit_ed25519', 'The orbit-managed SSH keypair (+ .pub).'],
          ['~/.orbit/run/control.sock', 'The multiplexed SSH master control socket.'],
          ['~/.orbit/run/docker.sock', 'The remote daemon socket, forwarded locally. The orbit docker context points here.'],
          ['~/.orbit/run/orbit.pid', 'PID of the detached forwarder.'],
          ['~/.orbit/run/orbit.log', 'Forwarder log (see orbit logs).'],
        ]} />
        <H3>config.toml</H3>
        <CodeBlock filename="~/.orbit/config.toml" code={'host_user = "dany"\nhost_addr = "192.168.1.42"\nssh_port = 22\nadapter = "unix"\nremote_socket = "/var/run/docker.sock"\ncontext_name = "orbit"'} />
      </>
    ),

    how: (
      <>
        <H>How it works</H>
        <ul className="mb-4">
          <Li><strong className="text-white">Transport:</strong> OpenSSH with one multiplexed master (<C>ControlMaster</C>/<C>ControlPath</C>) shared by the socket forward and every port tunnel.</Li>
          <Li><strong className="text-white">Docker redirection:</strong> the remote daemon socket is forwarded to <C>~/.orbit/run/docker.sock</C> and a standard docker context points at it — no <C>ssh://</C> endpoint (which would need <C>docker</C> on the remote&apos;s SSH PATH), no wrapper around <C>docker</C>.</Li>
          <Li><strong className="text-white">Port reconciler:</strong> subscribes to the daemon&apos;s <C>/events</C>, recomputes published ports on each event, and opens/cancels <C>ssh -O forward -L</C> tunnels to match. The stream reconnects with backoff so a transient blip never drops your forwards.</Li>
        </ul>
        <H3>Host adapters</H3>
        <FlagTable rows={[
          ['UnixSocketHost', 'macOS / Linux unix domain socket. Shipping — covers Mac→Mac and Linux.'],
          ['WindowsWslHost', 'Docker socket inside WSL2 via an SSH bridge. Planned (v1.1).'],
          ['WindowsNativeHost', 'Named-pipe relay for native Windows Docker. Future.'],
        ]} />
      </>
    ),

    mcp: (
      <>
        <H>MCP server</H>
        <P>orbit ships a built-in <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: ACCENT }}>Model Context Protocol</a> server so Claude (or any MCP client) can drive it in plain language.</P>
        <H3>Claude Code</H3>
        <CodeBlock code={'claude mcp add orbit -- orbit mcp'} />
        <H3>Claude Desktop</H3>
        <CodeBlock filename="claude_desktop_config.json" code={'{\n  "mcpServers": {\n    "orbit": { "command": "orbit", "args": ["mcp"] }\n  }\n}'} />
        <H3>Tools</H3>
        <P>Non-interactive operations are exposed as tools: <C>status</C>, <C>up</C>, <C>down</C>, <C>link</C>, <C>doctor</C>, <C>list_forwards</C>, <C>add_forward</C>, <C>remove_forward</C>, and <C>setup_hint</C>.</P>
        <Callout type="info">
          First-time interactive setup stays in your terminal — the server points the assistant at{' '}
          <C>orbit setup</C> rather than trying to proxy prompts. Tool calls run through the orbit
          CLI, so the JSON-RPC channel is never polluted by command output.
        </Callout>
      </>
    ),

    roadmap: (
      <>
        <H>Roadmap</H>
        <H3>Shipping — v1</H3>
        <ul className="mb-3"><Li><strong className="text-white">Mac → Mac / Linux:</strong> the unix-socket adapter with full automatic port forwarding.</Li></ul>
        <H3>Next — v1.1</H3>
        <ul className="mb-3"><Li><strong className="text-white">Mac → Windows (WSL2):</strong> reach the Docker socket inside a WSL2 distro through an SSH bridge, so a Windows gaming rig can be the host.</Li></ul>
        <H3>Later</H3>
        <ul className="mb-3">
          <Li><strong className="text-white">Windows-native host:</strong> a named-pipe relay for Docker Desktop on Windows without WSL.</Li>
          <Li><strong className="text-white">Code sync:</strong> optional source sync so bind-mounts and hot-reload work across machines.</Li>
          <Li><strong className="text-white">Multi-host / cluster mode:</strong> pool several machines and place builds/containers across them.</Li>
        </ul>
        <Callout type="info">
          The host adapter is a trait — new platforms plug in without touching the core. Track
          progress or contribute on{' '}
          <a href={REPO} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: ACCENT }}>GitHub</a>.
        </Callout>
      </>
    ),
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ContainerOrbitDocsPage() {
  const [active, setActive] = useState('overview')
  const sections = buildSections()

  return (
    <main style={{ background: BG_BASE, minHeight: '100vh' }}>
      <CustomCursor />
      <ProductNavbar
        icon="🛰️"
        name="container-orbit"
        accent={ACCENT}
        ctaKind="subscribe"
        ctaLabel="Get early access"
        docsHref="/container-orbit/docs"
      />

      <div className="pt-16 flex min-h-screen">
        {/* Sidebar — desktop */}
        <aside
          className="hidden md:flex flex-col flex-shrink-0 w-56 lg:w-64 sticky top-16 self-start overflow-y-auto py-8 pl-6 pr-4 border-r"
          style={{ borderColor: BORDER, maxHeight: 'calc(100vh - 64px)' }}
        >
          <Link href="/container-orbit" className="text-xs font-medium mb-6 flex items-center gap-1.5 hover:opacity-80 transition-opacity" style={{ color: ACCENT }}>
            ← container-orbit
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
                      <Link href="/container-orbit" className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: ACCENT }}>
                        Back to container-orbit →
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
