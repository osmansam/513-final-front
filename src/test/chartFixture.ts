import type { GameView } from '../api/types'

export const chartFixture: GameView = {
  id: 'game-one',
  snapshot: {
    width: 3, height: 2, islands: [{ x: 1, y: 0 }], player: { x: 0, y: 0 }, treasure: { x: 2, y: 1 },
    pirates: [
      { id: 'pirate-1', type: 'HUNTER', position: { x: 2, y: 0 } },
      { id: 'pirate-2', type: 'INTERCEPTOR', position: { x: 0, y: 1 } },
    ],
    monsters: [{ id: 'monster-1', position: { x: 1, y: 1 }, roamingArea: { minX: 0, minY: 1, maxX: 2, maxY: 1 } }],
    state: 'PLAYING', turnCount: 0,
  },
}
