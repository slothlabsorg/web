import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CustomCursor from '@/components/CustomCursor'
import { LANGS, REF_DOCS, UI, REPO_URL, type Lang } from '@/data/ragCourse'
import { getRefDocHtml } from '@/lib/course'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.org'

export function generateStaticParams() {
  return LANGS.flatMap((lang) => REF_DOCS.map((d) => ({ lang, doc: d.slug })))
}

export function generateMetadata({ params }: { params: { lang: string; doc: string } }): Metadata {
  const d = REF_DOCS.find((x) => x.slug === params.doc)
  const lang = (params.lang === 'es' ? 'es' : 'en') as Lang
  if (!d) return { title: 'RAG Course | SlothLabs' }
  return {
    title: `${d.title[lang]} — RAG Course | SlothLabs`,
    description: d.desc[lang],
    alternates: { canonical: `${SITE_URL}/rag-course/${lang}/ref/${d.slug}` },
  }
}

export default function RefDocPage({ params }: { params: { lang: string; doc: string } }) {
  const lang = (params.lang === 'es' ? 'es' : 'en') as Lang
  if (!LANGS.includes(params.lang as Lang)) notFound()
  const d = REF_DOCS.find((x) => x.slug === params.doc)
  if (!d) notFound()
  const html = getRefDocHtml(lang, d.slug)
  if (!html) notFound()
  const otherLang: Lang = lang === 'es' ? 'en' : 'es'

  return (
    <main className="bg-[#050d1f] min-h-screen">
      <CustomCursor />
      <Navbar />

      <div className="border-b border-[#0e1f3a] bg-[#060d1e]/60">
        <div className="site-container py-6">
          <div className="flex items-center justify-between gap-4 mb-4 text-sm">
            <Link href="/rag-course/" className="text-[#8BA3C7] hover:text-white transition-colors">
              {UI.backToCourse[lang]}
            </Link>
            <Link
              href={`/rag-course/${otherLang}/ref/${d.slug}/`}
              className="px-3 py-1.5 rounded-full border border-[#1a3060] text-[#8BA3C7] hover:text-white hover:border-[#4DA6FF]/50 transition-colors text-xs font-semibold"
            >
              {otherLang === 'en' ? '🇬🇧 English' : '🇪🇸 Español'}
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border border-[#1a3060] bg-[#4DA6FF]/10 flex-shrink-0">
              {d.icon}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
              {d.title[lang]}
            </h1>
          </div>
        </div>
      </div>

      <div className="site-container py-8 max-w-4xl">
        <div className="course-md" dangerouslySetInnerHTML={{ __html: html }} />
        <div className="mt-12 pt-6 border-t border-[#0e1f3a] flex items-center justify-between text-sm">
          <Link href="/rag-course/" className="text-[#8BA3C7] hover:text-white transition-colors">
            {UI.backToCourse[lang]}
          </Link>
          <a
            href={`${REPO_URL}/blob/main/${lang}/referencia/${d.slug}.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#4DA6FF] hover:text-white transition-colors font-semibold"
          >
            {UI.viewRepo[lang]} →
          </a>
        </div>
      </div>

      <Footer />
    </main>
  )
}
