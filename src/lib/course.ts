// ─── RAG COURSE — build-time content loader (server only) ─────────────────────
// Reads markdown/data from content/rag-course and renders to HTML with syntax
// highlighting. Rewrites relative .md links to the corresponding web routes.

import fs from 'node:fs'
import path from 'node:path'
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import type { Lang, DocType } from '@/data/ragCourse'
import { MODULES, REF_DOCS } from '@/data/ragCourse'

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

// ─── Link rewriting ───────────────────────────────────────────────────────────
// Course markdown is authored to be read in the repo, so its links are relative
// file paths. To rewrite one correctly you have to know where it was written
// FROM — `../guia.md` means different things in `es/02-ingesta/soluciones.md` and
// in `es/02-ingesta/lab/enunciado.md`. That context is what `LinkCtx` carries.

const COURSE_REPO = 'https://github.com/slothlabsorg/rag-course'
const RAGORBIT_REPO = 'https://github.com/slothlabsorg/ragorbit'
const MODULE_SLUGS = new Set(MODULES.map((m) => m.slug))

/** Where the markdown being rendered lives, so relative links can resolve. */
export interface LinkCtx {
  lang: Lang
  /** Module slug, for module and lab docs. Absent for reference docs. */
  module?: string
  /** Which directory the file sits in, relative to the module. */
  dir: 'module' | 'lab' | 'referencia'
}

/** Directory of the source file, as a path relative to content/rag-course. */
function sourceDir(ctx: LinkCtx): string {
  if (ctx.dir === 'referencia') return `${ctx.lang}/referencia`
  if (ctx.dir === 'lab') return `${ctx.lang}/${ctx.module}/lab`
  return `${ctx.lang}/${ctx.module}`
}

/** `docs/` and `examples/` live in the ragorbit repo, not this one.
 *  The course was originally authored inside ragorbit, so its links reach out
 *  with `../../docs/…`; resolving those as course paths is what produced 244
 *  dead links. Intent is detected from the path, not from the `../` depth. */
