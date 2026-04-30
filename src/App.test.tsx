import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/')
  })

  it('renders a generated room and tactile controls', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /Paper Theater/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Open velvet curtain/i })).toBeInTheDocument()
    expect(screen.getByText(/Impossible rule:/i)).toBeInTheDocument()
  })

  it('updates from seed input and opens debug JSON', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.clear(screen.getByLabelText(/Seed phrase/i))
    await user.type(screen.getByLabelText(/Seed phrase/i), 'telegram garden under a folded moon')
    await user.click(screen.getByRole('button', { name: /Open JSON/i }))
    expect(screen.getByText(/window.paperTheater.inspect/i)).toBeInTheDocument()
    expect(window.location.search).toContain('scene=')
  })

  it('exposes browser debug API', () => {
    render(<App />)
    expect(window.paperTheater?.generate('x')).toHaveProperty('title')
    act(() => window.paperTheater?.setState({ tabPull: 999 }))
    expect(window.paperTheater?.inspect()).toBeTruthy()
  })
})
