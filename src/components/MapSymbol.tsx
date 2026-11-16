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

export function MapSymbol({ kind, className = '', ...props }: SVGProps<SVGSVGElement> & { kind: MapSymbolKind }) {
  return (
    <svg viewBox="0 0 32 32" width={32} height={32} fill="none" className={`${colors[kind]} ${className}`}
      aria-hidden="true" focusable="false" {...props}>
      {kind === 'island' ? <>
        <path d="M3 24L8 17L15 15L24 18L29 25L22 29H10Z" fill="#c8b084" />
        <path d="M7 23L11 17L18 16L25 22L21 26H12Z" fill="#659f84" />
        <path d="M17 22V11" stroke="#5c4937" strokeWidth="2" />
        <path d="M17 7L11 14H23Z" fill="#9ad6c5" /><path d="M17 4L13 10H21Z" fill="#78b99e" />
      </> : kind === 'treasure' ? <>
        <circle cx="16" cy="17" r="13" stroke="currentColor" opacity="0.4" />
        <path d="M7 15V11Q16 4 25 11V15Z" fill="currentColor" /><path d="M7 16H25V25H7Z" fill="currentColor" />
        <path d="M11 10V25M21 10V25M7 16H25" stroke="#73522f" strokeWidth="1.5" />
        <rect x="14" y="14" width="4" height="7" rx="1" fill="#091e28" />
      </> : kind === 'monster' ? <>
        <path d="M9 19C5 24 6 27 2 26M13 20C10 27 13 29 9 29M19 20C22 27 19 29 23 29M23 19C27 24 26 27 30 26" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M7 16C7 5 25 5 25 16L22 23H10Z" fill="currentColor" />
        <path d="M12 15L15 17M20 15L17 17" stroke="#091e28" strokeWidth="2" strokeLinecap="round" />
      </> : <>
        {kind === 'player' && <circle cx="16" cy="16" r="14" fill="currentColor" opacity="0.12" />}
        <path d="M4 23H28L23 29H9Z" fill="currentColor" />
        <path d="M16 4V23" stroke="currentColor" strokeWidth="1.6" />
        <path d="M14 7L6 20H14ZM18 10L26 20H18Z" fill="currentColor" opacity={kind === 'player' ? '1' : '0.7'} />
        {kind !== 'player' && <path d="M17 3H26L23 6L26 9H17Z" fill="currentColor" />}
        {(kind === 'hunter' || kind === 'interceptor') && <text x="25" y="15" fill="currentColor" fontFamily="sans-serif" fontSize="7" fontWeight="700" textAnchor="middle">{kind === 'hunter' ? 'H' : 'I'}</text>}
      </>}
    </svg>
  )
}
