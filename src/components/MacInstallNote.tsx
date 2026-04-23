'use client'
import { useState } from 'react'

export default function MacInstallNote({ accent }: { accent: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="max-w-lg mx-auto mt-5 rounded-xl border text-left overflow-hidden"
      style={{ borderColor: `${accent}30`, background: `${accent}08` }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium gap-3"
        style={{ color: accent }}
      >
        <span className="flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          macOS says "unverified developer" — how to open it anyway
        </span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className="flex-shrink-0 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {open && (
        <div
          className="px-4 pb-5 pt-3 space-y-4 text-sm border-t"
          style={{ borderColor: `${accent}20`, color: '#8BA3C7' }}
        >
          <p>
            macOS blocks apps that aren&apos;t signed with an Apple Developer certificate. We&apos;re an indie
            team building on nights and weekends — we&apos;re currently collecting to cover the $99/year
            Apple enrollment fee. If you can,{' '}
            <a
              href="https://ko-fi.com/slothlabs"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:opacity-80"
              style={{ color: accent }}
            >
              supporting the project
            </a>{' '}
            gets us there faster.
          </p>

          <div>
            <p className="font-semibold text-white mb-2">Option 1 — Right-click to open (easiest)</p>
            <ol className="space-y-1 list-decimal list-inside">
              <li>Right-click the <code className="px-1 py-0.5 rounded text-xs" style={{ background: `${accent}18`, color: accent }}>.app</code> file → <strong className="text-white">Open</strong></li>
              <li>macOS shows a warning — click <strong className="text-white">Open</strong> again to confirm</li>
              <li>The app opens and macOS remembers the exception going forward</li>
            </ol>
          </div>

          <div>
            <p className="font-semibold text-white mb-2">Option 2 — System Settings</p>
            <ol className="space-y-1 list-decimal list-inside">
              <li>Try to open the app normally — macOS will block it</li>
              <li>Open <strong className="text-white">System Settings → Privacy &amp; Security</strong></li>
              <li>Scroll down to the security section and click <strong className="text-white">Open Anyway</strong></li>
            </ol>
          </div>

          <div>
            <p className="font-semibold text-white mb-2">Option 3 — Terminal</p>
            <pre
              className="rounded-lg px-4 py-3 text-xs overflow-x-auto"
              style={{ background: '#060614', color: accent, border: `1px solid ${accent}25` }}
            >
{`xattr -cr "/Applications/AppName.app"`}
            </pre>
            <p className="mt-1 text-xs" style={{ color: '#4A6080' }}>Replace <code>AppName</code> with the actual app name. This removes the quarantine flag macOS sets on downloaded files.</p>
          </div>
        </div>
      )}
    </div>
  )
}
