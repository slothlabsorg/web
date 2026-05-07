'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import CloudOrbitNavbar from '@/components/CloudOrbitNavbar'
import Footer from '@/components/Footer'
import CustomCursor from '@/components/CustomCursor'
import DownloadModal from '@/components/DownloadModal'
import { docsContent } from '@/config/content'

const { sidebar, introduction, installation, quickStart, awsSetup, cloudflare } = docsContent

// ── Code block with copy ──────────────────────────────────────────────────────
function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const highlight = (line: string) => {
    // Very simple highlight for INI / bash / powershell
    if (line.trimStart().startsWith('#')) {
      return <span className="code-comment">{line}</span>
    }
    if (line.includes('=')) {
      const [key, ...rest] = line.split('=')
      return <>
        <span className="code-keyword">{key}</span>
        <span className="text-[#8BA3C7]">=</span>
        <span className="code-value">{rest.join('=')}</span>
      </>
    }
    if (/^(brew|sudo|apt|yay|winget)\b/.test(line.trim())) {
      const words = line.split(' ')
      return <>
        <span className="code-keyword">{words[0]}</span>
        <span> {words.slice(1).join(' ')}</span>
      </>
    }
    return <>{line}</>
  }

  return (
    <div className="relative group rounded-xl border border-[#1a3060] overflow-hidden my-6">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#071020] border-b border-[#1a3060]">
        <span className="text-xs text-[#4A6080] font-mono">{lang}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs text-[#4A6080] hover:text-[#00D4FF] transition-colors px-2 py-1 rounded"
        >
          {copied ? (
            <span className="copy-success text-[#00D4FF] flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Copied!
            </span>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="4" y="1" width="7" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M1 4h2M1 4v6a1.5 1.5 0 001.5 1.5H8V11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code */}
      <pre className="px-5 py-5 overflow-x-auto text-sm leading-relaxed bg-[#0a1628] font-mono">
        <code>
          {code.split('\n').map((line, i) => (
            <div key={i} className="text-[#c9d1d9]">{highlight(line)}</div>
          ))}
        </code>
      </pre>
    </div>
  )
}

// ── Callout ───────────────────────────────────────────────────────────────────
type CalloutType = 'info' | 'success' | 'warning' | 'error'
function Callout({ type = 'info', children }: { type?: CalloutType; children: React.ReactNode }) {
  const styles: Record<CalloutType, string> = {
    info:    'bg-[#4DA6FF]/10 border-[#4DA6FF]',
    success: 'bg-[#00D4FF]/10 border-[#00D4FF]',
    warning: 'bg-yellow-400/10 border-yellow-400',
    error:   'bg-red-400/10 border-red-400',
  }
  return (
    <div className={`my-6 px-5 py-4 rounded-r-xl border-l-4 text-sm text-[#8BA3C7] leading-relaxed ${styles[type]}`}>
      {children}
    </div>
  )
}

// ── Step ──────────────────────────────────────────────────────────────────────
function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-5 my-8">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#00D4FF]/15 border border-[#00D4FF]/30 flex items-center justify-center text-sm font-bold text-[#00D4FF]">
        {n}
      </div>
      <div>
        <h4 className="font-semibold text-white mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>{title}</h4>
        <div className="text-sm text-[#8BA3C7] leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

// ── Prev / Next nav ───────────────────────────────────────────────────────────
function PrevNext({ prev, next }: { prev?: string; next?: string }) {
  return (
    <div className="flex justify-between gap-4 mt-16 pt-8 border-t border-[#1a3060]">
      {prev ? (
        <button className="flex-1 text-left px-4 py-4 rounded-xl bg-[#0d1b3e] border border-[#1a3060] hover:border-[#00D4FF]/50 transition-all group">
          <div className="text-xs text-[#4A6080] mb-1">← Previous</div>
          <div className="text-sm font-medium text-[#8BA3C7] group-hover:text-white transition-colors">{prev}</div>
        </button>
      ) : <div />}
      {next ? (
        <button className="flex-1 text-right px-4 py-4 rounded-xl bg-[#0d1b3e] border border-[#1a3060] hover:border-[#00D4FF]/50 transition-all group">
          <div className="text-xs text-[#4A6080] mb-1">Next →</div>
          <div className="text-sm font-medium text-[#8BA3C7] group-hover:text-white transition-colors">{next}</div>
        </button>
      ) : <div />}
    </div>
  )
}

// ── Sections ──────────────────────────────────────────────────────────────────
function SectionIntroduction() {
  return (
    <div>
      <h1 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight leading-[1.1]" style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}>
        <span className="gradient-text">{introduction.headline}</span>
      </h1>
      <p className="text-lg text-[#8BA3C7] mb-12 leading-relaxed">{introduction.lead}</p>

      <div className="grid md:grid-cols-3 gap-4 mb-12">
        {introduction.quickCards.map(card => (
          <button key={card.slug} className="group text-left p-5 rounded-xl bg-[#0d1b3e] border border-[#1a3060] hover:border-[#00D4FF]/50 transition-all hover:-translate-y-0.5">
            <div className="text-2xl mb-3">{card.icon}</div>
            <div className="font-semibold text-white mb-1 text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>{card.title}</div>
            <div className="text-xs text-[#4A6080]">{card.desc}</div>
          </button>
        ))}
      </div>

      <PrevNext next="Installation" />
    </div>
  )
}

function SectionInstallation({ tab, setTab }: { tab: string; setTab: (t: string) => void }) {
  const tabs = installation.tabs
  const [launchingSoon, setLaunchingSoon] = useState(true)
  useEffect(() => {
    setLaunchingSoon(new Date() < new Date('2026-05-08T00:00:00Z'))
  }, [])

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 tracking-tight" style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}>
        {installation.headline}
      </h2>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-[#071020] rounded-lg p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t
                ? 'bg-[#00D4FF] text-[#050d1f]'
                : 'text-[#8BA3C7] hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'macOS' && (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-white mb-2">{installation.macos.method1.title}</h4>
            <p className="text-sm text-[#8BA3C7] mb-4">{installation.macos.method1.body}</p>
            <DownloadModal
              buttonLabel={installation.macos.method1.cta}
              launchingSoon={launchingSoon}
              className="px-6 py-3 rounded-btn bg-[#F5A623] text-[#050d1f] font-bold text-sm hover:brightness-110 transition-all"
            />
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">{installation.macos.method2.title}</h4>
            <CodeBlock code={installation.macos.method2.code} lang="bash" />
          </div>
        </div>
      )}

      {tab === 'Windows' && (
        <div>
          <p className="text-sm text-[#8BA3C7] mb-4">{installation.windows.body}</p>
          <CodeBlock code={installation.windows.code} lang="powershell" />
        </div>
      )}

      {tab === 'Linux' && (
        <CodeBlock code={installation.linux.code} lang="bash" />
      )}

      <PrevNext prev="Introduction" next="Quick Start" />
    </div>
  )
}

