import type { Position } from '../api/types'

export function columnLabel(x: number): string {
  let value = x + 1
  let label = ''
  while (value > 0) {
    label = String.fromCharCode(65 + (value - 1) % 26) + label
    value = Math.floor((value - 1) / 26)
  }
  return label
}

export function formatCoordinate(position: Position): string {
  return `${columnLabel(position.x)}${position.y + 1}`
}
