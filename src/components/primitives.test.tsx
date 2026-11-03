import { render, screen } from '@testing-library/react'
import { AssemblyProvider } from '../cursors/AssemblyProvider'
import { useAssembly } from '../cursors/context'
import type { AssemblyValue } from '../cursors/context'
import { Section } from '../cursors/Section'
import { LangProvider } from '../i18n/LangProvider'
import { Block } from './Block'
import { Card } from './Card'
import { Chip } from './Chip'
import { Container } from './Container'
import { SectionHeading } from './SectionHeading'

beforeEach(() => {
  Object.defineProperty(document, 'fonts', { value: { ready: new Promise(() => {}) }, configurable: true })
  localStorage.setItem('dl:lang', 'en')
})
afterEach(() => localStorage.clear())

function Probe({ onValue }: { onValue: (value: AssemblyValue | null) => void }) {
  onValue(useAssembly())
  return null
}

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

  it('makes nested blocks children of the block around them, and lets a group or a link be an item', () => {
    let value: AssemblyValue | null = null
    render(
      <AssemblyProvider>
        <Probe onValue={(v) => (value = v)} />
        <Section id="skills">
          <Block gesture="draw" order={1} data-testid="card">
            <Block as="div" gesture="group" order={1} data-testid="row">
              <Block as="a" gesture="stamp" order={1} href="#x" data-testid="link">
                go
              </Block>
            </Block>
          </Block>
        </Section>
      </AssemblyProvider>,
    )
    const items = value!.director.snapshot().items
    const byTestId = (id: string) => items.find((i) => i.el === screen.getByTestId(id))!
    expect(byTestId('card').parentId).toBeUndefined()
    expect(byTestId('row').parentId).toBe(byTestId('card').id)
    expect(byTestId('link').parentId).toBe(byTestId('row').id)
    expect(byTestId('link').gesture).toBe('stamp')
    expect(screen.getByTestId('link')).toHaveAttribute('href', '#x')
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
  it('is a stamp item whose order follows its index, with the chip look', () => {
    render(
      <AssemblyProvider>
        <Section id="skills">
          <Chip index={3}>React</Chip>
        </Section>
      </AssemblyProvider>,
    )
    const chip = screen.getByText('React')
    expect(chip).toHaveAttribute('data-gesture', 'stamp')
    expect(chip.className).toContain('rounded-full')
    expect(chip.className).toContain('font-mono')
  })

  it('is a plain tag outside an AssemblyProvider', () => {
    render(<Chip>Rust</Chip>)
    expect(screen.getByText('Rust')).not.toHaveAttribute('data-assemble')
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
    expect(h2).toHaveAttribute('data-gesture', 'type')
    expect(screen.getByText('Work')).toHaveAttribute('data-word')
    expect(h2.closest('header')).toHaveAttribute('data-gesture', 'group')
  })
})

describe('Container', () => {
  it('centres content at the 1120px page width with responsive gutters', () => {
    render(<Container data-testid="c">x</Container>)
    const className = screen.getByTestId('c').className
    for (const expected of ['mx-auto', 'max-w-[1120px]', 'px-4', 'sm:px-6', 'lg:px-8']) expect(className).toContain(expected)
  })
})
