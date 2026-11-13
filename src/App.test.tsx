import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import App from './App'

const ready = () => new Response(JSON.stringify({ status: 'ok', service: 'columbus-adventure-backend' }), {
  status: 200, headers: { 'Content-Type': 'application/json' },
})

it('shows the welcome screen and a successful server connection', async () => {
  vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(ready()))
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Beyond the horizon.' })).toBeInTheDocument()
  expect(await screen.findByText('Connected')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Check connection' })).toBeEnabled()
})

it('shows a recoverable offline state and reconnects when the user retries', async () => {
  const fetcher = vi.fn<typeof fetch>().mockRejectedValueOnce(new TypeError('Failed to fetch'))
    .mockResolvedValueOnce(ready())
  vi.stubGlobal('fetch', fetcher)
  render(<App />)
  expect(await screen.findByText('The harbor is out of reach')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Reconnect' }))
  expect(await screen.findByText('Connected')).toBeInTheDocument()
})
