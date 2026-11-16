import { act, fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import type { ActionResult, GameView } from './api/types'
import App from './App'

const game: GameView = {
  id: 'movement-game', snapshot: {
    width: 6, height: 6, islands: [{ x: 2, y: 1 }], player: { x: 2, y: 2 }, treasure: { x: 0, y: 0 },
    pirates: [{ id: 'pirate-1', type: 'STANDARD', position: { x: 5, y: 0 } },
      { id: 'pirate-2', type: 'STANDARD', position: { x: 5, y: 5 } }],
    monsters: [{ id: 'monster-1', position: { x: 0, y: 5 }, roamingArea: { minX: 0, minY: 4, maxX: 1, maxY: 5 } }],
    state: 'PLAYING', turnCount: 0,
  },
}
const afterSouth: GameView = { ...game, snapshot: { ...game.snapshot,
  player: { x: 2, y: 3 }, turnCount: 1,
  pirates: [{ id: 'pirate-1', type: 'STANDARD', position: { x: 4, y: 0 } },
    { id: 'pirate-2', type: 'STANDARD', position: { x: 4, y: 5 } }],
  monsters: [{ ...game.snapshot.monsters[0]!, position: { x: 1, y: 5 } }],
} }
const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json' },
})

async function open(move: () => Promise<Response>, read: () => Promise<Response> = async () => jsonResponse(afterSouth)) {
  const fetcher = vi.fn<typeof fetch>().mockImplementation((input, init) => {
    const path = String(input)
    if (path === '/api/health') return Promise.resolve(jsonResponse({ status: 'ok', service: 'columbus-adventure-backend' }))
    if (init?.method === 'DELETE') return Promise.resolve(new Response(null, { status: 204 }))
    if (path.endsWith('/moves')) return move()
    if (init?.method === 'GET') return read()
    return Promise.resolve(jsonResponse(game, 201))
  })
  vi.stubGlobal('fetch', fetcher)
  render(<App />)
  await screen.findByText('Connected')
  fireEvent.click(screen.getByRole('button', { name: 'Start game' }))
  await screen.findByRole('heading', { name: 'Your ocean chart' })
  return fetcher
}

it('updates every entity and the turn count from the successful move response', async () => {
  const fetcher = await open(async () => jsonResponse({ status: 'APPLIED', snapshot: afterSouth.snapshot } satisfies ActionResult))
  fireEvent.click(screen.getByRole('button', { name: 'Move south' }))
  expect(await screen.findByText('Turn 1')).toBeInTheDocument()
  expect(screen.getByText('Your ship · C4', { selector: 'title' })).toBeInTheDocument()
  expect(screen.getByText('Pirate ship · E1', { selector: 'title' })).toBeInTheDocument()
  expect(screen.getByText('Sea monster · B6', { selector: 'title' })).toBeInTheDocument()
  expect(screen.getByRole('status', { name: 'Sailing feedback' })).toHaveTextContent('Sailed south to C4.')
  expect(fetcher).toHaveBeenCalledWith('/api/games/movement-game/moves', expect.objectContaining({ body: '{"direction":"SOUTH"}' }))
})

it('keeps the full snapshot unchanged and explains a blocked route', async () => {
  await open(async () => jsonResponse({ status: 'BLOCKED', snapshot: game.snapshot }))
  fireEvent.keyDown(window, { key: 'ArrowUp' })
  expect(await screen.findByText('That route is blocked. Choose another direction.')).toBeInTheDocument()
  expect(screen.getByText('Turn 0')).toBeInTheDocument()
  expect(screen.getByText('Your ship · C3', { selector: 'title' })).toBeInTheDocument()
  expect(screen.getByText('Sea monster · A6', { selector: 'title' })).toBeInTheDocument()
})

it('ignores extra inputs until the current move has completed', async () => {
  let finish!: (response: Response) => void
  const fetcher = await open(() => new Promise(resolve => { finish = resolve }))
  fireEvent.click(screen.getByRole('button', { name: 'Move south' }))
  expect(screen.getByRole('button', { name: 'Move east' })).toBeDisabled()
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  fireEvent.click(screen.getByRole('button', { name: 'Move east' }))
  expect(fetcher.mock.calls.filter(([input]) => String(input).endsWith('/moves'))).toHaveLength(1)
  await act(async () => { finish(jsonResponse({ status: 'APPLIED', snapshot: afterSouth.snapshot })) })
  expect(await screen.findByText('Turn 1')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Move east' })).toBeEnabled()
})

it.each(['WON', 'LOST'] as const)('stops all movement immediately when the backend returns %s', async state => {
  const finalSnapshot = { ...afterSouth.snapshot, state }
  const fetcher = await open(async () => jsonResponse({ status: 'APPLIED', snapshot: finalSnapshot }))
  fireEvent.click(screen.getByRole('button', { name: 'Move south' }))
  await screen.findByText('Turn 1')
  expect(screen.getByRole('button', { name: 'Move south' })).toBeDisabled()
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  expect(fetcher.mock.calls.filter(([input]) => String(input).endsWith('/moves'))).toHaveLength(1)
})

it('resynchronizes an interrupted move without automatically repeating the POST', async () => {
  const fetcher = await open(async () => { throw new TypeError('Connection lost') })
  fireEvent.click(screen.getByRole('button', { name: 'Move south' }))
  expect(await screen.findByText('Turn 1')).toBeInTheDocument()
  expect(screen.getByRole('alert')).toHaveTextContent('Check your position before sailing again.')
  expect(screen.getByRole('button', { name: 'Move south' })).toBeEnabled()
  expect(fetcher.mock.calls.filter(([input]) => String(input).endsWith('/moves'))).toHaveLength(1)
  expect(fetcher).toHaveBeenCalledWith('/api/games/movement-game', expect.objectContaining({ method: 'GET' }))
})

it('locks movement until an uncertain state can be refreshed successfully', async () => {
  let reads = 0
  const fetcher = await open(async () => { throw new TypeError('Connection lost') }, async () => {
    if (++reads === 1) throw new TypeError('Still offline')
    return jsonResponse(afterSouth)
  })
  fireEvent.click(screen.getByRole('button', { name: 'Move south' }))
  const refresh = await screen.findByRole('button', { name: 'Refresh chart' })
  expect(screen.getByRole('button', { name: 'Move east' })).toBeDisabled()
  fireEvent.keyDown(window, { key: 'd' })
  expect(fetcher.mock.calls.filter(([input]) => String(input).endsWith('/moves'))).toHaveLength(1)
  fireEvent.click(refresh)
  expect(await screen.findByText('Turn 1')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Move east' })).toBeEnabled()
  expect(screen.queryByRole('button', { name: 'Refresh chart' })).not.toBeInTheDocument()
})

it('returns to the harbor when a restarted backend no longer has the game', async () => {
  await open(async () => jsonResponse({ error: 'Game not found' }, 404), async () => jsonResponse({ error: 'Game not found' }, 404))
  fireEvent.click(screen.getByRole('button', { name: 'Move south' }))
  expect(await screen.findByRole('heading', { name: 'Columbus Adventure' })).toBeInTheDocument()
  expect(screen.getByRole('alert')).toHaveTextContent('This voyage is no longer available.')
  expect(screen.getByRole('button', { name: 'Start game' })).toBeEnabled()
})
