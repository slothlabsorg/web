import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CustomCursor from '@/components/CustomCursor'
import PricingSupportCTA from '@/components/PricingSupportCTA'

export default function NotFound() {
  return (
    <main className="bg-[#050d1f] min-h-screen">
      <CustomCursor />
      <Navbar />
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#4DA6FF]/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#00D4FF]/8 blur-3xl rounded-full translate-y-1/2 -translate-x-1/4" />
        </div>
        <div className="relative z-10 site-container text-center">
          <div className="max-w-2xl mx-auto">
            <Image
              src="/images/404.png"
              alt="Page not found — SlothLabs"
              width={560}
              height={400}
              className="w-full h-auto object-contain mb-8"
              priority
            />
            <h1
              className="text-3xl md:text-4xl font-bold text-white mb-4"
              style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}
            >
              Oops! This page drifted into space.
            </h1>
            <p className="text-[#8BA3C7] text-lg mb-8">
              The link you followed might be broken or the page was moved. No worries — you can head back home or explore our products.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#F5A623] text-[#050d1f] font-bold text-sm hover:brightness-110 transition-all"
            >
              Back to home
            </Link>
          </div>
        </div>
      </section>
      <PricingSupportCTA />
      <Footer />
    </main>
  )
}