function ragorbitTarget(href: string): string | null {
  const bare = href.replace(/^\.\//, '').replace(/^(?:\.\.\/)+/, '')
  if (!/^(docs|examples)\//.test(bare)) return null
  const isDir = bare.endsWith('/') || !bare.split('/').pop()!.includes('.')
  const kind = isDir ? 'tree' : 'blob'
  return `${RAGORBIT_REPO}/${kind}/main/${bare.replace(/\/$/, '')}`
}

const DOC_BY_FILE: Record<string, DocType> = {
  'guia.md': 'guia',
  'ejercicios.md': 'ejercicios',
  'soluciones.md': 'soluciones',
}

export interface RewrittenHref {
  href: string
  /** When set, the link stays on the page and switches to this tab. */
  tab?: DocType
}

export function rewriteHref(href: string, ctx: LinkCtx): RewrittenHref {
  if (!href) return { href }
  if (/^(https?:|mailto:|#)/i.test(href)) return { href }

  const [rawPath, hash] = href.split('#')
  const anchor = hash ? `#${hash}` : ''
  if (!rawPath) return { href: anchor || href }

  const ragorbit = ragorbitTarget(rawPath)
  if (ragorbit) return { href: `${ragorbit}${anchor}` }

  // Resolve against the source directory to get a path relative to the course root.
  const resolved = path.posix
    .normalize(path.posix.join(sourceDir(ctx), rawPath))
    .replace(/^\/+/, '')
  const segments = resolved.split('/').filter(Boolean)
  const [lang, ...rest] = segments
  const isCourseLang = lang === 'es' || lang === 'en'
  const file = segments[segments.length - 1]

  if (isCourseLang && rest.length > 0) {
    // referencia/<slug>.md → the on-site reference page
    if (rest[0] === 'referencia' && rest.length === 2) {
      const slug = rest[1].replace(/\.md$/, '')
      if (REF_SLUGS.has(slug)) return { href: `/rag-course/${lang}/ref/${slug}/${anchor}` }
    }

    if (MODULE_SLUGS.has(rest[0])) {
      const mod = rest[0]
      const tail = rest.slice(1)
      const sameModule = mod === ctx.module

      // The module directory itself → its page.
      if (tail.length === 0) return { href: `/rag-course/${lang}/${mod}/${anchor}` }

      // A tabbed document of a module page.
      let tab: DocType | undefined
      if (tail.length === 1) tab = DOC_BY_FILE[tail[0]]
      else if (tail[0] === 'lab' && tail[1] === 'enunciado.md') tab = 'lab'

      if (tab) {
        const base = `/rag-course/${lang}/${mod}/?tab=${tab}${anchor}`
        // Same module: keep the reader on the page and switch tab in place.
        return sameModule ? { href: anchor || '#', tab } : { href: base }
      }

      // expected.md / solucion.md render inside the lab tab as collapsibles.
      if (tail[0] === 'lab' && /^(expected|solucion)\.md$/.test(tail[tail.length - 1])) {
        const base = `/rag-course/${lang}/${mod}/?tab=lab${anchor}`
        return sameModule ? { href: anchor || '#', tab: 'lab' } : { href: base }
      }

      // Anything else in a module (the .py solutions, lab data) → the repo.
      return { href: `${COURSE_REPO}/blob/main/${resolved}${anchor}` }
    }
  }

  // Course root docs (PLAN.md, HANDOFF.md, README.md) and anything unresolved.
  const isDir = rawPath.endsWith('/') || !file.includes('.')
  const kind = isDir ? 'tree' : 'blob'
  return { href: `${COURSE_REPO}/${kind}/main/${resolved.replace(/\/$/, '')}${anchor}` }
}

function rewriteLinks(html: string, ctx: LinkCtx): string {
  return html.replace(/href="([^"]*)"/g, (_m, raw) => {
    const { href, tab } = rewriteHref(raw, ctx)
    if (tab) {
      // ModuleView delegates clicks on these and switches tab without navigating.
      return `href="${href}" data-course-tab="${tab}"`
    }
    return /^https?:/i.test(href)
      ? `href="${href}" target="_blank" rel="noopener noreferrer"`
      : `href="${href}"`
  })
}

export function renderMarkdown(md: string, ctx: LinkCtx): string {
  const marked = makeMarked()
  const html = marked.parse(md) as string
  return rewriteLinks(html, ctx)
}

export function getModuleDocHtml(lang: Lang, slug: string, type: DocType): string | null {
  const md = safeRead(path.join(ROOT, lang, slug, DOC_FILE[type]))
  if (md == null) return null
  return renderMarkdown(md, {
    lang,
    module: slug,
    dir: type === 'lab' ? 'lab' : 'module',
  })
}

export function getRefDocHtml(lang: Lang, slug: string): string | null {
  const md = safeRead(path.join(ROOT, lang, 'referencia', `${slug}.md`))
  if (md == null) return null
  return renderMarkdown(md, { lang, dir: 'referencia' })
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
  const labCtx: LinkCtx = { lang, module: slug, dir: 'lab' }
  const scratch = safeRead(path.join(labDir, 'solucion_scratch.py'))
  const expectedMd = safeRead(path.join(labDir, 'expected.md'))
  const solutionMd = safeRead(path.join(labDir, 'solucion.md'))
  return {
    scratch,
    // expected.md and solucion.md live in lab/, so their relative links resolve
    // from there — not from the module directory.
    expectedHtml: expectedMd ? renderMarkdown(expectedMd, labCtx) : null,
    solutionHtml: solutionMd ? renderMarkdown(solutionMd, labCtx) : null,
    dataFiles: collectDataFiles(labDir),
  }
}

export function moduleHasFile(lang: Lang, slug: string, type: DocType): boolean {
  return fs.existsSync(path.join(ROOT, lang, slug, DOC_FILE[type]))
}
