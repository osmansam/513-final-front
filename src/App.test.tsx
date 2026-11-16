import { StrictMode } from 'react'
import { fireEvent, render, screen, waitFor, act } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import App from './App'

const ready = () => new Response(JSON.stringify({ status: 'ok', service: 'columbus-adventure-backend' }), {
  status: 200, headers: { 'Content-Type': 'application/json' },
})

it('shows the welcome screen and a successful server connection', async () => {
  vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(ready()))
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Columbus Adventure' })).toBeInTheDocument()
  expect(await screen.findByText('Connected')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Check connection' })).toBeEnabled()
})

it('shows a recoverable offline state and reconnects when the user retries', async () => {
  const fetcher = vi.fn<typeof fetch>().mockRejectedValueOnce(new TypeError('Failed to fetch'))
    .mockResolvedValueOnce(ready())
  vi.stubGlobal('fetch', fetcher)
  render(<App />)
  expect(await screen.findByText('Cannot connect to the server')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Reconnect' }))
  expect(await screen.findByText('Connected')).toBeInTheDocument()
})


it('opens a real game snapshot only when the player asks for the chart', async () => {
  const { chartFixture } = await import('./test/chartFixture')
  const fetcher = vi.fn<typeof fetch>().mockImplementation((input, init) => {
    if (String(input) === '/api/health') return Promise.resolve(ready())
    if (init?.method === 'DELETE') return Promise.resolve(new Response(null, { status: 204 }))
    return Promise.resolve(new Response(JSON.stringify(chartFixture), { status: 201 }))
  })
  vi.stubGlobal('fetch', fetcher)
  render(<App />)
  await screen.findByText('Connected')
  expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(0)
  fireEvent.click(screen.getByRole('button', { name: 'Start game' }))
  expect(await screen.findByRole('heading', { name: 'Your ocean chart' })).toBeInTheDocument()
  expect(screen.getByRole('img', { name: 'Ocean chart, 3 columns by 2 rows' })).toBeInTheDocument()
  expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1)
})

it('preserves the welcome screen and allows retrying a failed chart request', async () => {
  const { chartFixture } = await import('./test/chartFixture')
  let attempts = 0
  vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockImplementation((input, init) => {
    if (String(input) === '/api/health') return Promise.resolve(ready())
    if (init?.method === 'DELETE') return Promise.resolve(new Response(null, { status: 204 }))
    attempts++
    return Promise.resolve(new Response(JSON.stringify(attempts === 1 ? { error: 'Please try again' } : chartFixture),
      { status: attempts === 1 ? 503 : 201 }))
  }))
  render(<App />)
  await screen.findByText('Connected')
  fireEvent.click(screen.getByRole('button', { name: 'Start game' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Please try again')
  expect(screen.getByRole('heading', { name: 'Columbus Adventure' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Start game' }))
  expect(await screen.findByRole('heading', { name: 'Your ocean chart' })).toBeInTheDocument()
})


it('avoids duplicate creations and disposes its game when unmounted in StrictMode', async () => {
  const { chartFixture } = await import('./test/chartFixture')
  const fetcher = vi.fn<typeof fetch>().mockImplementation((input, init) => {
    if (String(input) === '/api/health') return Promise.resolve(ready())
    if (init?.method === 'DELETE') return Promise.resolve(new Response(null, { status: 204 }))
    return Promise.resolve(new Response(JSON.stringify(chartFixture), { status: 201 }))
  })
  vi.stubGlobal('fetch', fetcher)
  const { unmount } = render(<StrictMode><App /></StrictMode>)
  await screen.findByText('Connected')
  expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(0)
  fireEvent.click(screen.getByRole('button', { name: 'Start game' }))
  await screen.findByRole('heading', { name: 'Your ocean chart' })
  expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1)
  unmount()
  await waitFor(() => expect(fetcher).toHaveBeenCalledWith('/api/games/game-one', expect.objectContaining({ method: 'DELETE' })))
})

it('disables chart creation while the current game request is pending', async () => {
  const { chartFixture } = await import('./test/chartFixture')
  let finish!: (response: Response) => void
  const fetcher = vi.fn<typeof fetch>().mockImplementation((input, init) => {
    if (String(input) === '/api/health') return Promise.resolve(ready())
    if (init?.method === 'DELETE') return Promise.resolve(new Response(null, { status: 204 }))
    return new Promise(resolve => { finish = resolve })
  })
  vi.stubGlobal('fetch', fetcher)
  render(<App />)
  await screen.findByText('Connected')
  fireEvent.click(screen.getByRole('button', { name: 'Start game' }))
  const opening = screen.getByRole('button', { name: 'Starting game…' })
  expect(opening).toBeDisabled()
  fireEvent.click(opening)
  expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1)
  await act(async () => { finish(new Response(JSON.stringify(chartFixture), { status: 201 })) })
  expect(await screen.findByRole('heading', { name: 'Your ocean chart' })).toBeInTheDocument()
})
