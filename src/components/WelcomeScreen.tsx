import { useState } from 'react'
import { parseSeed } from '../game/seed'
import type { useServerConnection } from '../hooks/useServerConnection'

interface Props {
  connection: ReturnType<typeof useServerConnection>
  onOpenChart: (seed?: number) => void
  opening: boolean
  chartError: string | null
}

export function WelcomeScreen({ connection, onOpenChart, opening, chartError }: Props) {
  const { status, error, refresh } = connection
  const [seed, setSeed] = useState('')
  const [seedError, setSeedError] = useState<string | null>(null)
  const connected = status === 'connected'
  const checking = status === 'checking'
  return <>
        <section className="mx-auto max-w-2xl" aria-labelledby="welcome-title">
          <div className="min-w-0">
            <h1 id="welcome-title" tabIndex={-1} className="text-3xl font-bold">Columbus Adventure</h1>
            <p className="mt-3 text-sm leading-6 text-gray-800">Reach the treasure without getting caught by pirates or sea monsters. Use the arrow keys or WASD to move.</p>
            <section aria-labelledby="harbor-title" className="mt-6 rounded border border-gray-300 bg-white p-5">
              <p id="harbor-title" className="text-base font-medium">{connected ? 'Ready to play' : checking ? 'Connecting to the server' : 'Cannot connect to the server'}</p>
              <p className="mt-2 text-sm leading-6 text-gray-800" role={status === 'offline' ? 'alert' : undefined}>
                {connected ? 'Start a game below.' : checking ? 'Checking the game server.' : error}
              </p>
              {status === 'offline' && <p className="mt-2 text-sm leading-6 text-gray-800">Start the game server, then reconnect.</p>}
              {connected && <form aria-label="Voyage setup" onSubmit={event => {
                event.preventDefault()
                try { const value = parseSeed(seed); setSeedError(null); onOpenChart(value) }
                catch (failure) { setSeedError(failure instanceof Error ? failure.message : 'Use a whole-number seed.') }
              }}>
                <label className="mt-5 block text-xs text-gray-800">Voyage seed (optional)
                  <input type="text" inputMode="numeric" value={seed} disabled={opening} aria-invalid={Boolean(seedError)}
                    aria-describedby={seedError ? 'seed-hint seed-error' : 'seed-hint'}
                    onChange={event => { setSeed(event.target.value); setSeedError(null) }} placeholder="Leave blank for a random map"
                    className="mt-2 min-h-11 w-full rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-500 focus-visible:outline-2 focus-visible:outline-blue-700 disabled:opacity-50" />
                </label>
                <p id="seed-hint" className="mt-2 text-xs leading-6 text-gray-800">Use the same number to replay a map, or leave blank for a new one.</p>
                {seedError && <p id="seed-error" role="alert" className="mt-2 text-sm text-red-700">{seedError}</p>}
                <button type="submit" disabled={opening}>
                {opening ? 'Starting game…' : 'Start game'}
              </button></form>}
              {chartError && <p role="alert" className="mt-4 text-sm leading-6 text-red-700">{chartError}</p>}
              <button type="button" onClick={() => { void refresh() }} disabled={checking}>
                {checking ? 'Checking connection…' : connected ? 'Check connection' : 'Reconnect'}

              </button>
            </section>
          </div>
        </section>
        <section aria-labelledby="instructions-title" className="mx-auto mt-6 max-w-2xl rounded border border-gray-300 p-5">
          <h2 id="instructions-title" className="text-lg font-semibold">How to play</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-gray-800">
            <li>Use the arrow keys, WASD, or the on-screen buttons to move one square.</li>
            <li>Go around islands and reach the treasure to win.</li>
            <li>Pirates and sea monsters move after each valid move. If one catches your ship, you lose.</li>
            <li>Hunters chase you, interceptors try to cut you off, and sea monsters stay in their patrol areas.</li>
          </ol>
        </section>
  </>
}
