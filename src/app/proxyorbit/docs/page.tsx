'use client'

import { useState } from 'react'
import Link from 'next/link'
import ProductNavbar from '@/components/ProductNavbar'
import Footer from '@/components/Footer'
import CustomCursor from '@/components/CustomCursor'

const ACCENT     = '#94A3B8'
const ACCENT_HI  = '#CBD5E1'
const BG_BASE    = '#050810'
const BG_CARD    = '#0c1018'
const BORDER     = '#1e2535'

const SIDEBAR: { group: string; items: { slug: string; label: string }[] }[] = [
  {
    group: 'Getting started',
    items: [
      { slug: 'overview',      label: 'Overview' },
      { slug: 'install',       label: 'Install' },
      { slug: 'quick-start',   label: 'Quick start' },
      { slug: 'ca-install',    label: 'Install the MITM CA' },
    ],
  },
  {
    group: 'Corporate environments',
    items: [
      { slug: 'zscaler',       label: 'Zscaler / Jamf / MDM' },
      { slug: 'shell-aliases', label: 'proxyon / proxyoff aliases' },
      { slug: 'ide-env',       label: 'JetBrains / VSCode env trap' },
    ],
  },
  {
    group: 'Per-tool config',
    items: [
      { slug: 'vscode',        label: 'VSCode' },
      { slug: 'jetbrains',     label: 'IntelliJ · PyCharm · WebStorm' },
      { slug: 'node',          label: 'Node.js' },
      { slug: 'python',        label: 'Python (requests, httpx)' },
      { slug: 'aws-cli',       label: 'AWS CLI' },
      { slug: 'go',            label: 'Go' },
      { slug: 'postman',       label: 'Postman / Insomnia' },
      { slug: 'docker',        label: 'Docker containers' },
    ],
  },
  {
    group: 'Features',
    items: [
      { slug: 'mitm',          label: 'HTTPS inspection (MITM)' },
      { slug: 'replay',        label: 'Replay requests' },
      { slug: 'intercept',     label: 'Intercept + modify' },
      { slug: 'curl',          label: 'Copy as cURL' },
      { slug: 'filters',       label: 'Filters & tunnels toggle' },
    ],
  },
  {
    group: 'Reference',
    items: [
      { slug: 'platforms',     label: 'Platform support' },
      { slug: 'troubleshoot',  label: 'Troubleshooting' },
    ],
  },
]

function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <div className="relative group rounded-xl border overflow-hidden my-5" style={{ borderColor: BORDER }}>
      <div className="flex items-center justify-between px-4 py-2" style={{ background: '#03060b', borderBottom: `1px solid ${BORDER}` }}>
        <span className="text-xs font-mono" style={{ color: '#4A6080' }}>{lang}</span>
        <button onClick={copy} className="text-xs transition-colors" style={{ color: copied ? ACCENT_HI : '#4A6080' }}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="px-4 py-4 overflow-x-auto text-[13px] leading-relaxed font-mono" style={{ background: '#060910', color: '#c9d1d9' }}>
        <code>{code}</code>
      </pre>
    </div>
  )
}

function Callout({ type, children }: { type: 'info' | 'warn' | 'success'; children: React.ReactNode }) {
  const color = type === 'warn' ? '#fbbf24' : type === 'success' ? '#34d399' : ACCENT_HI
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
  return <h3 className="text-lg font-semibold mt-6 mb-2 text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{props.children}</h3>
}
function P(props: { children: React.ReactNode }) {
  return <p className="text-[15px] leading-relaxed mb-3" style={{ color: '#8BA3C7' }}>{props.children}</p>
}
function C(props: { children: React.ReactNode }) {
  return <code className="px-1 py-0.5 rounded text-[13px] font-mono" style={{ background: BG_CARD, color: ACCENT_HI, border: `1px solid ${BORDER}` }}>{props.children}</code>
}

// ── Section content ──────────────────────────────────────────────────────────

