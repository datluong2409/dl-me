import { render, screen } from '@testing-library/react'
import App from './App'
import { SECTION_IDS } from './content/sections'

beforeEach(() => {
  // jsdom has no layout, so keep the initial viewport evaluation from running.
  Object.defineProperty(document, 'fonts', { value: { ready: new Promise(() => {}) }, configurable: true })
  localStorage.setItem('dl:lang', 'en')
})

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('App', () => {
  it('has a skip link that points at the main content', () => {
    const { container } = render(<App />)
    const link = screen.getByRole('link', { name: 'Skip to content' })
    expect(link).toHaveAttribute('href', '#content')
    expect(container.querySelector('main#content')).not.toBeNull()
  })

  it('renders the six sections in page order inside main', () => {
    const { container } = render(<App />)
    const ids = [...container.querySelectorAll('main > section')].map((s) => s.id)
    expect(ids).toEqual([...SECTION_IDS])
  })

  it('has exactly one h1 and never skips a heading level', () => {
    const { container } = render(<App />)
    const levels = [...container.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((h) => Number(h.tagName[1]))
    expect(levels.filter((l) => l === 1)).toHaveLength(1)
    expect(levels[0]).toBe(1)
    levels.forEach((level, i) => {
      if (i > 0) expect(level).toBeLessThanOrEqual(levels[i - 1] + 1)
    })
  })

  it('keeps every section within the 10-item assembly budget', () => {
    const { container } = render(<App />)
    const sections = container.querySelectorAll('main > section')
    expect(sections).toHaveLength(6)
    for (const section of sections) {
      const items = section.querySelectorAll('[data-assemble]').length
      expect(items, section.id).toBeGreaterThan(0)
      expect(items, section.id).toBeLessThanOrEqual(10)
    }
  })

  it('leaves nothing hidden for visitors who prefer reduced motion', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          matches: true,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: () => false,
        }) as unknown as MediaQueryList,
    )
    const { container } = render(<App />)
    expect(container.querySelectorAll('[data-assemble="pending"]')).toHaveLength(0)
    expect(container.querySelectorAll('[data-assemble="done"]').length).toBeGreaterThan(20)
  })

  it('switches the whole page to Vietnamese', () => {
    localStorage.setItem('dl:lang', 'vi')
    render(<App />)
    expect(screen.getByRole('link', { name: 'Chuyển tới nội dung' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Xin chào, tôi là Dat Luong.')
  })
})
