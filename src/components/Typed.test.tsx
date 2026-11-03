import { render, screen } from '@testing-library/react'
import { AssemblyProvider } from '../cursors/AssemblyProvider'
import { Section } from '../cursors/Section'
import { Typed } from './Typed'

beforeEach(() => {
  Object.defineProperty(document, 'fonts', { value: { ready: new Promise(() => {}) }, configurable: true })
})

describe('Typed', () => {
  it('splits its text into word spans separated by spaces, keeping the full text intact', () => {
    render(<Typed as="p" order={1} text="Full-stack developer who ships" data-testid="t" />)
    const el = screen.getByTestId('t')
    const words = [...el.querySelectorAll('[data-word]')]
    expect(words.map((w) => w.textContent)).toEqual(['Full-stack', 'developer', 'who', 'ships'])
    expect(el.textContent).toBe('Full-stack developer who ships')
    expect(el.tagName).toBe('P')
  })

  it('makes each word an inline-block so it can be moved on its own', () => {
    render(<Typed order={1} text="two words" data-testid="t" />)
    for (const word of screen.getByTestId('t').querySelectorAll('[data-word]')) {
      expect(word.className).toContain('inline-block')
    }
  })

  it('collapses extra whitespace and keeps an empty string empty', () => {
    const { rerender } = render(<Typed order={1} text="  spaced   out  " data-testid="t" />)
    expect(screen.getByTestId('t').textContent).toBe('spaced out')
    rerender(<Typed order={1} text="" data-testid="t" />)
    expect(screen.getByTestId('t').querySelectorAll('[data-word]')).toHaveLength(0)
  })

  it('keeps the accessible name of a heading or link intact', () => {
    render(
      <>
        <Typed as="h2" order={1} text="Things I've built" />
        <Typed as="a" order={2} text="HireZin" href="https://example.com/" />
      </>,
    )
    expect(screen.getByRole('heading', { level: 2, name: "Things I've built" })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'HireZin' })).toHaveAttribute('href', 'https://example.com/')
  })

  it('types trailing content too, as the last unit, so an icon never shows before the words', () => {
    render(<Typed as="span" order={1} text="Go now" trailing={<i data-testid="icon" />} data-testid="t" />)
    const el = screen.getByTestId('t')
    const units = [...el.querySelectorAll(':scope > [data-word]')]
    expect(units).toHaveLength(3)
    expect(units.at(-1)).toContainElement(screen.getByTestId('icon'))
    expect(el.lastElementChild).toBe(units.at(-1))
  })

  it('registers as a type item', () => {
    render(
      <AssemblyProvider>
        <Section id="about">
          <Typed order={3} text="hello there" data-testid="t" />
        </Section>
      </AssemblyProvider>,
    )
    const el = screen.getByTestId('t')
    expect(el).toHaveAttribute('data-gesture', 'type')
    expect(el).toHaveAttribute('data-assemble', 'pending')
  })
})
