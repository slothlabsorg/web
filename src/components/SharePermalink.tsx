'use client'

import { useState } from 'react'

interface Props {
  /** Path-only permalink, e.g. "/next/cloudorbit". The host is resolved client-side. */
  permalink: string
  appName: string
  dateLabel: string
  accent: string
}

export default function SharePermalink({ permalink, appName, dateLabel, accent }: Props) {
  const [copied, setCopied] = useState(false)

  const fullUrl = (() => {
    if (typeof window === 'undefined') return permalink
    return new URL(permalink, window.location.origin).toString()
  })()

  const shareText = `${appName} drops ${dateLabel} from SlothLabs — free, native, MIT.`

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: prompt the user
      window.prompt('Copy this link', fullUrl)
    }
  }

  const twitter = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`
  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`
  const reddit = `https://www.reddit.com/submit?url=${encodeURIComponent(fullUrl)}&title=${encodeURIComponent(`${appName} drops ${dateLabel} — SlothLabs`)}`

  return (
    <div className="flex items-center flex-wrap gap-2 pt-3">
      <span className="text-xs font-semibold uppercase tracking-widest text-[#4A6080] mr-1">Share:</span>
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors"
        style={{ borderColor: `${accent}40`, color: accent, background: `${accent}0d` }}
      >
        {copied ? (
          <>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 10l4 4 8-8" /></svg>
            Copied
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3h8a1 1 0 011 1v12a1 1 0 01-1 1H8a1 1 0 01-1-1V4a1 1 0 011-1z" /><path d="M5 7H4a1 1 0 00-1 1v9a1 1 0 001 1h7" /></svg>
            Copy link
          </>
        )}
      </button>
      <a
        href={twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors hover:text-white"
        style={{ borderColor: '#1e2535', color: '#8BA3C7' }}
      >
        𝕏 Post
      </a>
      <a
        href={linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors hover:text-white"
        style={{ borderColor: '#1e2535', color: '#8BA3C7' }}
      >
        in LinkedIn
      </a>
      <a
        href={reddit}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors hover:text-white"
        style={{ borderColor: '#1e2535', color: '#8BA3C7' }}
      >
        Reddit
      </a>
    </div>
  )
}
