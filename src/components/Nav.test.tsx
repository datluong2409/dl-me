import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LangProvider } from '../i18n/LangProvider'
import { Nav } from './Nav'

beforeEach(() => localStorage.setItem('dl:lang', 'en'))
afterEach(() => localStorage.clear())

const renderNav = () =>
  render(
    <LangProvider>
      <Nav />
    </LangProvider>,
  )

describe('Nav', () => {
  it('links to every section, with Contact as the call to action', () => {
    renderNav()
    const primary = screen.getByRole('navigation', { name: 'Primary' })
    const hrefs = within(primary)
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'))
    expect(hrefs).toEqual(['#about', '#skills', '#projects', '#experience', '#contact'])
    expect(within(primary).getByRole('link', { name: 'Contact' }).className).toContain('bg-accent')
  })

  it('has the name, the language toggle and the presence bar', () => {
    renderNav()
    expect(screen.getByRole('link', { name: 'Dat Luong' })).toHaveAttribute('href', '#hero')
    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument()
    expect(document.querySelector('[data-avatar]')).not.toBeNull()
  })

  it('opens and closes the mobile menu, returning focus on Escape', async () => {
    renderNav()
    const button = screen.getByRole('button', { name: 'Open menu' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button).toHaveAttribute('aria-controls', 'mobile-menu')
    expect(document.getElementById('mobile-menu')).toBeNull()

    await userEvent.click(button)
    const open = screen.getByRole('button', { name: 'Close menu' })
    expect(open).toHaveAttribute('aria-expanded', 'true')
    const panel = document.getElementById('mobile-menu')!
    expect(within(panel).getAllByRole('link')).toHaveLength(5)

    await userEvent.keyboard('{Escape}')
    expect(document.getElementById('mobile-menu')).toBeNull()
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveFocus()
  })

  it('closes the mobile menu when a link is chosen', async () => {
    renderNav()
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    const panel = document.getElementById('mobile-menu')!
    await userEvent.click(within(panel).getByRole('link', { name: 'Projects' }))
    expect(document.getElementById('mobile-menu')).toBeNull()
  })

  it('gives the menu button a 44px minimum hit area', () => {
    renderNav()
    const button = screen.getByRole('button', { name: 'Open menu' })
    expect(button.className).toContain('min-h-11')
    expect(button.className).toContain('min-w-11')
  })
})