const sections: Record<string, React.ReactNode> = {
  overview: (
    <>
      <H>ProxyOrbit documentation</H>
      <P>ProxyOrbit is a native HTTP/HTTPS proxy inspector for developers. Start the proxy, point any app or your whole system at <C>127.0.0.1:8080</C>, and every request shows up in a live feed with headers, body, timing, and process name.</P>
      <P>This site covers the bits that won&apos;t fit in the app&apos;s help panel: corporate/MDM escape hatches, per-tool config, CA installation, and feature deep-dives.</P>
      <Callout type="info">
        First time? Jump straight to <strong className="text-white">Quick start</strong> on the left — then <strong className="text-white">Install the MITM CA</strong> if you need HTTPS body inspection.
      </Callout>
    </>
  ),

  install: (
    <>
      <H>Install</H>
      <P>Grab the latest installer from the <a href="https://github.com/slothlabsorg/proxyorbit/releases/latest" target="_blank" rel="noreferrer" style={{ color: ACCENT_HI }} className="underline">GitHub Releases</a> page:</P>
      <ul className="list-disc list-inside space-y-1 mb-4" style={{ color: '#8BA3C7' }}>
        <li>macOS Apple Silicon — <C>.dmg</C> (arm64)</li>
        <li>macOS Intel — <C>.dmg</C> (x64)</li>
        <li>Windows — <C>.msi</C> or <C>.exe</C></li>
        <li>Linux — <C>.deb</C>, <C>.rpm</C>, or <C>.AppImage</C></li>
      </ul>
      <Callout type="warn">
        v1.0.0 ships unsigned. On macOS right-click the app and choose <strong className="text-white">Open</strong> the first time. On Windows, approve the SmartScreen prompt.
      </Callout>
    </>
  ),

  'quick-start': (
    <>
      <H>Quick start</H>
      <P>1. Launch ProxyOrbit and click <strong className="text-white">Start</strong>. The proxy listens on <C>127.0.0.1:8080</C>.</P>
      <P>2. In Settings, enable <strong className="text-white">Auto-configure system proxy</strong>. On macOS, GUI apps (browsers, Postman, Slack) will route automatically.</P>
      <P>3. Open a <em>new</em> terminal — <C>HTTPS_PROXY</C> is set via <C>launchctl setenv</C>, so only newly-spawned processes inherit it. For already-running shells, use the <Link href="#shell-aliases" style={{ color: ACCENT_HI }} className="underline">proxyon alias</Link>.</P>
      <P>4. For full HTTPS request/response bodies (not just CONNECT handshakes), enable <strong className="text-white">MITM HTTPS inspection</strong> in Settings and install the generated CA once.</P>
    </>
  ),

  'ca-install': (
    <>
      <H>Install the MITM CA</H>
      <P>After toggling HTTPS inspection on in Settings, ProxyOrbit writes a local root at <C>~/.proxyorbit/ca/ca.pem</C>. Install it in your OS trust store once — leaf certs for every host are minted on demand and signed by this root.</P>
      <H3>macOS</H3>
      <CodeBlock code={`sudo security add-trusted-cert -d -r trustRoot \\
  -k /Library/Keychains/System.keychain ~/.proxyorbit/ca/ca.pem`} />
      <H3>Linux (Debian / Ubuntu)</H3>
      <CodeBlock code={`sudo cp ~/.proxyorbit/ca/ca.pem /usr/local/share/ca-certificates/proxyorbit.crt
sudo update-ca-certificates`} />
      <H3>Windows (PowerShell, admin)</H3>
      <CodeBlock code={`Import-Certificate -FilePath "$env:USERPROFILE\\.proxyorbit\\ca\\ca.pem" \`
  -CertStoreLocation Cert:\\LocalMachine\\Root`} lang="powershell" />
      <Callout type="info">Firefox keeps a separate trust store — import via <strong className="text-white">Settings → Privacy &amp; Security → Certificates → View Certificates → Authorities</strong>.</Callout>
    </>
  ),

  zscaler: (
    <>
      <H>Zscaler / Jamf / MDM environments</H>
      <P>On managed Macs, <C>networksetup -set*proxystate on</C> often silently no-ops — the command exits <C>0</C> but System Settings → Network still shows proxies disabled. You&apos;ll typically also find a forced <C>SSL_CERT_FILE=/…/ZscalerRootCA.pem</C> in your environment.</P>
      <P>Symptoms:</P>
      <ul className="list-disc list-inside space-y-1 mb-4" style={{ color: '#8BA3C7' }}>
        <li>ProxyOrbit starts, shows <strong className="text-white">running</strong>, but 0 requests arrive from browsers or GUI apps.</li>
        <li><C>networksetup -getwebproxy Wi-Fi</C> prints <C>Enabled: No</C> even after toggling.</li>
        <li><C>scutil --proxy</C> shows <C>HTTPEnable: 0</C> and <C>HTTPSEnable: 0</C>.</li>
      </ul>
      <P>The fix is not to fight the MDM — it&apos;s to route traffic per-app or per-shell instead. See the next three sections.</P>
      <Callout type="warn">
        Some MDMs also pin specific root CAs per process. If VSCode / IntelliJ / Slack still refuse to trust ProxyOrbit&apos;s CA, check your employer&apos;s device-policy docs — that&apos;s outside ProxyOrbit&apos;s control.
      </Callout>
    </>
  ),

  'shell-aliases': (
    <>
      <H>proxyon / proxyoff shell aliases</H>
      <P>The most reliable fallback when networksetup is blocked. Add to <C>~/.zshrc</C> or <C>~/.bashrc</C>, and flip the proxy on/off in any terminal — even an already-running one:</P>
      <CodeBlock code={`# ProxyOrbit — CLI proxy toggle (zsh / bash)
export PROXYORBIT_CA="$HOME/.proxyorbit/ca/ca.pem"

proxyon() {
  export HTTPS_PROXY="http://127.0.0.1:8080"
  export HTTP_PROXY="http://127.0.0.1:8080"
  export ALL_PROXY="http://127.0.0.1:8080"
  export https_proxy="$HTTPS_PROXY"
  export http_proxy="$HTTP_PROXY"
  export all_proxy="$ALL_PROXY"
  # Trust ProxyOrbit's CA for the MITM leaf certs. If Zscaler already set
  # SSL_CERT_FILE, stash it and restore in proxyoff.
  [ -n "$SSL_CERT_FILE" ] && export SSL_CERT_FILE_PRE_PROXYORBIT="$SSL_CERT_FILE"
  export SSL_CERT_FILE="$PROXYORBIT_CA"
  export NODE_EXTRA_CA_CERTS="$PROXYORBIT_CA"
  export REQUESTS_CA_BUNDLE="$PROXYORBIT_CA"
  export CURL_CA_BUNDLE="$PROXYORBIT_CA"
  echo "ProxyOrbit: ON (127.0.0.1:8080)"
}

proxyoff() {
  unset HTTPS_PROXY HTTP_PROXY ALL_PROXY https_proxy http_proxy all_proxy \\
        NODE_EXTRA_CA_CERTS REQUESTS_CA_BUNDLE CURL_CA_BUNDLE
  if [ -n "$SSL_CERT_FILE_PRE_PROXYORBIT" ]; then
    export SSL_CERT_FILE="$SSL_CERT_FILE_PRE_PROXYORBIT"
    unset SSL_CERT_FILE_PRE_PROXYORBIT
  else
    unset SSL_CERT_FILE
  fi
  echo "ProxyOrbit: OFF"
}`} />
      <Callout type="success">
        After <C>source ~/.zshrc</C>, run <C>proxyon</C> then <C>curl https://httpbin.org/get</C> and watch the request land in ProxyOrbit.
      </Callout>
    </>
  ),

  'ide-env': (
    <>
      <H>JetBrains / VSCode terminal inherits the old environment</H>
      <P>When the IDE is launched <em>before</em> ProxyOrbit starts, its embedded terminal inherits the parent environment — which doesn&apos;t include the <C>HTTPS_PROXY</C> values set by <C>launchctl setenv</C>. You have three options:</P>
      <ul className="list-disc list-inside space-y-2 mb-4" style={{ color: '#8BA3C7' }}>
        <li>Quit and relaunch the IDE. New launches inherit the latest launchd env.</li>
        <li>Use the <C>proxyon</C> alias inside the IDE terminal — sets env for that shell only.</li>
        <li>Launch the IDE from a terminal that already has <C>proxyon</C> active; the child process inherits the env.</li>
      </ul>
      <Callout type="info">This is a macOS launchd quirk, not a ProxyOrbit bug. The same thing happens if you set any env var with <C>launchctl setenv</C>: only newly-spawned processes see it.</Callout>
    </>
  ),

  vscode: (
    <>
      <H>VSCode</H>
      <P>Settings → search <C>http.proxy</C> and set:</P>
      <CodeBlock code={`"http.proxy": "http://127.0.0.1:8080",
"http.proxyStrictSSL": false`} lang="json" />
      <P>For Node extensions that make their own requests (ESLint, Copilot, …), also export <C>NODE_EXTRA_CA_CERTS</C> before launching VSCode so they trust the MITM CA:</P>
      <CodeBlock code={`export NODE_EXTRA_CA_CERTS=~/.proxyorbit/ca/ca.pem
open -a "Visual Studio Code"`} />
    </>
  ),

  jetbrains: (
    <>
      <H>IntelliJ · PyCharm · WebStorm · Rider</H>
      <P>Settings → Appearance &amp; Behavior → System Settings → HTTP Proxy → Manual:</P>
      <ul className="list-disc list-inside space-y-1 mb-4" style={{ color: '#8BA3C7' }}>
        <li>Host name: <C>127.0.0.1</C></li>
        <li>Port: <C>8080</C></li>
        <li>Check <strong className="text-white">Also use for HTTPS</strong></li>
      </ul>
      <P>Under <strong className="text-white">Tools → Server Certificates</strong>, check <strong className="text-white">Accept non-trusted certificates automatically</strong>, or import <C>~/.proxyorbit/ca/ca.pem</C> manually the first time a secure request is routed.</P>
    </>
  ),

  node: (
    <>
      <H>Node.js</H>
      <CodeBlock code={`# .env or shell rc
export NODE_EXTRA_CA_CERTS=~/.proxyorbit/ca/ca.pem
export HTTPS_PROXY=http://127.0.0.1:8080
export HTTP_PROXY=http://127.0.0.1:8080`} />
      <Callout type="info">
        <C>NODE_EXTRA_CA_CERTS</C> appends to Node&apos;s built-in trust store, so the system roots (and Zscaler&apos;s root, if enterprise-pushed) still work. No need to disable TLS verification.
      </Callout>
    </>
  ),

  python: (
    <>
      <H>Python (requests, httpx, urllib3, aiohttp)</H>
      <CodeBlock code={`export REQUESTS_CA_BUNDLE=~/.proxyorbit/ca/ca.pem
export HTTPS_PROXY=http://127.0.0.1:8080
export HTTP_PROXY=http://127.0.0.1:8080`} />
      <P>Pipenv / poetry / <C>python -m pip install</C> all respect these too. For <C>pip</C> specifically, if your corp already pins an index, keep it — ProxyOrbit just intercepts the outbound HTTPS.</P>
    </>
  ),

  'aws-cli': (
    <>
      <H>AWS CLI</H>
      <CodeBlock code={`export AWS_CA_BUNDLE=~/.proxyorbit/ca/ca.pem
export HTTPS_PROXY=http://127.0.0.1:8080`} />
      <P>This also works for boto3 / botocore / the AWS SDKs in most languages — they honour the same env vars.</P>
    </>
  ),

  go: (
    <>
      <H>Go</H>
      <P><C>net/http</C> respects <C>HTTPS_PROXY</C> automatically. For the CA, either append to the system trust store or set <C>SSL_CERT_FILE</C>:</P>
      <CodeBlock code={`export HTTPS_PROXY=http://127.0.0.1:8080
export SSL_CERT_FILE=~/.proxyorbit/ca/ca.pem`} />
    </>
  ),

  postman: (
    <>
      <H>Postman / Insomnia</H>
      <P><strong className="text-white">Postman</strong>: Settings → Proxy → &quot;Use custom proxy configuration&quot; → <C>127.0.0.1:8080</C>. Under <strong className="text-white">Certificates</strong>, add <C>~/.proxyorbit/ca/ca.pem</C> as a CA certificate (or disable SSL verification for localhost dev).</P>
      <P><strong className="text-white">Insomnia</strong>: Preferences → General → Proxy → <C>http://127.0.0.1:8080</C>. Same for the CA under Client Certificates.</P>
    </>
  ),

  docker: (
    <>
      <H>Docker containers</H>
      <P>Containers can&apos;t reach host <C>localhost</C> directly. On macOS and Windows Docker Desktop, use <C>host.docker.internal</C>. On Linux, add <C>--add-host=host.docker.internal:host-gateway</C>.</P>
      <CodeBlock code={`docker run --rm \\
  -e HTTPS_PROXY=http://host.docker.internal:8080 \\
  -e HTTP_PROXY=http://host.docker.internal:8080 \\
  -v ~/.proxyorbit/ca/ca.pem:/usr/local/share/ca-certificates/proxyorbit.crt \\
  my-image \\
  sh -c "update-ca-certificates && my-command"`} />
    </>
  ),

  mitm: (
    <>
      <H>HTTPS inspection (MITM)</H>
      <P>Without MITM, ProxyOrbit sees only CONNECT handshakes — host/port and timing, no bodies. Turn it on in <strong className="text-white">Settings → HTTPS inspection</strong>. ProxyOrbit then:</P>
      <ul className="list-disc list-inside space-y-1 mb-4" style={{ color: '#8BA3C7' }}>
        <li>Generates a root CA at <C>~/.proxyorbit/ca/</C> on first launch (cert + private key, mode <C>0600</C>).</li>
        <li>Mints a per-host leaf cert on demand the first time a host is requested, caches it for the lifetime of the process.</li>
        <li>Terminates TLS with the leaf cert, forwards the plaintext request outbound with its own TLS, and records both sides.</li>
      </ul>
      <P>Install the CA once in your OS trust store (see <Link href="#ca-install" style={{ color: ACCENT_HI }} className="underline">Install the MITM CA</Link>) and HTTPS bodies become visible just like plain HTTP.</P>
      <Callout type="warn">
        The MITM CA is local to your machine. Don&apos;t share the <C>ca.key.pem</C> file — anyone with it can impersonate any HTTPS host to your browser while your CA is trusted.
      </Callout>
    </>
  ),

  replay: (
    <>
      <H>Replay requests</H>
      <P>Click any captured request, then the <strong className="text-white">Replay</strong> tab. Method, URL, headers, and body are pre-filled. Edit anything, hit <strong className="text-white">Send</strong>, and you&apos;ll see the response inline without polluting the capture log.</P>
      <P>Useful for:</P>
      <ul className="list-disc list-inside space-y-1 mb-4" style={{ color: '#8BA3C7' }}>
        <li>Re-running a failed API call after tweaking a header.</li>
        <li>Probing how a server responds to malformed input.</li>
        <li>Quickly copy-pasting a known-good request from one shell and modifying auth.</li>
      </ul>
    </>
  ),

  intercept: (
    <>
      <H>Intercept + modify</H>
      <P>Toggle <strong className="text-white">Intercept</strong> on (in the sidebar). The next request that goes through the proxy pauses in-flight and opens a modal showing its method, URL, headers, and body — all editable. Choose:</P>
      <ul className="list-disc list-inside space-y-1 mb-4" style={{ color: '#8BA3C7' }}>
        <li><strong className="text-white">Forward</strong> — sends the (edited or original) request upstream and captures the response.</li>
        <li><strong className="text-white">Drop</strong> — returns <C>444</C> to the client, never hits the remote.</li>
        <li>Ignore the modal — the request times out after 60 s and is dropped.</li>
      </ul>
      <P>A new request only pauses when the previous intercept is resolved — one modal at a time, others queue in the background.</P>
    </>
  ),

  curl: (
    <>
      <H>Copy as cURL</H>
      <P>Any captured request has a <strong className="text-white">Copy as cURL</strong> button in the detail panel header. It builds a portable command with method, URL, every header, and the body — ready to paste into any terminal or share with a teammate.</P>
      <P>Hop-by-hop headers (<C>Connection</C>, <C>Keep-Alive</C>, <C>Transfer-Encoding</C>, …) are filtered out because curl regenerates them. Binary bodies are base64-encoded; JSON bodies go through as-is.</P>
    </>
  ),

  filters: (
    <>
      <H>Filters & tunnels toggle</H>
      <ul className="list-disc list-inside space-y-1 mb-4" style={{ color: '#8BA3C7' }}>
        <li><strong className="text-white">Text</strong> — matches URL, host, or process name.</li>
        <li><strong className="text-white">Method</strong> — GET, POST, PUT, PATCH, DELETE.</li>
        <li><strong className="text-white">Status</strong> — 2xx, 3xx, 4xx, 5xx, or connection errors (no status line).</li>
        <li><strong className="text-white">Protocol</strong> — HTTP / HTTPS.</li>
        <li><strong className="text-white">Tunnels</strong> — off by default. Hides CONNECT tunnel handshakes (TLS setup noise, not real API calls). Toggle on if you&apos;re debugging why a tunnel failed to upgrade.</li>
      </ul>
    </>
  ),

  platforms: (
    <>
      <H>Platform support</H>
      <div className="rounded-xl border overflow-hidden my-5" style={{ borderColor: BORDER }}>
        <table className="w-full text-sm" style={{ background: BG_CARD }}>
          <thead>
            <tr style={{ background: '#03060b', color: ACCENT_HI }}>
              <th className="text-left px-4 py-3 font-semibold">Platform</th>
              <th className="text-left px-4 py-3 font-semibold">Proxy</th>
              <th className="text-left px-4 py-3 font-semibold">Auto-config</th>
              <th className="text-left px-4 py-3 font-semibold">MITM</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['macOS (Apple Silicon + Intel)', '✅', '✅', '✅'],
              ['Windows',                       '✅', '🚧 v1.1', '✅'],
              ['Linux (deb / rpm / AppImage)',  '✅', '🚧 v1.1', '✅'],
            ].map(row => (
              <tr key={row[0]} className="border-t" style={{ borderColor: BORDER, color: '#8BA3C7' }}>
                {row.map((cell, i) => (
                  <td key={i} className="px-4 py-3">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <P>Windows and Linux proxies listen fine; GUI auto-configure needs a platform-specific implementation (<C>netsh winhttp</C> + per-browser registry on Windows, GNOME/KDE dconf on Linux) and lands in v1.1. Until then use the per-tool config and <Link href="#shell-aliases" style={{ color: ACCENT_HI }} className="underline">shell aliases</Link>.</P>
    </>
  ),

  troubleshoot: (
    <>
      <H>Troubleshooting</H>
      <H3>&quot;Proxy running, 0 requests&quot;</H3>
      <P>System-proxy toggle appears on but traffic isn&apos;t routed. Run <C>networksetup -getwebproxy Wi-Fi</C>. If it prints <C>Enabled: No</C>, your MDM is blocking the state change — jump to <Link href="#zscaler" style={{ color: ACCENT_HI }} className="underline">Zscaler / Jamf</Link>.</P>
      <H3>CLI tools don&apos;t see the proxy</H3>
      <P>You&apos;re in an old terminal. <C>launchctl setenv</C> only affects newly-spawned processes. Either open a new terminal or run <C>proxyon</C> in your current one.</P>
      <H3>HTTPS requests fail with certificate errors after enabling MITM</H3>
      <P>You haven&apos;t installed the CA, or you installed it in the wrong trust store. See <Link href="#ca-install" style={{ color: ACCENT_HI }} className="underline">Install the MITM CA</Link>. Firefox has its own store separate from the system one.</P>
      <H3>Browser works but IDE doesn&apos;t</H3>
      <P>IDE was launched before ProxyOrbit. See <Link href="#ide-env" style={{ color: ACCENT_HI }} className="underline">JetBrains / VSCode env trap</Link>.</P>
      <H3>Something else broke</H3>
      <P>Please file an issue on <a href="https://github.com/slothlabsorg/proxyorbit/issues" target="_blank" rel="noreferrer" style={{ color: ACCENT_HI }} className="underline">GitHub</a> with the output of <C>networksetup -getwebproxy Wi-Fi</C>, <C>env | grep -i proxy</C>, and a short description of the tool you were using.</P>
    </>
  ),
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ProxyOrbitDocsPage() {
  const [section, setSection] = useState<string>('overview')
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <main style={{ background: BG_BASE, minHeight: '100vh' }}>
      <CustomCursor />
      <ProductNavbar icon="🔍" iconSrc="/images/proxyorbit-icon.png" name="ProxyOrbit" accent={ACCENT} docsHref="/proxyorbit/docs" />

      <div className="max-w-7xl mx-auto px-6 pt-20">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden md:block w-64 flex-shrink-0 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto py-8">
            <nav className="space-y-6">
              {SIDEBAR.map(group => (
                <div key={group.group}>
                  <div className="text-xs font-semibold uppercase tracking-widest mb-2 px-3" style={{ color: '#4A6080' }}>
                    {group.group}
                  </div>
                  <ul className="space-y-0.5">
                    {group.items.map(item => (
                      <li key={item.slug}>
                        <button
                          onClick={() => setSection(item.slug)}
                          className="w-full text-left text-sm px-3 py-1.5 rounded-md transition-all"
                          style={
                            section === item.slug
                              ? { background: `${ACCENT}18`, color: ACCENT_HI, fontWeight: 500 }
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
            </nav>
          </aside>

          {/* Mobile toggle */}
          <button
            className="md:hidden fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
            style={{ background: ACCENT_HI, color: BG_BASE }}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle docs menu"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>

          {mobileOpen && (
            <div className="md:hidden fixed inset-0 z-50 bg-[#050810]/90 backdrop-blur-md" onClick={() => setMobileOpen(false)}>
              <div className="absolute left-0 top-0 bottom-0 w-72 p-6 overflow-y-auto" style={{ background: BG_CARD, borderRight: `1px solid ${BORDER}` }} onClick={e => e.stopPropagation()}>
                <div className="text-sm font-semibold text-white mb-6" style={{ fontFamily: 'Syne, sans-serif' }}>Documentation</div>
                {SIDEBAR.map(group => (
                  <div key={group.group} className="mb-6">
                    <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#4A6080' }}>{group.group}</div>
                    <ul className="space-y-1">
                      {group.items.map(item => (
                        <li key={item.slug}>
                          <button
                            onClick={() => { setSection(item.slug); setMobileOpen(false) }}
                            className="w-full text-left text-sm px-3 py-2 rounded-md"
                            style={section === item.slug ? { background: `${ACCENT}18`, color: ACCENT_HI } : { color: '#8BA3C7' }}
                          >
                            {item.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <article className="flex-1 min-w-0 py-8 pb-24 max-w-3xl">
            <div className="flex items-center gap-2 text-xs mb-6" style={{ color: '#4A6080' }}>
              <Link href="/" className="hover:opacity-80 transition-opacity">SlothLabs</Link>
              <span>/</span>
              <Link href="/proxyorbit" className="hover:opacity-80 transition-opacity">ProxyOrbit</Link>
              <span>/</span>
              <span style={{ color: '#8BA3C7' }}>Docs</span>
            </div>
            {sections[section]}
          </article>
        </div>
      </div>

      <Footer showSuiteLink accent={ACCENT} />
    </main>
  )
}
