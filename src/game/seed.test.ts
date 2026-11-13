import { expect, it } from 'vitest'
import { parseSeed } from './seed'

it.each([['', undefined], ['  ', undefined], ['513', 513], ['-25', -25], ['0', 0], ['9007199254740991', Number.MAX_SAFE_INTEGER]])(
  'parses voyage seed %s', (text, expected) => expect(parseSeed(text)).toBe(expected),
)
it.each(['1.5', '1e3', 'abc', '9007199254740992', '-9007199254740992'])('rejects an invalid seed %s', text => {
  expect(() => parseSeed(text)).toThrow('Use a whole number between')
})
