import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CustomCursor from '@/components/CustomCursor'

export default function NotFound() {
  return (
    <main className="bg-[#050d1f] min-h-screen flex flex-col">
      <CustomCursor />
      <Navbar />

      <section className="relative flex-1 flex items-center justify-center py-24 overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[400px] rounded-full blur-[140px] opacity-[0.07] bg-[#4DA6FF]" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-[100px] opacity-[0.05] bg-[#FF3670]" />
        </div>

        <div className="relative z-10 site-container">
          <div className="max-w-lg mx-auto text-center space-y-6">

            {/* Slothy */}
            <div className="relative inline-block">
              <Image
                src="/images/imslothy.png"
                alt="Hi, I'm Slothy!"
                width={280}
                height={280}
                className="w-52 h-auto object-contain mx-auto drop-shadow-2xl"
                priority
              />
              {/* Speech bubble */}
              <div
                className="absolute -top-4 -right-6 px-3 py-1.5 rounded-xl text-xs font-bold border rotate-3 whitespace-nowrap"
                style={{
                  background: '#0d1b3e',
                  borderColor: '#1a3060',
                  color: '#4DA6FF',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                }}
              >
                404 😬
              </div>
            </div>

            {/* Heading */}
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-[#4A6080] mb-2">
                Page not found
              </p>
              <h1
                className="text-3xl md:text-4xl font-bold text-white leading-tight"
                style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}
              >
                Even Slothy couldn&apos;t<br />find this page.
              </h1>
            </div>

            <p className="text-[#8BA3C7] text-base leading-relaxed">
              The link you followed might be broken, the page was moved, or Slothy accidentally deleted it while napping.
              Either way — it&apos;s gone.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link
                href="/"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#F5A623] text-[#050d1f] font-bold text-sm hover:brightness-110 transition-all hover:-translate-y-0.5"
              >
                Back to home
              </Link>
              <Link
                href="/#products"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-full border border-[#1a3060] text-[#8BA3C7] text-sm font-medium hover:text-white hover:border-[#4DA6FF]/40 transition-all"
              >
                Browse products →
              </Link>
            </div>

            <p className="text-xs text-[#2a3a54] pt-2">
              Slothy says: &quot;I was going to fix this but I fell asleep. Sorry.&quot;
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
