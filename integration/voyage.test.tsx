import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from '../src/App'
import type { Direction, GameView } from '../src/api/types'
import { startServers } from './servers'

const fetchHttp = globalThis.fetch
let servers: Awaited<ReturnType<typeof startServers>>
beforeAll(async () => { servers = await startServers() })
afterAll(async () => { await servers?.stop() })
beforeEach(() => {
  // jsdom has no document base URL for fetch; all responses still come from real HTTP servers.
  vi.stubGlobal('fetch', ((input, init) => fetchHttp(new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, servers.frontendUrl), init)) as typeof fetch)
})
async function open(seed: number) {
  render(<App />)
  await screen.findByText('Connected')
  fireEvent.change(screen.getByRole('textbox', { name: 'Voyage seed (optional)' }), { target: { value: String(seed) } })
  fireEvent.click(screen.getByRole('button', { name: 'Open ocean chart' }))
  await screen.findByRole('heading', { name: 'Your ocean chart' })
}
async function sail(directions: Direction[]) {
  for (let index = 0; index < directions.length; index++) {
    const direction = directions[index]!
    const button = screen.getByRole('button', { name: `Move ${direction.toLowerCase()}` })
    await waitFor(() => expect(button).toBeEnabled())
    fireEvent.click(button)
    await screen.findByText(`Turn ${index + 1}`)
  }
}
it('serves the React entry point and proxies the live backend health endpoint', async () => {
  const page = await fetchHttp(servers.frontendUrl)
  expect(page.status).toBe(200)
  expect(await page.text()).toContain('<div id="root"></div>')
  const health = await fetchHttp(`${servers.frontendUrl}/api/health`)
  expect(await health.json()).toEqual({ status: 'ok', service: 'columbus-adventure-backend' })
})
it('wins a seeded voyage through React controls and replays the same chart after reset', async () => {
  await open(2)
  const originalMap = screen.getByRole('img', { name: 'Ocean chart, 20 columns by 20 rows' }).innerHTML
  await sail(['SOUTH', 'SOUTH', 'EAST', 'SOUTH'])
  expect(await screen.findByRole('dialog', { name: 'Treasure found!' })).toHaveTextContent('after 4 turns')
  fireEvent.click(screen.getByRole('button', { name: 'Sail again' }))
  await screen.findByText('Turn 0')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByRole('img', { name: 'Ocean chart, 20 columns by 20 rows' }).innerHTML).toBe(originalMap)
  expect(screen.getByRole('button', { name: 'Move south' })).toBeEnabled()
})
it('shows a real loss, prevents further moves, and starts a different voyage', async () => {
  await open(513)
  await sail([...Array<Direction>(10).fill('EAST'), 'SOUTH'])
  expect(await screen.findByRole('dialog', { name: 'Caught at sea' })).toHaveTextContent('after 11 turns')
  fireEvent.click(screen.getByRole('button', { name: 'View chart' }))
  expect(screen.getByRole('button', { name: 'Move east' })).toBeDisabled()
  fireEvent.keyDown(window, { key: 'd' })
  expect(screen.getByText('Turn 11')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'New voyage' }))
  fireEvent.click(screen.getByRole('button', { name: 'Return to harbor' }))
  await screen.findByRole('heading', { name: 'Beyond the horizon.' })
  fireEvent.click(screen.getByRole('button', { name: 'Open ocean chart' }))
  await screen.findByRole('heading', { name: 'Your ocean chart' })
  expect(screen.getByText('Turn 0')).toBeInTheDocument()
})
it('keeps a blocked move at turn zero and sails with the keyboard afterward', async () => {
  await open(513)
  fireEvent.click(screen.getByRole('button', { name: 'Move west' }))
  await waitFor(() => expect(screen.getByRole('status', { name: 'Sailing feedback' })).toHaveTextContent('That route is blocked'))
  expect(screen.getByText('Turn 0')).toBeInTheDocument()
  fireEvent.keyDown(window, { key: 'd' })
  await screen.findByText('Turn 1')
  expect(screen.getByRole('status', { name: 'Sailing feedback' })).toHaveTextContent('B8')
})
it('recovers to the harbor when the server no longer has the active session', async () => {
  let created: GameView | undefined
  vi.stubGlobal('fetch', (async (input, init) => {
    const url = new URL(String(input), servers.frontendUrl)
    const response = await fetchHttp(url, init)
    if (url.pathname === '/api/games' && init?.method === 'POST') created = await response.clone().json() as GameView
    return response
  }) as typeof fetch)
  await open(513)
  expect(created).toBeDefined()
  const deleted = await fetchHttp(`${servers.backendUrl}/api/games/${created!.id}`, { method: 'DELETE' })
  expect(deleted.status).toBe(204)
  fireEvent.click(screen.getByRole('button', { name: 'Move east' }))
  await screen.findByRole('heading', { name: 'Beyond the horizon.' })
  expect(screen.getByRole('alert')).toHaveTextContent('This voyage is no longer available')
})
