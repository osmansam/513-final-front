import type { ActionResult, Direction, GameView, HealthResponse } from './types'

export class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function createApiClient(baseUrl = '', fetcher: typeof fetch = (input, init) => globalThis.fetch(input, init)) {
  const base = baseUrl.replace(/\/+$/, '')

  async function request<T>(path: string, method: string, body?: unknown, signal?: AbortSignal): Promise<T> {
    if (signal?.aborted) throw new DOMException('Request cancelled', 'AbortError')
    const controller = new AbortController()
    const cancel = () => controller.abort()
    signal?.addEventListener('abort', cancel, { once: true })
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, 8000)
    try {
      const response = await fetcher(`${base}${path}`, {
        method, signal: controller.signal, cache: 'no-store',
        headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      })
      if (response.status === 204 && response.ok) return undefined as T
      let value: unknown
      try {
        value = await response.json()
      } catch {
        throw new ApiError(response.status, 'The game server sent an unreadable response. Please try again.')
      }
      if (!response.ok) {
        const message = typeof value === 'object' && value !== null && 'error' in value && typeof value.error === 'string'
          ? value.error : `The game request failed (${response.status}).`
        throw new ApiError(response.status, message)
      }
      return value as T
    } catch (error) {
      if (signal?.aborted) throw new DOMException('Request cancelled', 'AbortError')
      if (timedOut) throw new ApiError(0, 'The game server took too long to respond. Please try again.')
      if (error instanceof ApiError) throw error
      throw new ApiError(0, 'Unable to reach the game server. Please try again.')
    } finally {
      clearTimeout(timer)
      signal?.removeEventListener('abort', cancel)
    }
  }

  const gamePath = (id: string) => `/api/games/${encodeURIComponent(id)}`
  return {
    health: (signal?: AbortSignal) => request<HealthResponse>('/api/health', 'GET', undefined, signal),
    createGame: async (seed?: number, signal?: AbortSignal) => {
      if (seed !== undefined && !Number.isSafeInteger(seed)) {
        throw new ApiError(400, 'Seed must be a safe whole number.')
      }
      return request<GameView>('/api/games', 'POST', seed === undefined ? {} : { seed }, signal)
    },
    getGame: (id: string, signal?: AbortSignal) => request<GameView>(gamePath(id), 'GET', undefined, signal),
    moveGame: (id: string, direction: Direction, signal?: AbortSignal) =>
      request<ActionResult>(`${gamePath(id)}/moves`, 'POST', { direction }, signal),
    resetGame: (id: string, signal?: AbortSignal) => request<GameView>(`${gamePath(id)}/reset`, 'POST', {}, signal),
    deleteGame: (id: string, signal?: AbortSignal) => request<void>(gamePath(id), 'DELETE', undefined, signal),
  }
}

export const gameApi = createApiClient(import.meta.env.VITE_API_BASE_URL || '')
