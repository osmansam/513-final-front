import { useEffect, useRef } from 'react'
import { CHART_CELL, CHART_MARGIN } from '../game/chartGeometry'

export function useChartViewport(column: number, columns: number) {
  const viewport = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const element = viewport.current
    if (!element) return
    const follow = () => {
      const { clientWidth, scrollWidth, scrollLeft } = element
      if (!clientWidth || scrollWidth <= clientWidth) return
      const center = (CHART_MARGIN + (column + 0.5) * CHART_CELL) / (columns * CHART_CELL + CHART_MARGIN * 2) * scrollWidth
      const inset = Math.min(32, clientWidth / 4)
      if (center >= scrollLeft + inset && center <= scrollLeft + clientWidth - inset) return
      const left = Math.max(0, Math.min(center - clientWidth / 2, scrollWidth - clientWidth))
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      element.scrollTo({ left, behavior: reduced ? 'auto' : 'smooth' })
    }
    follow()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(follow)
    observer?.observe(element)
    window.addEventListener('resize', follow)
    return () => { observer?.disconnect(); window.removeEventListener('resize', follow) }
  }, [column, columns])
  return viewport
}
