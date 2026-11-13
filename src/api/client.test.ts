import { describe, expect, it, vi } from 'vitest'
import { ApiError, createApiClient } from './client'

const snapshot = {
  width: 20, height: 20, islands: [{ x: 2, y: 2 }], player: { x: 0, y: 0 }, treasure: { x: 19, y: 19 },
  pirates: [{ id: 'pirate-1', type: 'HUNTER', position: { x: 10, y: 10 } },
    { id: 'pirate-2', type: 'INTERCEPTOR', position: { x: 11, y: 10 } }],
  monsters: [{ id: 'monster-1', position: { x: 5, y: 5 }, roamingArea: { minX: 3, minY: 3, maxX: 7, maxY: 7 } },
    { id: 'monster-2', position: { x: 15, y: 5 }, roamingArea: { minX: 13, minY: 3, maxX: 17, maxY: 7 } }],
  state: 'PLAYING', turnCount: 0,
}
const view = { id: '513-game', snapshot }
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json' },
})

describe('game API client', () => {
  it('reads health from the configured backend base URL', async () => {
    const health = { status: 'ok', service: 'columbus-adventure-backend' }
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response(health))
    const client = createApiClient('http://game.test/', fetcher)
    expect(await client.health()).toEqual(health)
    expect(fetcher).toHaveBeenCalledWith('http://game.test/api/health', expect.objectContaining({ method: 'GET' }))
  })

  it('creates a seeded game as JSON and returns the frontend snapshot', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response(view, 201))
    expect(await createApiClient('', fetcher).createGame(513)).toEqual(view)
    expect(fetcher).toHaveBeenCalledWith('/api/games', expect.objectContaining({
      method: 'POST', body: '{"seed":513}', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    }))
  })

  it('creates an ordinary game without inventing a seed', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response(view, 201))
    expect(await createApiClient('', fetcher).createGame()).toEqual(view)
    expect(fetcher).toHaveBeenCalledWith('/api/games', expect.objectContaining({ body: '{}' }))
  })

  it('reads a game and encodes the resource ID as a single path segment', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response(view))
    expect(await createApiClient('', fetcher).getGame('game/one')).toEqual(view)
    expect(fetcher).toHaveBeenCalledWith('/api/games/game%2Fone', expect.objectContaining({ method: 'GET' }))
  })

  it('sends moves as directions and preserves blocked and terminal action results', async () => {
    for (const status of ['APPLIED', 'BLOCKED', 'GAME_OVER']) {
      const result = { status, snapshot }
      const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response(result))
      expect(await createApiClient('', fetcher).moveGame('513-game', 'EAST')).toEqual(result)
      expect(fetcher).toHaveBeenCalledWith('/api/games/513-game/moves', expect.objectContaining({
        method: 'POST', body: '{"direction":"EAST"}',
      }))
    }
  })

  it('resets an existing resource without replacing its ID', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response(view))
    expect(await createApiClient('', fetcher).resetGame('513-game')).toEqual(view)
    expect(fetcher).toHaveBeenCalledWith('/api/games/513-game/reset', expect.objectContaining({ method: 'POST', body: '{}' }))
  })

  it('handles a successful deletion without trying to parse an empty JSON body', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }))
    expect(await createApiClient('', fetcher).deleteGame('513-game')).toBeUndefined()
    expect(fetcher).toHaveBeenCalledWith('/api/games/513-game', expect.objectContaining({ method: 'DELETE' }))
  })

  it('preserves the HTTP status and backend error message', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({ error: 'Game not found' }, 404))
    await expect(createApiClient('', fetcher).getGame('missing')).rejects.toMatchObject({
      name: 'ApiError', status: 404, message: 'Game not found',
    })
  })

  it('reports unreadable server responses as an API error', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('<html>Error</html>', { status: 502 }))
    await expect(createApiClient('', fetcher).health()).rejects.toBeInstanceOf(ApiError)
  })

  it('turns a network failure into a useful connection error', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(createApiClient('', fetcher).health()).rejects.toMatchObject({ name: 'ApiError', status: 0 })
  })

  it('forwards caller cancellation and does not disguise it as a server failure', async () => {
    const controller = new AbortController()
    const fetcher = vi.fn<typeof fetch>().mockImplementation((_input, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
    }))
    const promise = createApiClient('', fetcher).health(controller.signal)
    const assertion = expect(promise).rejects.toMatchObject({ name: 'AbortError' })
    controller.abort()
    await assertion
  })

  it('times out a stalled request instead of leaving the interface loading forever', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn<typeof fetch>().mockImplementation((_input, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
    }))
    const assertion = expect(createApiClient('', fetcher).health()).rejects.toMatchObject({ name: 'ApiError', status: 0 })
    await vi.advanceTimersByTimeAsync(8000)
    await assertion
  })

  it('rejects seeds that JavaScript cannot represent safely before sending a request', async () => {
    const fetcher = vi.fn<typeof fetch>()
    const client = createApiClient('', fetcher)
    for (const seed of [NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
      await expect(client.createGame(seed)).rejects.toBeInstanceOf(ApiError)
    }
    expect(fetcher).not.toHaveBeenCalled()
  })
})
