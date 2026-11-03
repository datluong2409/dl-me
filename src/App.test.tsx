import { render, screen } from '@testing-library/react'
import App from './App'

describe('App shell', () => {
  it('has a skip link pointing at the main content', () => {
    const { container } = render(<App />)
    const link = screen.getByRole('link', { name: 'Skip to content' })
    expect(link).toHaveAttribute('href', '#content')
    expect(container.querySelector('main#content')).not.toBeNull()
  })
})
