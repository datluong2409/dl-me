import { render, screen } from '@testing-library/react'
import { LangProvider } from '../i18n/LangProvider'
import { Experience } from './Experience'

function renderExperience(lang: 'en' | 'vi' = 'en') {
  localStorage.setItem('dl:lang', lang)
  return render(
    <LangProvider>
      <Experience />
    </LangProvider>,
  )
}

afterEach(() => localStorage.clear())

describe('Experience', () => {
  it('has its heading and a two-entry ordered timeline', () => {
    const { container } = renderExperience()
    expect(container.querySelector('section#experience')).not.toBeNull()
    expect(screen.getByRole('heading', { level: 2, name: "Where I've worked" })).toBeInTheDocument()
    const list = container.querySelector('ol') as HTMLOListElement
    expect(list.querySelectorAll(':scope > li')).toHaveLength(2)
  })

  it('shows the TODO placeholders verbatim until the owner fills them in', () => {
    renderExperience()
    expect(screen.getAllByText('TODO: job title')).toHaveLength(2)
    expect(screen.getAllByText('TODO: company')).toHaveLength(2)
    expect(screen.getAllByText('TODO: period')).toHaveLength(2)
    expect(screen.getAllByText('TODO: key achievement')).toHaveLength(4)
  })

  it('shows the Vietnamese placeholders in Vietnamese', () => {
    renderExperience('vi')
    expect(screen.getAllByText('TODO: chức danh')).toHaveLength(2)
  })
})
