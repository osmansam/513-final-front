import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { Direction } from '../api/types'
import { MovementControls } from './MovementControls'

function Harness({ busy = false, disabled = false }: { busy?: boolean; disabled?: boolean }) {
  const [moves, setMoves] = useState<Direction[]>([])
  return <>
    <MovementControls onMove={direction => setMoves(previous => [...previous, direction])}
      busy={busy} disabled={disabled} needsSync={false} feedback="Choose a direction to sail." error={null} onRefresh={() => {}} />
    <output aria-label="Requested moves">{moves.join(',')}</output>
    <input aria-label="Voyage name" />
    <div contentEditable suppressContentEditableWarning role="textbox" aria-label="Notes" />
  </>
}

it.each([['north', 'NORTH'], ['east', 'EAST'], ['south', 'SOUTH'], ['west', 'WEST']])(
  'the %s button requests the matching direction', (name, expected) => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: `Move ${name}` }))
    expect(screen.getByLabelText('Requested moves')).toHaveTextContent(expected!)
  },
)

it.each([
  ['ArrowUp', 'NORTH'], ['ArrowRight', 'EAST'], ['ArrowDown', 'SOUTH'], ['ArrowLeft', 'WEST'],
  ['w', 'NORTH'], ['d', 'EAST'], ['s', 'SOUTH'], ['a', 'WEST'], ['W', 'NORTH'],
])('maps %s to a single %s request', (key, expected) => {
  render(<Harness />)
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
  fireEvent(window, event)
  expect(event.defaultPrevented).toBe(true)
  expect(screen.getByLabelText('Requested moves')).toHaveTextContent(expected!)
})

it('ignores held-key repeats, modified shortcuts and unrelated keys', () => {
  render(<Harness />)
  for (const options of [{ key: 'ArrowUp', repeat: true }, { key: 'w', ctrlKey: true },
    { key: 'a', metaKey: true }, { key: 's', altKey: true }, { key: 'ArrowLeft', shiftKey: true }, { key: 'Escape' }]) {
    fireEvent.keyDown(window, options)
  }
  expect(screen.getByLabelText('Requested moves')).toBeEmptyDOMElement()
})

it('does not sail while the player is editing a form field or editable text', () => {
  render(<Harness />)
  fireEvent.keyDown(screen.getByRole('textbox', { name: 'Voyage name' }), { key: 'w' })
  fireEvent.keyDown(screen.getByRole('textbox', { name: 'Notes' }), { key: 'ArrowUp' })
  expect(screen.getByLabelText('Requested moves')).toBeEmptyDOMElement()
})

it('blocks extra button and keyboard actions while a request is in flight', () => {
  render(<Harness busy />)
  for (const button of screen.getAllByRole('button')) expect(button).toBeDisabled()
  const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
  fireEvent(window, event)
  expect(event.defaultPrevented).toBe(true)
  expect(screen.getByLabelText('Requested moves')).toBeEmptyDOMElement()
})

it('does not intercept arrow keys or allow moves after input is disabled', () => {
  render(<Harness disabled />)
  const event = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true })
  fireEvent(window, event)
  expect(event.defaultPrevented).toBe(false)
  expect(screen.getByRole('button', { name: 'Move north' })).toBeDisabled()
  expect(screen.getByLabelText('Requested moves')).toBeEmptyDOMElement()
})
