import { render, screen } from '@testing-library/react'
import { Footer } from '../components/Footer'
import { LangProvider } from '../i18n/LangProvider'
import { profile } from '../content/profile'
import { fullText } from '../test/text'
import { Contact } from './Contact'

function renderWithLang(ui: React.ReactElement, lang: 'en' | 'vi' = 'en') {
  localStorage.setItem('dl:lang', lang)
  return render(<LangProvider>{ui}</LangProvider>)
}

afterEach(() => localStorage.clear())

describe('Contact', () => {
  it('has a heading and the invitation', () => {
    const { container } = renderWithLang(<Contact />)
    expect(container.querySelector('section#contact')).not.toBeNull()
    expect(screen.getByRole('heading', { level: 2, name: 'Say hello' })).toBeInTheDocument()
    expect(screen.getByText(fullText("Let's build something together."))).toBeInTheDocument()
  })

  it('links to email, LinkedIn and GitHub in the same tab', () => {
    renderWithLang(<Contact />)
    const email = screen.getByRole('link', { name: /mark\.dat\.code@gmail\.com/ })
    expect(email).toHaveAttribute('href', 'mailto:mark.dat.code@gmail.com')
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', profile.contact.linkedin)
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/datluong2409')
    for (const link of screen.getAllByRole('link')) expect(link).not.toHaveAttribute('target')
  })

  it('has no form: there is no backend', () => {
    const { container } = renderWithLang(<Contact />)
    expect(container.querySelector('form')).toBeNull()
  })
})

describe('Footer', () => {
  it('credits the six cursors in English', () => {
    renderWithLang(<Footer />)
    expect(screen.getByText('Assembled by Mai, Kai, Linh, Alex, Sora and Minh')).toBeInTheDocument()
    expect(screen.getByText(/Dat Luong/)).toBeInTheDocument()
  })

  it('credits the six cursors in Vietnamese', () => {
    renderWithLang(<Footer />, 'vi')
    expect(screen.getByText('Được lắp ráp bởi Mai, Kai, Linh, Alex, Sora và Minh')).toBeInTheDocument()
  })
})
