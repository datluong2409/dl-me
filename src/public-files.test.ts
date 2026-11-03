import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const file = (name: string) => resolve(__dirname, '../public', name)

describe('public files for Cloudflare Pages', () => {
  it('caches hashed assets forever and sets basic security headers', () => {
    const headers = readFileSync(file('_headers'), 'utf8')
    expect(headers).toMatch(/\/assets\/\*\s+Cache-Control: public, max-age=31536000, immutable/)
    expect(headers).toMatch(/\/\*\s+X-Content-Type-Options: nosniff/)
    expect(headers).toContain('Referrer-Policy: strict-origin-when-cross-origin')
  })

  it('allows crawlers', () => {
    expect(readFileSync(file('robots.txt'), 'utf8')).toMatch(/User-agent: \*\s+Allow: \//)
  })

  it('has an SVG favicon', () => {
    expect(readFileSync(file('favicon.svg'), 'utf8').trimStart().startsWith('<svg')).toBe(true)
  })

  it('has a 1200x630 PNG placeholder for the social preview', () => {
    expect(existsSync(file('og.png'))).toBe(true)
    const png = readFileSync(file('og.png'))
    expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    expect(png.readUInt32BE(16)).toBe(1200)
    expect(png.readUInt32BE(20)).toBe(630)
  })
})
