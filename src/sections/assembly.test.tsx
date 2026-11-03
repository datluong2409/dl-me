import { render } from '@testing-library/react'
import { AssemblyProvider } from '../cursors/AssemblyProvider'
import { useAssembly } from '../cursors/context'
import type { AssemblyValue } from '../cursors/context'
import type { Item } from '../cursors/types'
import { LangProvider } from '../i18n/LangProvider'
import { About } from './About'
import { Contact } from './Contact'
import { Experience } from './Experience'
import { Hero } from './Hero'
import { Projects } from './Projects'
import { Skills } from './Skills'

function Probe({ onValue }: { onValue: (value: AssemblyValue | null) => void }) {
  onValue(useAssembly())
  return null
}

function assemble() {
  let value: AssemblyValue | null = null
  const view = render(
    <LangProvider>
      <AssemblyProvider>
        <Probe onValue={(v) => (value = v)} />
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Experience />
        <Contact />
      </AssemblyProvider>
    </LangProvider>,
  )
  return { ...view, items: value!.director.snapshot().items }
}

beforeEach(() => {
  Object.defineProperty(document, 'fonts', { value: { ready: new Promise(() => {}) }, configurable: true })
  localStorage.setItem('dl:lang', 'en')
})
afterEach(() => localStorage.clear())

const SECTIONS = ['hero', 'about', 'skills', 'projects', 'experience', 'contact']

describe('assembly structure of the sections', () => {
  it('registers items in all six sections', () => {
    const { items } = assemble()
    for (const id of SECTIONS) expect(items.filter((i) => i.sectionId === id).length, id).toBeGreaterThan(2)
  })

  it('gives every child a parent that exists in the same section', () => {
    const { items } = assemble()
    const byId = new Map(items.map((i) => [i.id, i]))
    for (const item of items) {
      if (!item.parentId) continue
      expect(byId.get(item.parentId)?.sectionId, `${item.el.tagName} in ${item.sectionId}`).toBe(item.sectionId)
    }
  })

  it('never gives two siblings the same order, so the sequence is unambiguous', () => {
    const { items } = assemble()
    const seen = new Map<string, Item>()
    for (const item of items) {
      const key = `${item.sectionId}|${item.parentId ?? ''}|${item.order}`
      expect(seen.has(key), `duplicate order ${item.order} under ${item.parentId ?? item.sectionId}`).toBe(false)
      seen.set(key, item)
    }
  })

  it('keeps each section within the budget: at most 10 top-level items and 64 in all', () => {
    const { items } = assemble()
    for (const id of SECTIONS) {
      const inSection = items.filter((i) => i.sectionId === id)
      expect(inSection.filter((i) => !i.parentId).length, id).toBeLessThanOrEqual(10)
      expect(inSection.length, id).toBeLessThanOrEqual(64)
    }
  })

  it('splits every typed item into word spans, and nothing else', () => {
    const { items } = assemble()
    const typed = items.filter((i) => i.gesture === 'type')
    expect(typed.length).toBeGreaterThan(30)
    for (const item of typed) expect(item.el.querySelectorAll('[data-word]').length, item.el.textContent ?? '').toBeGreaterThan(0)
    for (const item of items.filter((i) => i.gesture !== 'type')) {
      const own = [...item.el.querySelectorAll('[data-word]')].filter((w) => w.closest('[data-gesture="type"]') === null)
      expect(own, item.el.tagName).toHaveLength(0)
    }
  })

  it('only gives a stamp or a type item to a parent, never the other way round', () => {
    const { items } = assemble()
    const byId = new Map(items.map((i) => [i.id, i]))
    for (const item of items) {
      const parent = item.parentId ? byId.get(item.parentId) : undefined
      if (parent) expect(['stamp', 'type'], `parent of ${item.gesture}`).not.toContain(parent.gesture)
    }
  })

  it('draws the cards and buttons, types the text, stamps the small tags', () => {
    const { items } = assemble()
    const count = (gesture: string) => items.filter((i) => i.gesture === gesture).length
    expect(count('draw')).toBeGreaterThanOrEqual(20)
    expect(count('stamp')).toBeGreaterThanOrEqual(30)
    expect(count('group')).toBeGreaterThanOrEqual(8)
  })
})

