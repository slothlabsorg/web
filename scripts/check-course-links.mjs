#!/usr/bin/env node
// Resolves every relative link in the course markdown against the files that
// actually exist on disk, and reports the ones that point at nothing.
//
//   node scripts/check-course-links.mjs [contentDir]
//
// Default contentDir is content/rag-course. Exits 1 if any link is unresolvable,
// so it can gate a build. Links to http(s), mailto and bare anchors are skipped.
//
// This checks the SOURCE markdown, independently of how src/lib/course.ts later
// rewrites hrefs for the web — a link that doesn't resolve here is broken no
// matter what the rewriter does with it.

import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(process.argv[2] ?? 'content/rag-course')

// Paths that live in the ragorbit repo, not the course repo. They can't be
// resolved on disk here, and the rewriter sends them to GitHub — so we only
// sanity-check their shape, and report them separately.
const RAGORBIT_PREFIX = /^(?:\.\.\/)*(?:docs|examples)\//

const LINK_RE = /\[(?:[^\]\\]|\\.)*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g

// `TOOLS[name](**args)` in prose parses as a markdown link. A real link target
// starts with a path character, never `*`.
const PATH_LIKE = /^[A-Za-z0-9._~/#-]/

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name === '__pycache__') continue
      walk(full, out)
    } else if (e.name.endsWith('.md')) {
      out.push(full)
    }
  }
  return out
}

const broken = []
const ragorbitLinks = []
let checked = 0

for (const file of walk(ROOT)) {
  const md = fs.readFileSync(file, 'utf8')
  const fileDir = path.dirname(file)

  // Strip fenced code blocks — links inside them are illustrative, not navigation.
  const scrubbed = md.replace(/```[\s\S]*?```/g, (m) => m.replace(/[^\n]/g, ' '))

  for (const m of scrubbed.matchAll(LINK_RE)) {
    const raw = m[1]
    if (/^(https?:|mailto:|#)/i.test(raw)) continue
    if (!PATH_LIKE.test(raw)) continue

    const [target] = raw.split('#')
    if (!target) continue // pure anchor
    checked++

    const rel = path.posix.normalize(target)

    if (RAGORBIT_PREFIX.test(target)) {
      ragorbitLinks.push({ file, raw })
      continue
    }

    // Resolve against the linking file's directory.
    const resolved = path.resolve(fileDir, rel)
    const exists =
      fs.existsSync(resolved) ||
      // A directory link may be written with or without the trailing slash.
      fs.existsSync(resolved.replace(/\/$/, ''))

    if (!exists) {
      broken.push({ file: path.relative(ROOT, file), raw, resolved: path.relative(ROOT, resolved) })
    }
  }
}

const byLang = (list) =>
  list.reduce((acc, b) => {
    const lang = (b.file ?? '').split(path.sep)[0] || '?'
    acc[lang] = (acc[lang] ?? 0) + 1
    return acc
  }, {})

console.log(`Course link check — ${ROOT}`)
console.log(`  relative links checked : ${checked}`)
console.log(`  → ragorbit repo (docs/, examples/): ${ragorbitLinks.length}  (resolved off-disk, not checked here)`)
console.log(`  unresolvable on disk   : ${broken.length}`, broken.length ? byLang(broken) : '')

if (broken.length) {
  console.log('\nBroken links:')
  const grouped = new Map()
  for (const b of broken) {
    if (!grouped.has(b.file)) grouped.set(b.file, [])
    grouped.get(b.file).push(b)
  }
  for (const [file, list] of [...grouped].sort()) {
    console.log(`\n  ${file}`)
    for (const b of list) console.log(`    ${b.raw}`)
  }
  process.exit(1)
}

console.log('\n✅ every relative link resolves to a file on disk')
