import type { Direction } from '../api/types'
import { useMovementKeys } from '../hooks/useMovementKeys'

export interface MovementProps {
  onMove: (direction: Direction) => void
  onRefresh: () => void
  busy: boolean
  needsSync: boolean
  feedback: string
  error: string | null
}
const buttons: { direction: Direction; arrow: string; key: string; shortcut: string }[] = [
  { direction: 'NORTH', arrow: '↑', key: 'W', shortcut: 'ArrowUp w' },
  { direction: 'WEST', arrow: '←', key: 'A', shortcut: 'ArrowLeft a' },
  { direction: 'EAST', arrow: '→', key: 'D', shortcut: 'ArrowRight d' },
  { direction: 'SOUTH', arrow: '↓', key: 'S', shortcut: 'ArrowDown s' },
]

export function MovementControls({ onMove, onRefresh, busy, disabled, needsSync, feedback, error }: MovementProps & { disabled: boolean }) {
  useMovementKeys(onMove, !disabled, busy)
  return (
    <section aria-label="Sailing controls" aria-busy={busy} className="border border-parchment/15 bg-ocean-900/70 p-5">
      <h2 className="font-display text-2xl">Take the helm</h2>
      <p className="mt-2 text-xs leading-6 text-parchment/65">Arrow keys or WASD. One press, one move.</p>
      <div className="mx-auto my-5 grid max-w-52 grid-cols-3 gap-2" style={{ gridTemplateAreas: '". north ." "west center east" ". south ."' }}>
        {buttons.map(button => <button key={button.direction} type="button" aria-label={`Move ${button.direction.toLowerCase()}`}
          aria-keyshortcuts={button.shortcut} disabled={disabled || busy} onClick={() => onMove(button.direction)}
          style={{ gridArea: button.direction.toLowerCase() }}
          className="flex min-h-14 flex-col items-center justify-center rounded-sm border border-seafoam/35 bg-seafoam/10 text-seafoam transition-colors hover:bg-seafoam/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-35">
          <span aria-hidden="true" className="text-xl leading-6">{button.arrow}</span><kbd aria-hidden="true" className="text-[10px]">{button.key}</kbd>
        </button>)}
        <span aria-hidden="true" style={{ gridArea: 'center' }} className="flex items-center justify-center text-[10px] uppercase tracking-widest text-parchment/65">Sail</span>
      </div>
      <p role="status" aria-label="Sailing feedback" aria-live="polite" className="text-sm leading-6 text-parchment/75">{busy ? 'Updating chart…' : feedback}</p>
      {error && <p role="alert" className="mt-3 text-sm leading-6 text-rose-200">{error}</p>}
      {needsSync && <button type="button" disabled={busy} onClick={onRefresh}
        className="mt-4 min-h-11 w-full rounded-sm border border-gold/50 px-4 py-2 text-sm text-gold hover:bg-gold/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-40">
        {busy ? 'Refreshing…' : 'Refresh chart'}
      </button>}
    </section>
  )
}
