import { useState } from 'react'
import { useChartViewport } from '../hooks/useChartViewport'
import type { GameSnapshot } from '../api/types'
import { formatCoordinate } from '../game/coordinates'
import { MapSymbol, pirateSymbol, symbolLabels } from './MapSymbol'
import type { MapSymbolKind } from './MapSymbol'
import { OceanMap } from './OceanMap'
import { MovementControls } from './MovementControls'
import type { MovementProps } from './MovementControls'

const legend: MapSymbolKind[] = ['player', 'treasure', 'island', 'hunter', 'interceptor', 'monster']
const stateLabels = { PLAYING: 'Exploring', WON: 'Treasure found', LOST: 'Voyage ended' }

export function GameChart({ snapshot, movement, paused = false, actions }: { snapshot: GameSnapshot; movement?: MovementProps; paused?: boolean; actions?: { busy: boolean; onReset: () => void; onNew: () => void } }) {
  const viewport = useChartViewport(snapshot.player.x, snapshot.width)
  const [showPatrolAreas, setShowPatrolAreas] = useState(true)
  const enemies = [
    ...snapshot.pirates.map(pirate => ({ id: pirate.id, kind: pirateSymbol(pirate.type), position: pirate.position })),
    ...snapshot.monsters.map(monster => ({ id: monster.id, kind: 'monster' as const, position: monster.position })),
  ]
  return (
    <section aria-labelledby="chart-title">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <h1 id="chart-title" tabIndex={-1} className="text-2xl font-bold">Your ocean chart</h1>
        <div className="flex gap-3 text-xs text-parchment/80"><span>{snapshot.width} × {snapshot.height} ocean</span><span aria-hidden="true">·</span><span>Turn {snapshot.turnCount}</span></div>
      </div>
      {actions && <div className="mb-5 flex flex-wrap gap-3">
        <button type="button" disabled={actions.busy} onClick={actions.onReset} className="min-h-11 rounded-sm border border-gold/40 px-4 py-2 text-sm text-gold hover:bg-gold/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-40">Reset voyage</button>
        <button type="button" disabled={actions.busy} onClick={actions.onNew} className="min-h-11 rounded-sm border border-parchment/25 px-4 py-2 text-sm text-parchment/80 hover:bg-parchment/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-40">New voyage</button>
      </div>}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0 rounded border border-parchment/25 bg-ocean-900 p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
            <p className="text-xs text-parchment/80">North ↑</p>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-parchment/70">
              <input type="checkbox" checked={showPatrolAreas} onChange={event => setShowPatrolAreas(event.target.checked)} className="size-4 accent-violet-300" />
              Show monster patrol areas
            </label>
          </div>
          <div ref={viewport} tabIndex={0} role="region" aria-label="Scrollable ocean chart" className="overflow-auto rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
            <div className="min-w-[560px]"><OceanMap snapshot={snapshot} showPatrolAreas={showPatrolAreas} /></div>
          </div>
          <p className="mt-3 text-xs leading-6 text-parchment/80 sm:hidden">Scroll across the chart to explore the whole ocean.</p>
          <ul aria-label="Map legend" className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-parchment/10 pt-4 sm:grid-cols-3">
            {legend.map(kind => <li key={kind} className="flex items-center gap-2 text-xs text-parchment/70"><MapSymbol kind={kind} className="size-7 shrink-0" /><span>{symbolLabels[kind]}</span></li>)}
          </ul>
          <details className="mt-4 border-t border-parchment/15 pt-4 text-xs text-parchment/80">
            <summary className="min-h-11 cursor-pointer rounded-sm py-3 font-semibold text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">Map details</summary>
            <p className="mb-3 leading-6">Islands block movement. Monster patrol bounds include every cell between the listed corners.</p>
            <h2 className="mb-2 font-semibold text-parchment">Islands ({snapshot.islands.length})</h2>
            {snapshot.islands.length > 0 ? <ul aria-label="Island coordinates" className="mb-4 grid grid-cols-4 gap-2 sm:grid-cols-8">
              {[...snapshot.islands].sort((a, b) => a.y - b.y || a.x - b.x).map(position =>
                <li key={`${position.x}-${position.y}`} className="tabular-nums">{formatCoordinate(position)}</li>)}
            </ul> : <p className="mb-4">No islands on this chart.</p>}
            <h2 className="mb-2 font-semibold text-parchment">Monster patrol areas</h2>
            {snapshot.monsters.length > 0 ? <ul aria-label="Monster patrol bounds" className="space-y-2 leading-6">
              {snapshot.monsters.map((monster, index) => <li key={monster.id}>
                Sea monster {index + 1}: {formatCoordinate({ x: monster.roamingArea.minX, y: monster.roamingArea.minY })} to {formatCoordinate({ x: monster.roamingArea.maxX, y: monster.roamingArea.maxY })}, inclusive
              </li>)}
            </ul> : <p>No monster patrol areas.</p>}
          </details>
        </div>
        <aside aria-label="Voyage details" className="space-y-4">
          {movement && <MovementControls {...movement} disabled={paused || snapshot.state !== 'PLAYING' || movement.needsSync} />}
          <section className="rounded border border-parchment/25 bg-ocean-900 p-4">
            <p className="text-sm font-semibold text-parchment">Game status</p>
            <h2 className="mt-3 text-lg font-semibold">Reach the treasure.</h2>
            <p className="mt-3 text-sm leading-7 text-parchment/80">Plan your route around islands and watch the enemies. Every successful step gives them a turn.</p>
            <dl className="mt-5 space-y-3 border-t border-parchment/10 pt-4 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-parchment/80">Your position</dt><dd className="font-semibold text-seafoam">{formatCoordinate(snapshot.player)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-parchment/80">Treasure</dt><dd className="font-semibold text-gold">{formatCoordinate(snapshot.treasure)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-parchment/80">Voyage</dt><dd>{stateLabels[snapshot.state]}</dd></div>
            </dl>
          </section>
          <section className="rounded border border-parchment/25 bg-ocean-900 p-4">
            <h2 className="text-lg font-semibold">Enemies</h2>
            <p className="mt-2 text-xs text-parchment/80">{snapshot.pirates.length} pirate ships · {snapshot.monsters.length} sea monsters</p>
            <ul aria-label="Enemy positions" className="mt-4 space-y-3">
              {enemies.map(enemy => <li key={enemy.id} className="flex items-center gap-2">
                <MapSymbol kind={enemy.kind} className="size-8 shrink-0" /><span className="flex-1 text-xs text-parchment/75">{symbolLabels[enemy.kind]}</span>
                <span className="text-xs tabular-nums text-parchment/80">{formatCoordinate(enemy.position)}</span>
              </li>)}
            </ul>
            {enemies.length === 0 && <p className="mt-4 text-sm text-parchment/80">No enemies in sight.</p>}
          </section>
        </aside>
      </div>
    </section>
  )
}
