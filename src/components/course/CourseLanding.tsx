'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MODULES, REF_DOCS, UI, REPO_URL, type Lang } from '@/data/ragCourse'

export default function CourseLanding() {
  const [lang, setLang] = useState<Lang>('en')

  return (
    <div>
      {/* Hero */}
      <section className="relative pt-32 pb-12 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[340px] rounded-full blur-[130px] opacity-[0.07] bg-[#4DA6FF]" />
        </div>
        <div className="relative z-10 site-container text-center max-w-3xl mx-auto space-y-5">
          {/* Lang toggle */}
          <div className="flex justify-center">
            <div className="inline-flex items-center rounded-full border border-[#1a3060] bg-[#0d1b3e]/60 p-1">
              {(['en', 'es'] as Lang[]).map((lg) => (
                <button
                  key={lg}
                  type="button"
                  onClick={() => setLang(lg)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    lang === lg ? 'bg-[#4DA6FF] text-[#050d1f]' : 'text-[#8BA3C7] hover:text-white'
                  }`}
                >
                  {lg === 'en' ? '🇬🇧 English' : '🇪🇸 Español'}
                </button>
              ))}
            </div>
          </div>

          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#4DA6FF]/10 border border-[#4DA6FF]/30 text-[#4DA6FF]">
            {UI.brandBadge[lang]}
          </span>
          <h1
            className="text-4xl md:text-6xl font-bold text-white tracking-tight"
            style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}
          >
            {UI.heroTitle[lang]}
          </h1>
          <p className="text-[#8BA3C7] text-lg leading-relaxed max-w-2xl mx-auto">{UI.heroSub[lang]}</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href={`/rag-course/${lang}/00-setup/`}
              className="px-6 py-3 rounded-full font-bold text-sm bg-[#4DA6FF] text-[#050d1f] hover:brightness-110 transition-all hover:-translate-y-0.5"
            >
              {lang === 'en' ? 'Start the course →' : 'Empezar el curso →'}
            </Link>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-full border border-[#1a3060] text-[#8BA3C7] hover:text-white hover:border-[#4DA6FF]/50 transition-all text-sm font-semibold"
            >
              {UI.viewRepo[lang]}
            </a>
          </div>
        </div>
      </section>

      {/* Method: three layers */}
      <section className="py-10">
        <div className="site-container max-w-5xl">
          <h2 className="text-center text-xl md:text-2xl font-bold text-white mb-6" style={{ fontFamily: 'Syne, sans-serif' }}>
            {UI.methodHeading[lang]}
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {UI.layers.map((layer) => (
              <div key={layer.n} className="rounded-2xl border border-[#1a3060] bg-[#060d1e] p-6">
                <div className="text-3xl mb-2 text-[#4DA6FF]">{layer.n}</div>
                <h3 className="font-bold text-white mb-1.5">{layer.t[lang]}</h3>
                <p className="text-[#8BA3C7] text-sm leading-relaxed">{layer.d[lang]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="py-10">
        <div className="site-container max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6" style={{ fontFamily: 'Syne, sans-serif' }}>
            {UI.modulesHeading[lang]} <span className="text-[#4A6080] text-lg font-normal">· {MODULES.length}</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODULES.map((m) => (
              <Link
                key={m.slug}
                href={`/rag-course/${lang}/${m.slug}/`}
                className="group rounded-2xl border p-5 bg-[#060d1e] transition-all duration-200 hover:-translate-y-1"
                style={{ borderColor: `${m.accent}26` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl border flex-shrink-0"
                    style={{ background: `${m.accent}14`, borderColor: `${m.accent}40` }}
                  >
                    {m.icon}
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold" style={{ color: m.accent }}>
                      {`M${m.n}`}
                    </span>
                    <h3 className="font-bold text-white leading-tight group-hover:text-[#4DA6FF] transition-colors">
                      {m.title[lang]}
                    </h3>
                  </div>
                </div>
                <p className="text-[#8BA3C7] text-sm leading-relaxed">{m.desc[lang]}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Reference knowledge base */}
      <section className="py-10 pb-24">
        <div className="site-container max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
            {UI.refHeading[lang]}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">
            {REF_DOCS.map((d) => (
              <Link
                key={d.slug}
                href={`/rag-course/${lang}/ref/${d.slug}/`}
                className="group rounded-xl border border-[#1a3060] p-4 bg-[#060d1e] hover:border-[#4DA6FF]/40 transition-all flex gap-3"
              >
                <span className="text-xl flex-shrink-0">{d.icon}</span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white text-sm group-hover:text-[#4DA6FF] transition-colors">{d.title[lang]}</h3>
                  <p className="text-[#4A6080] text-xs leading-relaxed mt-0.5">{d.desc[lang]}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
