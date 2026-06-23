// ─── RAG COURSE — build-time content loader (server only) ─────────────────────
// Reads markdown/data from content/rag-course and renders to HTML with syntax
// highlighting. Rewrites relative .md links to the corresponding web routes.

import fs from 'node:fs'
import path from 'node:path'
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import type { Lang, DocType } from '@/data/ragCourse'
import { REF_DOCS } from '@/data/ragCourse'

const ROOT = path.join(process.cwd(), 'content', 'rag-course')

function makeMarked() {
  return new Marked(
    markedHighlight({
      emptyLangClass: 'hljs',
      langPrefix: 'hljs language-',
      highlight(code, lang) {
        const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
        try {
          return hljs.highlight(code, { language }).value
        } catch {
          return hljs.highlight(code, { language: 'plaintext' }).value
        }
      },
    }),
  )
}

const REF_SLUGS = new Set(REF_DOCS.map((d) => d.slug))

const DOC_FILE: Record<DocType, string> = {
  guia: 'guia.md',
  ejercicios: 'ejercicios.md',
  soluciones: 'soluciones.md',
  lab: 'lab/enunciado.md',
}

function safeRead(p: string): string | null {
  try {
    if (!fs.existsSync(p)) return null
    return fs.readFileSync(p, 'utf8')
  } catch {
    return null
  }
}

// Rewrite a relative link found in course markdown to a web route (or the repo).
function rewriteHref(href: string, lang: Lang): string {
  if (!href) return href
  // Leave absolute URLs, mailto and pure in-page anchors untouched.
  if (/^(https?:|mailto:|#)/i.test(href)) return href

  const [rawPath, hash] = href.split('#')
  const anchor = hash ? `#${hash}` : ''
  const clean = rawPath.replace(/^\.\//, '')

  // referencia/<doc>.md  (with any number of ../ in front)
  const refMatch = clean.match(/(?:\.\.\/)*referencia\/([^/]+)\.md$/)
  if (refMatch && REF_SLUGS.has(refMatch[1])) {
    return `/rag-course/${lang}/ref/${refMatch[1]}/${anchor}`
  }
  // Sibling reference doc when already inside referencia/ (e.g. ./glosario.md)
  const bareRef = clean.match(/^([^/]+)\.md$/)
  if (bareRef && REF_SLUGS.has(bareRef[1])) {
    return `/rag-course/${lang}/ref/${bareRef[1]}/${anchor}`
  }
  // Cross-module: ../NN-name/<file>.md  → module page
  const modMatch = clean.match(/(?:\.\.\/)*(\d\d-[a-z0-9-]+)\/[^/]+\.md$/)
  if (modMatch) {
    return `/rag-course/${lang}/${modMatch[1]}/${anchor}`
  }
  // Same-module docs: guia.md, ejercicios.md, soluciones.md, lab/enunciado.md, ./expected.md …
  if (/(?:^|\/)(guia|ejercicios|soluciones)\.md$/.test(clean) || /(?:^|\/)lab\/[^/]+\.md$/.test(clean) || /(?:^|\/)expected\.md$/.test(clean)) {
    // We don't know the module here; keep the anchor and point within the same
    // page by stripping to a hash so navigation stays on the current module.
    return anchor || '#'
  }
  // Anything else that points at a repo file (.md/.py/examples/…): send to GitHub.
  const repoRel = clean.replace(/^(?:\.\.\/)+/, '')
  return `https://github.com/slothlabsorg/rag-course/blob/main/${lang}/${repoRel}${anchor}`
}

function rewriteLinks(html: string, lang: Lang): string {
  return html.replace(/href="([^"]*)"/g, (_m, href) => {
    const next = rewriteHref(href, lang)
    const external = /^https?:/i.test(next)
    return external
      ? `href="${next}" target="_blank" rel="noopener noreferrer"`
      : `href="${next}"`
  })
}

export function renderMarkdown(md: string, lang: Lang): string {
  const marked = makeMarked()
  const html = marked.parse(md) as string
  return rewriteLinks(html, lang)
}

export function getModuleDocHtml(lang: Lang, slug: string, type: DocType): string | null {
  const md = safeRead(path.join(ROOT, lang, slug, DOC_FILE[type]))
  if (md == null) return null
  return renderMarkdown(md, lang)
}

export function getRefDocHtml(lang: Lang, slug: string): string | null {
  const md = safeRead(path.join(ROOT, lang, 'referencia', `${slug}.md`))
  if (md == null) return null
  return renderMarkdown(md, lang)
}

// ─── Lab playground payload ───────────────────────────────────────────────────

export interface LabPayload {
  scratch: string | null            // reference from-scratch solution (starter)
  expectedHtml: string | null       // expected.md rendered
  solutionHtml: string | null       // solucion.md (walkthrough) rendered
  dataFiles: { path: string; content: string }[] // relative to lab/, written to FS
}

const TEXT_EXT = new Set(['.txt', '.md', '.json', '.csv', '.py', '.jsonl', '.tsv'])
const MAX_DATA_BYTES = 256 * 1024

function collectDataFiles(labDir: string): { path: string; content: string }[] {
  const datosDir = path.join(labDir, 'datos')
  const out: { path: string; content: string }[] = []
  if (!fs.existsSync(datosDir)) return out
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
      } else {
        const ext = path.extname(entry.name).toLowerCase()
        if (!TEXT_EXT.has(ext)) continue
        try {
          const stat = fs.statSync(full)
          if (stat.size > MAX_DATA_BYTES) continue
          const rel = path.relative(labDir, full).split(path.sep).join('/')
          out.push({ path: rel, content: fs.readFileSync(full, 'utf8') })
        } catch {
          /* skip */
        }
      }
    }
  }
  walk(datosDir)
  return out
}

export function getLabPayload(lang: Lang, slug: string): LabPayload {
  const labDir = path.join(ROOT, lang, slug, 'lab')
  const scratch = safeRead(path.join(labDir, 'solucion_scratch.py'))
  const expectedMd = safeRead(path.join(labDir, 'expected.md'))
  const solutionMd = safeRead(path.join(labDir, 'solucion.md'))
  return {
    scratch,
    expectedHtml: expectedMd ? renderMarkdown(expectedMd, lang) : null,
    solutionHtml: solutionMd ? renderMarkdown(solutionMd, lang) : null,
    dataFiles: collectDataFiles(labDir),
  }
}

export function moduleHasFile(lang: Lang, slug: string, type: DocType): boolean {
  return fs.existsSync(path.join(ROOT, lang, slug, DOC_FILE[type]))
}
