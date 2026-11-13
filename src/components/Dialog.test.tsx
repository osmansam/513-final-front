import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Dialog } from './Dialog'

function Harness() {
  const [open, setOpen] = useState(false)
  return <><button onClick={() => setOpen(true)}>Open dialog</button>
    {open && <Dialog title="Confirm voyage" onClose={() => setOpen(false)}>
      <button onClick={() => setOpen(false)}>Cancel</button><button>Confirm</button>
    </Dialog>}</>
}
it('traps tab focus, closes on Escape, and restores the trigger focus', () => {
  render(<Harness />)
  const trigger = screen.getByRole('button', { name: 'Open dialog' })
  trigger.focus()
  fireEvent.click(trigger)
  const cancel = screen.getByRole('button', { name: 'Cancel' })
  const confirm = screen.getByRole('button', { name: 'Confirm' })
  expect(cancel).toHaveFocus()
  confirm.focus()
  fireEvent.keyDown(document, { key: 'Tab' })
  expect(cancel).toHaveFocus()
  fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
  expect(confirm).toHaveFocus()
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(trigger).toHaveFocus()
})
