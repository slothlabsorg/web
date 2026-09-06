#!/usr/bin/env node
// Copies the course from its source repo into content/rag-course, which is what
// src/lib/course.ts reads at build time.
//
//   node scripts/sync-rag-course.mjs [--from <dir>] [--check]
//
// Source of truth is the rag-course repo (default ../rag-course). The copy under
// content/ is a build input, not a place to edit: anything changed there is lost
// on the next sync. --check reports what would change and exits 1 if anything
// would, without writing — useful in CI.
//
// Deliberately NOT wired into `prebuild`: Netlify builds only have the web repo
// checked out, so a sync there would fail or wipe the content. Run it by hand
// after editing the course, then commit both repos.

import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(name)
  return i === -1 ? null : (args[i + 1] ?? true)
}

const SRC = path.resolve(flag('--from') ?? path.join('..', 'rag-course'))
const DEST = path.resolve('content', 'rag-course')
const CHECK = args.includes('--check')
const LANGS = ['es', 'en']

// Editor/interpreter droppings that must never reach the web content.
const SKIP_DIRS = new Set(['__pycache__', '.git', 'node_modules', 'venv'])
const SKIP_FILES = new Set(['.DS_Store', 'Thumbs.db'])

if (!fs.existsSync(SRC)) {
  console.error(`✗ source not found: ${SRC}`)
  console.error('  Pass --from <dir> if the rag-course repo lives elsewhere.')
  process.exit(1)
}
for (const lang of LANGS) {
  if (!fs.existsSync(path.join(SRC, lang))) {
    console.error(`✗ source is missing ${lang}/ — is ${SRC} really the rag-course repo?`)
    process.exit(1)
  }
}

function walk(dir, base = dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue
      walk(path.join(dir, e.name), base, out)
    } else {
      if (SKIP_FILES.has(e.name)) continue
      out.push(path.relative(base, path.join(dir, e.name)))
    }
  }
  return out
}

const added = []
const changed = []
const removed = []

for (const lang of LANGS) {
  const srcLang = path.join(SRC, lang)
  const destLang = path.join(DEST, lang)

  const srcFiles = new Set(walk(srcLang))
  const destFiles = new Set(fs.existsSync(destLang) ? walk(destLang) : [])

  for (const rel of srcFiles) {
    const s = path.join(srcLang, rel)
    const d = path.join(destLang, rel)
    if (!fs.existsSync(d)) {
      added.push(`${lang}/${rel}`)
      if (!CHECK) {
        fs.mkdirSync(path.dirname(d), { recursive: true })
        fs.copyFileSync(s, d)
      }
    } else if (!fs.readFileSync(s).equals(fs.readFileSync(d))) {
      changed.push(`${lang}/${rel}`)
      if (!CHECK) fs.copyFileSync(s, d)
    }
  }

  // Files that exist only in the destination are stale — the source no longer
  // has them, so they'd render as orphan pages.
  for (const rel of destFiles) {
    if (srcFiles.has(rel)) continue
    removed.push(`${lang}/${rel}`)
    if (!CHECK) fs.rmSync(path.join(destLang, rel))
  }
}

const total = added.length + changed.length + removed.length
const list = (label, items) => {
  if (!items.length) return
  console.log(`\n  ${label} (${items.length}):`)
  for (const f of items.slice(0, 40)) console.log(`    ${f}`)
  if (items.length > 40) console.log(`    … and ${items.length - 40} more`)
}

console.log(`${CHECK ? 'Check' : 'Sync'}: ${SRC} → ${DEST}`)
list('added', added)
list('updated', changed)
list('deleted (stale in content/)', removed)

if (total === 0) {
  console.log('\n✅ content/rag-course is already in sync')
  process.exit(0)
}

if (CHECK) {
  console.log(`\n✗ ${total} file(s) out of sync — run without --check to apply`)
  process.exit(1)
}

console.log(`\n✅ synced ${total} file(s). Commit content/rag-course/ in this repo.`)
