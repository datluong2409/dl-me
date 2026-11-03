import { render, screen } from '@testing-library/react'
import { LangProvider } from '../i18n/LangProvider'
import { profile } from '../content/profile'
import { About } from './About'

function renderAbout(lang: 'en' | 'vi' = 'en') {
  localStorage.setItem('dl:lang', lang)
  return render(
    <LangProvider>
      <About />
    </LangProvider>,
  )
}

afterEach(() => localStorage.clear())

describe('About', () => {
  it('has its heading, the bio and the availability line', () => {
    const { container } = renderAbout()
    expect(container.querySelector('section#about')).not.toBeNull()
    expect(screen.getByRole('heading', { level: 2, name: 'Who I am' })).toBeInTheDocument()
    expect(screen.getByText(profile.about.en)).toBeInTheDocument()
    expect(screen.getByText(profile.openTo.en)).toBeInTheDocument()
  })

  it('lists the four domains as chips', () => {
    renderAbout()
    const domains = screen.getAllByRole('listitem').map((li) => li.textContent)
    expect(domains).toEqual(['Healthcare', 'Real Estate', 'Food Ordering & Billing', 'HR & Recruitment'])
  })

  it('shows the quick facts and a photo placeholder', () => {
    renderAbout()
    expect(screen.getByText('Experience')).toBeInTheDocument()
    expect(screen.getByText('Location')).toBeInTheDocument()
    expect(screen.getAllByText(/^TODO/)).toHaveLength(2)
    expect(screen.getByRole('img', { name: /Photo.*about/ })).toBeInTheDocument()
  })

  it('is translated when the language is Vietnamese', () => {
    renderAbout('vi')
    expect(screen.getByRole('heading', { level: 2, name: 'Tôi là ai' })).toBeInTheDocument()
    expect(screen.getByText('Y tế')).toBeInTheDocument()
  })
})
