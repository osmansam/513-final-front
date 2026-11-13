import { CompassRose } from './components/CompassRose'
import { GameChart } from './components/GameChart'
import { WelcomeScreen } from './components/WelcomeScreen'
import { useGameChart } from './hooks/useGameChart'
import { useServerConnection } from './hooks/useServerConnection'

export default function App() {
  const connection = useServerConnection()
  const chart = useGameChart()
  const { status } = connection
  return (
    <div className="chart-background min-h-screen text-parchment">
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
        {chart.game ? <GameChart snapshot={chart.game.snapshot} /> : <WelcomeScreen connection={connection}
          onOpenChart={() => { void chart.openChart() }} opening={chart.loading} chartError={chart.error} />}
      </main>
      <footer className="border-t border-parchment/10">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 px-6 py-5 text-[10px] uppercase tracking-[0.2em] text-parchment/40 sm:px-10">
          <p>Christopher Columbus Adventure</p><p>Navigate with care</p>
        </div>
      </footer>
    </div>
  )
}
