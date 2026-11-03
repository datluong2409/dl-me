// Fails the build when the gzipped JavaScript in dist/assets exceeds the budget (spec: 150 KB).
// Override for a quick check: BUNDLE_BUDGET_KB=1 node scripts/check-bundle.mjs
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const dir = join(process.cwd(), 'dist', 'assets')
const budgetKb = Number(process.env.BUNDLE_BUDGET_KB ?? 150)

let files = []
try {
  files = readdirSync(dir).filter((name) => name.endsWith('.js'))
} catch {
  // handled below
}
if (files.length === 0) {
  console.error('No JavaScript found in dist/assets. Run `npm run build` first.')
  process.exit(1)
}

let totalBytes = 0
for (const name of files) {
  const bytes = gzipSync(readFileSync(join(dir, name))).length
  totalBytes += bytes
  console.log(`${name}: ${(bytes / 1024).toFixed(1)} KB gzip`)
}

const totalKb = totalBytes / 1024
console.log(`Total JS: ${totalKb.toFixed(1)} KB gzip (budget ${budgetKb} KB)`)
if (totalKb > budgetKb) {
  console.error('Over the JavaScript budget.')
  process.exit(1)
}
