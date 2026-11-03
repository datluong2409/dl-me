import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const css = readFileSync(resolve(__dirname, 'tokens.css'), 'utf8')

function tokens(): Record<string, string> {
  const out: Record<string, string> = {}
  for (const m of css.matchAll(/--color-([\w-]+):\s*(#[0-9A-Fa-f]{6})/g)) {
    out[m[1]] = m[2].toUpperCase()
  }
  return out
}

describe('design tokens', () => {
  it('match the spec values exactly', () => {
    expect(tokens()).toEqual({
      bg: '#0A0D12',
      surface: '#11161D',
      border: '#232C3A',
      fg: '#F1F5F9',
      'fg-muted': '#94A3B8',
      accent: '#22C55E',
      ring: '#F1F5F9',
    })
  })
})
