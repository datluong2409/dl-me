import { act, render, screen } from '@testing-library/react'
import { AGENTS } from '../cursors/agents'
import { AssemblyContext } from '../cursors/context'
import type { Director, StatusEvent } from '../cursors/director'
import { LangProvider } from '../i18n/LangProvider'
import { PresenceBar } from './PresenceBar'

afterEach(() => localStorage.clear())

function setup(lang: 'en' | 'vi' = 'en') {
  localStorage.setItem('dl:lang', lang)
  let listener: ((event: StatusEvent) => void) | undefined
  const director = {
    subscribe: (fn: (event: StatusEvent) => void) => {
      listener = fn
      return () => {}
    },
  } as unknown as Director
  const view = render(
    <LangProvider>
      <AssemblyContext.Provider value={{ director, agents: AGENTS }}>
        <PresenceBar />
      </AssemblyContext.Provider>
    </LangProvider>,
  )
  return { view, emit: (e: StatusEvent) => act(() => listener!(e)) }
}

describe('PresenceBar', () => {
  it('is decorative: hidden from assistive tech, with one avatar per agent', () => {
    const { view } = setup()
    const bar = view.container.firstElementChild as HTMLElement
    expect(bar).toHaveAttribute('aria-hidden', 'true')
    for (const agent of AGENTS) {
      expect(bar.querySelector(`[data-avatar="${agent.id}"]`)).toHaveTextContent(agent.name[0])
    }
    expect(bar.querySelectorAll('[data-avatar]')).toHaveLength(6)
  })

  it('says who is online and who is editing which section', () => {
    const { emit } = setup()
    expect(screen.getByText('Mai is online')).toBeInTheDocument()
    emit({ agentId: 'mai', sectionId: 'projects' })
    expect(screen.getByText('Mai is editing Projects')).toBeInTheDocument()
    emit({ agentId: 'mai', sectionId: null })
    expect(screen.getByText('Mai is online')).toBeInTheDocument()
  })

  it('speaks Vietnamese when the language is Vietnamese', () => {
    const { emit } = setup('vi')
    emit({ agentId: 'kai', sectionId: 'skills' })
    expect(screen.getByText('Kai đang chỉnh Kỹ năng')).toBeInTheDocument()
  })
})
