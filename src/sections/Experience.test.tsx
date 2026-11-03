import { render, screen } from '@testing-library/react'
import { LangProvider } from '../i18n/LangProvider'
import { fullText } from '../test/text'
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

  it('shows the Enlab Software roles in English', () => {
    renderExperience()
    expect(screen.getByText(fullText('Software Developer'))).toBeInTheDocument()
    expect(screen.getByText(fullText('Internship Trainee'))).toBeInTheDocument()
    expect(screen.getAllByText(fullText('Enlab Software · Da Nang, Vietnam'))).toHaveLength(2)
    expect(screen.getByText(fullText('Oct 2021 – Present'))).toBeInTheDocument()
    expect(screen.queryByText(/TODO/)).toBeNull()
  })

  it('shows the roles in Vietnamese', () => {
    renderExperience('vi')
    expect(screen.getByText(fullText('Thực tập sinh'))).toBeInTheDocument()
    expect(screen.getByText(fullText('Th10/2021 – Hiện tại'))).toBeInTheDocument()
  })
})
