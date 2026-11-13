import { useState } from 'react'
import { Dialog } from './components/Dialog'
import { CompassRose } from './components/CompassRose'
import { GameChart } from './components/GameChart'
import { WelcomeScreen } from './components/WelcomeScreen'
import { useGameChart } from './hooks/useGameChart'
import { useServerConnection } from './hooks/useServerConnection'

export default function App() {
  const connection = useServerConnection()
  const chart = useGameChart()
  const { status } = connection
  const [confirmation, setConfirmation] = useState<'reset' | 'new' | null>(null)
  const [dismissedResult, setDismissedResult] = useState<string | null>(null)
  const resultKey = chart.game ? `${chart.game.id}:${chart.game.snapshot.state}:${chart.game.snapshot.turnCount}` : null
  const resultOpen = Boolean(chart.game && chart.game.snapshot.state !== 'PLAYING' && dismissedResult !== resultKey && !confirmation)
  const modalOpen = Boolean(chart.game && confirmation) || resultOpen
  const reset = async () => { await chart.resetVoyage(); setConfirmation(null); setDismissedResult(null) }
  const leave = () => { chart.leaveVoyage(); setConfirmation(null); setDismissedResult(null) }
  const primary = 'min-h-11 rounded-sm bg-gold px-5 py-3 text-sm font-semibold text-ocean-950 hover:bg-[#efcb8c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-40'
  const secondary = 'min-h-11 rounded-sm border border-parchment/30 px-5 py-3 text-sm text-parchment hover:bg-parchment/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-40'
  return (
    <>
    <div inert={modalOpen} className="chart-background min-h-screen text-parchment">
      <header className="border-b border-parchment/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5 sm:px-10">
          <div className="flex items-center gap-3">
            <CompassRose className="size-10 text-gold" />
            <div><p className="text-base font-semibold tracking-wide">COLUMBUS</p>
              <p className="text-[10px] tracking-[0.3em] text-parchment/55">OCEAN ADVENTURE</p></div>
          </div>
          <div role="status" aria-live="polite" className="flex items-center gap-2 rounded-full border border-parchment/15 bg-ocean-900/70 px-3 py-2 text-xs text-parchment/75">
            <span aria-hidden="true" className={`size-1.5 rounded-full ${status === 'connected' ? 'bg-seafoam' : status === 'checking' ? 'bg-gold' : 'bg-rose-300'}`} />
            {status === 'connected' ? 'Connected' : status === 'checking' ? 'Connecting' : 'Unavailable'}
          </div>
        </div>
      </header>
      <main className={`mx-auto max-w-7xl px-6 pb-14 sm:px-10 ${chart.game ? 'pt-8' : 'pt-14 sm:pt-20'}`}>
        {chart.game ? <GameChart snapshot={chart.game.snapshot} paused={modalOpen}
          actions={{ busy: chart.acting, onReset: () => setConfirmation('reset'), onNew: () => setConfirmation('new') }} movement={{
          onMove: chart.move, onRefresh: chart.refreshChart, busy: chart.acting,
          needsSync: chart.needsSync, feedback: chart.feedback, error: chart.moveError,
        }} /> : <WelcomeScreen connection={connection}
          onOpenChart={seed => { void chart.openChart(seed) }} opening={chart.loading} chartError={chart.error} />}
      </main>
      <footer className="border-t border-parchment/10">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 px-6 py-5 text-[10px] uppercase tracking-[0.2em] text-parchment/40 sm:px-10">
          <p>Christopher Columbus Adventure</p><p>Navigate with care</p>
        </div>
      </footer>
    </div>
    {confirmation && chart.game && <Dialog title={confirmation === 'reset' ? 'Reset this voyage?' : 'Leave this voyage?'}
      description={confirmation === 'reset' ? 'Your progress will be cleared. Seeded voyages replay the same map; ordinary voyages receive a fresh chart.' : 'Your current voyage will be left behind. Return to the harbor to choose a new ocean.'}
      onClose={() => { if (!chart.acting) setConfirmation(null) }}>
      <div className="mt-6 flex flex-wrap gap-3">
        <button data-autofocus type="button" disabled={chart.acting} className={secondary} onClick={() => setConfirmation(null)}>Keep sailing</button>
        <button type="button" disabled={chart.acting} className={primary} onClick={() => { if (confirmation === 'reset') void reset(); else leave() }}>
          {chart.acting ? 'Resetting…' : confirmation === 'reset' ? 'Confirm reset' : 'Return to harbor'}
        </button>
      </div>
    </Dialog>}
    {resultOpen && chart.game && <Dialog title={chart.game.snapshot.state === 'WON' ? 'Treasure found!' : 'Caught at sea'}
      description={chart.game.snapshot.state === 'WON' ? `You reached the treasure after ${chart.game.snapshot.turnCount} turns. The ocean’s riches are yours.` : `Your voyage ended after ${chart.game.snapshot.turnCount} turns. A new horizon awaits your next attempt.`}
      onClose={() => { if (!chart.acting) setDismissedResult(resultKey) }}>
      {chart.moveError && <p role="alert" className="mt-4 text-sm text-rose-200">{chart.moveError}</p>}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button type="button" disabled={chart.acting} className={primary} onClick={() => { void reset() }}>{chart.acting ? 'Preparing…' : 'Sail again'}</button>
        <button type="button" disabled={chart.acting} className={secondary} onClick={leave}>New voyage</button>
        <button data-autofocus type="button" disabled={chart.acting} className={`${secondary} sm:col-span-2`} onClick={() => setDismissedResult(resultKey)}>View chart</button>
      </div>
    </Dialog>}
    </>
  )
}
