import { act, render, screen } from '@testing-library/react'
import { LangProvider, useLang } from './LangProvider'
import { ui } from './messages'

function Probe() {
  const { lang, setLang, t, tr } = useLang()
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="t">{t({ en: 'a', vi: 'b' })}</span>
      <span data-testid="tr">{tr('skip')}</span>
      <button onClick={() => setLang('en')}>to-en</button>
      <button onClick={() => setLang('vi')}>to-vi</button>
    </div>
  )
}

function mockLanguages(languages: string[] | undefined) {
  vi.spyOn(window.navigator, 'languages', 'get').mockReturnValue(languages as readonly string[])
}

describe('LangProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    document.documentElement.lang = 'en'
  })

  it('starts from the detected browser language and syncs <html lang> and the title', () => {
    mockLanguages(['vi-VN'])
    render(
      <LangProvider>
        <Probe />
      </LangProvider>,
    )
    expect(screen.getByTestId('lang')).toHaveTextContent('vi')
    expect(document.documentElement.lang).toBe('vi')
    expect(document.title).toBe(ui.title.vi)
  })

  it('setLang updates language, <html lang>, title and persists the choice', () => {
    mockLanguages(['vi-VN'])
    render(
      <LangProvider>
        <Probe />
      </LangProvider>,
    )
    act(() => screen.getByText('to-en').click())
    expect(screen.getByTestId('lang')).toHaveTextContent('en')
    expect(document.documentElement.lang).toBe('en')
    expect(document.title).toBe(ui.title.en)
    expect(localStorage.getItem('dl:lang')).toBe('en')
  })

  it('prefers a stored language over the browser language', () => {
    mockLanguages(['en-US'])
    localStorage.setItem('dl:lang', 'vi')
    render(
      <LangProvider>
        <Probe />
      </LangProvider>,
    )
    expect(screen.getByTestId('lang')).toHaveTextContent('vi')
  })

  it('still renders with the detected language when storage throws', () => {
    mockLanguages(['vi'])
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    render(
      <LangProvider>
        <Probe />
      </LangProvider>,
    )
    expect(screen.getByTestId('lang')).toHaveTextContent('vi')
  })

  it('falls back to English when navigator.languages is empty', () => {
    mockLanguages([])
    render(
      <LangProvider>
        <Probe />
      </LangProvider>,
    )
    expect(screen.getByTestId('lang')).toHaveTextContent('en')
  })

  it('t() and tr() resolve text for the active language', () => {
    mockLanguages(['vi'])
    render(
      <LangProvider>
        <Probe />
      </LangProvider>,
    )
    expect(screen.getByTestId('t')).toHaveTextContent('b')
    expect(screen.getByTestId('tr')).toHaveTextContent(ui.skip.vi)
  })
})
