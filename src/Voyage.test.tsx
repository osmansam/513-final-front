import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import App from './App'
import { chartFixture } from './test/chartFixture'

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
function setup(state: 'PLAYING' | 'WON' | 'LOST' = 'PLAYING') {
  const fetcher = vi.fn<typeof fetch>().mockImplementation((input, init) => {
    if (String(input) === '/api/health') return Promise.resolve(response({ status: 'ok', service: 'columbus-adventure-backend' }))
    if (init?.method === 'DELETE') return Promise.resolve(new Response(null, { status: 204 }))
    if (String(input).endsWith('/moves')) return Promise.resolve(response({ status: 'APPLIED', snapshot: { ...chartFixture.snapshot, state, turnCount: 1 } }))
    return Promise.resolve(response(chartFixture, String(input) === '/api/games' ? 201 : 200))
  })
  vi.stubGlobal('fetch', fetcher)
  render(<App />)
  return fetcher
}
async function open() {
  await screen.findByText('Connected')
  fireEvent.click(screen.getByRole('button', { name: 'Open ocean chart' }))
  await screen.findByRole('heading', { name: 'Your ocean chart' })
}
it('sends an optional validated seed from the welcome form', async () => {
  const fetcher = setup()
  await screen.findByText('Connected')
  fireEvent.change(screen.getByRole('textbox', { name: 'Voyage seed (optional)' }), { target: { value: '-513' } })
  fireEvent.click(screen.getByRole('button', { name: 'Open ocean chart' }))
  await screen.findByRole('heading', { name: 'Your ocean chart' })
  expect(fetcher).toHaveBeenCalledWith('/api/games', expect.objectContaining({ body: '{"seed":-513}' }))
})
it('rejects invalid seed input before creating a backend resource', async () => {
  const fetcher = setup()
  await screen.findByText('Connected')
  fireEvent.change(screen.getByRole('textbox', { name: 'Voyage seed (optional)' }), { target: { value: '1.5' } })
  fireEvent.click(screen.getByRole('button', { name: 'Open ocean chart' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Use a whole number between')
  expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(0)
})
it('confirms reset, pauses movement in the dialog, and restores the backend snapshot', async () => {
  const fetcher = setup()
  await open()
  fireEvent.click(screen.getByRole('button', { name: 'Move south' }))
  await screen.findByText('Turn 1')
  fireEvent.click(screen.getByRole('button', { name: 'Reset voyage' }))
  expect(screen.getByRole('dialog', { name: 'Reset this voyage?' })).toBeInTheDocument()
  fireEvent.keyDown(window, { key: 'd' })
  expect(fetcher.mock.calls.filter(([input]) => String(input).endsWith('/moves'))).toHaveLength(1)
  fireEvent.click(screen.getByRole('button', { name: 'Confirm reset' }))
  expect(await screen.findByText('Turn 0')).toBeInTheDocument()
  expect(fetcher).toHaveBeenCalledWith('/api/games/game-one/reset', expect.objectContaining({ method: 'POST' }))
})
it('can cancel leaving, then discard the old session and return to the harbor', async () => {
  const fetcher = setup()
  await open()
  fireEvent.click(screen.getByRole('button', { name: 'New voyage' }))
  fireEvent.click(screen.getByRole('button', { name: 'Keep sailing' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'New voyage' }))
  fireEvent.click(screen.getByRole('button', { name: 'Return to harbor' }))
  expect(await screen.findByRole('heading', { name: 'Beyond the horizon.' })).toBeInTheDocument()
  await waitFor(() => expect(fetcher).toHaveBeenCalledWith('/api/games/game-one', expect.objectContaining({ method: 'DELETE' })))
})
it.each([['WON', 'Treasure found!'], ['LOST', 'Caught at sea']] as const)('shows the %s result and can restart', async (state, title) => {
  setup(state)
  await open()
  fireEvent.click(screen.getByRole('button', { name: 'Move south' }))
  expect(await screen.findByRole('dialog', { name: title })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Sail again' }))
  expect(await screen.findByText('Turn 0')).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Move south' })).toBeEnabled()
})
it('can inspect the ended chart without reopening the result dialog on every render', async () => {
  setup('WON')
  await open()
  fireEvent.click(screen.getByRole('button', { name: 'Move south' }))
  await screen.findByRole('dialog', { name: 'Treasure found!' })
  fireEvent.click(screen.getByRole('button', { name: 'View chart' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Move south' })).toBeDisabled()
  fireEvent.click(screen.getByRole('checkbox', { name: 'Show monster patrol areas' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('moves focus to the chart on arrival and to the welcome heading on return', async () => {
  setup()
  await open()
  expect(screen.getByRole('heading', { name: 'Your ocean chart' })).toHaveFocus()
  fireEvent.click(screen.getByRole('button', { name: 'New voyage' }))
  fireEvent.click(screen.getByRole('button', { name: 'Return to harbor' }))
  expect(await screen.findByRole('heading', { name: 'Beyond the horizon.' })).toHaveFocus()
})
it('provides a skip link that focuses the main content', () => {
  setup()
  fireEvent.click(screen.getByRole('link', { name: 'Skip to main content' }))
  expect(screen.getByRole('main')).toHaveFocus()
})
