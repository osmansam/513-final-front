import { useState } from 'react'
import type { GameSnapshot } from '../api/types'
import { formatCoordinate } from '../game/coordinates'
import { MapSymbol, pirateSymbol, symbolLabels } from './MapSymbol'
import type { MapSymbolKind } from './MapSymbol'
import { OceanMap } from './OceanMap'
import { MovementControls } from './MovementControls'
import type { MovementProps } from './MovementControls'

const legend: MapSymbolKind[] = ['player', 'treasure', 'island', 'hunter', 'interceptor', 'monster']
const stateLabels = { PLAYING: 'Exploring', WON: 'Treasure found', LOST: 'Voyage ended' }

export function GameChart({ snapshot, movement }: { snapshot: GameSnapshot; movement?: MovementProps }) {
  const [showPatrolAreas, setShowPatrolAreas] = useState(true)
  const enemies = [
    ...snapshot.pirates.map(pirate => ({ id: pirate.id, kind: pirateSymbol(pirate.type), position: pirate.position })),
    ...snapshot.monsters.map(monster => ({ id: monster.id, kind: 'monster' as const, position: monster.position })),
  ]
  return (
    <section aria-labelledby="chart-title">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-gold">Voyage / Open water</p>
          <h1 id="chart-title" className="font-display text-4xl tracking-tight sm:text-5xl">Your ocean chart</h1></div>
        <div className="flex gap-3 text-xs text-parchment/65"><span>{snapshot.width} × {snapshot.height} ocean</span><span aria-hidden="true">·</span><span>Turn {snapshot.turnCount}</span></div>
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 border border-parchment/15 bg-ocean-950/70 p-3 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-parchment/50">North ↑</p>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-parchment/70">
              <input type="checkbox" checked={showPatrolAreas} onChange={event => setShowPatrolAreas(event.target.checked)} className="size-4 accent-violet-300" />
              Show monster patrol areas
            </label>
          </div>
          <div tabIndex={0} role="region" aria-label="Scrollable ocean chart" className="overflow-auto rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
            <div className="min-w-[560px]"><OceanMap snapshot={snapshot} showPatrolAreas={showPatrolAreas} /></div>
          </div>
          <p className="mt-3 text-xs leading-6 text-parchment/50 sm:hidden">Scroll across the chart to explore the whole ocean.</p>
          <ul aria-label="Map legend" className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-parchment/10 pt-4 sm:grid-cols-3">
            {legend.map(kind => <li key={kind} className="flex items-center gap-2 text-xs text-parchment/70"><MapSymbol kind={kind} className="size-7 shrink-0" /><span>{symbolLabels[kind]}</span></li>)}
          </ul>
        </div>
        <aside aria-label="Voyage details" className="space-y-5">
          <section className="border border-gold/25 bg-ocean-900/80 p-5">
            <p className="text-[10px] uppercase tracking-[0.25em] text-gold">Captain’s log</p>
            <h2 className="mt-3 font-display text-2xl">Reach the treasure.</h2>
            <p className="mt-3 text-sm leading-7 text-parchment/60">Plan your route around islands and watch the enemies. Every successful step gives them a turn.</p>
            <dl className="mt-5 space-y-3 border-t border-parchment/10 pt-4 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-parchment/60">Your position</dt><dd className="font-semibold text-seafoam">{formatCoordinate(snapshot.player)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-parchment/60">Treasure</dt><dd className="font-semibold text-gold">{formatCoordinate(snapshot.treasure)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-parchment/60">Voyage</dt><dd>{stateLabels[snapshot.state]}</dd></div>
            </dl>
          </section>
          {movement && <MovementControls {...movement} disabled={snapshot.state !== 'PLAYING' || movement.needsSync} />}
          <section className="border border-parchment/15 bg-ocean-900/50 p-5">
            <h2 className="font-display text-xl">On the horizon</h2>
            <p className="mt-2 text-xs text-parchment/50">{snapshot.pirates.length} pirate ships · {snapshot.monsters.length} sea monsters</p>
            <ul aria-label="Enemy positions" className="mt-4 space-y-3">
              {enemies.map(enemy => <li key={enemy.id} className="flex items-center gap-2">
                <MapSymbol kind={enemy.kind} className="size-8 shrink-0" /><span className="flex-1 text-xs text-parchment/75">{symbolLabels[enemy.kind]}</span>
                <span className="text-xs tabular-nums text-parchment/60">{formatCoordinate(enemy.position)}</span>
              </li>)}
            </ul>
            {enemies.length === 0 && <p className="mt-4 text-sm text-parchment/60">No enemies in sight.</p>}
          </section>
        </aside>
      </div>
    </section>
  )
}
