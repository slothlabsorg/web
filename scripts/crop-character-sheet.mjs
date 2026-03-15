#!/usr/bin/env node
/**
 * Crops character-sheet.png (3×2 grid) into 6 separate PNGs with proper padding
 * so each pose is fully inside its cell (no cutting through the art).
 *
 * Usage: node scripts/crop-character-sheet.mjs [path-to-sheet]
 * Default path: public/images/character-sheet.png
 *
 * Layout: 3 columns × 2 rows. Edge padding and gutter between cells avoid "half" crops.
 */

import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const defaultInput = path.join(root, 'public/images/character-sheet.png')
const outDir = path.join(root, 'public/images')

const inputPath = process.argv[2] || defaultInput

const EDGE_PADDING = 15
const GUTTER_X = 12
const GUTTER_Y = 12
const COLS = 3
const ROWS = 2

async function main() {
  const meta = await sharp(inputPath).metadata()
  const width = meta.width || 0
  const height = meta.height || 0
  if (!width || !height) {
    console.error('Could not read image dimensions:', inputPath)
    process.exit(1)
  }

  const totalGutterX = (COLS - 1) * GUTTER_X
  const totalGutterY = (ROWS - 1) * GUTTER_Y
  const cellW = Math.floor((width - 2 * EDGE_PADDING - totalGutterX) / COLS)
  const cellH = Math.floor((height - 2 * EDGE_PADDING - totalGutterY) / ROWS)

  const pipeline = sharp(inputPath)
  let index = 0
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      index++
      const left = EDGE_PADDING + col * (cellW + GUTTER_X)
      const top = EDGE_PADDING + row * (cellH + GUTTER_Y)
      const outPath = path.join(outDir, `character-pose-${index}.png`)
      await pipeline
        .clone()
        .extract({ left, top, width: cellW, height: cellH })
        .png()
        .toFile(outPath)
      console.log(`Wrote ${path.relative(root, outPath)} (${cellW}x${cellH})`)
    }
  }
  console.log('Done. 6 poses saved to public/images/')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
