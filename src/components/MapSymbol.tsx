import type { SVGProps } from 'react'
import type { PirateType } from '../api/types'

export type MapSymbolKind = 'player' | 'treasure' | 'island' | 'pirate' | 'hunter' | 'interceptor' | 'monster'
export const symbolLabels: Record<MapSymbolKind, string> = {
  player: 'Your ship', treasure: 'Treasure', island: 'Island', pirate: 'Pirate ship',
  hunter: 'Hunter pirate', interceptor: 'Interceptor pirate', monster: 'Sea monster',
}
const colors: Record<MapSymbolKind, string> = {
  player: 'text-blue-700', treasure: 'text-amber-700', island: 'text-green-700', pirate: 'text-red-700',
  hunter: 'text-red-700', interceptor: 'text-orange-700', monster: 'text-purple-700',
}
export function pirateSymbol(type: PirateType): MapSymbolKind {
  return type === 'HUNTER' ? 'hunter' : type === 'INTERCEPTOR' ? 'interceptor' : 'pirate'
}

const letters: Record<MapSymbolKind, string> = {
  player: 'S', treasure: 'T', island: '#', pirate: 'P',
  hunter: 'H', interceptor: 'I', monster: 'M',
}

export function MapSymbol({ kind, className = '', ...props }: SVGProps<SVGSVGElement> & { kind: MapSymbolKind }) {
  return (
    <svg viewBox="0 0 32 32" width={32} height={32} className={`${colors[kind]} ${className}`}
      aria-hidden="true" focusable="false" {...props}>
      <text x="16" y="22" textAnchor="middle" fill="currentColor"
        fontFamily="Arial, sans-serif" fontSize="22" fontWeight="bold">{letters[kind]}</text>
    </svg>
  )
}
