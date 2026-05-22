#!/usr/bin/env node
// Combines public/news/general.json + public/news/<app>orbitnews.json into
// public/news/feed.json — the single endpoint every Orbit app fetches.
//
// Run automatically via `npm run build` (prepended to next build).

import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const NEWS_DIR  = join(__dirname, '..', 'public', 'news')
const OUT_FILE  = join(NEWS_DIR, 'feed.json')

async function readFeed(name) {
  try {
    const raw = await readFile(join(NEWS_DIR, name), 'utf8')
    const json = JSON.parse(raw)
    if (!Array.isArray(json.items)) {
      console.warn(`[news] ${name}: missing items[] — skipped`)
      return []
    }
    return json.items
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn(`[news] ${name}: parse failed — ${err.message}`)
    }
    return []
  }
}

async function main() {
  const files = await readdir(NEWS_DIR).catch(() => [])
  const perAppFiles = files.filter(f => /news\.json$/.test(f) && f !== 'feed.json')

  const all = []
  all.push(...await readFeed('general.json'))
  for (const f of perAppFiles) all.push(...await readFeed(f))

  // Dedupe by id (later entries win — per-app overrides general)
  const byId = new Map()
  for (const item of all) byId.set(item.id, item)

  const items = [...byId.values()].sort((a, b) => {
    const p = (b.priority ?? 0) - (a.priority ?? 0)
    if (p !== 0) return p
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  })

  const feed = {
    version: 1,
    generatedAt: new Date().toISOString(),
    items,
  }

  await writeFile(OUT_FILE, JSON.stringify(feed, null, 2) + '\n', 'utf8')
  console.log(`[news] wrote ${OUT_FILE} — ${items.length} item(s) from ${perAppFiles.length + 1} source file(s)`)
}

main().catch(err => {
  console.error('[news] build failed:', err)
  process.exit(1)
})
