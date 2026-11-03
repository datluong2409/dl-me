import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { AGENTS } from '../cursors/agents'

const css = readFileSync(resolve(__dirname, 'tokens.css'), 'utf8')
const token: Record<string, string> = {}
for (const m of css.matchAll(/--color-([\w-]+):\s*(#[0-9A-Fa-f]{6})/g)) token[m[1]] = m[2]

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe('text contrast (WCAG AA, 4.5:1)', () => {
  const pairs: [string, string, string][] = [
    ['fg', 'fg', 'bg'],
    ['fg-muted on bg', 'fg-muted', 'bg'],
    ['fg-muted on surface', 'fg-muted', 'surface'],
    ['accent on bg', 'accent', 'bg'],
    ['bg on accent', 'bg', 'accent'],
  ]
  it.each(pairs)('%s', (_name, foreground, background) => {
    expect(contrast(token[foreground], token[background])).toBeGreaterThanOrEqual(4.5)
  })

  it.each(AGENTS.map((a) => [a.name, a.color]))('cursor tag text (bg) on %s', (_name, color) => {
    expect(contrast(token.bg, color)).toBeGreaterThanOrEqual(4.5)
  })
})
