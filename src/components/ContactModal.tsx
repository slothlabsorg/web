'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

const EMAIL = 'friends@slothlabs.com'

interface Props {
  open: boolean
  onClose: () => void
}

export default function ContactModal({ open, onClose }: Props) {
  const close = useCallback(() => {
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
      onClick={close}
    >
      <div className="absolute inset-0 bg-[#050d1f]/90 backdrop-blur-md" />
      <div
        className="relative z-10 w-full max-w-md max-h-[90vh] rounded-2xl bg-[#0d1b3e] border border-[#1a3060] overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{ boxShadow: '0 0 80px rgba(0,212,255,0.12), 0 32px 64px rgba(0,0,0,0.6)' }}
      >
        <button
          onClick={close}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-[#112244] flex items-center justify-center text-[#4A6080] hover:text-white hover:bg-[#1a3060] transition-all"
          aria-label="Close"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="relative h-40 bg-gradient-to-b from-[#071020] to-[#0d1b3e] overflow-hidden flex items-end justify-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-40 rounded-full bg-[#4DA6FF]/10 blur-2xl" />
          <Image
            src="/images/sloth-head.png"
            alt="SlothLabs"
            width={120}
            height={120}
            className="relative z-10 h-24 w-auto object-contain object-bottom opacity-90"
          />
          <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-[#0d1b3e] to-transparent" />
        </div>

        <div className="px-7 py-6 text-center overflow-y-auto min-h-0 flex-1">
          <h2
            className="text-xl font-bold text-white mb-2"
            style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}
          >
            Say hello
          </h2>
          <p className="text-sm text-[#8BA3C7] leading-relaxed mb-6">
            We’d love to hear from you. Drop us a line for support, feedback, or just to chat.
          </p>
          <a
            href={`mailto:${EMAIL}`}
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#4DA6FF] text-[#050d1f] font-semibold text-sm hover:brightness-110 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            {EMAIL}
          </a>
        </div>
      </div>
    </div>
  )
}
