import { render, screen } from '@testing-library/react'
import { LangProvider } from '../i18n/LangProvider'
import { profile } from '../content/profile'
import { fullText } from '../test/text'
import { Hero } from './Hero'

function renderHero(lang: 'en' | 'vi' = 'en') {
  localStorage.setItem('dl:lang', lang)
  return render(
    <LangProvider>
      <Hero />
    </LangProvider>,
  )
}

afterEach(() => {
  delete profile.cvUrl
  localStorage.clear()
})

describe('Hero', () => {
  it('is the full-height first section with the greeting as the only h1', () => {
    const { container } = renderHero()
    const section = container.querySelector('section#hero') as HTMLElement
    expect(section.className).toContain('min-h-dvh')
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("Hi, I'm Dat Luong.")
  })

  it('greets in Vietnamese when the language is Vietnamese', () => {
    renderHero('vi')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Xin chào, tôi là Dat Luong.')
    expect(screen.getByText('Sẵn sàng nhận việc')).toBeInTheDocument()
  })

  it('shows the role, the pitch and the availability chip', () => {
    renderHero()
    expect(screen.getByText(fullText(profile.role.en))).toBeInTheDocument()
    expect(screen.getByText(fullText(profile.pitch.en))).toBeInTheDocument()
    expect(screen.getByText('Open to work')).toBeInTheDocument()
  })

  it('has a Get in touch button to the contact section and an avatar placeholder', () => {
    renderHero()
    expect(screen.getByRole('link', { name: 'Get in touch' })).toHaveAttribute('href', '#contact')
    expect(screen.getByRole('img', { name: /Photo.*avatar/ })).toBeInTheDocument()
  })

  it('hides Download CV until a CV is set, then links to it', () => {
    const { unmount } = renderHero()
    expect(screen.queryByRole('link', { name: 'Download CV' })).toBeNull()
    unmount()

    profile.cvUrl = '/cv.pdf'
    renderHero()
    expect(screen.getByRole('link', { name: 'Download CV' })).toHaveAttribute('href', '/cv.pdf')
  })
})
