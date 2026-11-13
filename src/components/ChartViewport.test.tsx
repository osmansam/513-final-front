import { render, screen } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { GameChart } from './GameChart'
import { chartFixture } from '../test/chartFixture'

let left = 0
const scroll = vi.fn((options: ScrollToOptions) => { left = options.left ?? 0 })
const chart = (x: number) => ({ ...chartFixture.snapshot, width: 20, player: { x, y: 0 } })
beforeEach(() => {
  left = 0
  scroll.mockClear()
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(300)
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(560)
  vi.spyOn(HTMLElement.prototype, 'scrollLeft', 'get').mockImplementation(() => left)
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: scroll })
})
it('brings an offscreen ship into view and clamps to the edge of the chart', () => {
  const { rerender } = render(<GameChart snapshot={chart(0)} />)
  expect(scroll).not.toHaveBeenCalled()
  rerender(<GameChart snapshot={chart(19)} />)
  expect(scroll).toHaveBeenLastCalledWith({ left: 260, behavior: 'smooth' })
})
it('preserves the player’s manual pan while the ship is already visible', () => {
  left = 160
  render(<GameChart snapshot={chart(10)} />)
  expect(scroll).not.toHaveBeenCalled()
})
it('does not scroll a chart that already fits in its viewport', () => {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(560)
  render(<GameChart snapshot={chart(19)} />)
  expect(scroll).not.toHaveBeenCalled()
})
it('respects reduced motion when following the ship', () => {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
  render(<GameChart snapshot={chart(19)} />)
  expect(scroll).toHaveBeenLastCalledWith({ left: 260, behavior: 'auto' })
})
it('keeps the ship visible when the viewport is resized', () => {
  const observe = vi.fn()
  const disconnect = vi.fn()
  let resize!: () => void
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: () => void) { resize = callback }
    observe = observe
    disconnect = disconnect
  })
  const { unmount } = render(<GameChart snapshot={chart(0)} />)
  expect(observe).toHaveBeenCalledWith(screen.getByRole('region', { name: 'Scrollable ocean chart' }))
  left = 260
  resize()
  expect(scroll).toHaveBeenLastCalledWith({ left: 0, behavior: 'smooth' })
  unmount()
  expect(disconnect).toHaveBeenCalledOnce()
})
