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
    <section aria-label="Sailing controls" aria-busy={busy} className="rounded border border-gray-300 bg-white p-4">
      <h2 className="text-lg font-semibold">Move your ship</h2>
      <p className="mt-2 text-xs leading-6 text-gray-800">Arrow keys or WASD. One press, one move.</p>
      <div className="mx-auto my-5 grid max-w-52 grid-cols-3 gap-2" style={{ gridTemplateAreas: '". north ." "west center east" ". south ."' }}>
        {buttons.map(button => <button key={button.direction} type="button" aria-label={`Move ${button.direction.toLowerCase()}`}
          aria-keyshortcuts={button.shortcut} disabled={disabled || busy} onClick={() => onMove(button.direction)}
          style={{ gridArea: button.direction.toLowerCase() }}>
          <span aria-hidden="true">{button.arrow}</span><kbd aria-hidden="true">{button.key}</kbd>
        </button>)}
        <span aria-hidden="true" style={{ gridArea: 'center' }} className="flex items-center justify-center text-xs text-gray-800">Sail</span>
      </div>
      <p role="status" aria-label="Sailing feedback" aria-live="polite" className="text-sm leading-6 text-gray-800">{busy ? 'Updating chart…' : feedback}</p>
      {error && <p role="alert" className="mt-3 text-sm leading-6 text-red-700">{error}</p>}
      {needsSync && <button type="button" disabled={busy} onClick={onRefresh}>
        {busy ? 'Refreshing…' : 'Refresh chart'}
      </button>}
    </section>
  )
}
