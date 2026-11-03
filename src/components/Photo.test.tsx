import { fireEvent, render, screen } from '@testing-library/react'
import { LangProvider } from '../i18n/LangProvider'
import { profile } from '../content/profile'
import { Photo } from './Photo'

const asset = {
  src: '/images/avatar.webp',
  width: 800,
  height: 1000,
  alt: { en: 'Portrait of Dat', vi: 'Ảnh chân dung của Dat' },
}

function renderPhoto(props: Partial<Parameters<typeof Photo>[0]> = {}) {
  return render(
    <LangProvider>
      <Photo slot="avatar" aspect="aspect-[4/5]" {...props} />
    </LangProvider>,
  )
}

afterEach(() => {
  delete profile.photos.avatar
  localStorage.clear()
})

describe('Photo', () => {
  it('shows a labelled dashed placeholder frame while no image is set', () => {
    renderPhoto()
    const frame = screen.getByRole('img', { name: /Photo.*avatar/ })
    expect(frame.className).toContain('border-dashed')
    expect(frame.className).toContain('aspect-[4/5]')
  })

  it('renders the image with its dimensions, alt text and lazy loading', () => {
    profile.photos.avatar = asset
    renderPhoto()
    const img = screen.getByRole('img', { name: 'Portrait of Dat' })
    expect(img).toHaveAttribute('src', '/images/avatar.webp')
    expect(img).toHaveAttribute('width', '800')
    expect(img).toHaveAttribute('height', '1000')
    expect(img).toHaveAttribute('loading', 'lazy')
  })

  it('loads eagerly when asked to, and uses the Vietnamese alt text', () => {
    profile.photos.avatar = asset
    localStorage.setItem('dl:lang', 'vi')
    renderPhoto({ eager: true })
    const img = screen.getByRole('img', { name: 'Ảnh chân dung của Dat' })
    expect(img).toHaveAttribute('loading', 'eager')
  })

  it('falls back to the placeholder frame, same box, when the image fails to load', () => {
    profile.photos.avatar = asset
    renderPhoto()
    fireEvent.error(screen.getByRole('img', { name: 'Portrait of Dat' }))
    expect(document.querySelector('img')).toBeNull()
    const frame = screen.getByRole('img', { name: /Photo.*avatar/ })
    expect(frame.className).toContain('aspect-[4/5]')
  })
})
