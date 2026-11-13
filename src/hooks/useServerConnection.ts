import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, gameApi } from '../api/client'

export function useServerConnection() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'offline'>('checking')
  const [error, setError] = useState<string | null>(null)
  const request = useRef<AbortController | null>(null)

  const refresh = useCallback(async () => {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setStatus('checking')
    setError(null)
    try {
      const health = await gameApi.health(controller.signal)
      if (!health || health.status !== 'ok' || health.service !== 'columbus-adventure-backend') {
        throw new ApiError(502, 'The game server is not ready. Please try again.')
      }
      if (!controller.signal.aborted) setStatus('connected')
    } catch (failure) {
      if (!controller.signal.aborted) {
        setStatus('offline')
        setError(failure instanceof ApiError ? failure.message : 'Unable to reach the game server. Please try again.')
      }
    }
  }, [])

  useEffect(() => {
    void refresh()
    return () => request.current?.abort()
  }, [refresh])

  return { status, error, refresh }
}
