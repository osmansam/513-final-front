import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, gameApi } from '../api/client'
import type { Direction, GameView } from '../api/types'
import { formatCoordinate } from '../game/coordinates'

type SyncOutcome = 'updated' | 'missing' | 'failed' | 'cancelled'
const initialFeedback = 'Choose a direction to sail.'

export function useGameChart() {
  const [game, setGame] = useState<GameView | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [acting, setActing] = useState(false)
  const [moveError, setMoveError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState(initialFeedback)
  const [needsSync, setNeedsSync] = useState(false)
  const current = useRef<GameView | null>(null)
  const pending = useRef<AbortController | null>(null)
  const uncertain = useRef(false)

  const replaceGame = useCallback((view: GameView) => {
    current.current = view
    setGame(view)
    uncertain.current = false
    setNeedsSync(false)
  }, [])

  const synchronize = useCallback(async (id: string, signal: AbortSignal): Promise<SyncOutcome> => {
    try {
      const view = await gameApi.getGame(id, signal)
      if (signal.aborted) return 'cancelled'
      replaceGame(view)
      return 'updated'
    } catch (failure) {
      if (signal.aborted) return 'cancelled'
      if (failure instanceof ApiError && failure.status === 404) {
        current.current = null
        setGame(null)
        uncertain.current = false
        setNeedsSync(false)
        setMoveError(null)
        setError('This voyage is no longer available. Open a new ocean chart.')
        return 'missing'
      }
      uncertain.current = true
      setNeedsSync(true)
      return 'failed'
    }
  }, [replaceGame])

  const openChart = useCallback(async (seed?: number) => {
    if (pending.current || current.current) return
    const controller = new AbortController()
    pending.current = controller
    setLoading(true)
    setError(null)
    setMoveError(null)
    setFeedback(initialFeedback)
    try {
      const created = await gameApi.createGame(seed, controller.signal)
      if (controller.signal.aborted) {
        void gameApi.deleteGame(created.id).catch(() => {})
        return
      }
      replaceGame(created)
    } catch (failure) {
      if (!controller.signal.aborted) {
        setError(failure instanceof ApiError ? failure.message : 'The ocean chart could not be opened. Please try again.')
      }
    } finally {
      if (pending.current === controller) pending.current = null
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [replaceGame])

  const move = useCallback(async (direction: Direction) => {
    const active = current.current
    if (!active || pending.current || uncertain.current || active.snapshot.state !== 'PLAYING') return
    const controller = new AbortController()
    pending.current = controller
    setActing(true)
    setMoveError(null)
    try {
      const result = await gameApi.moveGame(active.id, direction, controller.signal)
      if (controller.signal.aborted) return
      replaceGame({ id: active.id, snapshot: result.snapshot })
      if (result.snapshot.state === 'WON') setFeedback('Treasure found. Your voyage is complete.')
      else if (result.snapshot.state === 'LOST') setFeedback('Your ship was caught. This voyage has ended.')
      else if (result.status === 'BLOCKED') setFeedback('That route is blocked. Choose another direction.')
      else if (result.status === 'GAME_OVER') setFeedback('This voyage has ended.')
      else setFeedback(`Sailed ${direction.toLowerCase()} to ${formatCoordinate(result.snapshot.player)}.`)
    } catch {
      if (controller.signal.aborted) return
      uncertain.current = true
      setNeedsSync(true)
      const result = await synchronize(active.id, controller.signal)
      if (result === 'updated') {
        setMoveError('The move response was interrupted and the chart was refreshed. Check your position before sailing again.')
        setFeedback('Chart refreshed.')
      } else if (result === 'failed') {
        setMoveError('The move could not be confirmed. Refresh the chart before sailing again.')
        setFeedback('Chart out of date.')
      }
    } finally {
      if (pending.current === controller) pending.current = null
      if (!controller.signal.aborted) setActing(false)
    }
  }, [replaceGame, synchronize])

  const refreshChart = useCallback(async () => {
    const active = current.current
    if (!active || pending.current) return
    const controller = new AbortController()
    pending.current = controller
    setActing(true)
    setMoveError(null)
    try {
      const result = await synchronize(active.id, controller.signal)
      if (result === 'updated') setFeedback('Chart refreshed. Choose a direction to sail.')
      else if (result === 'failed') setMoveError('The chart is still unavailable. Try refreshing again before sailing.')
    } finally {
      if (pending.current === controller) pending.current = null
      if (!controller.signal.aborted) setActing(false)
    }
  }, [synchronize])

  const resetVoyage = useCallback(async () => {
    const active = current.current
    if (!active || pending.current) return false
    const controller = new AbortController()
    pending.current = controller
    setActing(true)
    setMoveError(null)
    try {
      const view = await gameApi.resetGame(active.id, controller.signal)
      if (controller.signal.aborted) return false
      replaceGame(view)
      setFeedback('A fresh voyage awaits. Choose a direction to sail.')
      return true
    } catch {
      if (controller.signal.aborted) return false
      uncertain.current = true
      setNeedsSync(true)
      const result = await synchronize(active.id, controller.signal)
      if (result === 'updated') setMoveError('The reset response was interrupted. The chart was refreshed; check your voyage before continuing.')
      else if (result === 'failed') setMoveError('The reset could not be confirmed. Refresh the chart before sailing again.')
      return false
    } finally {
      if (pending.current === controller) pending.current = null
      if (!controller.signal.aborted) setActing(false)
    }
  }, [replaceGame, synchronize])

  const leaveVoyage = useCallback(() => {
    if (pending.current) return
    const active = current.current
    current.current = null
    setGame(null)
    setError(null)
    setMoveError(null)
    setFeedback(initialFeedback)
    uncertain.current = false
    setNeedsSync(false)
    if (active) void gameApi.deleteGame(active.id).catch(() => {})
  }, [])

  useEffect(() => () => {
    pending.current?.abort()
    const active = current.current
    current.current = null
    if (active) void gameApi.deleteGame(active.id).catch(() => {})
  }, [])

  return { game, loading, error, openChart, move, acting, moveError, feedback, needsSync, refreshChart, resetVoyage, leaveVoyage }
}
