import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

// Project rule: styling is done with Tailwind utility classes. CSS files may only hold
// @import statements and the @theme block (design tokens and keyframes), never selector rules.

const srcDir = resolve(__dirname, '..')

function cssFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return cssFiles(path)
    return path.endsWith('.css') ? [path] : []
  })
}

function stripBlocks(css: string, opener: RegExp): string {
  let out = css
  for (;;) {
    const match = opener.exec(out)
    if (!match) return out
    let depth = 1
    let i = match.index + match[0].length
    while (i < out.length && depth > 0) {
      if (out[i] === '{') depth++
      else if (out[i] === '}') depth--
      i++
    }
    out = out.slice(0, match.index) + out.slice(i)
  }
}

function leftovers(css: string): string {
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const noImports = noComments.replace(/@import[^;]*;/g, '').replace(/@source[^;]*;/g, '')
  return stripBlocks(noImports, /@theme\s*(?:inline|static)?\s*\{/).trim()
}

const files = cssFiles(srcDir)

describe('styling uses Tailwind utilities, not hand-written CSS', () => {
  it('finds the stylesheets', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it.each(files.map((f) => [relative(srcDir, f), f]))('%s has no selector rules', (_name, file) => {
    expect(leftovers(readFileSync(file, 'utf8'))).toBe('')
  })

  it('limits Tailwind class scanning to index.html and src (not .claude skill docs)', () => {
    const global = readFileSync(resolve(srcDir, 'styles/global.css'), 'utf8')
    expect(global).toMatch(/@import\s+['"]tailwindcss['"]\s+source\(none\)/)
    expect(global).toMatch(/@source\s+['"]\.\.\/\.\.\/index\.html['"]/)
    expect(global).toMatch(/@source\s+['"]\.\.\/['"]/)
  })
})
