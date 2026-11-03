import { render, screen, within } from '@testing-library/react'
import { LangProvider } from '../i18n/LangProvider'
import { projects } from '../content/profile'
import { fullText } from '../test/text'
import { Projects } from './Projects'

function renderProjects(lang: 'en' | 'vi' = 'en') {
  localStorage.setItem('dl:lang', lang)
  return render(
    <LangProvider>
      <Projects />
    </LangProvider>,
  )
}

afterEach(() => localStorage.clear())

describe('Projects', () => {
  it('has its heading and one card per project', () => {
    const { container } = renderProjects()
    expect(container.querySelector('section#projects')).not.toBeNull()
    expect(screen.getByRole('heading', { level: 2, name: "Things I've built" })).toBeInTheDocument()
    expect(container.querySelectorAll('article')).toHaveLength(6)
  })

  it('links each project to its site or repository in the same tab', () => {
    renderProjects()
    for (const project of projects) {
      expect(screen.getByRole('link', { name: project.name })).toHaveAttribute('href', project.href)
    }
    for (const link of screen.getAllByRole('link')) expect(link).not.toHaveAttribute('target')
  })

  it('shows each project summary, stack tags, kind badge and photo placeholder', () => {
    renderProjects()
    for (const project of projects) {
      const card = screen.getByRole('heading', { level: 3, name: project.name }).closest('article') as HTMLElement
      expect(within(card).getByText(fullText(project.summary.en))).toBeInTheDocument()
      expect(within(card).getAllByRole('listitem').map((li) => li.textContent)).toEqual(project.stack)
      expect(within(card).getByRole('img', { name: new RegExp(`project-${project.slug}`) })).toBeInTheDocument()
    }
    expect(screen.getAllByText('Live')).toHaveLength(2)
    expect(screen.getAllByText('Self-hosted')).toHaveLength(1)
    expect(screen.getAllByText('Open source')).toHaveLength(3)
  })

  it('is translated when the language is Vietnamese', () => {
    renderProjects('vi')
    expect(screen.getByText(fullText(projects[0].summary.vi))).toBeInTheDocument()
    expect(screen.getAllByText('Đang chạy')).toHaveLength(2)
  })
})
