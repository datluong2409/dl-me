import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const html = readFileSync(resolve(__dirname, '../index.html'), 'utf8')
const doc = new DOMParser().parseFromString(html, 'text/html')

const meta = (attr: 'name' | 'property', key: string) =>
  doc.querySelector(`meta[${attr}="${key}"]`)?.getAttribute('content') ?? ''

describe('index.html', () => {
  it('declares English as the document language and a dark colour scheme', () => {
    expect(doc.documentElement.getAttribute('lang')).toBe('en')
    expect(meta('name', 'color-scheme')).toBe('dark')
  })

  it('has a description and Open Graph / Twitter metadata', () => {
    expect(meta('name', 'description').length).toBeGreaterThan(50)
    expect(meta('property', 'og:title')).toBe('Dat Luong — Full-stack Developer')
    expect(meta('property', 'og:description').length).toBeGreaterThan(50)
    expect(meta('property', 'og:image')).toMatch(/og\.png$/)
    expect(meta('property', 'og:type')).toBe('website')
    expect(meta('name', 'twitter:card')).toBe('summary_large_image')
  })

  it('links the SVG favicon', () => {
    expect(doc.querySelector('link[rel="icon"]')?.getAttribute('href')).toBe('/favicon.svg')
  })

  it('describes the person with JSON-LD', () => {
    const json = doc.querySelector('script[type="application/ld+json"]')?.textContent ?? ''
    const data = JSON.parse(json)
    expect(data['@type']).toBe('Person')
    expect(data.name).toBe('Dat Luong')
    expect(data.sameAs).toEqual(
      expect.arrayContaining(['https://github.com/datluong2409', 'https://www.linkedin.com/in/dat-luong/']),
    )
  })

  it('shows a static fallback with name, role and contact links when JavaScript is off', () => {
    // DOMParser keeps <noscript> content as text when scripting is enabled, so read the raw markup.
    const noscript = html.match(/<noscript>([\s\S]*?)<\/noscript>/)?.[1] ?? ''
    expect(noscript).toContain('Dat Luong')
    expect(noscript).toContain('Full-stack developer')
    expect(noscript).toContain('mailto:mark.dat.code@gmail.com')
    expect(noscript).toContain('https://www.linkedin.com/in/dat-luong/')
    expect(noscript).toContain('https://github.com/datluong2409')
  })
})
