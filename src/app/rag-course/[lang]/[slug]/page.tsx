import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CustomCursor from '@/components/CustomCursor'
import ModuleView from '@/components/course/ModuleView'
import { LANGS, MODULES, type DocType, type Lang } from '@/data/ragCourse'
import { getLabPayload, getModuleDocHtml, moduleHasFile } from '@/lib/course'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.org'
const DOC_TYPES: DocType[] = ['guia', 'ejercicios', 'soluciones', 'lab']

export function generateStaticParams() {
  return LANGS.flatMap((lang) => MODULES.map((m) => ({ lang, slug: m.slug })))
}

export function generateMetadata({ params }: { params: { lang: string; slug: string } }): Metadata {
  const m = MODULES.find((x) => x.slug === params.slug)
  const lang = (params.lang === 'es' ? 'es' : 'en') as Lang
  if (!m) return { title: 'RAG Course | SlothLabs' }
  const title = `M${m.n} · ${m.title[lang]} — RAG Course | SlothLabs`
  return {
    title,
    description: m.desc[lang],
    alternates: { canonical: `${SITE_URL}/rag-course/${lang}/${m.slug}` },
  }
}

export default function ModulePage({ params }: { params: { lang: string; slug: string } }) {
  const lang = (params.lang === 'es' ? 'es' : 'en') as Lang
  if (!LANGS.includes(params.lang as Lang)) notFound()
  const m = MODULES.find((x) => x.slug === params.slug)
  if (!m) notFound()

  const available = DOC_TYPES.filter((t) => moduleHasFile(lang, m.slug, t))
  const html: Partial<Record<DocType, string>> = {}
  for (const t of available) {
    const h = getModuleDocHtml(lang, m.slug, t)
    if (h) html[t] = h
  }
  const lab = getLabPayload(lang, m.slug)

  return (
    <main className="bg-[#050d1f] min-h-screen">
      <CustomCursor />
      <Navbar />
      <ModuleView
        lang={lang}
        slug={m.slug}
        n={m.n}
        icon={m.icon}
        accent={m.accent}
        title={m.title[lang]}
        available={available}
        html={html}
        lab={lab}
      />
      <Footer />
    </main>
  )
}
