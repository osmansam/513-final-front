import { useId } from 'react'
import type { GameSnapshot, Position } from '../api/types'
import { columnLabel, formatCoordinate } from '../game/coordinates'
import { MapSymbol, pirateSymbol, symbolLabels } from './MapSymbol'
import type { MapSymbolKind } from './MapSymbol'

import { CHART_CELL as CELL, CHART_MARGIN as MARGIN } from '../game/chartGeometry'
interface Marker { id: string; kind: MapSymbolKind; position: Position }

export function OceanMap({ snapshot, showPatrolAreas = true }: { snapshot: GameSnapshot; showPatrolAreas?: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const gridId = `ocean-grid-${id}`
  const descriptionId = `ocean-description-${id}`
  const width = snapshot.width * CELL
  const height = snapshot.height * CELL
  const markers: Marker[] = [
    { id: 'treasure', kind: 'treasure', position: snapshot.treasure },
    ...snapshot.pirates.map(pirate => ({ id: pirate.id, kind: pirateSymbol(pirate.type), position: pirate.position })),
    ...snapshot.monsters.map(monster => ({ id: monster.id, kind: 'monster' as const, position: monster.position })),
    { id: 'player', kind: 'player', position: snapshot.player },
  ]
  const occupants = new Map<string, Marker[]>()
  for (const marker of markers) {
    const key = `${marker.position.x},${marker.position.y}`
    const cell = occupants.get(key) ?? []
    cell.push(marker)
    occupants.set(key, cell)
  }

  return (
    <svg viewBox={`0 0 ${width + MARGIN * 2} ${height + MARGIN * 2}`} className="block h-auto w-full"
      role="img" aria-label={`Ocean chart, ${snapshot.width} columns by ${snapshot.height} rows`} aria-describedby={descriptionId}>
      <desc id={descriptionId}>Your ship is at {formatCoordinate(snapshot.player)}. Treasure is at {formatCoordinate(snapshot.treasure)}.
        {' '}{snapshot.islands.length} islands, {snapshot.pirates.length} pirates, and {snapshot.monsters.length} sea monsters.
        {' '}Entity positions are also listed in voyage details. Island coordinates and monster patrol bounds are available in Map details below the chart. Columns run west to east; rows run north to south.</desc>
      <defs><pattern id={gridId} x={MARGIN} y={MARGIN} width={CELL} height={CELL} patternUnits="userSpaceOnUse">
        <path d={`M ${CELL} 0 H 0 V ${CELL}`} fill="none" stroke="#64748b" strokeOpacity="0.5" strokeWidth="0.7" />
      </pattern></defs>
      <rect x={MARGIN} y={MARGIN} width={width} height={height} rx="2" fill="#e6f3fa" />
      <rect x={MARGIN} y={MARGIN} width={width} height={height} fill={`url(#${gridId})`} stroke="#64748b" strokeOpacity="0.6" />
      <g fill="#222222" fillOpacity="0.65" fontFamily="sans-serif" fontSize="10" textAnchor="middle" aria-hidden="true">
        {Array.from({ length: snapshot.width }, (_, column) => <text key={`column-${column}`} x={MARGIN + (column + 0.5) * CELL} y="14">{columnLabel(column)}</text>)}
        {Array.from({ length: snapshot.height }, (_, row) => <text key={`row-${row}`} x="12" y={MARGIN + (row + 0.5) * CELL + 3}>{row + 1}</text>)}
      </g>
      {showPatrolAreas && snapshot.monsters.map(monster => <rect key={monster.id} data-patrol-id={monster.id}
        x={MARGIN + monster.roamingArea.minX * CELL} y={MARGIN + monster.roamingArea.minY * CELL}
        width={(monster.roamingArea.maxX - monster.roamingArea.minX + 1) * CELL}
        height={(monster.roamingArea.maxY - monster.roamingArea.minY + 1) * CELL}
        fill="#7e22ce" fillOpacity="0.08" stroke="#7e22ce" strokeOpacity="0.5" strokeDasharray="5 4" strokeWidth="1" />)}
      {snapshot.islands.map(position => <g key={`island-${position.x}-${position.y}`} transform={`translate(${MARGIN + position.x * CELL} ${MARGIN + position.y * CELL})`}>
        <title>{`Island · ${formatCoordinate(position)}`}</title><MapSymbol kind="island" />
      </g>)}
      {markers.map(marker => {
        const cell = occupants.get(`${marker.position.x},${marker.position.y}`)!
        const columns = Math.ceil(Math.sqrt(cell.length))
        const size = CELL / columns
        const verticalOffset = (CELL - Math.ceil(cell.length / columns) * size) / 2
        const index = cell.indexOf(marker)
        return <g key={marker.id} data-entity-id={marker.id}
          transform={`translate(${MARGIN + marker.position.x * CELL} ${MARGIN + marker.position.y * CELL})`}>
          <title>{`${symbolLabels[marker.kind]} · ${formatCoordinate(marker.position)}`}</title>
          <MapSymbol kind={marker.kind} x={(index % columns) * size} y={verticalOffset + Math.floor(index / columns) * size} width={size} height={size} />
        </g>
      })}
    </svg>
  )
}
