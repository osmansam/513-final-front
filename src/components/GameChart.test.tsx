import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { chartFixture } from '../test/chartFixture'
import { GameChart } from './GameChart'

it('shows the chart, mission, enemy roster and turn information from the snapshot', () => {
  render(<GameChart snapshot={chartFixture.snapshot} />)
  expect(screen.getByRole('heading', { name: 'Your ocean chart' })).toBeInTheDocument()
  expect(screen.getByText('3 × 2 ocean')).toBeInTheDocument()
  expect(screen.getByText('Turn 0')).toBeInTheDocument()
  expect(screen.getByRole('complementary', { name: 'Voyage details' })).toHaveTextContent('A1')
  expect(screen.getByRole('complementary', { name: 'Voyage details' })).toHaveTextContent('C2')
  expect(screen.getByRole('list', { name: 'Enemy positions' })).toHaveTextContent('Hunter pirate')
  expect(screen.getByRole('list', { name: 'Enemy positions' })).toHaveTextContent('Interceptor pirate')
  expect(screen.getByRole('list', { name: 'Enemy positions' })).toHaveTextContent('Sea monster')
})

it('lets the player toggle patrol areas without changing the game snapshot', () => {
  const { container } = render(<GameChart snapshot={chartFixture.snapshot} />)
  const toggle = screen.getByRole('checkbox', { name: 'Show monster patrol areas' })
  expect(toggle).toBeChecked()
  expect(container.querySelector('[data-patrol-id]')).not.toBeNull()
  fireEvent.click(toggle)
  expect(toggle).not.toBeChecked()
  expect(container.querySelector('[data-patrol-id]')).toBeNull()
  expect(screen.getByText('Turn 0')).toBeInTheDocument()
})

it('provides terrain coordinates and inclusive monster patrol bounds as text', () => {
  render(<GameChart snapshot={chartFixture.snapshot} />)
  const disclosure = screen.getByText('Map details')
  fireEvent.click(disclosure)
  const islands = screen.getByRole('list', { name: 'Island coordinates' })
  expect(within(islands).getAllByRole('listitem')).toHaveLength(1)
  expect(islands).toHaveTextContent('B1')
  const patrols = screen.getByRole('list', { name: 'Monster patrol bounds' })
  expect(patrols).toHaveTextContent('Sea monster 1: A2 to C2, inclusive')
  fireEvent.click(screen.getByRole('checkbox', { name: 'Show monster patrol areas' }))
  expect(patrols).toHaveTextContent('A2 to C2, inclusive')
  expect(screen.getByRole('img', { name: 'Ocean chart, 3 columns by 2 rows' })).toHaveAccessibleDescription(/Map details/)
})
it('explains when the chart has no islands or monster patrols', () => {
  render(<GameChart snapshot={{ ...chartFixture.snapshot, islands: [], monsters: [] }} />)
  fireEvent.click(screen.getByText('Map details'))
  expect(screen.getByText('No islands on this chart.')).toBeInTheDocument()
  expect(screen.getByText('No monster patrol areas.')).toBeInTheDocument()
})
