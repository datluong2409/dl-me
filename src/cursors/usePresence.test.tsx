import { act, render, screen } from '@testing-library/react'
import { AGENTS } from './agents'
import { AssemblyContext } from './context'
import type { Director, StatusEvent } from './director'
import { usePresence } from './usePresence'

function Show() {
  return <span data-testid="presence">{JSON.stringify(usePresence())}</span>
}

function setup() {
  let listener: ((event: StatusEvent) => void) | undefined
  const unsubscribe = vi.fn()
  const director = {
    subscribe: (fn: (event: StatusEvent) => void) => {
      listener = fn
      return unsubscribe
    },
  } as unknown as Director
  const view = render(
    <AssemblyContext.Provider value={{ director, agents: AGENTS }}>
      <Show />
    </AssemblyContext.Provider>,
  )
  return { emit: (e: StatusEvent) => act(() => listener!(e)), unsubscribe, view }
}

describe('usePresence', () => {
  it('starts empty and follows director status events', () => {
    const { emit } = setup()
    expect(screen.getByTestId('presence')).toHaveTextContent('{}')
    emit({ agentId: 'mai', sectionId: 'projects' })
    emit({ agentId: 'kai', sectionId: null })
    expect(JSON.parse(screen.getByTestId('presence').textContent!)).toEqual({ mai: 'projects', kai: null })
  })

  it('unsubscribes on unmount', () => {
    const { unsubscribe, view } = setup()
    view.unmount()
    expect(unsubscribe).toHaveBeenCalled()
  })

  it('returns an empty object outside a provider', () => {
    render(<Show />)
    expect(screen.getByTestId('presence')).toHaveTextContent('{}')
  })
})
