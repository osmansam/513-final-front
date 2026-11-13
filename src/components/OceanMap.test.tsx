import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { chartFixture } from '../test/chartFixture'
import { OceanMap } from './OceanMap'
import { formatCoordinate } from '../game/coordinates'

describe('ocean chart', () => {
  it('uses the snapshot dimensions and places entities in their actual grid cells', () => {
    render(<OceanMap snapshot={chartFixture.snapshot} />)
    expect(screen.getByRole('img', { name: 'Ocean chart, 3 columns by 2 rows' })).toHaveAttribute('viewBox', '0 0 144 112')
    for (const [title, transform] of [
      ['Your ship · A1', 'translate(24 24)'], ['Treasure · C2', 'translate(88 56)'],
      ['Island · B1', 'translate(56 24)'], ['Hunter pirate · C1', 'translate(88 24)'],
      ['Interceptor pirate · A2', 'translate(24 56)'], ['Sea monster · B2', 'translate(56 56)'],
    ]) {
      expect(screen.getByText(title!, { selector: 'title' }).closest('g')).toHaveAttribute('transform', transform)
    }
  })

  it('draws inclusive patrol bounds and can hide them', () => {
    const { container, rerender } = render(<OceanMap snapshot={chartFixture.snapshot} />)
    const area = container.querySelector('[data-patrol-id="monster-1"]')
    expect(area).toHaveAttribute('x', '24')
    expect(area).toHaveAttribute('y', '56')
    expect(area).toHaveAttribute('width', '96')
    expect(area).toHaveAttribute('height', '32')
    rerender(<OceanMap snapshot={chartFixture.snapshot} showPatrolAreas={false} />)
    expect(container.querySelector('[data-patrol-id]')).toBeNull()
  })

  it('keeps both markers visible when the player shares a cell with treasure or an enemy', () => {
    const snapshot = { ...chartFixture.snapshot, player: { x: 2, y: 1 }, state: 'WON' as const }
    const { container } = render(<OceanMap snapshot={snapshot} />)
    const player = container.querySelector('[data-entity-id="player"] svg')
    const treasure = container.querySelector('[data-entity-id="treasure"] svg')
    expect(player).toHaveAttribute('width', '16')
    expect(treasure).toHaveAttribute('width', '16')
    expect(player?.getAttribute('x')).not.toBe(treasure?.getAttribute('x'))
    expect(screen.getByText('Your ship · C2', { selector: 'title' })).toBeInTheDocument()
    expect(screen.getByText('Treasure · C2', { selector: 'title' })).toBeInTheDocument()
  })

  it('updates positions from a new snapshot without keeping stale markers', () => {
    const { rerender } = render(<OceanMap snapshot={chartFixture.snapshot} />)
    rerender(<OceanMap snapshot={{ ...chartFixture.snapshot, player: { x: 1, y: 1 }, turnCount: 1 }} />)
    expect(screen.queryByText('Your ship · A1', { selector: 'title' })).not.toBeInTheDocument()
    expect(screen.getByText('Your ship · B2', { selector: 'title' }).closest('g')).toHaveAttribute('transform', 'translate(56 56)')
  })

  it.each([
    [{ x: 0, y: 0 }, 'A1'], [{ x: 19, y: 19 }, 'T20'],
    [{ x: 25, y: 0 }, 'Z1'], [{ x: 26, y: 5 }, 'AA6'],
  ])('formats chart coordinates without exposing zero-based API coordinates', (position, expected) => {
    expect(formatCoordinate(position)).toBe(expected)
  })
})