describe('what each section assembles in detail', () => {
  const gesturesOf = (items: Item[], parent: Item) => items.filter((i) => i.parentId === parent.id).map((i) => i.gesture)
  const cardOf = (items: Item[], el: Element) => items.find((i) => i.el === el)!

  it('hero: types the headline, role and pitch; the call to action is a group of drawn buttons with typed labels', () => {
    const { items, container } = assemble()
    const hero = items.filter((i) => i.sectionId === 'hero')
    const typed = hero.filter((i) => i.gesture === 'type' && !i.parentId)
    expect(typed.map((i) => i.el.tagName)).toEqual(['H1', 'P', 'P'])
    const group = hero.find((i) => i.gesture === 'group' && i.el.querySelector('a[href="#contact"]'))!
    const buttons = hero.filter((i) => i.parentId === group.id)
    expect(buttons.map((b) => b.gesture)).toEqual(['draw'])
    expect(gesturesOf(items, buttons[0])).toEqual(['type'])
    expect(container.querySelector('#hero [data-gesture="stamp"]')).not.toBeNull() // the availability chip
  })

  it('about: types the heading and the bio, stamps the four domains, draws a facts card with typed rows', () => {
    const { items, container } = assemble()
    const about = items.filter((i) => i.sectionId === 'about')
    const domains = about.find((i) => i.gesture === 'group' && i.el.tagName === 'UL')!
    expect(gesturesOf(items, domains)).toEqual(['stamp', 'stamp', 'stamp', 'stamp'])
    const facts = about.find((i) => i.gesture === 'draw' && i.el.querySelector('dl'))!
    expect(gesturesOf(items, facts)).toEqual(['type', 'type', 'type', 'type'])
    expect(container.querySelectorAll('#about h2 [data-word]').length).toBeGreaterThan(0)
  })

  it('skills: each card is drawn, then its title typed, its chips stamped and its note typed', () => {
    const { items, container } = assemble()
    for (const card of container.querySelectorAll('#skills article')) {
      const item = cardOf(items, card)
      expect(item.gesture).toBe('draw')
      const kids = gesturesOf(items, item)
      expect(kids[0]).toBe('type')
      expect(kids.filter((g) => g === 'stamp').length).toBeGreaterThanOrEqual(2)
    }
  })

  it('projects: each card draws its photo, types its name, stamps its badge and chips, types its summary', () => {
    const { items, container } = assemble()
    const cards = [...container.querySelectorAll('#projects article')]
    expect(cards).toHaveLength(6)
    for (const card of cards) {
      const item = cardOf(items, card)
      const kids = items.filter((i) => i.parentId === item.id).sort((a, b) => a.order - b.order)
      expect(kids.slice(0, 4).map((k) => k.gesture)).toEqual(['draw', 'type', 'stamp', 'type'])
      expect(kids.slice(4).every((k) => k.gesture === 'stamp')).toBe(true)
      expect(kids.length).toBeGreaterThanOrEqual(6)
    }
  })

  it('experience: each entry is drawn, then role, company, period and bullets are typed', () => {
    const { items, container } = assemble()
    for (const entry of container.querySelectorAll('#experience ol > li')) {
      const kids = gesturesOf(items, cardOf(items, entry))
      expect(kids).toEqual(['type', 'type', 'type', 'type', 'type'])
    }
  })

  it('contact: types the invitation; the links are a group of drawn buttons with typed labels', () => {
    const { items } = assemble()
    const contact = items.filter((i) => i.sectionId === 'contact')
    const group = contact.find((i) => i.gesture === 'group' && i.el.querySelector('a[href^="mailto:"]'))!
    const buttons = contact.filter((i) => i.parentId === group.id)
    expect(buttons.map((b) => b.gesture)).toEqual(['draw', 'draw', 'draw'])
    for (const button of buttons) expect(gesturesOf(items, button)).toEqual(['type'])
  })
})
