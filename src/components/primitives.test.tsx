import { render, screen } from '@testing-library/react'
import { AssemblyProvider } from '../cursors/AssemblyProvider'
import { Section } from '../cursors/Section'
import { LangProvider } from '../i18n/LangProvider'
import { Block } from './Block'
import { Card } from './Card'
import { Chip } from './Chip'
import { SectionHeading } from './SectionHeading'

beforeEach(() => {
  Object.defineProperty(document, 'fonts', { value: { ready: new Promise(() => {}) }, configurable: true })
  localStorage.setItem('dl:lang', 'en')
})
afterEach(() => localStorage.clear())

describe('Block', () => {
  it('renders the chosen tag with its classes plus group, and registers itself as an item', () => {
    render(
      <AssemblyProvider>
        <Section id="about">
          <Block as="p" gesture="drop" order={2} className="text-fg" data-testid="b">
            hello
          </Block>
        </Section>
      </AssemblyProvider>,
    )
    const el = screen.getByTestId('b')
    expect(el.tagName).toBe('P')
    expect(el.className).toContain('text-fg')
    expect(el.className).toContain('group')
    expect(el).toHaveAttribute('data-assemble', 'pending')
    expect(el).toHaveAttribute('data-gesture', 'drop')
  })

  it('is a plain element outside an AssemblyProvider', () => {
    render(
      <Block gesture="drop" order={1} data-testid="b">
        x
      </Block>,
    )
    expect(screen.getByTestId('b')).not.toHaveAttribute('data-assemble')
  })
})

describe('Card', () => {
  it('is a draw item with card styling', () => {
    render(
      <AssemblyProvider>
        <Section id="skills">
          <Card order={3} data-testid="c">
            body
          </Card>
        </Section>
      </AssemblyProvider>,
    )
    const el = screen.getByTestId('c')
    expect(el).toHaveAttribute('data-gesture', 'draw')
    expect(el.className).toContain('rounded-xl')
    expect(el.className).toContain('border-border')
  })
})

describe('Chip', () => {
  it('sets its stagger index and uses the chip animation classes', () => {
    render(<Chip index={3}>React</Chip>)
    const chip = screen.getByText('React')
    expect(chip.style.getPropertyValue('--i')).toBe('3')
    expect(chip.className).toContain('motion-safe:group-data-[assemble=done]:animate-chip-in')
  })
})

describe('SectionHeading', () => {
  it('renders an h2 with the id, the eyebrow and the title in the active language', () => {
    render(
      <LangProvider>
        <AssemblyProvider>
          <Section id="projects">
            <SectionHeading
              id="projects-title"
              order={1}
              eyebrow={{ en: 'Work', vi: 'Công việc' }}
              title={{ en: 'Things I built', vi: 'Những gì tôi làm' }}
            />
          </Section>
        </AssemblyProvider>
      </LangProvider>,
    )
    const h2 = screen.getByRole('heading', { level: 2, name: 'Things I built' })
    expect(h2).toHaveAttribute('id', 'projects-title')
    expect(screen.getByText('Work')).toBeInTheDocument()
    expect(h2.closest('[data-gesture]')).toHaveAttribute('data-gesture', 'drop')
  })
})
