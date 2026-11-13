import { CompassRose } from './components/CompassRose'
import { useServerConnection } from './hooks/useServerConnection'

const principles = [
  { number: '01', title: 'Find the treasure', description: 'Chart a path across the islands and reach the treasure before danger finds you.' },
  { number: '02', title: 'Outsmart the pirates', description: 'Hunters follow your trail. Interceptors try to get ahead. Make every move count.' },
  { number: '03', title: 'Watch the waters', description: 'Sea creatures patrol the ocean. Keep a careful eye on the waters around your ship.' },
]

export default function App() {
  const { status, error, refresh } = useServerConnection()
  const connected = status === 'connected'
  const checking = status === 'checking'

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
            <span aria-hidden="true" className={`size-1.5 rounded-full ${connected ? 'bg-seafoam' : checking ? 'bg-gold' : 'bg-rose-300'}`} />
            {connected ? 'Connected' : checking ? 'Connecting' : 'Unavailable'}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 pb-14 pt-14 sm:px-10 sm:pt-20">
        <section className="grid items-center gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-16" aria-labelledby="welcome-title">
          <div className="min-w-0">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">Christopher Columbus Adventure</p>
            <h1 id="welcome-title" className="max-w-2xl font-display text-6xl leading-[1.04] tracking-[-0.04em] sm:text-7xl xl:text-8xl">Beyond the horizon.</h1>
            <p className="mt-7 max-w-md text-base leading-8 text-parchment/65 sm:text-lg">An ocean of treasure, pirates, and strange creatures awaits. All you need is a ship and a little courage.</p>
            <section aria-labelledby="harbor-title" className="mt-9 max-w-lg border-l-2 border-gold/70 bg-ocean-900/70 p-5 sm:p-6">
              <p id="harbor-title" className="text-base font-medium">{connected ? 'The harbor is ready' : checking ? 'Finding the harbor' : 'The harbor is out of reach'}</p>
              <p className="mt-2 text-sm leading-6 text-parchment/60" role={status === 'offline' ? 'alert' : undefined}>
                {connected ? 'Your connection is ready for a new adventure.' : checking ? 'Checking the waters before your next voyage.' : error}
              </p>
              {status === 'offline' && <p className="mt-2 text-sm leading-6 text-parchment/60">Start the game server, then reconnect.</p>}
              <button type="button" onClick={() => { void refresh() }} disabled={checking}
                className="mt-5 inline-flex min-h-11 items-center justify-center gap-3 rounded-sm bg-gold px-5 py-3 text-sm font-semibold text-ocean-950 transition-colors hover:bg-[#efcb8c] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold disabled:cursor-wait disabled:opacity-60">
                {checking ? 'Checking connection…' : connected ? 'Check connection' : 'Reconnect'}
                <span aria-hidden="true">↗</span>
              </button>
            </section>
          </div>
          <div className="relative mx-auto flex aspect-square w-full max-w-md items-center justify-center lg:max-w-lg" aria-hidden="true">
            <div className="absolute inset-[8%] rounded-full border border-seafoam/10 bg-seafoam/[0.025]" />
            <CompassRose className="relative w-[87%] text-gold/80" />
            <p className="absolute bottom-0 text-[10px] tracking-[0.35em] text-parchment/35">MAKE EVERY MOVE COUNT</p>
          </div>
        </section>
        <section className="mt-14 grid gap-7 border-t border-parchment/15 pt-8 sm:mt-20 md:grid-cols-3 md:gap-10" aria-label="Your adventure">
          {principles.map(({ number, title, description }) => (
            <article key={number} className="min-w-0">
              <p className="mb-4 font-display text-sm text-gold/75">{number} /</p>
              <h2 className="font-display text-2xl">{title}</h2>
              <p className="mt-3 max-w-sm text-sm leading-7 text-parchment/55">{description}</p>
            </article>
          ))}
        </section>
      </main>
      <footer className="border-t border-parchment/10">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 px-6 py-5 text-[10px] uppercase tracking-[0.2em] text-parchment/40 sm:px-10">
          <p>Christopher Columbus Adventure</p><p>Navigate with care</p>
        </div>
      </footer>
    </div>
  )
}
