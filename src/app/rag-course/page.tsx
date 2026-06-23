import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CustomCursor from '@/components/CustomCursor'
import CourseLanding from '@/components/course/CourseLanding'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://slothlabs.org'

export const metadata: Metadata = {
  title: 'RAG Course — RAG & Agentic AI from zero to expert | SlothLabs',
  description:
    'A free, open-source, bilingual (EN/ES) hands-on course on Retrieval-Augmented Generation and Agentic AI. Every topic in three layers — concept, from scratch in Python, real framework — with exercises you run in the browser.',
  openGraph: {
    title: 'RAG Course | SlothLabs',
    description:
      'Bilingual hands-on course: RAG & Agentic AI from zero to expert. Concept → from scratch → real framework, with in-browser Python exercises.',
    url: `${SITE_URL}/rag-course`,
    siteName: 'SlothLabs',
  },
  alternates: { canonical: `${SITE_URL}/rag-course` },
}

export default function RagCoursePage() {
  return (
    <main className="bg-[#050d1f] min-h-screen">
      <CustomCursor />
      <Navbar />
      <CourseLanding />
      <Footer />
    </main>
  )
}
