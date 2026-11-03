import { render, screen, within } from '@testing-library/react'
import { LangProvider } from '../i18n/LangProvider'
import { skillGroups } from '../content/profile'
import { Skills } from './Skills'

function renderSkills(lang: 'en' | 'vi' = 'en') {
  localStorage.setItem('dl:lang', lang)
  return render(
    <LangProvider>
      <Skills />
    </LangProvider>,
  )
}

afterEach(() => localStorage.clear())

describe('Skills', () => {
  it('has its heading and one card per skill group', () => {
    const { container } = renderSkills()
    expect(container.querySelector('section#skills')).not.toBeNull()
    expect(screen.getByRole('heading', { level: 2, name: 'What I work with' })).toBeInTheDocument()
    const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(titles).toEqual(['Frontend', 'Backend', 'Databases', 'DevOps', 'Desktop & AI'])
  })

  it('lists exactly the group items as chips, in order', () => {
    renderSkills()
    for (const group of skillGroups) {
      const card = screen.getByRole('heading', { level: 3, name: group.title.en }).closest('article') as HTMLElement
      const chips = within(card).getAllByRole('listitem')
      expect(chips.map((li) => li.textContent)).toEqual(group.items)
    }
  })

  it('shows the databases note and translates it', () => {
    renderSkills('vi')
    expect(screen.getByText('Index, tối ưu truy vấn, thiết kế schema')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Cơ sở dữ liệu' })).toBeInTheDocument()
  })
})