function SectionQuickStart() {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 tracking-tight" style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}>
        {quickStart.headline}
      </h2>

      {quickStart.steps.map(step => (
        <Step key={step.n} n={step.n} title={step.title}>
          {step.body}
          {step.n === 2 && (
            <div className="mt-3 p-4 rounded-xl bg-[#071020] border border-[#1a3060] text-xs font-mono text-[#4A6080] italic">
              [Screenshot placeholder: profile list view]
            </div>
          )}
        </Step>
      ))}

      <PrevNext prev="Installation" next="AWS Setup" />
    </div>
  )
}

function SectionAWSSetup() {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 tracking-tight" style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}>
        {awsSetup.headline}
      </h2>
      <p className="text-[#8BA3C7] mb-6 leading-relaxed">{awsSetup.body}</p>
      <CodeBlock code={awsSetup.configExample} lang="ini" />
      <Callout type="success">{awsSetup.note}</Callout>
      <PrevNext prev="Quick Start" next="Cloudflare Networks" />
    </div>
  )
}

function SectionCloudflare() {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 tracking-tight" style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}>
        {cloudflare.headline}
      </h2>

      <Callout type="error">{cloudflare.problem}</Callout>
      <Callout type="success">{cloudflare.solution}</Callout>

      <h3 className="font-semibold text-white mt-8 mb-4">If you still see connection errors:</h3>
      <ol className="space-y-3 list-none">
        {cloudflare.steps.map((step, i) => (
          <li key={i} className="flex gap-3 text-sm text-[#8BA3C7]">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1a3060] flex items-center justify-center text-xs text-[#4A6080] font-bold">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>

      <PrevNext prev="AWS Setup" />
    </div>
  )
}

// ── Main docs page ────────────────────────────────────────────────────────────
export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('introduction')
  const [installTab, setInstallTab] = useState('macOS')
  const [mobileSidebarOpen, setMobileSidebar] = useState(false)

  return (
    <main className="bg-[#050d1f] min-h-screen">
      <CustomCursor />
      <CloudOrbitNavbar />

      <div className="max-w-7xl mx-auto px-6 pt-20">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden md:block w-60 flex-shrink-0 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto py-8">
            <nav className="space-y-6">
              {sidebar.map(group => (
                <div key={group.group}>
                  <div className="text-xs font-semibold text-[#4A6080] uppercase tracking-widest mb-2 px-3">
                    {group.group}
                  </div>
                  <ul className="space-y-0.5">
                    {group.items.map(item => (
                      <li key={item.slug}>
                        <button
                          onClick={() => setActiveSection(item.slug)}
                          className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-all ${
                            activeSection === item.slug
                              ? 'bg-[#00D4FF]/10 text-[#00D4FF] font-medium'
                              : 'text-[#8BA3C7] hover:text-white hover:bg-[#0d1b3e]'
                          }`}
                        >
                          {item.label}
                          {activeSection === item.slug && (
                            <span className="ml-2 text-[#00D4FF]">·</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>

          {/* Mobile sidebar toggle */}
          <button
            className="md:hidden fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-[#00D4FF] text-[#050d1f] flex items-center justify-center shadow-lg"
            onClick={() => setMobileSidebar(!mobileSidebarOpen)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>

          {mobileSidebarOpen && (
            <div className="md:hidden fixed inset-0 z-50 bg-[#050d1f]/90 backdrop-blur-md" onClick={() => setMobileSidebar(false)}>
              <div className="absolute left-0 top-0 bottom-0 w-72 bg-[#0d1b3e] border-r border-[#1a3060] p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="text-sm font-semibold text-white mb-6">Documentation</div>
                {sidebar.map(group => (
                  <div key={group.group} className="mb-6">
                    <div className="text-xs font-semibold text-[#4A6080] uppercase tracking-widest mb-2">
                      {group.group}
                    </div>
                    <ul className="space-y-1">
                      {group.items.map(item => (
                        <li key={item.slug}>
                          <button
                            onClick={() => { setActiveSection(item.slug); setMobileSidebar(false) }}
                            className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-all ${
                              activeSection === item.slug
                                ? 'bg-[#00D4FF]/10 text-[#00D4FF] font-medium'
                                : 'text-[#8BA3C7]'
                            }`}
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
          <article className="flex-1 min-w-0 py-8 pb-24">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-[#4A6080] mb-8">
              <Link href="/" className="hover:text-[#8BA3C7] transition-colors">SlothLabs</Link>
              <span>/</span>
              <Link href="/cloudorbit" className="hover:text-[#8BA3C7] transition-colors">CloudOrbit</Link>
              <span>/</span>
              <span className="text-[#8BA3C7]">Docs</span>
              <span>/</span>
              <span className="text-[#8BA3C7] capitalize">{activeSection.replace(/-/g, ' ')}</span>
            </div>

            {activeSection === 'introduction'     && <SectionIntroduction />}
            {activeSection === 'installation'     && <SectionInstallation tab={installTab} setTab={setInstallTab} />}
            {activeSection === 'quick-start'      && <SectionQuickStart />}
            {activeSection === 'aws-setup'        && <SectionAWSSetup />}
            {activeSection === 'profiles'         && (
              <div>
                <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Syne, sans-serif' }}>Profiles</h2>
                <Callout type="info">CloudOrbit reads <code className="font-mono text-[#00D4FF] text-xs">~/.aws/config</code> automatically on launch. SSO groups and their associated accounts appear in the sidebar without any manual setup.</Callout>
                <p className="text-[#8BA3C7] text-sm leading-relaxed">Named profiles using <code className="font-mono text-[#00D4FF] text-xs">aws_access_key_id</code> (non-SSO static credentials) are not yet supported but coming soon.</p>
                <PrevNext prev="AWS Setup" next="Session Management" />
              </div>
            )}
            {activeSection === 'session-management' && (
              <div>
                <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Syne, sans-serif' }}>Session Management</h2>
                <p className="text-[#8BA3C7] mb-6 leading-relaxed">CloudOrbit assumes roles via <code className="font-mono text-[#00D4FF] text-xs">GetRoleCredentials</code> and stores temporary STS credentials securely in your OS keychain. Credentials are valid for 1–12 hours depending on your role's session duration.</p>
                <Callout type="success">Credentials are automatically written to <code className="font-mono text-[#00D4FF] text-xs">~/.aws/credentials</code> so any CLI tool, Terraform, or kubectl that reads standard AWS credentials will pick them up instantly.</Callout>
                <PrevNext prev="Profiles" next="EKS Integration" />
              </div>
            )}
            {activeSection === 'eks-integration' && (
              <div>
                <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Syne, sans-serif' }}>EKS Integration</h2>
                <p className="text-[#8BA3C7] mb-4 leading-relaxed">After assuming a role, CloudOrbit queries the EKS API in the selected region to discover clusters. Click <strong className="text-white">Update kubeconfig</strong> on any cluster to merge it into <code className="font-mono text-[#00D4FF] text-xs">~/.kube/config</code>.</p>
                <CodeBlock code="# CloudOrbit does this automatically — equivalent to:\naws eks update-kubeconfig --name my-cluster --region us-east-1" lang="bash" />
                <PrevNext prev="Session Management" next="kubeconfig Update" />
              </div>
            )}
            {activeSection === 'kubeconfig-update' && (
              <div>
                <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Syne, sans-serif' }}>kubeconfig Update</h2>
                <p className="text-[#8BA3C7] mb-4 leading-relaxed">CloudOrbit writes cluster entries using <code className="font-mono text-[#00D4FF] text-xs">serde_yaml</code> directly — no <code className="font-mono text-[#00D4FF] text-xs">aws</code> CLI required on the system. The resulting config is compatible with <code className="font-mono text-[#00D4FF] text-xs">kubectl</code>, Lens, and any other tool that reads the standard kubeconfig format.</p>
                <Callout type="warning">Switching to a different AWS role in a different account will change the cluster credentials. Run <code className="font-mono text-[#00D4FF] text-xs">kubectl get nodes</code> to verify access after switching.</Callout>
                <PrevNext prev="EKS Integration" next="Cloudflare Networks" />
              </div>
            )}
            {activeSection === 'cloudflare-networks' && <SectionCloudflare />}
            {activeSection === 'common-issues' && (
              <div>
                <h2 className="text-3xl font-bold mb-8" style={{ fontFamily: 'Syne, sans-serif' }}>Common Issues</h2>
                {[
                  {
                    q: '"SSO token expired" appears immediately after login',
                    a: 'Your system clock may be out of sync. CloudOrbit validates token expiry using local time. Ensure your clock is correct: System Preferences → Date & Time → Set automatically.',
                  },
                  {
                    q: 'EKS clusters not showing up',
                    a: 'Make sure the assumed role has eks:ListClusters permission in IAM. Also verify the correct AWS region is selected — clusters are region-specific.',
                  },
                  {
                    q: 'SSM session fails to open',
                    a: 'The AWS CLI and session-manager-plugin must be installed. Run: aws --version && session-manager-plugin in your terminal.',
                  },
                  {
                    q: 'kubeconfig update fails',
                    a: 'Ensure ~/.kube/ directory exists and is writable. CloudOrbit creates it automatically but will fail if the directory has incorrect permissions.',
                  },
                ].map(item => (
                  <div key={item.q} className="mb-8 p-5 rounded-xl bg-[#0d1b3e] border border-[#1a3060]">
                    <h4 className="font-semibold text-white mb-2 text-sm">{item.q}</h4>
                    <p className="text-sm text-[#8BA3C7] leading-relaxed">{item.a}</p>
                  </div>
                ))}
                <PrevNext prev="Cloudflare Networks" />
              </div>
            )}
          </article>
        </div>
      </div>

      <Footer showSuiteLink accent="#00D4FF" />
    </main>
  )
}
