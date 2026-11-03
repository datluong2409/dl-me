import { StrictMode } from 'react'
import { act, render, screen } from '@testing-library/react'
import { AssemblyProvider } from './AssemblyProvider'
import { Section } from './Section'
import { useAssembly } from './context'
import type { AssemblyValue } from './context'
import { useAssemble } from './useAssemble'

function Item({ testId = 'item' }: { testId?: string }) {
  const ref = useAssemble<HTMLDivElement>({ gesture: 'drop', order: 1 })
  return (
    <div ref={ref} data-testid={testId}>
      item
    </div>
  )
}

function Probe({ onValue }: { onValue: (value: AssemblyValue | null) => void }) {
  onValue(useAssembly())
  return null
}

function mockReducedMotion(reduced: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: reduced,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  )
}

beforeEach(() => {
  // Keep the initial viewport evaluation from running: jsdom has no layout, so every section would look "above the fold".
  Object.defineProperty(document, 'fonts', { value: { ready: new Promise(() => {}) }, configurable: true })
})

afterEach(() => {
  vi.restoreAllMocks()
  Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true, writable: true })
})

describe('useAssemble', () => {
  it('registers the element as pending with its gesture and drop offsets', () => {
    render(
      <AssemblyProvider>
        <Section id="about">
          <Item />
        </Section>
      </AssemblyProvider>,
    )
    const el = screen.getByTestId('item')
    expect(el).toHaveAttribute('data-assemble', 'pending')
    expect(el).toHaveAttribute('data-gesture', 'drop')
    expect(el.style.getPropertyValue('--ax')).toMatch(/px$/)
  })

  it('does nothing outside an AssemblyProvider', () => {
    render(<Item />)
    expect(screen.getByTestId('item')).not.toHaveAttribute('data-assemble')
  })

  it('leaves nothing hidden when the user prefers reduced motion', () => {
    mockReducedMotion(true)
    const { container } = render(
      <AssemblyProvider>
        <Section id="about">
          <Item />
        </Section>
      </AssemblyProvider>,
    )
    expect(screen.getByTestId('item')).toHaveAttribute('data-assemble', 'done')
    expect(container.querySelectorAll('[data-assemble="pending"]')).toHaveLength(0)
  })

  it('stays done across React re-renders', () => {
    let value: AssemblyValue | null = null
    const tree = (
      <AssemblyProvider>
        <Probe onValue={(v) => (value = v)} />
        <Section id="about">
          <Item />
        </Section>
      </AssemblyProvider>
    )
    const { rerender } = render(tree)
    act(() => value!.director.completeSectionInstantly('about'))
    expect(screen.getByTestId('item')).toHaveAttribute('data-assemble', 'done')
    rerender(tree)
    expect(screen.getByTestId('item')).toHaveAttribute('data-assemble', 'done')
  })

  it('unregisters items when they unmount', () => {
    let value: AssemblyValue | null = null
    const tree = (show: boolean) => (
      <AssemblyProvider>
        <Probe onValue={(v) => (value = v)} />
        <Section id="about">{show && <Item />}</Section>
      </AssemblyProvider>
    )
    const { rerender } = render(tree(true))
    expect(value!.director.snapshot().items).toHaveLength(1)
    rerender(tree(false))
    expect(value!.director.snapshot().items).toHaveLength(0)
  })

  it('survives React StrictMode double effects', () => {
    render(
      <StrictMode>
        <AssemblyProvider>
          <Section id="about">
            <Item />
          </Section>
        </AssemblyProvider>
      </StrictMode>,
    )
    expect(screen.getByTestId('item')).toHaveAttribute('data-assemble', 'pending')
  })
})

describe('AssemblyProvider', () => {
  it('renders an aria-hidden overlay with six cursors on desktop and three on phones', () => {
    const desktop = render(
      <AssemblyProvider>
        <p>x</p>
      </AssemblyProvider>,
    )
    expect(desktop.container.querySelectorAll('[data-cursor]')).toHaveLength(6)
    expect(desktop.container.querySelector('[data-cursor]')!.closest('[aria-hidden="true"]')).not.toBeNull()
    desktop.unmount()

    Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true, writable: true })
    const phone = render(
      <AssemblyProvider>
        <p>x</p>
      </AssemblyProvider>,
    )
    expect(phone.container.querySelectorAll('[data-cursor]')).toHaveLength(3)
  })

  it('hides pending items with Tailwind classes that only apply when motion is allowed', () => {
    const { container } = render(
      <AssemblyProvider>
        <p>x</p>
      </AssemblyProvider>,
    )
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.className).toContain('motion-safe:[&_[data-assemble=pending]]:opacity-0')
    expect(wrapper.className).toContain('motion-safe:[&_[data-assemble=pending][data-gesture=drop]]')
  })
})
