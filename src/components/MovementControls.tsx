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
    <section aria-label="Sailing controls" aria-busy={busy} >
      <h2 className="font-bold">Move your ship</h2>
      <p className="mt-2 text-xs leading-6 text-gray-800">Arrow keys or WASD. One press, one move.</p>
      <div className="my-2 flex flex-wrap gap-2">
        {buttons.map(button => <button key={button.direction} type="button" aria-label={`Move ${button.direction.toLowerCase()}`}
          aria-keyshortcuts={button.shortcut} disabled={disabled || busy} onClick={() => onMove(button.direction)}>
          <span aria-hidden="true">{button.arrow} {button.key}</span>
        </button>)}
      </div>
      <p role="status" aria-label="Sailing feedback" aria-live="polite" className="text-sm leading-6 text-gray-800">{busy ? 'Updating chart…' : feedback}</p>
      {error && <p role="alert" className="mt-3 text-sm leading-6 text-red-700">{error}</p>}
      {needsSync && <button type="button" disabled={busy} onClick={onRefresh}>
        {busy ? 'Refreshing…' : 'Refresh chart'}
      </button>}
    </section>
  )
}
