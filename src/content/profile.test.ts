import { SECTION_IDS } from './sections'
import { experience, profile, projects, skillGroups } from './profile'

function isLocalized(value: unknown): value is { en: string; vi: string } {
  if (typeof value !== 'object' || value === null) return false
  const keys = Object.keys(value).sort()
  return keys.length === 2 && keys[0] === 'en' && keys[1] === 'vi'
}

function collectLocalized(value: unknown, out: { en: string; vi: string }[] = []) {
  if (isLocalized(value)) {
    out.push(value)
  } else if (Array.isArray(value)) {
    value.forEach((v) => collectLocalized(v, out))
  } else if (typeof value === 'object' && value !== null) {
    Object.values(value).forEach((v) => collectLocalized(v, out))
  }
  return out
}

describe('section ids', () => {
  it('lists the six sections in page order', () => {
    expect([...SECTION_IDS]).toEqual(['hero', 'about', 'skills', 'projects', 'experience', 'contact'])
  })
})

describe('profile content', () => {
  it('has non-empty English and Vietnamese text everywhere', () => {
    const all = collectLocalized({ profile, skillGroups, projects, experience })
    expect(all.length).toBeGreaterThan(30)
    for (const text of all) {
      expect(text.en.trim()).not.toBe('')
      expect(text.vi.trim()).not.toBe('')
    }
  })

  it('pins the hero copy from the spec', () => {
    expect(profile.heroGreeting).toEqual({ en: "Hi, I'm Dat Luong.", vi: 'Xin chào, tôi là Dat Luong.' })
    expect(profile.role.en).toBe('Full-stack developer — React, NestJS, and databases that stay fast.')
  })

  it('has the exact contact links from the README', () => {
    expect(profile.contact.email).toBe('mark.dat.code@gmail.com')
    expect(profile.contact.linkedin).toBe('https://www.linkedin.com/in/dat-luong/')
    expect(profile.contact.github).toBe('https://github.com/datluong2409')
  })

  it('has four domains, no CV yet and no photos yet', () => {
    expect(profile.domains).toHaveLength(4)
    expect(profile.cvUrl).toBeUndefined()
    expect(profile.photos).toEqual({})
  })

  it('marks owner-supplied facts as TODO placeholders', () => {
    expect(profile.quickFacts).toHaveLength(2)
    for (const fact of profile.quickFacts) {
      expect(fact.value.en.startsWith('TODO')).toBe(true)
      expect(fact.value.vi.startsWith('TODO')).toBe(true)
    }
    expect(experience).toHaveLength(2)
    for (const text of collectLocalized(experience)) {
      expect(text.en.startsWith('TODO')).toBe(true)
      expect(text.vi.startsWith('TODO')).toBe(true)
    }
  })
})

describe('skill groups', () => {
  it('has the five groups from the spec', () => {
    expect(skillGroups.map((g) => g.id)).toEqual(['frontend', 'backend', 'databases', 'devops', 'desktop-ai'])
    for (const group of skillGroups) expect(group.items.length).toBeGreaterThan(0)
  })
})

describe('projects', () => {
  it('lists the six README projects in order', () => {
    expect(projects.map((p) => p.slug)).toEqual([
      'hirezin',
      'transtube',
      'mealgogo',
      'linux-clipboard',
      'openmydear',
      'odata2orm',
    ])
  })

  it('uses the kinds from the spec', () => {
    expect(Object.fromEntries(projects.map((p) => [p.slug, p.kind]))).toEqual({
      hirezin: 'live',
      transtube: 'live',
      mealgogo: 'self-hosted',
      'linux-clipboard': 'open-source',
      openmydear: 'open-source',
      odata2orm: 'open-source',
    })
  })

  it('links to the live sites and GitHub repos over https', () => {
    const hrefs = Object.fromEntries(projects.map((p) => [p.slug, p.href]))
    expect(hrefs.hirezin).toBe('https://www.hirezin.com/')
    expect(hrefs.transtube).toBe('https://www.transtubee.com/en/')
    for (const slug of ['mealgogo', 'linux-clipboard', 'openmydear', 'odata2orm']) {
      expect(hrefs[slug]).toBe(`https://github.com/datluong2409/${slug}`)
    }
    for (const project of projects) expect(project.href.startsWith('https://')).toBe(true)
  })
})
