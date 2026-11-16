import { useState } from 'react'
import { parseSeed } from '../game/seed'
import { CompassRose } from './CompassRose'
import type { useServerConnection } from '../hooks/useServerConnection'

const principles = [
  { number: '01', title: 'Find the treasure', description: 'Move your ship to the treasure. Islands block your path.' },
  { number: '02', title: 'Avoid the pirates', description: 'Hunters chase your ship. Interceptors try to cut off your next move.' },
  { number: '03', title: 'Watch for sea monsters', description: 'Sea monsters move inside their patrol areas. A collision ends the game.' },
]

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
        <section className="grid items-center gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-16" aria-labelledby="welcome-title">
          <div className="min-w-0">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">Christopher Columbus Adventure</p>
            <h1 id="welcome-title" tabIndex={-1} className="max-w-2xl font-display text-6xl leading-[1.04] tracking-[-0.04em] sm:text-7xl xl:text-8xl">Columbus Adventure</h1>
            <p className="mt-7 max-w-md text-base leading-8 text-parchment/65 sm:text-lg">Reach the treasure without getting caught by pirates or sea monsters. Use the arrow keys or WASD to move.</p>
            <section aria-labelledby="harbor-title" className="mt-9 max-w-lg border-l-2 border-gold/70 bg-ocean-900/70 p-5 sm:p-6">
              <p id="harbor-title" className="text-base font-medium">{connected ? 'Ready to play' : checking ? 'Connecting to the server' : 'Cannot connect to the server'}</p>
              <p className="mt-2 text-sm leading-6 text-parchment/65" role={status === 'offline' ? 'alert' : undefined}>
                {connected ? 'Start a game below.' : checking ? 'Checking the game server.' : error}
              </p>
              {status === 'offline' && <p className="mt-2 text-sm leading-6 text-parchment/65">Start the game server, then reconnect.</p>}
              {connected && <form aria-label="Voyage setup" onSubmit={event => {
                event.preventDefault()
                try { const value = parseSeed(seed); setSeedError(null); onOpenChart(value) }
                catch (failure) { setSeedError(failure instanceof Error ? failure.message : 'Use a whole-number seed.') }
              }}>
                <label className="mt-5 block text-xs text-parchment/75">Voyage seed (optional)
                  <input type="text" inputMode="numeric" value={seed} disabled={opening} aria-invalid={Boolean(seedError)}
                    aria-describedby={seedError ? 'seed-hint seed-error' : 'seed-hint'}
                    onChange={event => { setSeed(event.target.value); setSeedError(null) }} placeholder="Leave blank for a random map"
                    className="mt-2 min-h-11 w-full rounded-sm border border-parchment/25 bg-ocean-950 px-3 py-2 text-sm text-parchment placeholder:text-parchment/65 focus-visible:outline-2 focus-visible:outline-gold disabled:opacity-50" />
                </label>
                <p id="seed-hint" className="mt-2 text-xs leading-6 text-parchment/65">Use the same number to replay a map, or leave blank for a new one.</p>
                {seedError && <p id="seed-error" role="alert" className="mt-2 text-sm text-rose-200">{seedError}</p>}
                <button type="submit" disabled={opening}
                className="mt-5 mr-3 inline-flex min-h-11 items-center justify-center gap-3 rounded-sm bg-gold px-5 py-3 text-sm font-semibold text-ocean-950 transition-colors hover:bg-[#efcb8c] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold disabled:cursor-wait disabled:opacity-60">
                {opening ? 'Starting game…' : 'Start game'}<span aria-hidden="true">↗</span>
              </button></form>}
              {chartError && <p role="alert" className="mt-4 text-sm leading-6 text-rose-200">{chartError}</p>}
              <button type="button" onClick={() => { void refresh() }} disabled={checking}
                className="mt-5 inline-flex min-h-11 items-center justify-center gap-3 rounded-sm border border-parchment/25 px-5 py-3 text-sm font-semibold text-parchment transition-colors hover:bg-parchment/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold disabled:cursor-wait disabled:opacity-60">
                {checking ? 'Checking connection…' : connected ? 'Check connection' : 'Reconnect'}
                <span aria-hidden="true">↗</span>
              </button>
            </section>
          </div>
          <div className="relative mx-auto flex aspect-square w-full max-w-md items-center justify-center lg:max-w-lg" aria-hidden="true">
            <div className="absolute inset-[8%] rounded-full border border-seafoam/10 bg-seafoam/[0.025]" />
            <CompassRose className="relative w-[87%] text-gold/80" />
            <p className="absolute bottom-0 text-[10px] tracking-[0.35em] text-parchment/65">FIND THE TREASURE</p>
          </div>
        </section>
        <section className="mt-14 grid gap-7 border-t border-parchment/15 pt-8 sm:mt-20 md:grid-cols-3 md:gap-10" aria-label="Your adventure">
          {principles.map(({ number, title, description }) => (
            <article key={number} className="min-w-0">
              <p className="mb-4 font-display text-sm text-gold/75">{number} /</p>
              <h2 className="font-display text-2xl">{title}</h2>
              <p className="mt-3 max-w-sm text-sm leading-7 text-parchment/65">{description}</p>
            </article>
          ))}
        </section>
  </>
}
