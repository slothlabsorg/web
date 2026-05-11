'use client'
import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  accent?: string
  source?: string          // which product / page the signup came from
  buttonLabel?: string
  className?: string
  style?: React.CSSProperties  // inline style for trigger button
}

// Netlify Forms: encode payload as URL-encoded form data
function encode(data: Record<string, string>) {
  return Object.keys(data)
    .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(data[k]))
    .join('&')
}

export default function SubscribeModal({
  accent = '#4DA6FF',
  source = 'general',
  buttonLabel = 'Subscribe for updates',
  className,
  style,
}: Props) {
  const [open, setOpen]     = useState(false)
  const [email, setEmail]   = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'ok' | 'error'>('idle')
  const [err, setErr]       = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const close = useCallback(() => {
    setOpen(false)
    setTimeout(() => {
      setStatus('idle')
      setEmail('')
      setErr('')
    }, 300)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, close])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !/.+@.+\..+/.test(email)) {
      setErr('Enter a valid email address')
      return
    }
    setStatus('submitting')
    setErr('')
    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encode({
          'form-name': 'email-signup',
          email,
          source,
        }),
      })
      if (!res.ok) throw new Error('Submission failed')
      setStatus('ok')
    } catch {
      setStatus('error')
      setErr('Could not send. Try again in a moment.')
    }
  }

  const accentDim = `${accent}15`
  const accentMid = `${accent}40`

  return (
    <>
      {/* Trigger — styled via className/style so this component can be used inside
          Server Components (no functions cross the server/client boundary). */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? 'inline-flex items-center justify-center px-6 py-3.5 rounded-full border text-sm font-medium hover:opacity-80 transition-all'}
        style={style ?? (!className ? { borderColor: accentMid, color: accent } : undefined)}
      >
        {buttonLabel}
      </button>

      {/* Modal */}
      {mounted && open && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 bg-[#050d1f]/90 backdrop-blur-md" />

          <div
            className="relative z-10 w-full max-w-md rounded-2xl border overflow-hidden shadow-2xl"
            style={{ background: '#0d1b3e', borderColor: '#1a3060', boxShadow: `0 0 80px ${accent}20, 0 32px 64px rgba(0,0,0,0.6)` }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              type="button"
              onClick={close}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-[#112244] flex items-center justify-center text-[#4A6080] hover:text-white hover:bg-[#1a3060] transition-all"
              aria-label="Close"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>

            <div className="px-7 py-8">
              {status === 'ok' ? (
                <div className="text-center space-y-4 py-4">
                  <div
                    className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: accentDim, border: `1px solid ${accentMid}` }}
                  >
                    ✨
                  </div>
                  <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                    You&apos;re on the list!
                  </h2>
                  <p className="text-sm text-[#8BA3C7] leading-relaxed">
                    Slothy will drop you a line when there&apos;s something real to share — release notes, new tools, and the occasional update. No spam, unsubscribe anytime.
                  </p>
                  <button
                    type="button"
                    onClick={close}
                    className="mt-2 inline-flex items-center justify-center px-6 py-2.5 rounded-full font-semibold text-sm transition-all hover:brightness-110"
                    style={{ background: accent, color: '#050d1f' }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div
                    className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5"
                    style={{ background: accentDim, border: `1px solid ${accentMid}` }}
                  >
                    📬
                  </div>
                  <h2 className="text-2xl font-bold text-white text-center" style={{ fontFamily: 'Syne, sans-serif' }}>
                    Get SlothLabs updates
                  </h2>
                  <p className="text-sm text-[#8BA3C7] text-center mt-2 leading-relaxed">
                    Release notes, new tools, the occasional sloth fact. No spam, no selling your data. Unsubscribe anytime.
                  </p>

                  <form
                    name="email-signup"
                    method="POST"
                    data-netlify="true"
                    data-netlify-honeypot="bot-field"
                    onSubmit={submit}
                    className="mt-6 space-y-3"
                  >
                    {/* Hidden fields required by Netlify */}
                    <input type="hidden" name="form-name" value="email-signup" />
                    <input type="hidden" name="source" value={source} />
                    {/* Honeypot for bots */}
                    <p className="hidden">
                      <label>Don&apos;t fill this out: <input name="bot-field" /></label>
                    </p>

                    <label className="block">
                      <span className="text-xs font-medium text-[#4A6080] uppercase tracking-wider">Email</span>
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoFocus
                        className="mt-1.5 w-full px-4 py-3 rounded-xl border bg-[#071020] text-white placeholder-[#4A6080] text-sm focus:outline-none focus:ring-2 transition-all"
                        style={{ borderColor: '#1a3060' }}
                      />
                    </label>

                    {err && (
                      <p className="text-xs text-red-400">{err}</p>
                    )}

                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60 hover:brightness-110"
                      style={{ background: accent, color: '#050d1f' }}
                    >
                      {status === 'submitting' ? 'Subscribing…' : 'Subscribe'}
                    </button>
                    <p className="text-[11px] text-[#4A6080] text-center">
                      By subscribing you agree to receive occasional emails from SlothLabs.
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
