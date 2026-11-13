export function parseSeed(text: string): number | undefined {
  const value = text.trim()
  if (!value) return undefined
  if (!/^-?\d+$/.test(value) || !Number.isSafeInteger(Number(value))) {
    throw new Error('Use a whole number between -9007199254740991 and 9007199254740991, or leave the seed blank.')
  }
  return Number(value)
}
