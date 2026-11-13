import { fireEvent, render, screen } from '@testing-library/react'
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
