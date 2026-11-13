import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, gameApi } from '../api/client'
import type { GameView } from '../api/types'

export function useGameChart() {
  const [game, setGame] = useState<GameView | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const current = useRef<GameView | null>(null)
  const pending = useRef<AbortController | null>(null)

  const openChart = useCallback(async () => {
    if (pending.current || current.current) return
    const controller = new AbortController()
    pending.current = controller
    setLoading(true)
    setError(null)
    try {
      const created = await gameApi.createGame(undefined, controller.signal)
      if (controller.signal.aborted) {
        void gameApi.deleteGame(created.id).catch(() => {})
        return
      }
      current.current = created
      setGame(created)
    } catch (failure) {
      if (!controller.signal.aborted) {
        setError(failure instanceof ApiError ? failure.message : 'The ocean chart could not be opened. Please try again.')
      }
    } finally {
      if (pending.current === controller) pending.current = null
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => () => {
    pending.current?.abort()
    const active = current.current
    current.current = null
    if (active) void gameApi.deleteGame(active.id).catch(() => {})
  }, [])

  return { game, loading, error, openChart }
}
