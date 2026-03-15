#!/usr/bin/env node
/**
 * Extracts the circular face/icon from slothlabs-logo-transparent.png and saves
 * as favicon (app/icon.png). The icon is assumed to be in the left square of the logo.
 *
 * Usage: node scripts/extract-favicon.mjs [path-to-logo]
 */

import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const defaultInput = path.join(root, 'public/images/slothlabs-logo-transparent.png')
const outIcon = path.join(root, 'src/app/icon.png')
const outApple = path.join(root, 'src/app/apple-icon.png')

const inputPath = process.argv[2] || defaultInput

async function main() {
  const meta = await sharp(inputPath).metadata()
  const w = meta.width || 0
  const h = meta.height || 0
  if (!w || !h) {
    console.error('Could not read image dimensions:', inputPath)
    process.exit(1)
  }

  const size = Math.min(w, h)
  const left = 0
  const top = 0

  await sharp(inputPath)
    .extract({ left, top, width: size, height: size })
    .resize(32, 32)
    .png()
    .toFile(outIcon)
  console.log('Wrote', path.relative(root, outIcon))

  await sharp(inputPath)
    .extract({ left, top, width: size, height: size })
    .resize(180, 180)
    .png()
    .toFile(outApple)
  console.log('Wrote', path.relative(root, outApple))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
