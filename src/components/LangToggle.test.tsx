import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LangProvider } from '../i18n/LangProvider'
import { LangToggle } from './LangToggle'

afterEach(() => localStorage.clear())

describe('LangToggle', () => {
  it('marks the active language with aria-pressed and switches on click', async () => {
    localStorage.setItem('dl:lang', 'en')
    render(
      <LangProvider>
        <LangToggle />
      </LangProvider>,
    )
    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'VI' })).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(screen.getByRole('button', { name: 'VI' }))
    expect(screen.getByRole('button', { name: 'VI' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'false')
    expect(document.documentElement.lang).toBe('vi')
  })

  it('gives each button a 44px minimum hit area', () => {
    render(
      <LangProvider>
        <LangToggle />
      </LangProvider>,
    )
    for (const button of screen.getAllByRole('button')) {
      expect(button.className).toContain('min-h-11')
      expect(button.className).toContain('min-w-11')
    }
  })
})
