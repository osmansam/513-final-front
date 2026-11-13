export type Direction = 'NORTH' | 'EAST' | 'SOUTH' | 'WEST'
export type GameState = 'PLAYING' | 'WON' | 'LOST'
export type PirateType = 'STANDARD' | 'HUNTER' | 'INTERCEPTOR'
export type ActionStatus = 'APPLIED' | 'BLOCKED' | 'GAME_OVER'

export interface Position { readonly x: number; readonly y: number }
export interface RoamingArea {
  readonly minX: number
  readonly minY: number
  readonly maxX: number
  readonly maxY: number
}
export interface PirateSnapshot {
  readonly id: string
  readonly type: PirateType
  readonly position: Position
}
export interface MonsterSnapshot {
  readonly id: string
  readonly position: Position
  readonly roamingArea: RoamingArea
}
export interface GameSnapshot {
  readonly width: number
  readonly height: number
  readonly islands: readonly Position[]
  readonly player: Position
  readonly treasure: Position
  readonly pirates: readonly PirateSnapshot[]
  readonly monsters: readonly MonsterSnapshot[]
  readonly state: GameState
  readonly turnCount: number
}
export interface GameView { readonly id: string; readonly snapshot: GameSnapshot }
export interface ActionResult { readonly status: ActionStatus; readonly snapshot: GameSnapshot }
export interface HealthResponse { readonly status: 'ok'; readonly service: 'columbus-adventure-backend' }
