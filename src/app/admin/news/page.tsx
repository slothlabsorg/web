import type { Metadata } from 'next'
import NewsEditor from './NewsEditor'

export const metadata: Metadata = {
  title: 'News CMS · SlothLabs',
  robots: { index: false, follow: false, nocache: true },
}

export default function NewsAdminPage() {
  return <NewsEditor />
}
