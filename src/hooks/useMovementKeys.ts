import { useEffect } from 'react'
import type { Direction } from '../api/types'

const directions: Record<string, Direction> = {
  arrowup: 'NORTH', arrowright: 'EAST', arrowdown: 'SOUTH', arrowleft: 'WEST',
  w: 'NORTH', d: 'EAST', s: 'SOUTH', a: 'WEST',
}

export function useMovementKeys(onMove: (direction: Direction) => void, enabled: boolean, busy: boolean) {
  useEffect(() => {
    if (!enabled) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing) return
      if (event.target instanceof Element && event.target.closest(
        '[role="dialog"], input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"], [role="slider"], [role="spinbutton"]',
      )) return
      const direction = directions[event.key.toLowerCase()]
      if (!direction) return
      event.preventDefault()
      if (!busy && !event.repeat) onMove(direction)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onMove, enabled, busy])
}
